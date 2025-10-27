/**
 * Payment Success Handler - TossPayments Callback
 *
 * GET /api/payment/success?paymentKey=xxx&orderId=xxx&amount=xxx
 *
 * 결제 완료 후 TossPayments에서 리다이렉트하는 페이지
 * 1. 결제 승인 API 호출
 * 2. NamingPayment 업데이트 (unlocked = true)
 * 3. 결제 완료 페이지로 리다이렉트
 */

import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { prisma } from '~/lib/db.server';

// ============================================================
// Environment Variables
// ============================================================

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!;

if (!TOSS_SECRET_KEY) {
  console.error('❌ TOSS_SECRET_KEY is not configured');
}

// ============================================================
// Request Validation
// ============================================================

const SuccessParamsSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string().uuid(),
  amount: z.string().transform((val) => parseInt(val, 10)),
});

// ============================================================
// Loader Handler
// ============================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const params = {
    paymentKey: url.searchParams.get('paymentKey'),
    orderId: url.searchParams.get('orderId'),
    amount: url.searchParams.get('amount'),
  };

  console.log('[Payment Success] Received callback:', params);

  try {
    // 1. Validate query parameters
    const { paymentKey, orderId, amount } = SuccessParamsSchema.parse(params);

    // 2. Find payment record
    const payment = await prisma.namingPayment.findUnique({
      where: { id: orderId },
      include: { session: true },
    });

    if (!payment) {
      console.error('[Payment Success] Payment not found:', orderId);
      return redirect('/naming/freemium/payment/error?code=PAYMENT_NOT_FOUND');
    }

    // 3. Verify amount matches
    if (payment.amount !== amount) {
      console.error('[Payment Success] Amount mismatch:', {
        expected: payment.amount,
        received: amount,
      });
      return redirect('/naming/freemium/payment/error?code=AMOUNT_MISMATCH');
    }

    // 4. Check if already unlocked (prevent double processing)
    if (payment.unlocked) {
      console.log('[Payment Success] Already unlocked, redirecting to result page');
      return redirect(`/naming/freemium/result?sessionId=${payment.sessionId}`);
    }

    // 5. Call TossPayments confirm API
    console.log('[Payment Success] Confirming payment with TossPayments...');

    const confirmResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/confirm`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      }
    );

    if (!confirmResponse.ok) {
      const errorData = await confirmResponse.json();
      console.error('[Payment Success] TossPayments confirm failed:', errorData);

      // Update payment status to failed
      await prisma.namingPayment.update({
        where: { id: orderId },
        data: { status: 'FAILED' },
      });

      return redirect(
        `/naming/freemium/payment/error?code=CONFIRM_FAILED&message=${encodeURIComponent(errorData.message || '결제 승인 실패')}`
      );
    }

    const confirmData = await confirmResponse.json();
    console.log('[Payment Success] Payment confirmed:', confirmData);

    // 6. Update payment record
    await prisma.namingPayment.update({
      where: { id: orderId },
      data: {
        status: 'DONE',
        unlocked: true,
        unlockedAt: new Date(),
        tossPaymentKey: paymentKey,
        tossApprovedAt: new Date(confirmData.approvedAt),
      },
    });

    console.log('[Payment Success] Payment unlocked successfully');

    // 7. TODO: Send email with PDF (optional)
    // await sendPaymentSuccessEmail(payment);

    // 8. Redirect to result page
    return redirect(`/naming/freemium/result?sessionId=${payment.sessionId}&payment=success`);
  } catch (error) {
    console.error('[Payment Success] Error:', error);

    if (error instanceof z.ZodError) {
      return redirect('/naming/freemium/payment/error?code=INVALID_PARAMS');
    }

    return redirect(
      `/naming/freemium/payment/error?code=UNKNOWN_ERROR&message=${encodeURIComponent((error as Error).message || '알 수 없는 오류')}`
    );
  }
}
