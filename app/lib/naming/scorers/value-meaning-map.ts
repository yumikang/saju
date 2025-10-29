/**
 * Value-Meaning Mapping System
 *
 * Maps parent values (부모 가치관) to specific Korean characters and meanings.
 * Used by MeaningScorer to calculate value alignment scores.
 */

import type { ParentValue } from '~/components/naming/ValueSelector';

export interface ValueMeaningMapping {
  keywords: string[];      // 관련 키워드
  characters: string[];    // 관련 한자
  weight: number;          // 가중치 (기본 1.0)
}

/**
 * Parent Value to Meaning Mapping
 *
 * Each value type maps to:
 * - keywords: Meaning keywords that align with this value
 * - characters: Specific hanja characters that embody this value
 * - weight: Scoring weight (default 1.0)
 */
export const VALUE_MEANING_MAP: Record<ParentValue, ValueMeaningMapping> = {
  success: {
    keywords: [
      '성공', '출세', '영광', '승리', '업적', '달성', '우수', '뛰어남',
      '걸출', '탁월', '명성', '명예', '영예', '위대', '높음', '크다',
      '훌륭', '빛나다', '번창', '발전', '진보', '향상'
    ],
    characters: [
      '成', '達', '勝', '優', '傑', '榮', '盛', '偉', '大', '昇',
      '進', '輝', '赫', '卓', '秀', '煥', '顯', '峰', '冠', '尊'
    ],
    weight: 1.0
  },

  health: {
    keywords: [
      '건강', '장수', '강건', '튼튼', '활력', '생명', '오래', '힘',
      '체력', '정신', '맑다', '깨끗', '순수', '평안', '편안', '안녕',
      '자연', '조화', '균형', '안정'
    ],
    characters: [
      '健', '康', '壽', '命', '生', '永', '久', '淸', '純', '安',
      '泰', '寧', '和', '樂', '福', '祥', '吉', '昌', '綠', '松'
    ],
    weight: 1.0
  },

  popularity: {
    keywords: [
      '인기', '인덕', '사랑', '친구', '우정', '소통', '교류', '화합',
      '친절', '따뜻', '온화', '배려', '포용', '너그럽', '열린', '밝음',
      '환영', '기쁨', '즐거움', '유쾌', '상냥', '호감'
    ],
    characters: [
      '仁', '愛', '德', '友', '和', '協', '親', '善', '溫', '柔',
      '美', '麗', '喜', '悅', '樂', '歡', '明', '亮', '輝', '光'
    ],
    weight: 1.0
  },

  wealth: {
    keywords: [
      '재물', '풍요', '부유', '번영', '풍부', '넉넉', '여유', '돈',
      '재산', '재력', '부', '보배', '귀중', '값진', '가치', '이득',
      '수확', '열매', '결실', '충만', '가득', '만족'
    ],
    characters: [
      '財', '富', '豊', '寶', '珍', '貴', '榮', '昌', '盛', '裕',
      '滿', '實', '成', '益', '利', '得', '金', '銀', '玉', '璋'
    ],
    weight: 1.0
  },

  peace: {
    keywords: [
      '평화', '안정', '평온', '고요', '조용', '차분', '편안', '평안',
      '순조', '원만', '조화', '균형', '중용', '중립', '부드럽', '온화',
      '태평', '무사', '안전', '보호', '지키다'
    ],
    characters: [
      '平', '安', '泰', '寧', '靜', '穩', '和', '諧', '順', '柔',
      '溫', '淡', '定', '正', '中', '守', '保', '護', '恬', '休'
    ],
    weight: 1.0
  },

  wisdom: {
    keywords: [
      '지혜', '학문', '학업', '공부', '지식', '총명', '슬기', '현명',
      '똑똑', '영리', '지능', '재능', '재주', '능력', '배움', '독서',
      '글', '문장', '예술', '창의', '창조', '발명', '생각', '사고'
    ],
    characters: [
      '智', '慧', '學', '文', '才', '哲', '賢', '明', '英', '睿',
      '敏', '聰', '穎', '秀', '俊', '彬', '雅', '藝', '書', '道'
    ],
    weight: 1.0
  }
};

/**
 * Check if a character aligns with a parent value
 *
 * @param character - Hanja character to check
 * @param value - Parent value to check against
 * @returns true if character is in the value's character list
 */
export function characterMatchesValue(character: string, value: ParentValue): boolean {
  const mapping = VALUE_MEANING_MAP[value];
  return mapping.characters.includes(character);
}

/**
 * Check if a meaning aligns with a parent value
 *
 * @param meaning - Meaning text to check
 * @param value - Parent value to check against
 * @returns true if meaning contains any keyword from the value
 */
export function meaningMatchesValue(meaning: string, value: ParentValue): boolean {
  const mapping = VALUE_MEANING_MAP[value];
  return mapping.keywords.some(keyword => meaning.includes(keyword));
}

/**
 * Calculate alignment score for a character with parent values
 *
 * @param character - Hanja character
 * @param meaning - Character's meaning
 * @param parentValues - User's selected parent values
 * @returns Alignment score (0-100)
 */
export function calculateCharacterValueAlignment(
  character: string,
  meaning: string,
  parentValues: ParentValue[]
): number {
  if (!parentValues || parentValues.length === 0) {
    return 0; // No parent values selected, no alignment bonus
  }

  let alignmentScore = 0;
  let matchCount = 0;

  for (const value of parentValues) {
    const mapping = VALUE_MEANING_MAP[value];

    // Character match (stronger signal)
    const characterMatch = mapping.characters.includes(character);
    if (characterMatch) {
      alignmentScore += 50 * mapping.weight;
      matchCount++;
    }

    // Meaning match (weaker signal, but still valuable)
    const meaningMatch = mapping.keywords.some(keyword => meaning.includes(keyword));
    if (meaningMatch && !characterMatch) {
      alignmentScore += 30 * mapping.weight;
      matchCount++;
    }
  }

  // Normalize by number of selected values
  // Average score per value, capped at 100
  return Math.min(100, alignmentScore / parentValues.length);
}

/**
 * Calculate aggregate alignment score for a name candidate
 *
 * @param characters - Array of name characters with meanings
 * @param parentValues - User's selected parent values
 * @returns Overall alignment score (0-100)
 */
export function calculateNameValueAlignment(
  characters: Array<{ character: string; meaning: string }>,
  parentValues: ParentValue[]
): number {
  if (!parentValues || parentValues.length === 0) {
    return 0;
  }

  const characterScores = characters.map(char =>
    calculateCharacterValueAlignment(char.character, char.meaning, parentValues)
  );

  // Average of all character alignment scores
  const averageScore = characterScores.reduce((sum, score) => sum + score, 0) / characters.length;

  return averageScore;
}
