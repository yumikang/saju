/**
 * Payment Webhook API
 *
 * TossPayments 웹훅 엔드포인트
 * - TossPayments 서버에서 비동기로 결제 상태 업데이트를 받음
 * - 인증 불필요 (TossPayments 서버 → 우리 서버)
 * - 결제 상태에 따라 NamingPayment 레코드 업데이트
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { prisma } from '~/lib/db.server';

/**
 * TossPayments 웹훅 이벤트 타입
 */
type WebhookEventType =
  | 'PAYMENT_STATUS_CHANGED'
  | 'VIRTUAL_ACCOUNT_ISSUED'
  | 'VIRTUAL_ACCOUNT_DEPOSIT'
  | 'PAYMENT_CANCELLED';

interface TossWebhookPayload {
  eventType: WebhookEventType;
  createdAt: string;
  data: {
    orderId: string;
    paymentKey?: string;
    status: string;
    method?: string;
    totalAmount?: number;
    approvedAt?: string;
    cancelledAt?: string;
    cancels?: Array<{
      cancelAmount: number;
      cancelReason: string;
      cancelledAt: string;
    }>;
  };
}

/**
 * TossPayments status → NamingPayment status 매핑
 */
function mapTossStatusToPaymentStatus(tossStatus: string): string {
  const statusMap: Record<string, string> = {
    READY: 'READY',
    IN_PROGRESS: 'IN_PROGRESS',
    WAITING_FOR_DEPOSIT: 'READY',
    DONE: 'DONE',
    CANCELED: 'CANCELED',
    PARTIAL_CANCELED: 'CANCELED',
    ABORTED: 'FAILED',
    EXPIRED: 'EXPIRED',
  };

  return statusMap[tossStatus] || 'PENDING';
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const payload: TossWebhookPayload = await request.json();

    console.log('[Webhook] Received event:', {
      eventType: payload.eventType,
      orderId: payload.data.orderId,
      status: payload.data.status,
    });

    const { eventType, data } = payload;
    const { orderId, paymentKey, status, method, totalAmount, approvedAt, cancelledAt, cancels } = data;

    // DB에서 결제 정보 조회
    const payment = await prisma.namingPayment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      console.warn('[Webhook] Payment not found:', orderId);
      return json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // 이벤트 타입별 처리
    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED': {
        const mappedStatus = mapTossStatusToPaymentStatus(status);

        // 결제 상태 업데이트
        const updateData: any = {
          status: mappedStatus,
        };

        if (paymentKey) updateData.paymentKey = paymentKey;
        if (method) updateData.method = method;
        if (approvedAt) {
          updateData.approvedAt = new Date(approvedAt);
        }

        await prisma.namingPayment.update({
          where: { orderId },
          data: updateData,
        });

        console.log('[Webhook] Payment status updated:', {
          orderId,
          oldStatus: payment.status,
          newStatus: mappedStatus,
        });

        break;
      }

      case 'PAYMENT_CANCELLED': {
        // 결제 취소 처리
        const cancelReason = cancels && cancels.length > 0
          ? cancels[0].cancelReason
          : '사용자 요청';

        await prisma.namingPayment.update({
          where: { orderId },
          data: {
            status: 'CANCELED',
            cancelledAt: cancelledAt ? new Date(cancelledAt) : new Date(),
            failureMessage: cancelReason,
          },
        });

        console.log('[Webhook] Payment cancelled:', {
          orderId,
          reason: cancelReason,
        });

        break;
      }

      case 'VIRTUAL_ACCOUNT_ISSUED':
      case 'VIRTUAL_ACCOUNT_DEPOSIT': {
        // 가상계좌 발급/입금 처리
        // Freemium에서는 주로 카드 결제를 사용하므로 기본 처리만 수행
        console.log('[Webhook] Virtual account event:', eventType, orderId);
        break;
      }

      default:
        console.warn('[Webhook] Unknown event type:', eventType);
    }

    // 성공 응답 (TossPayments는 200 OK를 기대)
    return json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);

    // 웹훅 처리 실패 시에도 200 OK 반환 (재시도 방지)
    // 실제 프로덕션에서는 별도의 에러 로그 시스템에 기록
    return json({ success: false, error: 'Internal error' });
  }
}
