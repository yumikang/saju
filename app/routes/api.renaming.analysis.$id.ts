/**
 * Renaming API: Get Analysis by ID
 *
 * GET /api/renaming/analysis/:id
 *
 * Returns analysis data for a specific renaming analysis.
 */

import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { id } = params;

    if (!id) {
      return json(
        {
          success: false,
          error: 'MISSING_ID',
          message: '분석 ID가 필요합니다',
        },
        { status: 400 }
      );
    }

    const analysis = await prisma.renamingAnalysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      return json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: '분석 데이터를 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }

    return json(
      {
        success: true,
        data: {
          analysisId: analysis.id,
          currentScore: analysis.currentScore,
          currentNameHanja: analysis.currentNameHanja,
          sajuData: analysis.sajuData,
          analysisData: analysis.analysisData,
          createdAt: analysis.createdAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/renaming/analysis/:id] Error:', error);
    return json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '분석 데이터를 가져오는 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}
