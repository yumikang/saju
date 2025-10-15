/**
 * Payment Intent API
 *
 * 결제 요청 생성 엔드포인트
 * - orderId 생성
 * - NamingPayment 레코드 생성 (PENDING 상태)
 * - 클라이언트가 결제창을 열 수 있도록 orderId 반환
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { prisma } from '~/lib/db.server';
import { generateOrderId } from '~/lib/payment/toss.client';
import { requireUser } from '~/lib/session.server';

export async function action({ request }: ActionFunctionArgs) {
  // 인증 확인
  const user = await requireUser(request);

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { sajuId, amount } = body;

    // 입력 검증
    if (!sajuId || !amount || amount <= 0) {
      return json(
        { error: '유효하지 않은 요청입니다. sajuId와 amount가 필요합니다.' },
        { status: 400 }
      );
    }

    // 금액 검증 (정수, 양수)
    if (!Number.isInteger(amount) || amount <= 0) {
      return json(
        { error: '결제 금액은 양의 정수여야 합니다.' },
        { status: 400 }
      );
    }

    // 중복 결제 확인 - 이미 완료된 결제가 있는지 확인
    const existingPayment = await prisma.namingPayment.findFirst({
      where: {
        userId: user.id,
        sajuId: sajuId,
        status: 'DONE',
      },
    });

    if (existingPayment) {
      return json(
        {
          error: '이미 결제가 완료된 사주입니다.',
          existingOrderId: existingPayment.orderId,
        },
        { status: 409 }
      );
    }

    // orderId 생성 (고유 ID)
    const orderId = generateOrderId('NAMING');

    // NamingPayment 레코드 생성 (PENDING 상태)
    const payment = await prisma.namingPayment.create({
      data: {
        userId: user.id,
        sajuId: sajuId,
        orderId: orderId,
        amount: amount,
        status: 'PENDING',
        orderName: '사주 작명 결과 프리미엄 조회',
        // 15분 후 만료
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // 성공 응답
    return json({
      success: true,
      orderId: payment.orderId,
      amount: payment.amount,
      expiresAt: payment.expiresAt,
    });
  } catch (error) {
    console.error('Payment intent error:', error);

    // Prisma unique constraint 에러 처리
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return json(
        { error: '이미 진행 중인 결제가 있습니다.' },
        { status: 409 }
      );
    }

    return json(
      { error: '결제 요청 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
