import { create } from 'zustand'

interface NamingData {
  id: string
  userName: string
  birthDate: Date
  birthTime: string
  lastName: string
  serviceType: 'quick' | 'premium' | 'group'
  price: number
  status: 'pending' | 'processing' | 'completed'
  createdAt: Date
  results?: string[]
}

interface NamingStore {
  namings: NamingData[]
  currentNaming: NamingData | null
  addNaming: (naming: NamingData) => void
  updateNaming: (id: string, updates: Partial<NamingData>) => void
  setCurrentNaming: (naming: NamingData | null) => void
  getStats: () => {
    total: number
    completed: number
    revenue: number
  }
}

export const useNamingStore = create<NamingStore>((set, get) => ({
  namings: [],
  currentNaming: null,
  
  addNaming: (naming) => {
    set((state) => ({
      namings: [...state.namings, naming]
    }))
  },
  
  updateNaming: (id, updates) => {
    set((state) => ({
      namings: state.namings.map(n => 
        n.id === id ? { ...n, ...updates } : n
      )
    }))
  },
  
  setCurrentNaming: (naming) => {
    set({ currentNaming: naming })
  },
  
  getStats: () => {
    const { namings } = get()
    return {
      total: namings.length,
      completed: namings.filter(n => n.status === 'completed').length,
      revenue: namings.reduce((sum, n) => sum + n.price, 0)
    }
  }
}))