import { Element } from '@prisma/client';

/**
 * 오행 Element enum과 한글 문자열 간 변환 유틸리티
 * HanjaSelector 컴포넌트와 DB Element enum 간 타입 변환에 사용
 */

const ELEMENT_MAP: Record<Element, string> = {
  [Element.METAL]: '금',
  [Element.WOOD]: '목',
  [Element.WATER]: '수',
  [Element.FIRE]: '화',
  [Element.EARTH]: '토',
};

/**
 * Element enum을 한글 문자열로 변환
 * @param element - Prisma Element enum 값
 * @returns 한글 오행 문자열 ('금', '목', '수', '화', '토') 또는 undefined
 */
export function elementToKorean(element: Element | null): string | undefined {
  return element ? ELEMENT_MAP[element] : undefined;
}

/**
 * 한글 문자열을 Element enum으로 변환
 * @param korean - 한글 오행 문자열 ('금', '목', '수', '화', '토')
 * @returns Element enum 값 또는 null
 */
export function koreanToElement(korean: string): Element | null {
  const entry = Object.entries(ELEMENT_MAP).find(([_, k]) => k === korean);
  return entry ? (entry[0] as Element) : null;
}
