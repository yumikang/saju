/**
 * Naming Store - Zustand
 *
 * Manages client-side state for naming service:
 * - Premium status
 * - Favorites
 * - Filters and sorting
 * - Modal state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Element } from '@prisma/client';

// ============================================================
// Types
// ============================================================

export interface NamingFilters {
  minScore: number;
  maxScore: number;
  elements: Element[];
  gender?: 'male' | 'female';
}

export type SortBy = 'score' | 'strokes' | 'meaning';

interface NamingState {
  // ─────────────────────────────────────────────────────
  // Premium Status
  // ─────────────────────────────────────────────────────
  isPremium: boolean;
  purchaseDate: string | null;
  sajuIdPurchased: string | null; // 어느 사주 분석에 대해 결제했는지

  // ─────────────────────────────────────────────────────
  // Session Data
  // ─────────────────────────────────────────────────────
  currentSajuId: string | null;
  favorites: string[]; // candidate IDs

  // ─────────────────────────────────────────────────────
  // UI State (not persisted)
  // ─────────────────────────────────────────────────────
  filters: NamingFilters;
  sortBy: SortBy;
  selectedCharacterId: string | null;
  isPaymentModalOpen: boolean;

  // ─────────────────────────────────────────────────────
  // Actions: Premium
  // ─────────────────────────────────────────────────────
  setPremium: (sajuId: string) => void;
  checkPremiumForSaju: (sajuId: string) => boolean;
  clearPremium: () => void;

  // ─────────────────────────────────────────────────────
  // Actions: Session
  // ─────────────────────────────────────────────────────
  setCurrentSaju: (id: string) => void;
  toggleFavorite: (candidateId: string) => void;
  clearSession: () => void;

  // ─────────────────────────────────────────────────────
  // Actions: UI
  // ─────────────────────────────────────────────────────
  updateFilters: (filters: Partial<NamingFilters>) => void;
  setSortBy: (sortBy: SortBy) => void;
  openCharacterDetail: (id: string) => void;
  closeCharacterDetail: () => void;
  openPaymentModal: () => void;
  closePaymentModal: () => void;
}

// ============================================================
// Store
// ============================================================

export const useNamingStore = create<NamingState>()(
  persist(
    (set, get) => ({
      // ─────────────────────────────────────────────────────
      // Initial State
      // ─────────────────────────────────────────────────────
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

      // ─────────────────────────────────────────────────────
      // Actions: Premium
      // ─────────────────────────────────────────────────────
      setPremium: (sajuId: string) => {
        set({
          isPremium: true,
          purchaseDate: new Date().toISOString(),
          sajuIdPurchased: sajuId,
        });
      },

      checkPremiumForSaju: (sajuId: string) => {
        const state = get();
        return state.isPremium && state.sajuIdPurchased === sajuId;
      },

      clearPremium: () => {
        set({
          isPremium: false,
          purchaseDate: null,
          sajuIdPurchased: null,
        });
      },

      // ─────────────────────────────────────────────────────
      // Actions: Session
      // ─────────────────────────────────────────────────────
      setCurrentSaju: (id: string) => {
        set({ currentSajuId: id });
      },

      toggleFavorite: (candidateId: string) => {
        set((state) => ({
          favorites: state.favorites.includes(candidateId)
            ? state.favorites.filter((id) => id !== candidateId)
            : [...state.favorites, candidateId],
        }));
      },

      clearSession: () => {
        set({
          currentSajuId: null,
          favorites: [],
          filters: {
            minScore: 60,
            maxScore: 100,
            elements: [],
          },
          sortBy: 'score',
          selectedCharacterId: null,
        });
      },

      // ─────────────────────────────────────────────────────
      // Actions: UI
      // ─────────────────────────────────────────────────────
      updateFilters: (filters: Partial<NamingFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      setSortBy: (sortBy: SortBy) => {
        set({ sortBy });
      },

      openCharacterDetail: (id: string) => {
        set({ selectedCharacterId: id });
      },

      closeCharacterDetail: () => {
        set({ selectedCharacterId: null });
      },

      openPaymentModal: () => {
        set({ isPaymentModalOpen: true });
      },

      closePaymentModal: () => {
        set({ isPaymentModalOpen: false });
      },
    }),
    {
      name: 'naming-storage',
      // Only persist essential data
      partialize: (state) => ({
        isPremium: state.isPremium,
        purchaseDate: state.purchaseDate,
        sajuIdPurchased: state.sajuIdPurchased,
        currentSajuId: state.currentSajuId,
        favorites: state.favorites,
      }),
    }
  )
);
