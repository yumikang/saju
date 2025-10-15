/**
 * Hanja Detail API
 *
 * 한자 상세 정보 조회 엔드포인트
 * - 한자 character로 조회
 * - 뜻, 획수, 오행, 음양, 독음, 사용 빈도 등 반환
 */

import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { prisma } from '~/lib/db.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  // character 파라미터 검증
  if (!id) {
    return json(
      { error: '한자를 지정해주세요.' },
      { status: 400 }
    );
  }

  try {
    // HanjaDict에서 한자 정보 조회
    const hanja = await prisma.hanjaDict.findUnique({
      where: { character: id },
    });

    if (!hanja) {
      return json(
        { error: '한자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // HanjaReading에서 독음 정보 조회 (여러 독음이 있을 수 있음)
    const readings = await prisma.hanjaReading.findMany({
      where: { character: id },
      orderBy: [
        { isPrimary: 'desc' }, // 주요 독음 먼저
        { reading: 'asc' },
      ],
    });

    // 응답 데이터 구성
    return json({
      success: true,
      hanja: {
        character: hanja.character,
        meaning: hanja.meaning,
        strokes: hanja.strokes,
        element: hanja.element,
        yinYang: hanja.yinYang,
        koreanReading: hanja.koreanReading,
        chineseReading: hanja.chineseReading,
        radical: hanja.radical,
        usageFrequency: hanja.usageFrequency,
        nameFrequency: hanja.nameFrequency,
        category: hanja.category,
        gender: hanja.gender,
        isGoodForNaming: hanja.isGoodForNaming,
        readings: readings.map((r) => ({
          reading: r.reading,
          soundElem: r.soundElem,
          isPrimary: r.isPrimary,
        })),
      },
    });
  } catch (error) {
    console.error('Hanja detail error:', error);
    return json(
      { error: '한자 정보 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
