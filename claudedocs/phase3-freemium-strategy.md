# Phase 3: Freemium Strategy Architecture

## Executive Summary

Freemium 전략을 통한 작명 서비스 결과 페이지 설계. 사용자에게 "최고 점수의 품질"을 티징하면서 5위 이름을 무료로 제공하여 가치를 입증하고, 프리미엄 전환을 유도하는 심리학 기반 아키텍처.

**핵심 전략**: "92점이 있는데 내 점수 72점? 20점 차이면 꽤 크네..." → 결제 전환

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ResultsPage Container                     │
│  - Premium state management                                  │
│  - Candidate sorting & tier classification                   │
│  - Payment modal orchestration                               │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ BlurredSection   │  │  FreeSection     │  │ LockedSection    │
│  (Ranks 1-4)     │  │   (Rank 5)       │  │  (Ranks 6-50)    │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ • BlurredCard ×4 │  │ • NameCard       │  │ • LockedCounter  │
│ • ScoreTeaser    │  │ • CharacterModal │  │ • VolumeMessage  │
│ • PremiumCTA     │  │ • Favorite btn   │  │ • CallToAction   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                                            │
        └────────────────┬───────────────────────────┘
                         ▼
              ┌─────────────────────┐
              │  PaymentModal       │
              │  - Price: ₩9,900    │
              │  - Benefits list    │
              │  - Payment gateway  │
              └─────────────────────┘
```

### 1.2 Data Flow Architecture

```
API Response (30-50 candidates)
        │
        ▼
┌──────────────────────────────┐
│  Candidate Processing Layer  │
│  - Sort by score DESC        │
│  - Classify into tiers       │
│  - Calculate score gaps      │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────┐
│  Tier Classification                         │
│  - Tier 1 (Blurred): ranks 1-4              │
│  - Tier 2 (Free): rank 5                    │
│  - Tier 3 (Locked): ranks 6+                │
│  - Calculate psychological metrics:          │
│    • Score gap (1st vs 5th)                 │
│    • Volume count (6-50)                    │
│    • Premium value proposition              │
└──────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│  Premium State Manager       │
│  - Check isPremium status    │
│  - Toggle visibility rules   │
│  - Manage favorites          │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│  Conditional Rendering       │
│  - Blur effects (FREE)       │
│  - Full access (PREMIUM)     │
└──────────────────────────────┘
```

---

## 2. Data Structure Design

### 2.1 Type Definitions

```typescript
// app/lib/naming/freemium-types.ts

import type { ScoredCandidate } from './types';

/**
 * Freemium tier classification
 */
export enum FreemiumTier {
  BLURRED = 'blurred',    // Ranks 1-4: Blurred preview
  FREE = 'free',          // Rank 5: Fully accessible
  LOCKED = 'locked'       // Ranks 6+: Completely locked
}

/**
 * Classified candidate with tier information
 */
export interface TieredCandidate {
  candidate: ScoredCandidate;
  rank: number;
  tier: FreemiumTier;
  scoreGapFromFirst?: number;  // For psychological messaging
  scoreGapFromFree?: number;   // 5th rank와 점수 차이
}

/**
 * Freemium section data
 */
export interface FreemiumSections {
  blurred: TieredCandidate[];   // Ranks 1-4
  free: TieredCandidate;        // Rank 5
  locked: {
    candidates: TieredCandidate[];
    count: number;
    averageScore?: number;
    bestScore?: number;
  };
}

/**
 * Premium state
 */
export interface PremiumState {
  isPremium: boolean;
  purchaseDate?: Date;
  transactionId?: string;
  expiresAt?: Date;  // For subscription model (future)
}

/**
 * CTA messaging
 */
export interface CTAMetrics {
  scoreGap: number;           // 1st vs Free (5th)
  percentageGap: number;      // Gap as percentage
  lockedCount: number;        // Number of locked names
  estimatedValue: number;     // Price
  topScore: number;           // Best score available
  freeScore: number;          // 5th rank score
}
```

### 2.2 Store Design (Zustand)

```typescript
// app/stores/usePremiumStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PremiumState } from '~/lib/naming/freemium-types';

interface PremiumStore extends PremiumState {
  // State
  isPremium: boolean;
  purchaseDate?: Date;
  transactionId?: string;

  // Actions
  activatePremium: (transactionId: string) => void;
  deactivatePremium: () => void;
  checkPremiumStatus: () => boolean;

  // Future: Favorites (premium feature)
  favorites: Set<string>;  // Candidate IDs
  addFavorite: (candidateId: string) => void;
  removeFavorite: (candidateId: string) => void;
  isFavorite: (candidateId: string) => boolean;
}

export const usePremiumStore = create<PremiumStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isPremium: false,
      purchaseDate: undefined,
      transactionId: undefined,
      favorites: new Set(),

      // Activate premium (after payment)
      activatePremium: (transactionId) => {
        set({
          isPremium: true,
          purchaseDate: new Date(),
          transactionId,
        });
      },

      // Deactivate (for testing or refund)
      deactivatePremium: () => {
        set({
          isPremium: false,
          purchaseDate: undefined,
          transactionId: undefined,
        });
      },

      // Check status
      checkPremiumStatus: () => {
        return get().isPremium;
      },

      // Favorites management
      addFavorite: (candidateId) => {
        const { favorites } = get();
        favorites.add(candidateId);
        set({ favorites: new Set(favorites) });
      },

      removeFavorite: (candidateId) => {
        const { favorites } = get();
        favorites.delete(candidateId);
        set({ favorites: new Set(favorites) });
      },

      isFavorite: (candidateId) => {
        return get().favorites.has(candidateId);
      },
    }),
    {
      name: 'premium-storage',
      // Only persist premium status and favorites
      partialize: (state) => ({
        isPremium: state.isPremium,
        purchaseDate: state.purchaseDate,
        transactionId: state.transactionId,
        favorites: Array.from(state.favorites),
      }),
      // Rehydrate favorites Set from array
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.favorites)) {
          state.favorites = new Set(state.favorites as string[]);
        }
      },
    }
  )
);
```

### 2.3 Classification Utility

```typescript
// app/lib/naming/freemium-classifier.ts

import type { ScoredCandidate } from './types';
import type {
  TieredCandidate,
  FreemiumSections,
  CTAMetrics,
  FreemiumTier
} from './freemium-types';

/**
 * Classify candidates into freemium tiers
 */
export function classifyCandidates(
  candidates: ScoredCandidate[]
): FreemiumSections {
  // 1. Sort by overall score DESC
  const sorted = [...candidates].sort(
    (a, b) => b.scores.overall - a.scores.overall
  );

  // 2. Classify into tiers
  const tiered: TieredCandidate[] = sorted.map((candidate, index) => {
    const rank = index + 1;
    let tier: FreemiumTier;

    if (rank <= 4) {
      tier = FreemiumTier.BLURRED;
    } else if (rank === 5) {
      tier = FreemiumTier.FREE;
    } else {
      tier = FreemiumTier.LOCKED;
    }

    const scoreGapFromFirst = sorted[0].scores.overall - candidate.scores.overall;
    const scoreGapFromFree = sorted[4]?.scores.overall
      ? sorted[4].scores.overall - candidate.scores.overall
      : 0;

    return {
      candidate,
      rank,
      tier,
      scoreGapFromFirst,
      scoreGapFromFree,
    };
  });

  // 3. Extract sections
  const blurred = tiered.filter(t => t.tier === FreemiumTier.BLURRED);
  const free = tiered.find(t => t.tier === FreemiumTier.FREE);
  const locked = tiered.filter(t => t.tier === FreemiumTier.LOCKED);

  if (!free) {
    throw new Error('No free tier candidate (rank 5) found');
  }

  return {
    blurred,
    free,
    locked: {
      candidates: locked,
      count: locked.length,
      averageScore: locked.length > 0
        ? locked.reduce((sum, t) => sum + t.candidate.scores.overall, 0) / locked.length
        : undefined,
      bestScore: locked[0]?.candidate.scores.overall,
    },
  };
}

/**
 * Calculate CTA messaging metrics
 */
export function calculateCTAMetrics(
  sections: FreemiumSections,
  price: number = 9900
): CTAMetrics {
  const topScore = sections.blurred[0].candidate.scores.overall;
  const freeScore = sections.free.candidate.scores.overall;
  const scoreGap = topScore - freeScore;
  const percentageGap = (scoreGap / topScore) * 100;

  return {
    scoreGap: Math.round(scoreGap * 10) / 10,  // 1 decimal place
    percentageGap: Math.round(percentageGap * 10) / 10,
    lockedCount: sections.locked.count,
    estimatedValue: price,
    topScore: Math.round(topScore * 10) / 10,
    freeScore: Math.round(freeScore * 10) / 10,
  };
}

/**
 * Generate psychological messaging
 */
export function generateCTAMessage(metrics: CTAMetrics): string {
  const { scoreGap, topScore, lockedCount } = metrics;

  // Different messages based on score gap
  if (scoreGap >= 20) {
    return `1등과 ${scoreGap}점 차이! 최상위 이름들을 확인하세요.`;
  } else if (scoreGap >= 10) {
    return `더 좋은 이름 ${4 + lockedCount}개를 놓치고 계세요.`;
  } else {
    return `${topScore}점! 최고 점수의 이름을 확인하세요.`;
  }
}
```

---

## 3. Component Architecture

### 3.1 Main Container Component

```typescript
// app/components/naming/ResultsPageFreemium.tsx

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ScoredCandidate } from '~/lib/naming/types';
import { usePremiumStore } from '~/stores/usePremiumStore';
import {
  classifyCandidates,
  calculateCTAMetrics,
  generateCTAMessage
} from '~/lib/naming/freemium-classifier';

import { BlurredSection } from './BlurredSection';
import { FreeSection } from './FreeSection';
import { LockedSection } from './LockedSection';
import { PaymentModal } from './PaymentModal';
import { PremiumResultsView } from './PremiumResultsView';

interface ResultsPageFreemiumProps {
  candidates: ScoredCandidate[];
  lastName: string;
  onBack?: () => void;
}

export function ResultsPageFreemium({
  candidates,
  lastName,
  onBack
}: ResultsPageFreemiumProps) {
  const { isPremium } = usePremiumStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Classify candidates into tiers
  const sections = useMemo(
    () => classifyCandidates(candidates),
    [candidates]
  );

  // Calculate CTA metrics
  const ctaMetrics = useMemo(
    () => calculateCTAMetrics(sections),
    [sections]
  );

  const ctaMessage = useMemo(
    () => generateCTAMessage(ctaMetrics),
    [ctaMetrics]
  );

  // Premium users see everything
  if (isPremium) {
    return (
      <PremiumResultsView
        candidates={candidates}
        lastName={lastName}
        onBack={onBack}
      />
    );
  }

  // Free users see freemium tiers
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {lastName}씨를 위한 작명 결과
        </h1>
        <p className="text-muted-foreground">
          총 {candidates.length}개의 이름이 생성되었습니다
        </p>
      </div>

      {/* Blurred Section (1-4위) */}
      <BlurredSection
        candidates={sections.blurred}
        onUnlock={() => setIsPaymentModalOpen(true)}
      />

      {/* Premium CTA */}
      <PremiumCTA
        metrics={ctaMetrics}
        message={ctaMessage}
        onUpgrade={() => setIsPaymentModalOpen(true)}
      />

      {/* Free Section (5위) */}
      <FreeSection
        candidate={sections.free}
        lastName={lastName}
      />

      {/* Locked Section (6-50위) */}
      <LockedSection
        lockedData={sections.locked}
        onUnlock={() => setIsPaymentModalOpen(true)}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        metrics={ctaMetrics}
      />
    </motion.div>
  );
}
```

### 3.2 Blurred Section Component

```typescript
// app/components/naming/BlurredSection.tsx

import { motion } from 'framer-motion';
import { Lock, Star, TrendingUp } from 'lucide-react';
import type { TieredCandidate } from '~/lib/naming/freemium-types';
import { cn } from '~/lib/utils';

interface BlurredSectionProps {
  candidates: TieredCandidate[];
  onUnlock: () => void;
}

export function BlurredSection({ candidates, onUnlock }: BlurredSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-500" />
          최고 점수 TOP 4
        </h2>
        <span className="text-sm text-muted-foreground">
          프리미엄으로 확인하세요
        </span>
      </div>

      <div className="grid gap-3">
        {candidates.map((tiered, index) => (
          <BlurredCard
            key={tiered.rank}
            tiered={tiered}
            onUnlock={onUnlock}
          />
        ))}
      </div>
    </div>
  );
}

interface BlurredCardProps {
  tiered: TieredCandidate;
  onUnlock: () => void;
}

function BlurredCard({ tiered, onUnlock }: BlurredCardProps) {
  const { rank, candidate } = tiered;
  const score = candidate.scores.overall;

  // Medal colors for ranks 1-3
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-600 to-amber-800';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      onClick={onUnlock}
      className={cn(
        "relative card-mobile cursor-pointer",
        "border-2 border-dashed border-primary/30",
        "hover:border-primary hover:shadow-lg transition-all"
      )}
    >
      {/* Rank Badge */}
      <div className={cn(
        "absolute -top-3 -left-3 z-10",
        "w-12 h-12 rounded-full flex items-center justify-center",
        "font-bold text-white shadow-lg",
        `bg-gradient-to-br ${getMedalColor(rank)}`
      )}>
        {rank}
      </div>

      {/* Lock Badge */}
      <div className="absolute -top-3 -right-3 z-10">
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shadow-lg">
          <Lock className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Blurred Name */}
        <div className="flex-1">
          <div
            className="text-2xl font-bold mb-1"
            style={{
              filter: 'blur(8px)',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
            {candidate.firstName[0]}{candidate.firstName[1]}
          </div>
          <div
            className="text-sm text-muted-foreground"
            style={{
              filter: 'blur(6px)',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
            {candidate.characters[0].character}
            {candidate.characters[1].character}
          </div>
        </div>

        {/* Score (CLEAR) */}
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          <span className="text-3xl font-bold text-primary">
            {score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Teaser Text */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        클릭하여 잠금 해제 →
      </div>
    </motion.div>
  );
}
```

### 3.3 Premium CTA Component

```typescript
// app/components/naming/PremiumCTA.tsx

import { motion } from 'framer-motion';
import { Sparkles, Lock, TrendingUp, Heart } from 'lucide-react';
import type { CTAMetrics } from '~/lib/naming/freemium-types';
import { Button } from '~/components/ui/button';

interface PremiumCTAProps {
  metrics: CTAMetrics;
  message: string;
  onUpgrade: () => void;
}

export function PremiumCTA({ metrics, message, onUpgrade }: PremiumCTAProps) {
  const { scoreGap, topScore, freeScore, lockedCount, estimatedValue } = metrics;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring' }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-[2px]"
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
        {/* Sparkles decoration */}
        <div className="absolute top-4 right-4">
          <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
        </div>

        <div className="space-y-4">
          {/* Main Message */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {message}
            </h3>
            <p className="text-sm text-muted-foreground">
              프리미엄으로 업그레이드하고 모든 이름을 확인하세요
            </p>
          </div>

          {/* Score Comparison */}
          <div className="grid grid-cols-3 gap-3 text-center py-4 border-y">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                1등 점수
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {topScore}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                무료 (5위)
              </div>
              <div className="text-2xl font-bold text-gray-600">
                {freeScore}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 text-green-600" />
              <span>TOP 4 최고 점수 이름 잠금 해제</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 text-green-600" />
              <span>{lockedCount}개 추가 이름 모두 확인</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-green-600" />
              <span>즐겨찾기 및 PDF 다운로드</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span>한자 상세 풀이 및 의미 분석</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onUpgrade}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg py-6"
          >
            <span className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              ₩{estimatedValue.toLocaleString()}로 프리미엄 시작
            </span>
          </Button>

          {/* Trust Signals */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>✓ 일회성 결제</span>
            <span>•</span>
            <span>✓ 평생 사용</span>
            <span>•</span>
            <span>✓ 7일 환불 보장</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

### 3.4 Free Section Component

```typescript
// app/components/naming/FreeSection.tsx

import { motion } from 'framer-motion';
import { Gift, Star } from 'lucide-react';
import type { TieredCandidate } from '~/lib/naming/freemium-types';
import { NameCard } from './NameCard';

interface FreeSectionProps {
  candidate: TieredCandidate;
  lastName: string;
}

export function FreeSection({ candidate, lastName }: FreeSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-green-500" />
        <h2 className="text-xl font-semibold">
          무료 체험
        </h2>
        <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
          5위
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <NameCard
          candidate={candidate.candidate}
          rank={candidate.rank}
          lastName={lastName}
          isFree={true}
          expanded={true}  // Auto-expanded for free preview
        />
      </motion.div>

      {/* Encouragement message */}
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <Star className="inline w-4 h-4 mb-1" />
          {' '}
          이것도 좋은 이름인데, 위에는 더 좋은 점수가 있어요!
        </p>
      </div>
    </div>
  );
}
```

### 3.5 Locked Section Component

```typescript
// app/components/naming/LockedSection.tsx

import { motion } from 'framer-motion';
import { Lock, TrendingDown } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface LockedSectionProps {
  lockedData: {
    count: number;
    averageScore?: number;
    bestScore?: number;
  };
  onUnlock: () => void;
}

export function LockedSection({ lockedData, onUnlock }: LockedSectionProps) {
  const { count, averageScore, bestScore } = lockedData;

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50"
    >
      {/* Lock Icon */}
      <div className="mx-auto w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-gray-500" />
      </div>

      {/* Message */}
      <h3 className="text-xl font-semibold mb-2">
        {count}개의 추가 이름이 잠겨있습니다
      </h3>

      {averageScore && (
        <p className="text-sm text-muted-foreground mb-4">
          평균 점수: {averageScore.toFixed(1)}점
          {bestScore && ` • 최고 점수: ${bestScore.toFixed(1)}점`}
        </p>
      )}

      <p className="text-muted-foreground mb-6">
        프리미엄으로 업그레이드하면 모든 이름을 확인할 수 있습니다
      </p>

      {/* Unlock Button */}
      <Button
        onClick={onUnlock}
        size="lg"
        variant="outline"
        className="border-2 hover:bg-gray-100"
      >
        <Lock className="w-4 h-4 mr-2" />
        잠금 해제
      </Button>
    </motion.div>
  );
}
```

### 3.6 Payment Modal (Placeholder)

```typescript
// app/components/naming/PaymentModal.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { CreditCard, Check } from 'lucide-react';
import type { CTAMetrics } from '~/lib/naming/freemium-types';
import { usePremiumStore } from '~/stores/usePremiumStore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: CTAMetrics;
}

export function PaymentModal({ isOpen, onClose, metrics }: PaymentModalProps) {
  const { activatePremium } = usePremiumStore();
  const { estimatedValue, lockedCount } = metrics;

  // TODO: Replace with actual payment integration
  const handleTestPurchase = () => {
    // Simulate payment success
    const mockTransactionId = `TEST_${Date.now()}`;
    activatePremium(mockTransactionId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">프리미엄으로 업그레이드</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Price */}
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              ₩{estimatedValue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              일회성 결제 • 평생 사용
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>TOP 4 최고 점수 이름 잠금 해제</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>{lockedCount + 4}개 전체 이름 확인</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>한자 상세 풀이</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>즐겨찾기 및 PDF 다운로드</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>평생 무제한 열람</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleTestPurchase}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              결제하기
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              size="lg"
              className="w-full"
            >
              나중에
            </Button>
          </div>

          {/* Trust signals */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <div>안전한 결제 • SSL 보안</div>
            <div>7일 이내 100% 환불 보장</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3.7 Premium Results View

```typescript
// app/components/naming/PremiumResultsView.tsx

import { motion } from 'framer-motion';
import { Crown, Download, Heart } from 'lucide-react';
import type { ScoredCandidate } from '~/lib/naming/types';
import { NameCard } from './NameCard';
import { Button } from '~/components/ui/button';

interface PremiumResultsViewProps {
  candidates: ScoredCandidate[];
  lastName: string;
  onBack?: () => void;
}

export function PremiumResultsView({
  candidates,
  lastName,
  onBack
}: PremiumResultsViewProps) {
  // Sort by score
  const sorted = [...candidates].sort(
    (a, b) => b.scores.overall - a.scores.overall
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6"
    >
      {/* Premium Badge */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {lastName}씨를 위한 작명 결과
          </h1>
          <p className="text-muted-foreground">
            총 {candidates.length}개의 이름 (프리미엄)
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-full">
          <Crown className="w-5 h-5" />
          <span className="font-semibold">프리미엄</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          <Heart className="w-4 h-4 mr-2" />
          즐겨찾기 보기
        </Button>
        <Button variant="outline" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          PDF 다운로드
        </Button>
      </div>

      {/* All Names */}
      <div className="space-y-4">
        {sorted.map((candidate, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <NameCard
              candidate={candidate}
              rank={index + 1}
              lastName={lastName}
              isPremium={true}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
```

---

## 4. UX Psychology Design

### 4.1 Psychological Triggers

```typescript
/**
 * Psychology-driven design decisions
 */
export const PSYCHOLOGY_PATTERNS = {
  // 1. Curiosity Gap (블러 효과)
  blurEffect: {
    primary: 'blur(8px)',     // Names: 완전히 알아볼 수 없게
    secondary: 'blur(6px)',   // Hanja: 흐릿하게
    score: 'clear',           // Score: 선명하게 (티저)
    rationale: 'Score만 보여줘서 "얼마나 좋은지" 알게 하되, "무엇인지"는 모르게'
  },

  // 2. Loss Aversion (놓치고 있다는 감정)
  lossAversion: {
    message: '1등과 20점 차이',
    emphasis: 'scoreGap',
    colorCoding: {
      high: 'text-red-600',   // >20점 차이: 빨강 (위험)
      medium: 'text-orange-600', // 10-20점: 주황
      low: 'text-yellow-600'  // <10점: 노랑
    }
  },

  // 3. Social Proof (순위 강조)
  socialProof: {
    medals: [1, 2, 3],        // 메달 표시
    colors: {
      gold: 'from-yellow-400 to-yellow-600',
      silver: 'from-gray-300 to-gray-500',
      bronze: 'from-amber-600 to-amber-800'
    },
    rationale: '1-3위 특별함 강조 → "이게 최고구나" 인식'
  },

  // 4. Value Demonstration (무료 샘플)
  valueDemonstration: {
    freeRank: 5,              // 5위 공개
    fullAccess: true,         // 완전 접근
    rationale: '품질 입증 → "이것도 좋은데 위는 더 좋겠네"'
  },

  // 5. Scarcity (제한된 정보)
  scarcity: {
    lockedMessage: 'N개의 추가 이름',
    emphasize: 'count',
    rationale: '볼륨감 제공 → "많이 놓치고 있네" 감정'
  },

  // 6. Anchoring (가격 정당화)
  anchoring: {
    context: '평생 쓸 이름',
    comparison: '만원 = 커피 3잔',
    rationale: '낮은 가격 인식 → 쉬운 결정'
  },

  // 7. Trust Building (신뢰 신호)
  trustSignals: [
    '일회성 결제',
    '평생 사용',
    '7일 환불 보장',
    'SSL 보안'
  ]
};
```

### 4.2 Animation Timing Strategy

```typescript
/**
 * Optimal animation timing for psychological impact
 */
export const ANIMATION_TIMING = {
  // Stage 1: Initial Impact (0-1s)
  initial: {
    header: 0,              // 즉시 표시
    blurred: 0.1,           // 0.1s 후 블러 카드 등장
    stagger: 0.1,           // 각 카드 0.1s 간격
  },

  // Stage 2: Build Curiosity (1-2s)
  curiosity: {
    cta: 0.5,               // 0.5s 후 CTA 등장
    emphasis: 'spring',     // 스프링 애니메이션 (주목)
  },

  // Stage 3: Value Demonstration (2-3s)
  demonstration: {
    freeCard: 0.4,          // 무료 카드 등장
    autoExpand: true,       // 자동 확장 (품질 입증)
  },

  // Stage 4: Final Push (3s+)
  finalPush: {
    locked: 0.6,            // 잠긴 섹션 등장
    emphasize: 'volume',    // 놓치는 것 강조
  },

  // Interaction feedback
  feedback: {
    hover: 0.2,             // 호버 반응 속도
    click: 0.1,             // 클릭 피드백 속도
    modal: 0.3,             // 모달 등장 속도
  }
};
```

### 4.3 Color Psychology

```typescript
/**
 * Color coding for psychological messaging
 */
export const COLOR_PSYCHOLOGY = {
  premium: {
    gradient: 'from-purple-600 to-pink-600',
    rationale: '고급스러움, 특별함'
  },

  locked: {
    icon: 'text-gray-500',
    border: 'border-gray-300',
    rationale: '접근 불가 → 중립적 회색'
  },

  free: {
    badge: 'bg-green-50 text-green-600',
    rationale: '무료 → 긍정적 녹색'
  },

  score: {
    high: 'text-yellow-600',    // 90+
    good: 'text-blue-600',      // 80-89
    fair: 'text-green-600',     // 70-79
    low: 'text-gray-600',       // <70
  },

  cta: {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600',
    hover: 'from-purple-700 to-pink-700',
    rationale: '강력한 행동 유도 → 대비되는 그라데이션'
  }
};
```

---

## 5. State Management Strategy

### 5.1 Zustand Store Architecture

```
┌─────────────────────────────────────┐
│      usePremiumStore (persist)      │
│  - isPremium: boolean               │
│  - purchaseDate: Date?              │
│  - transactionId: string?           │
│  - favorites: Set<string>           │
│  └─────────────────────────────────┘
                 │
                 ├─ activatePremium()
                 ├─ deactivatePremium()
                 ├─ checkPremiumStatus()
                 └─ Favorites CRUD
```

**Persistence Strategy**:
- **Storage**: `localStorage` via zustand/persist
- **Key**: `premium-storage`
- **Rehydration**: On app mount
- **Expiration**: Never (one-time purchase)

**Future: Subscription Model**:
```typescript
interface SubscriptionState {
  plan: 'free' | 'premium' | 'lifetime';
  expiresAt?: Date;
  autoRenew: boolean;
}
```

### 5.2 Session vs Persistent State

```typescript
/**
 * State classification
 */
const STATE_CLASSIFICATION = {
  persistent: [
    'isPremium',
    'purchaseDate',
    'transactionId',
    'favorites'
  ],

  session: [
    'currentCandidates',  // Current results
    'paymentModalOpen',   // UI state
    'expandedCards'       // UI state
  ],

  computed: [
    'sections',           // Derived from candidates
    'ctaMetrics',         // Calculated from sections
    'ctaMessage'          // Generated from metrics
  ]
};
```

---

## 6. API Integration

### 6.1 Results Flow

```
User completes form
       │
       ▼
POST /api/naming/recommend
       │
       ▼
API returns 30-50 ScoredCandidate[]
       │
       ▼
ResultsPageFreemium receives candidates
       │
       ▼
classifyCandidates() → FreemiumSections
       │
       ▼
Conditional render based on isPremium
```

### 6.2 Premium Purchase Flow (Future)

```
User clicks CTA
       │
       ▼
PaymentModal opens
       │
       ▼
User enters payment info
       │
       ▼
POST /api/payment/process
       │
       ├─ Success
       │    ├─ activatePremium(transactionId)
       │    ├─ Re-render with premium view
       │    └─ Show success toast
       │
       └─ Failure
            ├─ Show error message
            └─ Allow retry
```

---

## 7. Implementation Checklist

### Phase 1: Core Architecture (Priority: CRITICAL)

- [ ] **Data Layer**
  - [ ] Create `freemium-types.ts` with all TypeDefinitions
  - [ ] Create `freemium-classifier.ts` with utility functions
  - [ ] Create `usePremiumStore.ts` with Zustand persist
  - [ ] Test classification logic with mock data

- [ ] **Component Structure**
  - [ ] Create `ResultsPageFreemium.tsx` container
  - [ ] Implement tier-based conditional rendering
  - [ ] Add premium state integration
  - [ ] Test with isPremium toggle

### Phase 2: Freemium Components (Priority: HIGH)

- [ ] **BlurredSection**
  - [ ] Create `BlurredSection.tsx` and `BlurredCard.tsx`
  - [ ] Implement blur CSS (filter: blur(8px))
  - [ ] Add click handler to open payment modal
  - [ ] Add rank badges (medals)
  - [ ] Test blur effect on various devices

- [ ] **PremiumCTA**
  - [ ] Create `PremiumCTA.tsx`
  - [ ] Implement dynamic messaging from CTAMetrics
  - [ ] Add gradient styling
  - [ ] Add benefits list
  - [ ] Add trust signals

- [ ] **FreeSection**
  - [ ] Create `FreeSection.tsx`
  - [ ] Integrate existing `NameCard` component
  - [ ] Add "free preview" badge
  - [ ] Auto-expand for visibility

- [ ] **LockedSection**
  - [ ] Create `LockedSection.tsx`
  - [ ] Show locked count
  - [ ] Add unlock button
  - [ ] Optional: Show average/best score teaser

### Phase 3: Premium View (Priority: HIGH)

- [ ] **PremiumResultsView**
  - [ ] Create `PremiumResultsView.tsx`
  - [ ] Show all candidates without restrictions
  - [ ] Add premium badge/crown icon
  - [ ] Add favorites functionality
  - [ ] Add PDF download button (future)

### Phase 4: Payment Integration (Priority: MEDIUM)

- [ ] **PaymentModal**
  - [ ] Create `PaymentModal.tsx`
  - [ ] Add test purchase flow
  - [ ] Integrate activatePremium action
  - [ ] Add loading states
  - [ ] Add error handling

- [ ] **Backend Integration** (Future)
  - [ ] Create `/api/payment/process` endpoint
  - [ ] Integrate with PG (Toss Payments, etc.)
  - [ ] Handle webhooks for payment verification
  - [ ] Store transactions in database
  - [ ] Implement refund logic

### Phase 5: Polish & Optimization (Priority: LOW)

- [ ] **Animations**
  - [ ] Fine-tune animation timings
  - [ ] Add micro-interactions
  - [ ] Test on mobile devices
  - [ ] Optimize for 60fps

- [ ] **Accessibility**
  - [ ] Add ARIA labels
  - [ ] Ensure keyboard navigation
  - [ ] Test with screen readers
  - [ ] Add focus indicators

- [ ] **Analytics**
  - [ ] Track CTA click rates
  - [ ] Track conversion funnel
  - [ ] A/B test messaging variations
  - [ ] Optimize based on data

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// freemium-classifier.test.ts

describe('classifyCandidates', () => {
  it('should classify top 4 as blurred', () => {
    const candidates = mockCandidates(50);
    const sections = classifyCandidates(candidates);
    expect(sections.blurred).toHaveLength(4);
    expect(sections.blurred[0].rank).toBe(1);
  });

  it('should classify rank 5 as free', () => {
    const candidates = mockCandidates(50);
    const sections = classifyCandidates(candidates);
    expect(sections.free.rank).toBe(5);
  });

  it('should classify 6+ as locked', () => {
    const candidates = mockCandidates(50);
    const sections = classifyCandidates(candidates);
    expect(sections.locked.count).toBe(45);
  });
});

describe('calculateCTAMetrics', () => {
  it('should calculate score gap correctly', () => {
    const sections = mockSections();
    const metrics = calculateCTAMetrics(sections);
    expect(metrics.scoreGap).toBeGreaterThan(0);
  });
});
```

### 8.2 Integration Tests

```typescript
// ResultsPageFreemium.test.tsx

describe('ResultsPageFreemium', () => {
  it('should show blurred cards for free users', () => {
    const { container } = render(
      <ResultsPageFreemium candidates={mockCandidates(50)} />
    );
    const blurred = container.querySelectorAll('[style*="blur"]');
    expect(blurred.length).toBeGreaterThan(0);
  });

  it('should show all cards for premium users', () => {
    usePremiumStore.setState({ isPremium: true });
    const { queryByText } = render(
      <ResultsPageFreemium candidates={mockCandidates(50)} />
    );
    expect(queryByText(/잠겨있습니다/)).toBeNull();
  });

  it('should open payment modal on CTA click', () => {
    const { getByText } = render(
      <ResultsPageFreemium candidates={mockCandidates(50)} />
    );
    fireEvent.click(getByText(/프리미엄 시작/));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

### 8.3 E2E Tests (Playwright)

```typescript
// freemium-flow.spec.ts

test('freemium conversion flow', async ({ page }) => {
  // 1. Navigate to results
  await page.goto('/naming/results?session=test');

  // 2. Verify blurred cards exist
  await expect(page.locator('[style*="blur"]')).toHaveCount(8); // 4 cards × 2 elements

  // 3. Verify free card is visible
  await expect(page.locator('text=무료 체험')).toBeVisible();

  // 4. Click premium CTA
  await page.click('text=프리미엄 시작');

  // 5. Verify modal opened
  await expect(page.locator('role=dialog')).toBeVisible();

  // 6. Complete test purchase
  await page.click('text=결제하기');

  // 7. Verify premium view
  await expect(page.locator('text=프리미엄')).toBeVisible();
  await expect(page.locator('[style*="blur"]')).toHaveCount(0);
});
```

---

## 9. Performance Optimization

### 9.1 Rendering Strategy

```typescript
/**
 * Optimization checklist
 */
const PERFORMANCE_OPTIMIZATIONS = {
  // 1. Memoization
  memoization: [
    'useMemo for sections classification',
    'useMemo for CTA metrics',
    'useCallback for event handlers'
  ],

  // 2. Lazy Loading
  lazyLoading: [
    'Lazy load PaymentModal',
    'Lazy load PremiumResultsView',
    'Code splitting for payment gateway'
  ],

  // 3. Virtual Scrolling
  virtualScrolling: [
    'Use react-window for 50+ cards',
    'Render only visible cards',
    'Prefetch next 5 cards'
  ],

  // 4. Image Optimization
  imageOptimization: [
    'Optimize medal icons',
    'Use SVG for icons',
    'Lazy load decorative images'
  ],

  // 5. Bundle Size
  bundleSize: [
    'Tree-shake unused framer-motion features',
    'Use lucide-react imports (not full bundle)',
    'Code split payment components'
  ]
};
```

### 9.2 Target Metrics

```typescript
const PERFORMANCE_TARGETS = {
  FCP: '< 1.5s',      // First Contentful Paint
  LCP: '< 2.5s',      // Largest Contentful Paint
  TTI: '< 3.5s',      // Time to Interactive
  CLS: '< 0.1',       // Cumulative Layout Shift
  FID: '< 100ms',     // First Input Delay

  interactions: {
    blurRender: '< 16ms',     // 60fps
    modalOpen: '< 300ms',
    premiumActivation: '< 1s'
  }
};
```

---

## 10. A/B Testing Plan

### 10.1 Test Variations

```typescript
/**
 * A/B test variations for optimization
 */
const AB_TEST_VARIANTS = {
  // Test 1: Blur intensity
  blurIntensity: {
    A: 'blur(8px)',   // Control
    B: 'blur(12px)',  // Stronger blur
    metric: 'CTA click rate'
  },

  // Test 2: Free tier position
  freeTierRank: {
    A: 5,             // Control (5th)
    B: 3,             // Higher quality (3rd)
    metric: 'Conversion rate'
  },

  // Test 3: CTA messaging
  ctaMessage: {
    A: '1등과 20점 차이',              // Loss aversion
    B: '최고 점수 확인하기',           // Direct benefit
    C: '더 좋은 이름 40개 대기중',     // Volume emphasis
    metric: 'Modal open rate'
  },

  // Test 4: Price display
  priceDisplay: {
    A: '₩9,900',                      // Direct price
    B: '₩9,900 (커피 3잔 값)',        // Anchoring
    C: '하루 ₩27 (30일 기준)',        // Daily breakdown
    metric: 'Purchase completion rate'
  },

  // Test 5: CTA button style
  ctaButtonStyle: {
    A: 'gradient purple-pink',        // Control
    B: 'solid primary',               // Conservative
    C: 'gradient gold-yellow',        // Luxury
    metric: 'Click-through rate'
  }
};
```

### 10.2 Conversion Funnel Tracking

```typescript
/**
 * Analytics events to track
 */
const ANALYTICS_EVENTS = {
  // Freemium funnel
  freemium: {
    resultsPageView: 'view_results_page',
    blurredCardClick: 'click_blurred_card',
    ctaView: 'view_premium_cta',
    ctaClick: 'click_premium_cta',
    modalOpen: 'open_payment_modal',
    paymentStart: 'start_payment',
    paymentSuccess: 'complete_payment',
    paymentFail: 'fail_payment'
  },

  // Engagement
  engagement: {
    freeCardExpand: 'expand_free_card',
    freeCardCollapse: 'collapse_free_card',
    favoriteAdd: 'add_favorite',
    pdfDownload: 'download_pdf'
  },

  // Premium usage
  premium: {
    premiumCardView: 'view_premium_card',
    premiumCardExpand: 'expand_premium_card',
    characterDetailView: 'view_character_detail'
  }
};
```

---

## 11. Mobile Optimization

### 11.1 Responsive Design

```typescript
/**
 * Mobile-first responsive strategy
 */
const RESPONSIVE_BREAKPOINTS = {
  mobile: '< 640px',
  tablet: '640px - 1024px',
  desktop: '> 1024px'
};

const MOBILE_OPTIMIZATIONS = {
  // Layout adjustments
  layout: {
    blurredCards: 'stack vertically',
    cta: 'sticky bottom bar',
    modal: 'full-screen on mobile'
  },

  // Touch optimization
  touch: {
    minTapTarget: '44px × 44px',
    swipeGestures: 'left/right for card navigation',
    pinchZoom: 'disabled on blurred cards'
  },

  // Performance
  performance: {
    reducedMotion: 'respect prefers-reduced-motion',
    animationDuration: 'shorter on mobile',
    imageSize: 'responsive srcset'
  }
};
```

### 11.2 Mobile UX Enhancements

```typescript
// Mobile-specific component variations

export function BlurredCardMobile({ tiered, onUnlock }: BlurredCardProps) {
  return (
    <motion.div
      className="card-mobile touch-manipulation"
      onClick={onUnlock}
      whileTap={{ scale: 0.98 }}  // Tactile feedback
    >
      {/* Larger tap targets */}
      <div className="p-6">  {/* Increased padding */}
        {/* ... content ... */}
      </div>

      {/* Clear touch indicator */}
      <div className="text-center py-4 bg-primary/10 rounded-b-xl">
        <span className="text-sm font-medium text-primary">
          탭하여 잠금 해제 👆
        </span>
      </div>
    </motion.div>
  );
}

// Sticky CTA on mobile
export function MobileStickyC TA({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden z-50">
      <Button
        onClick={onUpgrade}
        size="lg"
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
      >
        프리미엄으로 업그레이드
      </Button>
    </div>
  );
}
```

---

## 12. Future Enhancements

### 12.1 Phase 4 Features (Post-Launch)

```typescript
/**
 * Future feature roadmap
 */
const FUTURE_FEATURES = {
  // 1. Advanced Analytics
  analytics: {
    userBehaviorTracking: 'Heatmaps, scroll depth, time on tier',
    abTesting: 'Automated A/B test framework',
    conversionOptimization: 'ML-based messaging optimization'
  },

  // 2. Enhanced Freemium
  enhancedFreemium: {
    timedTrials: '24-hour full access trial',
    referralProgram: 'Unlock 1 name per referral',
    socialSharing: 'Share to unlock bonus content'
  },

  // 3. Premium Features
  premiumFeatures: {
    aiExplanation: 'GPT-powered name meaning expansion',
    voiceNarration: 'Audio pronunciation guide',
    customReports: 'Personalized PDF with family history',
    expertConsultation: '1:1 naming expert video call'
  },

  // 4. Subscription Model
  subscriptionModel: {
    tiers: ['Free', 'Basic (₩9,900)', 'Pro (₩29,900)', 'Expert (₩99,900)'],
    familyPlan: 'Multiple children naming',
    businessPlan: 'Company/brand naming services'
  },

  // 5. Gamification
  gamification: {
    achievements: 'Unlock badges for exploration',
    leaderboard: 'Most favorited names (anonymous)',
    challenges: 'Daily name puzzles for rewards'
  }
};
```

### 12.2 Monetization Optimization

```typescript
/**
 * Revenue optimization strategies
 */
const MONETIZATION_STRATEGIES = {
  // Dynamic pricing
  dynamicPricing: {
    demandBased: 'Increase price during peak seasons (New Year)',
    timeDecay: 'Discount after 24 hours without purchase',
    bundling: 'Family package (3 children for ₩24,900)'
  },

  // Upsells
  upsells: {
    premiumPlus: 'Add expert consultation (+₩50,000)',
    physicalProduct: 'Printed naming certificate (+₩30,000)',
    giftPackage: 'Gift box with calligraphy (+₩100,000)'
  },

  // Retention
  retention: {
    anniversaryReminder: 'Birthday reminders with new features',
    siblingDiscount: 'Second child naming 50% off',
    lifetimeUpdates: 'Algorithm improvements benefit all users'
  }
};
```

---

## 13. Success Metrics

### 13.1 KPIs to Track

```typescript
/**
 * Key performance indicators
 */
const SUCCESS_METRICS = {
  // Conversion funnel
  conversionFunnel: {
    resultsPageViews: 'Total results page loads',
    ctaImpressions: 'CTA view rate',
    ctaClicks: 'CTA click-through rate',
    modalOpens: 'Modal open rate',
    paymentAttempts: 'Payment start rate',
    paymentSuccess: 'Payment completion rate'
  },

  // Revenue
  revenue: {
    totalRevenue: 'Total sales',
    averageOrderValue: 'AOV',
    conversionRate: 'Overall conversion %',
    revenuePerUser: 'ARPU',
    lifetimeValue: 'LTV'
  },

  // Engagement
  engagement: {
    timeOnPage: 'Average session duration',
    cardInteractions: 'Card expand/collapse rate',
    freeCardEngagement: 'Time spent on free card',
    characterDetailViews: 'Detail modal opens'
  },

  // Quality
  quality: {
    refundRate: 'Refund request %',
    supportTickets: 'Customer service volume',
    userSatisfaction: 'NPS score',
    repeatPurchase: 'Multi-child naming rate'
  }
};
```

### 13.2 Target Benchmarks

```typescript
/**
 * Success benchmarks (industry standards)
 */
const TARGET_BENCHMARKS = {
  conversionRate: {
    current: 0,
    target: '5-10%',      // Typical SaaS freemium
    stretch: '15%+'       // Exceptional
  },

  ctaClickRate: {
    target: '20-30%',     // CTA visibility
    stretch: '40%+'
  },

  modalConversion: {
    target: '30-40%',     // Modal to payment
    stretch: '50%+'
  },

  refundRate: {
    target: '< 5%',       // Industry standard
    stretch: '< 2%'
  },

  nps: {
    target: '> 50',       // Good
    stretch: '> 70'       // Excellent
  }
};
```

---

## 14. Risk Mitigation

### 14.1 Potential Risks

```typescript
/**
 * Risk analysis and mitigation
 */
const RISK_ANALYSIS = {
  // Risk 1: Low conversion rate
  lowConversion: {
    probability: 'Medium',
    impact: 'High',
    mitigation: [
      'A/B test messaging variations',
      'Adjust free tier (rank 3 vs 5)',
      'Add time-limited discount',
      'Implement exit-intent popup'
    ]
  },

  // Risk 2: High refund rate
  highRefunds: {
    probability: 'Low',
    impact: 'High',
    mitigation: [
      'Improve free tier quality demonstration',
      'Add satisfaction guarantee messaging',
      'Collect feedback on refund requests',
      'Implement cooling-off period education'
    ]
  },

  // Risk 3: Blur bypass attempts
  blurBypass: {
    probability: 'Medium',
    impact: 'Medium',
    mitigation: [
      'Server-side data control',
      'Don't send blurred data to client',
      'Obfuscate DOM',
      'Rate limit API requests'
    ]
  },

  // Risk 4: Poor mobile experience
  mobileUX: {
    probability: 'Low',
    impact: 'Medium',
    mitigation: [
      'Mobile-first design',
      'Extensive mobile testing',
      'Touch-optimized interactions',
      'Progressive enhancement'
    ]
  },

  // Risk 5: Payment gateway failures
  paymentFailures: {
    probability: 'Low',
    impact: 'Critical',
    mitigation: [
      'Multiple payment gateway fallbacks',
      'Clear error messaging',
      'Retry mechanism',
      'Customer support escalation'
    ]
  }
};
```

### 14.2 Security Considerations

```typescript
/**
 * Security measures
 */
const SECURITY_MEASURES = {
  // Data protection
  dataProtection: {
    clientSide: [
      'Never send blurred candidate data to client',
      'Only send rank and score for blurred tiers',
      'Obfuscate actual names in DOM'
    ],
    serverSide: [
      'Verify premium status on every request',
      'Rate limit API endpoints',
      'Implement CSRF protection',
      'Validate payment webhooks'
    ]
  },

  // Payment security
  paymentSecurity: {
    pciCompliance: 'Use PCI-DSS compliant gateway (Toss Payments)',
    tokenization: 'Never store card details',
    sslTls: 'Enforce HTTPS everywhere',
    fraudDetection: 'Monitor suspicious patterns'
  },

  // Privacy
  privacy: {
    gdpr: 'Data minimization, right to deletion',
    localDataEncryption: 'Encrypt localStorage premium state',
    anonymization: 'Anonymous analytics',
    transparentPolicies: 'Clear privacy policy and ToS'
  }
};
```

---

## 15. Documentation & Handoff

### 15.1 Developer Documentation

```markdown
# Freemium System Developer Guide

## Quick Start

1. **Install dependencies** (already done)
2. **Create types**: `app/lib/naming/freemium-types.ts`
3. **Create classifier**: `app/lib/naming/freemium-classifier.ts`
4. **Create store**: `app/stores/usePremiumStore.ts`
5. **Create components**: See component architecture section
6. **Test with mock data**: Use `isPremium` toggle

## Key Files

- Types: `app/lib/naming/freemium-types.ts`
- Logic: `app/lib/naming/freemium-classifier.ts`
- State: `app/stores/usePremiumStore.ts`
- Main: `app/components/naming/ResultsPageFreemium.tsx`
- Sections: `app/components/naming/{Blurred,Free,Locked}Section.tsx`
- CTA: `app/components/naming/PremiumCTA.tsx`
- Modal: `app/components/naming/PaymentModal.tsx`

## Testing Premium Flow

```typescript
// Toggle premium in dev tools
usePremiumStore.getState().activatePremium('TEST_ID');

// Reset
usePremiumStore.getState().deactivatePremium();
```

## Common Issues

1. **Blur not working**: Check CSS filter support
2. **State not persisting**: Verify zustand persist config
3. **CTA not showing**: Check sections classification logic
```

### 15.2 Product Documentation

```markdown
# Freemium Strategy Product Spec

## User Flows

### Free User Journey
1. Complete naming form
2. Receive 30-50 results
3. See TOP 4 blurred (scores visible)
4. See rank 5 fully (quality demonstration)
5. See 6-50 locked (volume teaser)
6. Click CTA → Payment modal
7. Complete payment
8. Instant premium access

### Premium User Journey
1. Results page loads
2. All candidates visible
3. Premium badge shown
4. Access to favorites
5. PDF download available
6. Character detail modals

## Psychology Principles

- **Curiosity Gap**: Blur + clear scores
- **Loss Aversion**: "Missing 20 points"
- **Value Demonstration**: Free 5th rank
- **Scarcity**: "40 names locked"
- **Anchoring**: "₩9,900 = coffee 3x"

## Success Criteria

- Conversion rate: 5-10%
- Refund rate: < 5%
- NPS: > 50
- Mobile experience: Excellent
```

---

## Conclusion

이 아키텍처는 심리학 기반의 Freemium 전략을 통해 사용자에게 가치를 입증하고 자연스럽게 프리미엄 전환을 유도하는 시스템입니다.

**핵심 성공 요인**:
1. **명확한 가치 제시**: 5위 무료 공개로 품질 입증
2. **심리적 압박**: 블러 + 점수 차이 강조
3. **낮은 진입 장벽**: ₩9,900 일회성 결제
4. **즉각적인 만족**: 결제 즉시 전체 공개

**다음 단계**:
- Phase 1: 데이터 레이어 및 유틸리티 구현
- Phase 2: Freemium 컴포넌트 개발
- Phase 3: 프리미엄 뷰 및 통합
- Phase 4: 결제 연동 및 최적화
- Phase 5: A/B 테스트 및 전환율 최적화

**예상 일정**:
- Phase 1-2: 1-2일
- Phase 3: 1일
- Phase 4: 2-3일 (결제 연동)
- Phase 5: 지속적 최적화

이 설계를 기반으로 단계적으로 구현하면 효과적인 Freemium 전환 시스템을 구축할 수 있습니다.
