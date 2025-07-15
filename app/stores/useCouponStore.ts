import { create } from 'zustand'

interface Coupon {
  id: string
  code: string
  discount: number // percentage
  type: 'percentage' | 'fixed'
  validUntil: Date
  maxUses: number
  currentUses: number
  minPurchase?: number
  serviceTypes?: ('quick' | 'premium' | 'group')[]
}

interface CouponStore {
  coupons: Coupon[]
  activeCoupon: Coupon | null
  addCoupon: (coupon: Coupon) => void
  validateCoupon: (code: string) => Coupon | null
  applyCoupon: (code: string) => boolean
  clearActiveCoupon: () => void
  calculateDiscountedPrice: (originalPrice: number) => number
}

export const useCouponStore = create<CouponStore>((set, get) => ({
  coupons: [
    {
      id: '1',
      code: 'TIMESALE30',
      discount: 30,
      type: 'percentage',
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      maxUses: 100,
      currentUses: 0,
      serviceTypes: ['quick']
    },
    {
      id: '2',
      code: 'EXPERT20',
      discount: 20,
      type: 'percentage',
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      maxUses: 50,
      currentUses: 0,
      serviceTypes: ['premium']
    }
  ],
  activeCoupon: null,
  
  addCoupon: (coupon) => {
    set((state) => ({
      coupons: [...state.coupons, coupon]
    }))
  },
  
  validateCoupon: (code) => {
    const { coupons } = get()
    const coupon = coupons.find(c => c.code === code)
    
    if (!coupon) return null
    if (coupon.validUntil < new Date()) return null
    if (coupon.currentUses >= coupon.maxUses) return null
    
    return coupon
  },
  
  applyCoupon: (code) => {
    const coupon = get().validateCoupon(code)
    if (!coupon) return false
    
    set({ activeCoupon: coupon })
    return true
  },
  
  clearActiveCoupon: () => {
    set({ activeCoupon: null })
  },
  
  calculateDiscountedPrice: (originalPrice) => {
    const { activeCoupon } = get()
    if (!activeCoupon) return originalPrice
    
    if (activeCoupon.type === 'percentage') {
      return originalPrice * (1 - activeCoupon.discount / 100)
    } else {
      return Math.max(0, originalPrice - activeCoupon.discount)
    }
  }
}))