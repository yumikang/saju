/**
 * Favorites API
 *
 * 즐겨찾기 관리 엔드포인트
 * - GET: 사용자의 즐겨찾기 목록 조회
 * - POST: 즐겨찾기 추가
 * - DELETE: 즐겨찾기 삭제
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { prisma } from '~/lib/db.server';
import { requireUser } from '~/lib/session.server';

/**
 * GET /api/favorites
 * 사용자의 즐겨찾기 목록 조회
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        namingResult: {
          select: {
            id: true,
            firstName: true,
            fullName: true,
            firstNameHanja: true,
            overallScore: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return json({
      success: true,
      favorites: favorites.map((fav) => ({
        id: fav.id,
        namingResultId: fav.namingResultId,
        rating: fav.rating,
        comment: fav.comment,
        createdAt: fav.createdAt,
        namingResult: fav.namingResult,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return json(
      { error: '즐겨찾기 목록을 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites - 즐겨찾기 추가
 * DELETE /api/favorites - 즐겨찾기 삭제
 */
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  if (request.method === 'POST') {
    // 즐겨찾기 추가
    try {
      const body = await request.json();
      const { namingResultId, rating, comment } = body;

      if (!namingResultId) {
        return json(
          { error: 'namingResultId가 필요합니다.' },
          { status: 400 }
        );
      }

      // 중복 체크
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_namingResultId: {
            userId: user.id,
            namingResultId,
          },
        },
      });

      if (existing) {
        return json(
          { error: '이미 즐겨찾기에 추가된 항목입니다.' },
          { status: 409 }
        );
      }

      // 즐겨찾기 추가
      const favorite = await prisma.favorite.create({
        data: {
          userId: user.id,
          namingResultId,
          rating,
          comment,
        },
      });

      return json({
        success: true,
        favorite: {
          id: favorite.id,
          namingResultId: favorite.namingResultId,
          rating: favorite.rating,
          comment: favorite.comment,
          createdAt: favorite.createdAt,
        },
      });
    } catch (error) {
      console.error('Failed to add favorite:', error);
      return json(
        { error: '즐겨찾기 추가에 실패했습니다.' },
        { status: 500 }
      );
    }
  }

  if (request.method === 'DELETE') {
    // 즐겨찾기 삭제
    try {
      const body = await request.json();
      const { namingResultId } = body;

      if (!namingResultId) {
        return json(
          { error: 'namingResultId가 필요합니다.' },
          { status: 400 }
        );
      }

      // 삭제
      await prisma.favorite.delete({
        where: {
          userId_namingResultId: {
            userId: user.id,
            namingResultId,
          },
        },
      });

      return json({
        success: true,
        message: '즐겨찾기가 삭제되었습니다.',
      });
    } catch (error: any) {
      // Not found 에러 처리
      if (error.code === 'P2025') {
        return json(
          { error: '즐겨찾기 항목을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      console.error('Failed to delete favorite:', error);
      return json(
        { error: '즐겨찾기 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }
  }

  return json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
