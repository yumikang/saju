#!/usr/bin/env npx tsx
// 한자-오행 룩업 테이블
// 기존 185개 한자 데이터에서 추출한 character → element 매핑

import { Element } from '@prisma/client';

/**
 * 한자별 오행 매핑 테이블
 * 기존 raw_data.json에서 추출한 185개 한자의 오행 정보
 * Gov 데이터 정규화 시 참조용으로 사용
 */
export const HANJA_ELEMENT_LOOKUP = new Map<string, Element>([
  // 금(金) 오행 한자들
  ['金', Element.METAL],    // 쇠, 금
  ['靜', Element.METAL],    // 고요할
  ['情', Element.METAL],    // 정
  ['曺', Element.METAL],    // 무리
  ['任', Element.METAL],    // 맡을
  ['申', Element.METAL],    // 신
  ['愼', Element.METAL],    // 삼갈
  ['劉', Element.METAL],    // 성
  ['宋', Element.METAL],    // 나라이름
  ['全', Element.METAL],    // 온전할
  ['孫', Element.METAL],    // 손자
  ['白', Element.METAL],    // 흰
  ['駿', Element.METAL],    // 준마
  ['遵', Element.METAL],    // 좇을
  ['瑞', Element.METAL],    // 상서로울
  ['徐', Element.METAL],    // 천천히
  ['西', Element.METAL],    // 서녘
  ['書', Element.METAL],    // 글
  ['眞', Element.METAL],    // 참
  ['秀', Element.METAL],    // 빼어날
  ['壽', Element.METAL],    // 목숨
  ['玧', Element.METAL],    // 옥
  ['兌', Element.METAL],    // 기쁠
  ['銀', Element.METAL],    // 은
  ['兒', Element.METAL],    // 아이
  ['州', Element.METAL],    // 고을
  ['成', Element.METAL],    // 이룰
  ['誠', Element.METAL],    // 정성
  ['石', Element.METAL],    // 돌
  ['鐵', Element.METAL],    // 쇠
  ['乾', Element.METAL],    // 하늘
  ['承', Element.METAL],    // 받들
  ['勝', Element.METAL],    // 이길
  ['讚', Element.METAL],    // 칭찬할
  ['瑟', Element.METAL],    // 거문고
  ['瑬', Element.METAL],    // 옥
  ['率', Element.METAL],    // 거느릴
  ['秋', Element.METAL],    // 가을

  // 목(木) 오행 한자들
  ['李', Element.WOOD],     // 오얏나무
  ['朴', Element.WOOD],     // 박달나무
  ['姜', Element.WOOD],     // 생강
  ['康', Element.WOOD],     // 편안할
  ['吳', Element.WOOD],     // 나라이름
  ['柳', Element.WOOD],     // 버들
  ['松', Element.WOOD],     // 소나무
  ['高', Element.WOOD],     // 높을
  ['古', Element.WOOD],     // 옛
  ['楊', Element.WOOD],     // 버들
  ['梁', Element.WOOD],     // 대들보
  ['林', Element.WOOD],     // 수풀
  ['賢', Element.WOOD],     // 어질
  ['胤', Element.WOOD],     // 후사
  ['皓', Element.WOOD],     // 밝을
  ['英', Element.WOOD],     // 꽃
  ['榮', Element.WOOD],     // 영화
  ['我', Element.WOOD],     // 나
  ['雅', Element.WOOD],     // 아름다울
  ['蓮', Element.WOOD],     // 연꽃
  ['柱', Element.WOOD],     // 기둥
  ['蕙', Element.WOOD],     // 혜초
  ['景', Element.WOOD],     // 경치
  ['敬', Element.WOOD],     // 공경할
  ['京', Element.WOOD],     // 서울
  ['慶', Element.WOOD],     // 경사
  ['桃', Element.WOOD],     // 복숭아
  ['健', Element.WOOD],     // 건강할
  ['建', Element.WOOD],     // 세울
  ['元', Element.WOOD],     // 으뜸
  ['桓', Element.WOOD],     // 굳셀
  ['椀', Element.WOOD],     // 그릇
  ['葵', Element.WOOD],     // 해바라기
  ['梵', Element.WOOD],     // 깨끗할
  ['革', Element.WOOD],     // 가죽
  ['赫', Element.WOOD],     // 빛날
  ['結', Element.WOOD],     // 맺을
  ['彬', Element.WOOD],     // 빛날
  ['栗', Element.WOOD],     // 밤
  ['野', Element.WOOD],     // 들
  ['春', Element.WOOD],     // 봄
  ['薰', Element.WOOD],     // 향기

  // 수(水) 오행 한자들
  ['江', Element.WATER],    // 강
  ['韓', Element.WATER],    // 나라이름
  ['漢', Element.WATER],    // 한수
  ['文', Element.WATER],    // 글월
  ['門', Element.WATER],    // 문
  ['裵', Element.WATER],    // 성
  ['民', Element.WATER],    // 백성
  ['敏', Element.WATER],    // 민첩할
  ['玟', Element.WATER],    // 옥돌
  ['弦', Element.WATER],    // 활시위
  ['玄', Element.WATER],    // 검을
  ['雨', Element.WATER],    // 비
  ['浩', Element.WATER],    // 넓을
  ['好', Element.WATER],    // 좋을
  ['豪', Element.WATER],    // 호걸
  ['池', Element.WATER],    // 못
  ['永', Element.WATER],    // 길
  ['水', Element.WATER],    // 물
  ['洙', Element.WATER],    // 물이름
  ['潤', Element.WATER],    // 윤택할
  ['泰', Element.WATER],    // 클
  ['希', Element.WATER],    // 바랄
  ['熙', Element.WATER],    // 빛날
  ['洪', Element.WATER],    // 큰물
  ['演', Element.WATER],    // 연기할
  ['惠', Element.WATER],    // 은혜
  ['慧', Element.WATER],    // 지혜
  ['源', Element.WATER],    // 근원
  ['歡', Element.WATER],    // 기쁠
  ['範', Element.WATER],    // 법
  ['凡', Element.WATER],    // 무릇
  ['濱', Element.WATER],    // 물가
  ['賓', Element.WATER],    // 손님
  ['別', Element.WATER],    // 다를
  ['潔', Element.WATER],    // 깨끗할
  ['潭', Element.WATER],    // 못
  ['淡', Element.WATER],    // 담담할
  ['膽', Element.WATER],    // 쓸개
  ['泉', Element.WATER],    // 샘
  ['冬', Element.WATER],    // 겨울
  ['澈', Element.WATER],    // 맑을

  // 화(火) 오행 한자들
  ['鄭', Element.FIRE],     // 나라이름
  ['正', Element.FIRE],     // 바를
  ['趙', Element.FIRE],     // 나라이름
  ['張', Element.FIRE],     // 활
  ['章', Element.FIRE],     // 글
  ['田', Element.FIRE],     // 밭
  ['旻', Element.FIRE],     // 하늘
  ['俊', Element.FIRE],     // 준수할
  ['炫', Element.FIRE],     // 빛날
  ['振', Element.FIRE],     // 떨칠
  ['珍', Element.FIRE],     // 보배
  ['晋', Element.FIRE],     // 나아갈
  ['智', Element.FIRE],     // 지혜
  ['志', Element.FIRE],     // 뜻
  ['知', Element.FIRE],     // 알
  ['映', Element.FIRE],     // 비칠
  ['太', Element.FIRE],     // 클
  ['喜', Element.FIRE],     // 기쁠
  ['珠', Element.FIRE],     // 구슬
  ['宙', Element.FIRE],     // 집
  ['星', Element.FIRE],     // 별
  ['道', Element.FIRE],     // 길
  ['島', Element.FIRE],     // 섬
  ['昔', Element.FIRE],     // 옛날
  ['哲', Element.FIRE],     // 철학
  ['燻', Element.FIRE],     // 그을릴
  ['煥', Element.FIRE],     // 빛날
  ['昇', Element.FIRE],     // 오를
  ['燦', Element.FIRE],     // 빛날
  ['粲', Element.FIRE],     // 빛날
  ['臨', Element.FIRE],     // 임할
  ['那', Element.FIRE],     // 어찌
  ['娜', Element.FIRE],     // 아름다울
  ['羅', Element.FIRE],     // 벌일
  ['律', Element.FIRE],     // 법
  ['夏', Element.FIRE],     // 여름

  // 토(土) 오행 한자들
  ['伊', Element.EARTH],    // 그, 이
  ['崔', Element.EARTH],    // 높을
  ['五', Element.EARTH],    // 다섯
  ['安', Element.EARTH],    // 편안할
  ['宇', Element.EARTH],    // 집
  ['友', Element.EARTH],    // 벗
  ['佑', Element.EARTH],    // 도울
  ['峻', Element.EARTH],    // 높을
  ['尹', Element.EARTH],    // 다스릴
  ['允', Element.EARTH],    // 허락할
  ['恩', Element.EARTH],    // 은혜
  ['隱', Element.EARTH],    // 숨을
  ['燕', Element.EARTH],    // 제비
  ['延', Element.EARTH],    // 늘일
  ['聖', Element.EARTH],    // 성인
  ['都', Element.EARTH],    // 도읍
  ['碩', Element.EARTH],    // 클
  ['勳', Element.EARTH],    // 공
  ['龍', Element.EARTH],    // 용
  ['容', Element.EARTH],    // 용모
  ['勇', Element.EARTH],    // 용감할
  ['完', Element.EARTH],    // 완전할
  ['琓', Element.EARTH],    // 옥
  ['圭', Element.EARTH],    // 홀
  ['奎', Element.EARTH],    // 별
  ['園', Element.EARTH],    // 동산
  ['遠', Element.EARTH],    // 멀
]);

/**
 * 한자의 오행을 조회하는 함수
 * @param character 한자 문자
 * @returns Prisma Element enum 값 또는 undefined
 */
export function lookupHanjaElement(character: string): Element | undefined {
  return HANJA_ELEMENT_LOOKUP.get(character);
}

/**
 * 룩업 테이블에 포함된 한자인지 확인
 * @param character 한자 문자
 * @returns 룩업 테이블에 존재하는지 여부
 */
export function hasElementMapping(character: string): boolean {
  return HANJA_ELEMENT_LOOKUP.has(character);
}

/**
 * 특정 오행에 속하는 모든 한자 반환
 * @param element Prisma Element enum 값
 * @returns 해당 오행에 속하는 한자 배열
 */
export function getHanjaByElement(element: Element): string[] {
  const result: string[] = [];
  for (const [character, elementValue] of HANJA_ELEMENT_LOOKUP) {
    if (elementValue === element) {
      result.push(character);
    }
  }
  return result;
}

/**
 * 룩업 테이블 통계 반환
 */
export function getLookupStats() {
  const elementCounts = new Map<Element, number>();
  
  for (const element of HANJA_ELEMENT_LOOKUP.values()) {
    elementCounts.set(element, (elementCounts.get(element) || 0) + 1);
  }
  
  return {
    totalCharacters: HANJA_ELEMENT_LOOKUP.size,
    elementCounts: Object.fromEntries(elementCounts),
    coverage: `${HANJA_ELEMENT_LOOKUP.size}/185 characters mapped`
  };
}

// 개발/디버깅용 출력
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('한자-오행 룩업 테이블 통계:');
  console.log(getLookupStats());
  
  console.log('\n오행별 한자 수:');
  Object.values(Element).forEach(element => {
    const hanjas = getHanjaByElement(element);
    console.log(`${element}: ${hanjas.length}개 - ${hanjas.slice(0, 10).join(', ')}${hanjas.length > 10 ? '...' : ''}`);
  });
}