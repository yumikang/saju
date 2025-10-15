/**
 * PDF Export API
 *
 * 작명 결과를 PDF로 내보내기
 * - 프리미엄 전용 기능
 * - NamingResult ID로 조회
 * - PDF 버퍼 반환
 */

import { type LoaderFunctionArgs } from '@remix-run/node';
import { prisma } from '~/lib/db.server';
import { requireUser } from '~/lib/session.server';
import { generateNamingResultPdf, type NamingResultPdfData } from '~/lib/pdf/generator.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { resultId } = params;

  if (!resultId) {
    return new Response('Result ID가 필요합니다.', { status: 400 });
  }

  try {
    // NamingResult 조회
    const namingResult = await prisma.namingResult.findUnique({
      where: { id: resultId },
      include: {
        sajuData: true,
      },
    });

    if (!namingResult) {
      return new Response('작명 결과를 찾을 수 없습니다.', { status: 404 });
    }

    // 권한 확인 (본인의 결과만 내보낼 수 있음)
    if (namingResult.userId !== user.id) {
      return new Response('권한이 없습니다.', { status: 403 });
    }

    // TODO: 프리미엄 권한 확인
    // 현재는 스킵하고, 나중에 NamingPayment 테이블을 확인하여 해당 sajuDataId에 대한 결제가 있는지 확인

    // PDF 데이터 구성
    const pdfData: NamingResultPdfData = {
      lastName: namingResult.lastName,
      firstName: [namingResult.firstName],
      firstNameHanja: namingResult.firstNameHanja ? [namingResult.firstNameHanja] : [],
      scores: {
        overall: namingResult.overallScore,
        elementHarmony: namingResult.balanceScore,
        pronunciation: namingResult.soundScore,
        meaning: namingResult.meaningScore,
      },
      characters: [], // TODO: 한자 정보 조회 및 추가
      sajuInfo: namingResult.sajuData
        ? {
            birthDate: namingResult.sajuData.birthDate.toISOString().split('T')[0],
            birthTime: namingResult.sajuData.birthTime,
            gender: namingResult.sajuData.gender,
          }
        : undefined,
    };

    // PDF 생성
    const pdfBuffer = await generateNamingResultPdf(pdfData);

    // PDF 응답
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="naming-result-${resultId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return new Response('PDF 생성에 실패했습니다.', { status: 500 });
  }
}
