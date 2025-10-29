/**
 * Currency Formatting Utilities
 *
 * Isomorphic utilities that work on both client and server
 */

/**
 * Format amount for display
 *
 * @param amount - Amount in KRW
 * @returns string
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

/**
 * Validate payment amount
 *
 * @param amount - Amount to validate
 * @returns boolean
 */
export function isValidAmount(amount: number): boolean {
  return amount > 0 && Number.isInteger(amount);
}
