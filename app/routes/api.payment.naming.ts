/**
 * Naming Payment API - TossPayments Integration
 *
 * POST /api/payment/naming
 *
 * 프리미엄 작명 서비스 결제 시작
 * - sessionId로 NamingSession 조회
 * - NamingPayment 레코드 생성
 * - TossPayments 결제 요청
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { prisma } from '~/lib/db.server';

// ============================================================
// Environment Variables
// ============================================================

const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY!;
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!;
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

if (!TOSS_CLIENT_KEY || !TOSS_SECRET_KEY) {
  console.warn('⚠️ TossPayments keys not configured. Payment will fail.');
}

// ============================================================
// Request Validation
// ============================================================

const PaymentRequestSchema = z.object({
  sessionId: z.string().uuid(),
  amount: z.number().int().min(1000), // 최소 1,000원
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
});

type PaymentRequest = z.infer<typeof PaymentRequestSchema>;

// ============================================================
// Response Types
// ============================================================

interface PaymentSuccessResponse {
  success: true;
  paymentId: string;
  checkoutUrl: string;
  orderId: string;
}

interface PaymentErrorResponse {
  success: false;
  error: string;
  message: string;
}

type PaymentResponse = PaymentSuccessResponse | PaymentErrorResponse;

// ============================================================
// Main Action Handler
// ============================================================

export async function action({ request }: ActionFunctionArgs) {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const { sessionId, amount, customerName, customerEmail, customerPhone } =
      PaymentRequestSchema.parse(body);

    console.log(`[Payment] Initiating payment for session: ${sessionId}, amount: ${amount}`);

    // 2. Verify session exists and is valid
    const session = await prisma.namingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return json<PaymentErrorResponse>(
        {
          success: false,
          error: 'SESSION_NOT_FOUND',
          message: '세션을 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }

    // 3. Check if session has expired
    if (session.expiresAt < new Date()) {
      return json<PaymentErrorResponse>(
        {
          success: false,
          error: 'SESSION_EXPIRED',
          message: '세션이 만료되었습니다. 다시 시도해주세요.',
        },
        { status: 400 }
      );
    }

    // 4. Check if payment already exists for this session
    const existingPayment = await prisma.namingPayment.findFirst({
      where: {
        sessionId: session.id,
        status: { in: ['PENDING', 'DONE'] },
      },
    });

    if (existingPayment) {
      // If payment is already completed, return error
      if (existingPayment.unlocked) {
        return json<PaymentErrorResponse>(
          {
            success: false,
            error: 'ALREADY_PAID',
            message: '이미 결제가 완료되었습니다',
          },
          { status: 400 }
        );
      }

      // If payment is pending, return existing checkout URL
      if (existingPayment.tossCheckoutUrl) {
        return json<PaymentSuccessResponse>({
          success: true,
          paymentId: existingPayment.id,
          checkoutUrl: existingPayment.tossCheckoutUrl,
          orderId: existingPayment.id,
        });
      }
    }

    // 5. Generate orderId
    const orderId = crypto.randomUUID();
    const orderName = `프리미엄 작명 서비스 (${session.lastName}씨 자녀)`;

    // 6. Create payment record
    const payment = await prisma.namingPayment.create({
      data: {
        orderId,
        sessionId: session.id,
        amount,
        currency: 'KRW',
        status: 'PENDING',
        customerName,
        customerEmail,
        customerPhone,
        unlocked: false,
      },
    });

    console.log(`[Payment] Created payment record: ${payment.id} with orderId: ${orderId}`);

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
        orderName,
        successUrl: `${BASE_URL}/api/payment/success`,
        failUrl: `${BASE_URL}/api/payment/fail`,
        ...(customerEmail && { customerEmail }),
        ...(customerName && { customerName }),
        ...(customerPhone && { customerMobilePhone: customerPhone }),
      }),
    });

    if (!tossResponse.ok) {
      const errorData = await tossResponse.json();
      console.error('[Payment] TossPayments API error:', errorData);

      // Update payment status to failed
      await prisma.namingPayment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      return json<PaymentErrorResponse>(
        {
          success: false,
          error: 'TOSS_API_ERROR',
          message: '결제 요청 중 오류가 발생했습니다',
        },
        { status: 500 }
      );
    }

    const tossData = await tossResponse.json();
    const checkoutUrl = tossData.checkout?.url;

    if (!checkoutUrl) {
      console.error('[Payment] No checkout URL in TossPayments response');

      return json<PaymentErrorResponse>(
        {
          success: false,
          error: 'NO_CHECKOUT_URL',
          message: '결제 페이지를 생성할 수 없습니다',
        },
        { status: 500 }
      );
    }

    // 7. Update payment record with checkout URL
    await prisma.namingPayment.update({
      where: { id: payment.id },
      data: {
        tossCheckoutUrl: checkoutUrl,
      },
    });

    console.log(`[Payment] Payment initialized successfully: ${payment.id}`);

    // 8. Return checkout URL
    return json<PaymentSuccessResponse>({
      success: true,
      paymentId: payment.id,
      checkoutUrl,
      orderId,
    });
  } catch (error) {
    console.error('[Payment] Error:', error);

    if (error instanceof z.ZodError) {
      return json<PaymentErrorResponse>(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '요청 데이터 형식이 올바르지 않습니다',
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return json<PaymentErrorResponse>(
        {
          success: false,
          error: 'PAYMENT_ERROR',
          message: error.message || '결제 처리 중 오류가 발생했습니다',
        },
        { status: 500 }
      );
    }

    return json<PaymentErrorResponse>(
      {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: '알 수 없는 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - API documentation
 */
export async function loader() {
  return json({
    success: false,
    error: 'METHOD_NOT_ALLOWED',
    message: 'POST 요청만 허용됩니다',
    documentation: {
      endpoint: '/api/payment/naming',
      method: 'POST',
      contentType: 'application/json',
      requiredFields: {
        sessionId: 'UUID of naming session',
        amount: 'Payment amount in KRW (e.g., 69000)',
      },
      optionalFields: {
        customerName: 'Customer name',
        customerEmail: 'Customer email',
        customerPhone: 'Customer phone number',
      },
      response: {
        success: {
          paymentId: 'UUID of payment record',
          checkoutUrl: 'TossPayments checkout URL',
          orderId: 'Order ID (same as paymentId)',
        },
        error: {
          error: 'Error code',
          message: 'Error message in Korean',
        },
      },
    },
  }, { status: 405 });
}
