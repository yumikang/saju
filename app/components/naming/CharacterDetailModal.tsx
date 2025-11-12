/**
 * CharacterDetailModal Component
 *
 * 한자 상세 정보 모달
 * - 한자 클릭 시 상세 정보 표시
 * - 뜻, 획수, 오행, 음양, 독음, 사용 빈도 등
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Badge } from '~/components/ui/badge';

interface HanjaDetail {
  character: string;
  meaning: string | null;
  strokes: number | null;
  element: string | null;
  yinYang: string | null;
  koreanReading: string | null;
  chineseReading: string | null;
  radical: string | null;
  usageFrequency: number | null;
  nameFrequency: number | null;
  category: string | null;
  gender: string | null;
  isGoodForNaming: boolean;
  readings: Array<{
    reading: string;
    soundElem: string | null;
    isPrimary: boolean;
  }>;
}

interface CharacterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: string;
}

export function CharacterDetailModal({
  isOpen,
  onClose,
  character,
}: CharacterDetailModalProps) {
  const [hanja, setHanja] = useState<HanjaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !character) return;

    const fetchHanjaDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/hanja/${encodeURIComponent(character)}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '한자 정보를 가져올 수 없습니다.');
        }

        const data = await response.json();
        setHanja(data.hanja);
      } catch (err: any) {
        console.error('Error fetching hanja detail:', err);
        setError(err.message || '한자 정보를 가져오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHanjaDetail();
  }, [isOpen, character]);

  /**
   * 오행 → 색상 매핑
   */
  const getElementColor = (element: string | null): string => {
    const colorMap: Record<string, string> = {
      WOOD: 'text-green-600',
      FIRE: 'text-red-600',
      EARTH: 'text-yellow-600',
      METAL: 'text-gray-600',
      WATER: 'text-blue-600',
    };
    return element ? colorMap[element] || 'text-foreground' : 'text-muted-foreground';
  };

  /**
   * 오행 → 한글 변환
   */
  const getElementLabel = (element: string | null): string => {
    const labelMap: Record<string, string> = {
      WOOD: '목(木)',
      FIRE: '화(火)',
      EARTH: '토(土)',
      METAL: '금(金)',
      WATER: '수(水)',
    };
    return element ? labelMap[element] || element : '없음';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>한자 상세 정보</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && hanja && (
          <div className="space-y-6">
            {/* 한자 표시 */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{hanja.character}</div>
              {hanja.meaning && (
                <p className="text-lg text-muted-foreground">{hanja.meaning}</p>
              )}
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 획수 */}
              {hanja.strokes !== null && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-1">획수 (참고용)</p>
                  <p className="text-lg font-semibold">{hanja.strokes}획</p>
                  <p className="text-xs text-amber-600 mt-1">※ 점수에 미반영</p>
                </div>
              )}

              {/* 오행 */}
              {hanja.element && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-1">오행 (참고용)</p>
                  <p className={`text-lg font-semibold ${getElementColor(hanja.element)}`}>
                    {getElementLabel(hanja.element)}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">※ 점수에 미반영</p>
                </div>
              )}

              {/* 음양 */}
              {hanja.yinYang && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-1">음양</p>
                  <p className="text-lg font-semibold">
                    {hanja.yinYang === 'YIN' ? '음(陰)' : '양(陽)'}
                  </p>
                </div>
              )}

              {/* 부수 */}
              {hanja.radical && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-1">부수</p>
                  <p className="text-lg font-semibold">{hanja.radical}</p>
                </div>
              )}
            </div>

            {/* 독음 정보 */}
            {hanja.readings && hanja.readings.length > 0 && (
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">독음</p>
                <div className="flex flex-wrap gap-2">
                  {hanja.readings.map((reading, index) => (
                    <Badge
                      key={index}
                      variant={reading.isPrimary ? 'default' : 'secondary'}
                    >
                      {reading.reading}
                      {reading.soundElem && ` (${reading.soundElem})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 사용 정보 */}
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">사용 정보</p>

              {/* 작명 적합성 */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">작명 적합성</span>
                <Badge variant={hanja.isGoodForNaming ? 'default' : 'destructive'}>
                  {hanja.isGoodForNaming ? '적합' : '부적합'}
                </Badge>
              </div>

              {/* 성별 선호도 */}
              {hanja.gender && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">성별 선호도</span>
                  <span className="text-sm">
                    {hanja.gender === 'male' ? '남성' : hanja.gender === 'female' ? '여성' : '중성'}
                  </span>
                </div>
              )}

              {/* 사용 빈도 */}
              {hanja.usageFrequency !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">일반 사용 빈도</span>
                  <span className="text-sm">{hanja.usageFrequency.toLocaleString()}회</span>
                </div>
              )}

              {/* 작명 빈도 */}
              {hanja.nameFrequency !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">작명 사용 빈도</span>
                  <span className="text-sm">{hanja.nameFrequency.toLocaleString()}회</span>
                </div>
              )}

              {/* 카테고리 */}
              {hanja.category && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">카테고리</span>
                  <span className="text-sm">{hanja.category}</span>
                </div>
              )}
            </div>

            {/* 독음 상세 (한국어/중국어) */}
            {(hanja.koreanReading || hanja.chineseReading) && (
              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">기타 독음</p>
                {hanja.koreanReading && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">한국 한자음</span>
                    <span className="text-sm">{hanja.koreanReading}</span>
                  </div>
                )}
                {hanja.chineseReading && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">중국 병음</span>
                    <span className="text-sm">{hanja.chineseReading}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
