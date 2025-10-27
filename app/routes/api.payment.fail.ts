/**
 * Payment Fail Handler - TossPayments Callback
 *
 * GET /api/payment/fail?code=xxx&message=xxx&orderId=xxx
 *
 * 결제 실패 시 TossPayments에서 리다이렉트하는 페이지
 */

import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { prisma } from '~/lib/db.server';

// ============================================================
// Request Validation
// ============================================================

const FailParamsSchema = z.object({
  code: z.string(),
  message: z.string(),
  orderId: z.string().uuid().optional(),
});

// ============================================================
// Loader Handler
// ============================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const params = {
    code: url.searchParams.get('code'),
    message: url.searchParams.get('message'),
    orderId: url.searchParams.get('orderId'),
  };

  console.log('[Payment Fail] Received callback:', params);

  try {
    // 1. Validate query parameters
    const { code, message, orderId } = FailParamsSchema.parse(params);

    // 2. Update payment status if orderId is provided
    if (orderId) {
      const payment = await prisma.namingPayment.findUnique({
        where: { id: orderId },
      });

      if (payment) {
        await prisma.namingPayment.update({
          where: { id: orderId },
          data: {
            status: 'failed',
            tossErrorCode: code,
            tossErrorMessage: message,
          },
        });

        console.log('[Payment Fail] Payment status updated to failed');

        // Redirect back to payment page with error
        return redirect(
          `/naming/freemium/results?sessionId=${payment.sessionId}&payment=failed&code=${encodeURIComponent(code)}&message=${encodeURIComponent(message)}`
        );
      }
    }

    // 3. Redirect to generic error page
    return redirect(
      `/naming/freemium/payment/error?code=${encodeURIComponent(code)}&message=${encodeURIComponent(message)}`
    );
  } catch (error) {
    console.error('[Payment Fail] Error:', error);

    return redirect(
      `/naming/freemium/payment/error?code=UNKNOWN_ERROR&message=${encodeURIComponent((error as Error).message || '알 수 없는 오류')}`
    );
  }
}
