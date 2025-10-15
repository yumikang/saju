/**
 * Payment Confirm API
 *
 * 결제 승인 엔드포인트
 * - TossPayments 성공 리다이렉트 후 호출됨
 * - TossPayments API로 결제 승인 요청
 * - NamingPayment 레코드를 DONE 상태로 업데이트
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { prisma } from '~/lib/db.server';
import { approvePayment } from '~/lib/payment/toss.client';
import { requireUser } from '~/utils/user-session.server';

export async function action({ request }: ActionFunctionArgs) {
  // 인증 확인
  const user = await requireUser(request);

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { paymentKey, orderId, amount } = body;

    // 입력 검증
    if (!paymentKey || !orderId || !amount) {
      return json(
        { error: '유효하지 않은 요청입니다. paymentKey, orderId, amount가 필요합니다.' },
        { status: 400 }
      );
    }

    // DB에서 결제 정보 조회
    const payment = await prisma.namingPayment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      return json(
        { error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 권한 확인
    if (payment.userId !== user.userId) {
      return json(
        { error: '결제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미 처리된 결제인지 확인
    if (payment.status === 'DONE') {
      return json({
        success: true,
        message: '이미 완료된 결제입니다.',
        payment: {
          orderId: payment.orderId,
          paymentKey: payment.paymentKey,
          amount: payment.amount,
          status: payment.status,
          approvedAt: payment.approvedAt,
        },
      });
    }

    // 금액 검증 (변조 방지)
    if (payment.amount !== amount) {
      // 금액 불일치 - FAILED로 업데이트
      await prisma.namingPayment.update({
        where: { orderId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureCode: 'AMOUNT_MISMATCH',
          failureMessage: '결제 금액이 일치하지 않습니다.',
        },
      });

      return json(
        { error: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // TossPayments API로 결제 승인 요청
    try {
      const tossResponse = await approvePayment({
        paymentKey,
        orderId,
        amount,
      });

      // 승인 성공 - DB 업데이트 (DONE 상태)
      const updatedPayment = await prisma.namingPayment.update({
        where: { orderId },
        data: {
          paymentKey: tossResponse.paymentKey,
          status: 'DONE',
          method: tossResponse.method,
          approvedAt: new Date(tossResponse.approvedAt || Date.now()),
          receiptUrl: tossResponse.receipt?.url,
          cardInfo: tossResponse.card
            ? {
                company: tossResponse.card.company,
                number: tossResponse.card.number,
                installmentPlanMonths: tossResponse.card.installmentPlanMonths,
                cardType: tossResponse.card.cardType,
                ownerType: tossResponse.card.ownerType,
                isInterestFree: tossResponse.card.isInterestFree,
              }
            : null,
        },
      });

      // 성공 응답
      return json({
        success: true,
        message: '결제가 성공적으로 완료되었습니다.',
        payment: {
          orderId: updatedPayment.orderId,
          paymentKey: updatedPayment.paymentKey,
          amount: updatedPayment.amount,
          status: updatedPayment.status,
          method: updatedPayment.method,
          approvedAt: updatedPayment.approvedAt,
          receiptUrl: updatedPayment.receiptUrl,
        },
      });
    } catch (tossError: any) {
      // TossPayments API 실패 - DB 업데이트 (FAILED 상태)
      console.error('TossPayments approval error:', tossError);

      const failureCode = tossError.code || 'UNKNOWN_ERROR';
      const failureMessage = tossError.message || '결제 승인에 실패했습니다.';

      await prisma.namingPayment.update({
        where: { orderId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureCode,
          failureMessage,
        },
      });

      return json(
        {
          error: failureMessage,
          code: failureCode,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment confirm error:', error);
    return json(
      { error: '결제 승인 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}
