# Data Enhancement Scripts - Implementation Guide

## Overview

This directory contains ETL scripts for the 3-phase data enhancement project:

1. **Phase 1: Gender Classification** (Scripts 85-87)
2. **Phase 2: Popularity Scoring** (Scripts 88-89)
3. **Phase 3: Negative Filtering** (Scripts 90-91)

## Script Inventory

### ✅ Completed
- `check-db-stats.ts` - Database statistics analyzer

### 📝 To Be Implemented

#### Phase 1: Gender Classification
- `85_classify_gender.ts` - Main gender classification algorithm
- `86_validate_gender_classification.ts` - Validation and quality checks
- `87_update_gender_data.ts` - Database update for gender field

#### Phase 2: Popularity Scoring
- `88_collect_newborn_stats.ts` - Collect and process 2024 newborn name statistics
- `89_update_name_frequency.ts` - Database update for nameFrequency field

#### Phase 3: Enhanced Negative Filtering
- `90_expand_negative_characters.ts` - Expand negative character list
- `91_validate_negative_characters.ts` - Validate negative classifications

## Data Directory Structure

```
saju/
├── scripts/
│   └── etl/
│       ├── check-db-stats.ts ✅
│       ├── 85_classify_gender.ts 📝
│       ├── 86_validate_gender_classification.ts 📝
│       ├── 87_update_gender_data.ts 📝
│       ├── 88_collect_newborn_stats.ts 📝
│       ├── 89_update_name_frequency.ts 📝
│       ├── 90_expand_negative_characters.ts 📝
│       ├── 91_validate_negative_characters.ts 📝
│       └── __tests__/
│           └── data-enhancement.test.ts 📝
└── data/
    ├── gender-classification/
    │   ├── tier1-explicit.json 📝
    │   ├── tier2-cultural-male.json 📝
    │   ├── tier2-cultural-female.json 📝
    │   ├── tier3-neutral.json 📝
    │   └── newborn-stats-2024.json 📝
    ├── popularity/
    │   ├── newborn-names-2024.json 📝
    │   └── character-frequencies-2024.json (auto-generated)
    └── negative-characters/
        ├── categories.json 📝
        └── validation-report.json (auto-generated)
```

## Implementation Priority

### Week 1: Gender Classification
1. Create `data/gender-classification/tier1-explicit.json`
2. Implement `85_classify_gender.ts`
3. Implement `86_validate_gender_classification.ts`
4. Implement `87_update_gender_data.ts`
5. Run and validate

### Week 2-3: Popularity Scoring
1. Collect 2024 newborn name data → `data/popularity/newborn-names-2024.json`
2. Implement `88_collect_newborn_stats.ts`
3. Implement `89_update_name_frequency.ts`
4. Run and validate

### Week 4: Enhanced Negative Filtering
1. Create `data/negative-characters/categories.json`
2. Implement `90_expand_negative_characters.ts`
3. Implement `91_validate_negative_characters.ts`
4. Run and validate

## Script Templates

### Template: Gender Classification Script
```typescript
// scripts/etl/85_classify_gender.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

interface GenderClassification {
  character: string;
  gender: 'male' | 'female' | 'neutral';
  confidence: number;
  source: 'explicit' | 'statistical' | 'cultural' | 'default';
  reasoning: string;
}

async function main() {
  console.log('🔄 Starting gender classification...\n');

  // 1. Load tier 1 explicit data
  const tier1 = JSON.parse(
    await fs.readFile('data/gender-classification/tier1-explicit.json', 'utf-8')
  );

  // 2. Load all characters from database
  const allChars = await prisma.hanjaDict.findMany({
    select: { character: true, meaning: true, radical: true }
  });

  console.log(`📊 Total characters: ${allChars.length}`);

  // 3. Classify each character
  const results: GenderClassification[] = [];
  for (const char of allChars) {
    const classification = await classifyCharacter(char, tier1);
    results.push(classification);
  }

  // 4. Generate report
  const report = {
    timestamp: new Date().toISOString(),
    total: results.length,
    byGender: {
      male: results.filter(r => r.gender === 'male').length,
      female: results.filter(r => r.gender === 'female').length,
      neutral: results.filter(r => r.gender === 'neutral').length
    },
    bySource: {
      explicit: results.filter(r => r.source === 'explicit').length,
      statistical: results.filter(r => r.source === 'statistical').length,
      cultural: results.filter(r => r.source === 'cultural').length,
      default: results.filter(r => r.source === 'default').length
    }
  };

  console.log('\n📊 Classification Results:');
  console.log(JSON.stringify(report, null, 2));

  // 5. Save results
  await fs.writeFile(
    'data/gender-classification/classification-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n✅ Classification complete!');
}

async function classifyCharacter(
  char: { character: string; meaning: string | null; radical: string | null },
  tier1: { male: string[]; female: string[] }
): Promise<GenderClassification> {
  // Tier 1: Explicit classification
  if (tier1.male.includes(char.character)) {
    return {
      character: char.character,
      gender: 'male',
      confidence: 0.95,
      source: 'explicit',
      reasoning: 'Explicitly male character in Korean naming culture'
    };
  }

  if (tier1.female.includes(char.character)) {
    return {
      character: char.character,
      gender: 'female',
      confidence: 0.95,
      source: 'explicit',
      reasoning: 'Explicitly female character in Korean naming culture'
    };
  }

  // Tier 2: Statistical classification (implement based on newborn data)
  // TODO: Implement statistical classification

  // Tier 3: Cultural patterns (implement based on meaning/radical)
  // TODO: Implement cultural classification

  // Default: neutral
  return {
    character: char.character,
    gender: 'neutral',
    confidence: 0.5,
    source: 'default',
    reasoning: 'No strong gender association found'
  };
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Template: Popularity Scoring Script
```typescript
// scripts/etl/88_collect_newborn_stats.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

interface NewbornName {
  rank: number;
  name: string;
  gender: 'M' | 'F';
  count: number;
  characters: string[];
}

interface CharacterFrequency {
  character: string;
  totalUsage: number;
  maleUsage: number;
  femaleUsage: number;
  appearances: number;
  score: number;
}

async function main() {
  console.log('📊 Collecting 2024 newborn name statistics...\n');

  // 1. Load newborn names dataset
  const dataset = JSON.parse(
    await fs.readFile('data/popularity/newborn-names-2024.json', 'utf-8')
  );

  const names: NewbornName[] = dataset.names;
  console.log(`✅ Loaded ${names.length} names from dataset`);

  // 2. Calculate character frequencies
  const frequencies = calculateCharacterFrequencies(names);
  console.log(`📈 Calculated frequencies for ${frequencies.size} characters`);

  // 3. Normalize scores to 0-10000 range
  normalizeScores(frequencies);

  // 4. Save frequency data
  await fs.writeFile(
    'data/popularity/character-frequencies-2024.json',
    JSON.stringify(Array.from(frequencies.values()), null, 2)
  );

  // 5. Display top 20
  const topChars = Array.from(frequencies.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  console.log('\n⭐ Top 20 Most Popular Characters:');
  topChars.forEach((char, idx) => {
    console.log(
      `  ${idx + 1}. ${char.character} (score: ${char.score}, ` +
      `usage: ${char.totalUsage})`
    );
  });

  console.log('\n✅ Frequency calculation complete!');
}

function calculateCharacterFrequencies(
  names: NewbornName[]
): Map<string, CharacterFrequency> {
  const freqMap = new Map<string, CharacterFrequency>();

  for (const name of names) {
    for (const char of name.characters) {
      if (!freqMap.has(char)) {
        freqMap.set(char, {
          character: char,
          totalUsage: 0,
          maleUsage: 0,
          femaleUsage: 0,
          appearances: 0,
          score: 0
        });
      }

      const freq = freqMap.get(char)!;
      freq.totalUsage += name.count;
      freq.appearances += 1;

      if (name.gender === 'M') {
        freq.maleUsage += name.count;
      } else {
        freq.femaleUsage += name.count;
      }
    }
  }

  // Calculate scores (0-10000 scale)
  for (const freq of freqMap.values()) {
    freq.score = Math.min(freq.totalUsage / 10, 10000);
  }

  return freqMap;
}

function normalizeScores(frequencies: Map<string, CharacterFrequency>): void {
  const scores = Array.from(frequencies.values()).map(f => f.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  for (const freq of frequencies.values()) {
    freq.score = Math.round(
      ((freq.score - minScore) / (maxScore - minScore)) * 10000
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Template: Negative Character Expansion Script
```typescript
// scripts/etl/90_expand_negative_characters.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

interface NegativeCategory {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  characters: string[];
}

async function main() {
  console.log('🛡️  Expanding negative character filtering...\n');

  // 1. Load categories
  const categories = JSON.parse(
    await fs.readFile('data/negative-characters/categories.json', 'utf-8')
  );

  // 2. Collect all negative characters
  const allNegative = new Set<string>();
  const metadata = new Map<string, {
    category: string;
    severity: string;
    reason: string;
  }>();

  for (const [name, category] of Object.entries(categories.categories)) {
    const cat = category as NegativeCategory;
    console.log(`📋 ${name}: ${cat.characters.length} characters (${cat.severity})`);

    for (const char of cat.characters) {
      allNegative.add(char);
      metadata.set(char, {
        category: name,
        severity: cat.severity,
        reason: cat.description
      });
    }
  }

  console.log(`\n📊 Total negative characters: ${allNegative.size}`);

  // 3. Update database
  const updated = await prisma.hanjaDict.updateMany({
    where: {
      character: { in: Array.from(allNegative) }
    },
    data: {
      isGoodForNaming: false
    }
  });

  console.log(`✅ Updated ${updated.count} characters`);

  // 4. Store metadata
  for (const char of allNegative) {
    const meta = metadata.get(char);
    if (meta) {
      await prisma.hanjaDict.updateMany({
        where: { character: char },
        data: {
          evidenceJSON: {
            negativeCategory: meta.category,
            negativeSeverity: meta.severity,
            negativeReason: meta.reason,
            markedAt: new Date().toISOString()
          }
        }
      });
    }
  }

  console.log('\n✅ Negative character expansion complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Testing

### Run Statistics Check
```bash
npx tsx scripts/etl/check-db-stats.ts
```

### Expected Output After All Phases
```
📊 한자 데이터베이스 현황 분석
============================================================

총 한자 수: 8,787개

📋 성별 분류 현황:
  남성 선호: XXX개 (XX.X%)
  여성 선호: XXX개 (XX.X%)
  중성: XXX개 (XX.X%)
  미분류: 0개 (0.00%)  ✅
  ✅ 분류 완료: 8,787개 (100.00%)  ✅

📈 이름 빈도 현황:
  평균 빈도: XXX.XX
  최대 빈도: XXXX
  빈도 데이터 있음: 8,787개 (100.00%)  ✅

🛡️ 작명 적합성 필터링:
  작명 적합: 8,637개 (98.29%)
  작명 부적합: 150개 (1.71%)  ✅
```

## Common Issues & Solutions

### Issue 1: Data Source Not Available
**Solution**: Use manual dataset creation. See templates in `/data/` directories.

### Issue 2: Performance Slow on Batch Updates
**Solution**: Increase batch size from 100 to 500 in transaction loops.

### Issue 3: TypeScript Type Errors
**Solution**: Ensure all interfaces match Prisma schema types. Use strict mode.

## Next Steps

1. **Review detailed plan**: `/claudedocs/3-phase-data-enhancement-plan.md`
2. **Follow roadmap**: `/claudedocs/IMPLEMENTATION_ROADMAP.md`
3. **Start implementation**: Begin with Phase 1 gender classification
4. **Test frequently**: Run `check-db-stats.ts` after each phase

---

**Last Updated**: October 17, 2025
**Maintainer**: Development Team
**Status**: Ready for Implementation
