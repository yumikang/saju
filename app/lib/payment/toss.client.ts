/**
 * TossPayments Client Library
 *
 * 토스페이먼츠 결제 연동 클라이언트
 * - 결제창 호출
 * - 결제 승인
 * - 결제 조회
 */

import { loadTossPayments } from '@tosspayments/payment-sdk';

// ============================================================
// Types
// ============================================================

export interface PaymentRequest {
  amount: number;
  orderId: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
}

export interface PaymentApproval {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  method: string;
  totalAmount: number;
  balanceAmount: number;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  receipt?: {
    url: string;
  };
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
    approveNo: string;
    cardType: string;
    ownerType: string;
    isInterestFree: boolean;
  };
}

// ============================================================
// Configuration
// ============================================================

const TOSS_CLIENT_KEY = process.env.TOSS_PAYMENTS_CLIENT_KEY ||'';
const TOSS_SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY || '';

if (!TOSS_CLIENT_KEY) {
  console.warn('⚠️  TOSS_PAYMENTS_CLIENT_KEY not configured');
}

// ============================================================
// Client Functions
// ============================================================

/**
 * Initialize TossPayments widget and request payment
 *
 * @param request - Payment request data
 * @returns Promise<void>
 */
export async function requestPayment(request: PaymentRequest): Promise<void> {
  try {
    const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

    // 결제창 호출
    await tossPayments.requestPayment('카드', {
      amount: request.amount,
      orderId: request.orderId,
      orderName: request.orderName,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      successUrl: request.successUrl,
      failUrl: request.failUrl,
    });
  } catch (error) {
    console.error('Payment request failed:', error);
    throw new Error('결제 요청 실패');
  }
}

/**
 * Approve payment (server-side)
 *
 * @param approval - Payment approval data
 * @returns Promise<TossPaymentResponse>
 */
export async function approvePayment(
  approval: PaymentApproval
): Promise<TossPaymentResponse> {
  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(approval),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '결제 승인 실패');
  }

  return response.json();
}

/**
 * Get payment details (server-side)
 *
 * @param paymentKey - Payment key from Toss
 * @returns Promise<TossPaymentResponse>
 */
export async function getPayment(paymentKey: string): Promise<TossPaymentResponse> {
  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '결제 조회 실패');
  }

  return response.json();
}

/**
 * Cancel payment (server-side)
 *
 * @param paymentKey - Payment key from Toss
 * @param cancelReason - Reason for cancellation
 * @returns Promise<TossPaymentResponse>
 */
export async function cancelPayment(
  paymentKey: string,
  cancelReason: string
): Promise<TossPaymentResponse> {
  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancelReason }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '결제 취소 실패');
  }

  return response.json();
}

/**
 * Generate unique order ID
 *
 * @param prefix - Order ID prefix
 * @returns string
 */
export function generateOrderId(prefix: string = 'ORDER'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

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
