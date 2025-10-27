/**
 * Mock Payment Success Endpoint
 *
 * FOR TESTING ONLY - Not for production use
 *
 * POST /api/payment/mock-success
 *
 * Simulates successful payment for E2E testing
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { prisma } from '~/lib/db.server';
import { z } from 'zod';

const MockPaymentSchema = z.object({
  sessionId: z.string().uuid(),
  amount: z.number().int().positive(),
  paymentKey: z.string(),
  orderId: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = MockPaymentSchema.parse(body);

    // Find session
    const session = await prisma.namingSession.findUnique({
      where: { id: data.sessionId },
      include: { payment: true },
    });

    if (!session) {
      return json({ error: 'Session not found' }, { status: 404 });
    }

    // Create or update payment
    if (session.payment) {
      // Update existing payment
      await prisma.namingPayment.update({
        where: { id: session.payment.id },
        data: {
          status: 'COMPLETED',
          unlocked: true,
          paymentKey: data.paymentKey,
          unlockedAt: new Date(),
        },
      });
    } else {
      // Create new payment
      await prisma.namingPayment.create({
        data: {
          sessionId: data.sessionId,
          amount: data.amount,
          status: 'COMPLETED',
          unlocked: true,
          paymentKey: data.paymentKey,
          orderId: data.orderId,
          unlockedAt: new Date(),
        },
      });
    }

    // Extend session expiry by 24 hours
    await prisma.namingSession.update({
      where: { id: data.sessionId },
      data: {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return json({
      success: true,
      message: 'Mock payment completed successfully',
    });
  } catch (error) {
    console.error('[Mock Payment] Error:', error);

    if (error instanceof z.ZodError) {
      return json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return json(
      { error: 'Failed to process mock payment' },
      { status: 500 }
    );
  }
}

// GET not allowed
export async function loader() {
  return json(
    { error: 'POST requests only' },
    { status: 405 }
  );
}
