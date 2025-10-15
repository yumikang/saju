import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNamingStore } from '../naming.store';
import type { Element } from '@prisma/client';

// ============================================================
// Test Setup
// ============================================================

// Mock localStorage for persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ============================================================
// Helper Functions
// ============================================================

function resetStore() {
  // Reset to initial state
  useNamingStore.setState({
    isPremium: false,
    purchaseDate: null,
    sajuIdPurchased: null,
    currentSajuId: null,
    favorites: [],
    filters: {
      minScore: 60,
      maxScore: 100,
      elements: [],
    },
    sortBy: 'score',
    selectedCharacterId: null,
    isPaymentModalOpen: false,
  });

  // Clear localStorage
  localStorage.clear();
}

// ============================================================
// Tests: Initial State
// ============================================================

describe('NamingStore - Initial State', () => {
  beforeEach(() => {
    resetStore();
  });

  it('초기 상태가 올바르게 설정되어야 함', () => {
    const state = useNamingStore.getState();

    expect(state.isPremium).toBe(false);
    expect(state.purchaseDate).toBeNull();
    expect(state.sajuIdPurchased).toBeNull();
    expect(state.currentSajuId).toBeNull();
    expect(state.favorites).toEqual([]);
    expect(state.filters).toEqual({
      minScore: 60,
      maxScore: 100,
      elements: [],
    });
    expect(state.sortBy).toBe('score');
    expect(state.selectedCharacterId).toBeNull();
    expect(state.isPaymentModalOpen).toBe(false);
  });

  it('모든 액션 함수가 정의되어 있어야 함', () => {
    const state = useNamingStore.getState();

    // Premium actions
    expect(typeof state.setPremium).toBe('function');
    expect(typeof state.checkPremiumForSaju).toBe('function');
    expect(typeof state.clearPremium).toBe('function');

    // Session actions
    expect(typeof state.setCurrentSaju).toBe('function');
    expect(typeof state.toggleFavorite).toBe('function');
    expect(typeof state.clearSession).toBe('function');

    // UI actions
    expect(typeof state.updateFilters).toBe('function');
    expect(typeof state.setSortBy).toBe('function');
    expect(typeof state.openCharacterDetail).toBe('function');
    expect(typeof state.closeCharacterDetail).toBe('function');
    expect(typeof state.openPaymentModal).toBe('function');
    expect(typeof state.closePaymentModal).toBe('function');
  });
});

// ============================================================
// Tests: Premium Actions
// ============================================================

describe('NamingStore - Premium Actions', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('setPremium', () => {
    it('프리미엄 상태를 올바르게 설정해야 함', () => {
      const { setPremium } = useNamingStore.getState();

      setPremium('test-saju-123');

      const state = useNamingStore.getState();
      expect(state.isPremium).toBe(true);
      expect(state.sajuIdPurchased).toBe('test-saju-123');
      expect(state.purchaseDate).toBeTruthy();
      expect(typeof state.purchaseDate).toBe('string');
    });

    it('purchaseDate를 ISO 문자열로 저장해야 함', () => {
      const { setPremium } = useNamingStore.getState();

      const beforeDate = new Date();
      setPremium('test-saju-123');
      const afterDate = new Date();

      const state = useNamingStore.getState();
      const purchaseDate = new Date(state.purchaseDate!);

      expect(purchaseDate.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime());
      expect(purchaseDate.getTime()).toBeLessThanOrEqual(afterDate.getTime());
    });

    it('다른 사주 ID로 프리미엄을 재설정할 수 있어야 함', () => {
      const { setPremium } = useNamingStore.getState();

      setPremium('saju-1');
      expect(useNamingStore.getState().sajuIdPurchased).toBe('saju-1');

      setPremium('saju-2');
      expect(useNamingStore.getState().sajuIdPurchased).toBe('saju-2');
      expect(useNamingStore.getState().isPremium).toBe(true);
    });
  });

  describe('checkPremiumForSaju', () => {
    it('구매한 사주 ID와 일치하면 true를 반환해야 함', () => {
      const { setPremium, checkPremiumForSaju } = useNamingStore.getState();

      setPremium('test-saju-123');

      expect(checkPremiumForSaju('test-saju-123')).toBe(true);
    });

    it('구매한 사주 ID와 다르면 false를 반환해야 함', () => {
      const { setPremium, checkPremiumForSaju } = useNamingStore.getState();

      setPremium('test-saju-123');

      expect(checkPremiumForSaju('test-saju-456')).toBe(false);
    });

    it('프리미엄이 아니면 false를 반환해야 함', () => {
      const { checkPremiumForSaju } = useNamingStore.getState();

      expect(checkPremiumForSaju('test-saju-123')).toBe(false);
    });
  });

  describe('clearPremium', () => {
    it('프리미엄 상태를 초기화해야 함', () => {
      const { setPremium, clearPremium } = useNamingStore.getState();

      setPremium('test-saju-123');
      clearPremium();

      const state = useNamingStore.getState();
      expect(state.isPremium).toBe(false);
      expect(state.purchaseDate).toBeNull();
      expect(state.sajuIdPurchased).toBeNull();
    });

    it('프리미엄이 아닌 상태에서 clearPremium을 호출해도 문제없어야 함', () => {
      const { clearPremium } = useNamingStore.getState();

      expect(() => clearPremium()).not.toThrow();

      const state = useNamingStore.getState();
      expect(state.isPremium).toBe(false);
    });
  });
});

// ============================================================
// Tests: Session Actions
// ============================================================

describe('NamingStore - Session Actions', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('setCurrentSaju', () => {
    it('현재 사주 ID를 설정해야 함', () => {
      const { setCurrentSaju } = useNamingStore.getState();

      setCurrentSaju('current-saju-123');

      expect(useNamingStore.getState().currentSajuId).toBe('current-saju-123');
    });

    it('사주 ID를 변경할 수 있어야 함', () => {
      const { setCurrentSaju } = useNamingStore.getState();

      setCurrentSaju('saju-1');
      expect(useNamingStore.getState().currentSajuId).toBe('saju-1');

      setCurrentSaju('saju-2');
      expect(useNamingStore.getState().currentSajuId).toBe('saju-2');
    });
  });

  describe('toggleFavorite', () => {
    it('즐겨찾기를 추가해야 함', () => {
      const { toggleFavorite } = useNamingStore.getState();

      toggleFavorite('candidate-1');

      const state = useNamingStore.getState();
      expect(state.favorites).toContain('candidate-1');
      expect(state.favorites.length).toBe(1);
    });

    it('여러 개의 즐겨찾기를 추가할 수 있어야 함', () => {
      const { toggleFavorite } = useNamingStore.getState();

      toggleFavorite('candidate-1');
      toggleFavorite('candidate-2');
      toggleFavorite('candidate-3');

      const state = useNamingStore.getState();
      expect(state.favorites).toEqual(['candidate-1', 'candidate-2', 'candidate-3']);
    });

    it('이미 있는 즐겨찾기를 토글하면 제거해야 함', () => {
      const { toggleFavorite } = useNamingStore.getState();

      toggleFavorite('candidate-1');
      expect(useNamingStore.getState().favorites).toContain('candidate-1');

      toggleFavorite('candidate-1');
      expect(useNamingStore.getState().favorites).not.toContain('candidate-1');
      expect(useNamingStore.getState().favorites.length).toBe(0);
    });

    it('중간 항목을 제거할 수 있어야 함', () => {
      const { toggleFavorite } = useNamingStore.getState();

      toggleFavorite('candidate-1');
      toggleFavorite('candidate-2');
      toggleFavorite('candidate-3');

      toggleFavorite('candidate-2');

      const state = useNamingStore.getState();
      expect(state.favorites).toEqual(['candidate-1', 'candidate-3']);
    });

    it('토글을 여러 번 반복할 수 있어야 함', () => {
      const { toggleFavorite } = useNamingStore.getState();

      toggleFavorite('candidate-1');
      expect(useNamingStore.getState().favorites.length).toBe(1);

      toggleFavorite('candidate-1');
      expect(useNamingStore.getState().favorites.length).toBe(0);

      toggleFavorite('candidate-1');
      expect(useNamingStore.getState().favorites.length).toBe(1);
    });
  });

  describe('clearSession', () => {
    it('세션 데이터를 초기화해야 함', () => {
      const store = useNamingStore.getState();

      // Set some session data
      store.setCurrentSaju('test-saju');
      store.toggleFavorite('candidate-1');
      store.updateFilters({ minScore: 80 });
      store.setSortBy('strokes');
      store.openCharacterDetail('char-1');

      // Clear session
      store.clearSession();

      const state = useNamingStore.getState();
      expect(state.currentSajuId).toBeNull();
      expect(state.favorites).toEqual([]);
      expect(state.filters).toEqual({
        minScore: 60,
        maxScore: 100,
        elements: [],
      });
      expect(state.sortBy).toBe('score');
      expect(state.selectedCharacterId).toBeNull();
    });

    it('프리미엄 상태는 유지해야 함', () => {
      const store = useNamingStore.getState();

      store.setPremium('premium-saju');
      store.clearSession();

      const state = useNamingStore.getState();
      expect(state.isPremium).toBe(true);
      expect(state.sajuIdPurchased).toBe('premium-saju');
    });

    it('모달 상태는 유지해야 함', () => {
      const store = useNamingStore.getState();

      store.openPaymentModal();
      store.clearSession();

      expect(useNamingStore.getState().isPaymentModalOpen).toBe(true);
    });
  });
});

// ============================================================
// Tests: UI Actions
// ============================================================

describe('NamingStore - UI Actions', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('updateFilters', () => {
    it('필터를 부분적으로 업데이트해야 함', () => {
      const { updateFilters } = useNamingStore.getState();

      updateFilters({ minScore: 70 });

      const state = useNamingStore.getState();
      expect(state.filters.minScore).toBe(70);
      expect(state.filters.maxScore).toBe(100); // unchanged
      expect(state.filters.elements).toEqual([]); // unchanged
    });

    it('여러 필터를 동시에 업데이트할 수 있어야 함', () => {
      const { updateFilters } = useNamingStore.getState();

      updateFilters({
        minScore: 75,
        maxScore: 95,
        elements: ['WOOD', 'FIRE'] as Element[],
      });

      const state = useNamingStore.getState();
      expect(state.filters).toEqual({
        minScore: 75,
        maxScore: 95,
        elements: ['WOOD', 'FIRE'],
      });
    });

    it('필터를 여러 번 업데이트할 수 있어야 함', () => {
      const { updateFilters } = useNamingStore.getState();

      updateFilters({ minScore: 70 });
      updateFilters({ maxScore: 90 });
      updateFilters({ elements: ['WATER'] as Element[] });

      const state = useNamingStore.getState();
      expect(state.filters).toEqual({
        minScore: 70,
        maxScore: 90,
        elements: ['WATER'],
      });
    });

    it('gender 필터를 추가할 수 있어야 함', () => {
      const { updateFilters } = useNamingStore.getState();

      updateFilters({ gender: 'male' });

      const state = useNamingStore.getState();
      expect(state.filters.gender).toBe('male');
    });
  });

  describe('setSortBy', () => {
    it('정렬 방식을 변경해야 함', () => {
      const { setSortBy } = useNamingStore.getState();

      setSortBy('strokes');

      expect(useNamingStore.getState().sortBy).toBe('strokes');
    });

    it('모든 정렬 옵션을 설정할 수 있어야 함', () => {
      const { setSortBy } = useNamingStore.getState();

      setSortBy('score');
      expect(useNamingStore.getState().sortBy).toBe('score');

      setSortBy('strokes');
      expect(useNamingStore.getState().sortBy).toBe('strokes');

      setSortBy('meaning');
      expect(useNamingStore.getState().sortBy).toBe('meaning');
    });
  });

  describe('Character Detail Modal', () => {
    it('한자 상세 모달을 열어야 함', () => {
      const { openCharacterDetail } = useNamingStore.getState();

      openCharacterDetail('char-123');

      expect(useNamingStore.getState().selectedCharacterId).toBe('char-123');
    });

    it('한자 상세 모달을 닫아야 함', () => {
      const { openCharacterDetail, closeCharacterDetail } = useNamingStore.getState();

      openCharacterDetail('char-123');
      closeCharacterDetail();

      expect(useNamingStore.getState().selectedCharacterId).toBeNull();
    });

    it('다른 한자로 모달을 변경할 수 있어야 함', () => {
      const { openCharacterDetail } = useNamingStore.getState();

      openCharacterDetail('char-1');
      expect(useNamingStore.getState().selectedCharacterId).toBe('char-1');

      openCharacterDetail('char-2');
      expect(useNamingStore.getState().selectedCharacterId).toBe('char-2');
    });
  });

  describe('Payment Modal', () => {
    it('결제 모달을 열어야 함', () => {
      const { openPaymentModal } = useNamingStore.getState();

      openPaymentModal();

      expect(useNamingStore.getState().isPaymentModalOpen).toBe(true);
    });

    it('결제 모달을 닫아야 함', () => {
      const { openPaymentModal, closePaymentModal } = useNamingStore.getState();

      openPaymentModal();
      closePaymentModal();

      expect(useNamingStore.getState().isPaymentModalOpen).toBe(false);
    });

    it('모달을 여러 번 열고 닫을 수 있어야 함', () => {
      const { openPaymentModal, closePaymentModal } = useNamingStore.getState();

      openPaymentModal();
      expect(useNamingStore.getState().isPaymentModalOpen).toBe(true);

      closePaymentModal();
      expect(useNamingStore.getState().isPaymentModalOpen).toBe(false);

      openPaymentModal();
      expect(useNamingStore.getState().isPaymentModalOpen).toBe(true);
    });
  });
});

// ============================================================
// Tests: Complex Scenarios
// ============================================================

describe('NamingStore - Complex Scenarios', () => {
  beforeEach(() => {
    resetStore();
  });

  it('프리미엄 구매 후 즐겨찾기 추가 시나리오', () => {
    const store = useNamingStore.getState();

    // 1. 사주 분석 시작
    store.setCurrentSaju('saju-123');

    // 2. 무료로 5위 확인하고 즐겨찾기
    store.toggleFavorite('candidate-5');

    // 3. 프리미엄 구매
    store.setPremium('saju-123');

    // 4. 1-4위 확인하고 즐겨찾기
    store.toggleFavorite('candidate-1');
    store.toggleFavorite('candidate-2');

    // 검증
    const state = useNamingStore.getState();
    expect(state.isPremium).toBe(true);
    expect(state.checkPremiumForSaju('saju-123')).toBe(true);
    expect(state.favorites).toEqual(['candidate-5', 'candidate-1', 'candidate-2']);
  });

  it('여러 사주 분석 세션 전환 시나리오', () => {
    const store = useNamingStore.getState();

    // 첫 번째 사주 분석
    store.setCurrentSaju('saju-1');
    store.toggleFavorite('saju1-candidate-1');

    // 두 번째 사주 분석 (세션 클리어)
    store.clearSession();
    store.setCurrentSaju('saju-2');
    store.toggleFavorite('saju2-candidate-1');

    // 검증
    const state = useNamingStore.getState();
    expect(state.currentSajuId).toBe('saju-2');
    expect(state.favorites).toEqual(['saju2-candidate-1']);
  });

  it('필터 조정 후 정렬 변경 시나리오', () => {
    const store = useNamingStore.getState();

    // 필터 설정
    store.updateFilters({
      minScore: 80,
      elements: ['WOOD', 'FIRE'] as Element[],
    });

    // 정렬 변경
    store.setSortBy('strokes');

    // 검증
    const state = useNamingStore.getState();
    expect(state.filters.minScore).toBe(80);
    expect(state.filters.elements).toEqual(['WOOD', 'FIRE']);
    expect(state.sortBy).toBe('strokes');
  });
});

// ============================================================
// Tests: Persistence
// ============================================================

describe('NamingStore - Persistence', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it.skip('프리미엄 상태가 localStorage에 저장되어야 함 (persist middleware in test environment)', () => {
    const { setPremium } = useNamingStore.getState();

    setPremium('test-saju-123');

    const stored = JSON.parse(localStorage.getItem('naming-storage') || '{}');
    expect(stored.state?.isPremium || stored.isPremium).toBe(true);
    expect(stored.state?.sajuIdPurchased || stored.sajuIdPurchased).toBe('test-saju-123');
  });

  it.skip('즐겨찾기가 localStorage에 저장되어야 함 (persist middleware in test environment)', () => {
    const { toggleFavorite } = useNamingStore.getState();

    toggleFavorite('candidate-1');
    toggleFavorite('candidate-2');

    const stored = JSON.parse(localStorage.getItem('naming-storage') || '{}');
    expect(stored.state?.favorites || stored.favorites).toEqual(['candidate-1', 'candidate-2']);
  });

  it('UI 상태는 localStorage에 저장되지 않아야 함', () => {
    const store = useNamingStore.getState();

    store.setSortBy('strokes');
    store.openPaymentModal();

    const stored = JSON.parse(localStorage.getItem('naming-storage') || '{}');
    const data = stored.state || stored;
    expect(data.sortBy).toBeUndefined();
    expect(data.isPaymentModalOpen).toBeUndefined();
  });
});
