/**
 * Freemium PDF Generation API
 *
 * GET /api/pdf/freemium/$sessionId
 *
 * Generates PDF with all 10 unlocked names after payment
 */

import { type LoaderFunctionArgs } from '@remix-run/node';
import { prisma } from '~/lib/db.server';
import { generateFreemiumPDF } from '~/lib/pdf/freemium-generator.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const { sessionId } = params;

  if (!sessionId) {
    return new Response('Session ID required', { status: 400 });
  }

  try {
    // 1. Fetch session with payment verification
    const session = await prisma.namingSession.findUnique({
      where: { id: sessionId },
      include: { payment: true },
    });

    if (!session) {
      return new Response('Session not found', { status: 404 });
    }

    // 2. Security: Verify payment unlocked
    if (!session.payment || !session.payment.unlocked) {
      return new Response('Payment required', { status: 403 });
    }

    // 3. Check session not expired
    if (session.expiresAt < new Date()) {
      return new Response('Session expired', { status: 410 });
    }

    // 4. Extract top 10 names
    const top5 = (session.top5 as any[]) || [];
    const remaining15 = (session.remaining15 as any[]) || [];
    const top10Names = [...top5, ...remaining15.slice(0, 5)];

    // 5. Prepare PDF data
    const pdfData = {
      session: {
        lastName: session.lastName,
        gender: session.gender,
        birthDate: session.birthDate.toISOString().split('T')[0],
        birthTime: session.birthTime,
        selectedValues: session.selectedValues as string[],
      },
      names: top10Names,
      saju: session.saju,
      yongsin: session.yongsin,
      payment: {
        amount: session.payment.amount,
        completedAt: session.payment.unlockedAt,
      },
    };

    // 6. Generate PDF
    const pdfBuffer = await generateFreemiumPDF(pdfData);

    // 7. Return PDF file
    const filename = `naming-${session.lastName}-${Date.now()}.pdf`;

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[PDF Generation] Error:', error);
    return new Response('PDF generation failed', { status: 500 });
  }
}
