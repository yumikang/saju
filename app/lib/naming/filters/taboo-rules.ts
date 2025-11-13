/**
 * TABOO_RULES - 중앙화된 불용한자 및 부정 키워드 관리 시스템
 *
 * 참고: https://sky-cat.tistory.com/96 (불용한자 301자)
 *
 * 구조:
 * 1. EXPLICIT_TABOO_CHARACTERS: 명시적으로 금지된 한자 (301자 + α)
 * 2. NEGATIVE_KEYWORD_CATEGORIES: 부정 의미 키워드 카테고리
 * 3. AUTO_SCAN 함수로 DB 한자 자동 검수
 */

export interface TabooCharacter {
  character: string;
  category: TabooCategory;
  reason: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source?: string; // 출처 (e.g., "sky-cat-301", "manual")
}

export type TabooCategory =
  | 'death'          // 죽음
  | 'illness'        // 질병/장애
  | 'disaster'       // 재앙
  | 'violence'       // 폭력
  | 'unhappiness'    // 불행
  | 'poverty'        // 가난
  | 'ugliness'       // 추함
  | 'crime'          // 범죄
  | 'decay'          // 부패
  | 'negative'       // 일반 부정
  | 'misfortune';    // 불운

/**
 * 불길문자(不吉文字) 301자 - 이름에 쓰면 안되는 한자
 * 출처: 전통 작명 불용한자 목록
 */
const TABOO_301_CHARACTERS = [
  '可', '男', '大', '落', '馬', '丙', '巳', '牙', '子', '次', '太', '八', '下',
  '甲', '南', '德', '蘭', '卍', '秉', '四', '亞', '長', '燦', '兌', '平', '學',
  '江', '女', '挑', '良', '萬', '炳', '糸', '兒', '在', '昌', '泰', '風', '鶴',
  '康', '桃', '連', '滿', '柄', '蛇', '岳', '哉', '尺', '兎', '豊', '韓',
  '介', '豚', '蓮', '末', '寶', '絲', '安', '栽', '千', '亥',
  '巨', '乭', '烈', '梅', '福', '山', '岩', '宰', '川', '海',
  '乾', '冬', '禮', '命', '峯', '殺', '愛', '裁', '天', '杏',
  '傑', '東', '露', '明', '峰', '三', '羊', '載', '鐵', '幸',
  '犬', '童', '鹿', '某', '鳳', '上', '億', '占', '初', '香',
  '決', '董', '籠', '卯', '富', '常', '姸', '點', '草', '玄',
  '庚', '斗', '了', '戊', '北', '祥', '泳', '丁', '寸', '亨',
  '卿', '龍', '武', '分', '霜', '英', '正', '秋', '好',
  '慶', '留', '默', '芬', '生', '榮', '政', '丑', '虎',
  '季', '六', '文', '紛', '西', '午', '貞', '春', '昊',
  '癸', '未', '粉', '石', '五', '晶', '出', '鎬',
  '桂', '美', '不', '碩', '玉', '靜', '忠', '紅',
  '鷄', '敏', '佛', '錫', '沃', '兆', '翠', '洪',
  '坤', '閔', '丕', '仙', '翁', '足', '治', '火',
  '寬', '百', '妃', '先', '完', '尊', '七', '花',
  '光', '法', '飛', '善', '王', '宗', '華',
  '鑛', '丙', '彬', '雪', '外', '終', '皇',
  '久', '成', '用', '主', '孝',
  '九', '星', '雨', '柱', '後',
  '狗', '盛', '隅', '珠', '勳',
  '龜', '聖', '雲', '竹', '煇',
  '舊', '小', '雄', '中', '輝',
  '國', '笑', '元', '仲', '姬',
  '菊', '松', '遠', '重', '喜',
  '君', '釗', '月', '地', '熙',
  '貴', '水', '酉', '枝', '僖',
  '龜', '手', '允', '辰', '嬉',
  '極', '洙', '胤', '珍', '熹',
  '根', '壽', '殷', '眞',
  '今', '淑', '銀', '進',
  '金', '純', '乙', '鎭',
  '琴', '順', '義',
  '錦', '戌', '二',
  '己', '昇', '伊',
  '起', '勝', '貳',
  '基', '始', '仁',
  '吉', '時', '寅',
  '植', '一',
  '申', '日',
  '伸', '壬',
  '辛', '任',
  '神',
  '新',
  '實',
  '心',
  '十'
];

/**
 * 명시적 불용한자 목록 (상세 설명 포함)
 */
export const EXPLICIT_TABOO_CHARACTERS: TabooCharacter[] = [
  // === 301자를 TabooCharacter 형식으로 변환 ===
  ...TABOO_301_CHARACTERS.map(char => ({
    character: char,
    category: 'misfortune' as TabooCategory,
    reason: '전통 불길문자 301자',
    severity: 'high' as const,
    source: 'taboo-301'
  })),

  // === 추가 명시적 불용한자 (더 심각한 것들) ===
  { character: '瘂', category: 'illness', reason: '벙어리, 말하지 못함', severity: 'critical', source: 'manual' },
  { character: '殘', category: 'illness', reason: '모자람, 장애', severity: 'critical', source: 'manual' },
  { character: '病', category: 'illness', reason: '질병', severity: 'critical', source: 'manual' },
  { character: '痛', category: 'illness', reason: '아픔, 고통', severity: 'critical', source: 'manual' },
  { character: '死', category: 'death', reason: '죽음', severity: 'critical', source: 'manual' },
  { character: '災', category: 'disaster', reason: '재앙', severity: 'critical', source: 'manual' },
  { character: '禍', category: 'disaster', reason: '화, 재앙', severity: 'critical', source: 'manual' },
  { character: '凶', category: 'disaster', reason: '흉함', severity: 'critical', source: 'manual' },
  { character: '惡', category: 'negative', reason: '악함', severity: 'critical', source: 'manual' },
  { character: '貧', category: 'poverty', reason: '가난', severity: 'critical', source: 'manual' },
  { character: '窮', category: 'poverty', reason: '궁핍', severity: 'critical', source: 'manual' },
  { character: '乞', category: 'poverty', reason: '구걸', severity: 'critical', source: 'manual' },

  // === 2025-11-12 추가: 부정적 의미 한자 ===
  { character: '愚', category: 'negative', reason: '어리석음', severity: 'high', source: 'manual' },
  { character: '滯', category: 'negative', reason: '막힘, 체류, 정체', severity: 'high', source: 'manual' },
  { character: '重', category: 'misfortune', reason: '무거움, 부담스러움', severity: 'medium', source: 'manual' },
  { character: '尤', category: 'misfortune', reason: '허물, 원망, 꾸짖음', severity: 'medium', source: 'manual' },

  // === 2025-11-13 추가: DB 품질 문제로 인한 부적절 한자 ===
  { character: '蹲', category: 'negative', reason: '쭈그리다, 웅크리다', severity: 'high', source: 'manual' },
  { character: '薯', category: 'negative', reason: '고구마, 감자', severity: 'high', source: 'manual' },
  { character: '猶', category: 'negative', reason: '같을, 비교(부정적)', severity: 'medium', source: 'manual' },
  { character: '雖', category: 'negative', reason: '비록(접속사, 이름부적합)', severity: 'medium', source: 'manual' },
  { character: '猢', category: 'negative', reason: '원숭이', severity: 'high', source: 'manual' },
  { character: '鵞', category: 'negative', reason: '거위', severity: 'medium', source: 'manual' },
];

/**
 * 부정 키워드 카테고리
 * 한자의 meaning 필드에서 이 키워드들을 검색하여 자동 필터링
 */
export const NEGATIVE_KEYWORD_CATEGORIES: Record<TabooCategory, string[]> = {
  death: [
    '죽음', '죽이', '죽다', '시체', '망하', '요절', '단명', '사망',
    '사라지', '소멸', '절명'
  ],

  illness: [
    '질병', '아픔', '고통', '괴로', '신음', '장애',
    '불구', '벙어리', '귀머거리', '장님', '앉은뱅이', '절름',
    '말못', '말하지못', '듣지못', '보지못', '걷지못', '허약', '병약',
    '앓', '신경쇠약', '정신병', '병들', '병', '환자', '병자', '질환',
    '앓다', '아프', '유충', '그리마', '벌레'
  ],

  disaster: [
    '재앙', '화', '난', '액', '흉', '불길', '참혹', '재난',
    '화재', '수해', '지진', '폭풍', '해일', '재해', '파멸',
    '멸망', '붕괴', '파괴'
  ],

  violence: [
    '살육', '살해', '죽이', '베다', '찌르', '때리', '해치', '폭력',
    '구타', '학대', '고문', '도살', '참살',
    '처형', '총살', '교수형', '참수'
  ],

  unhappiness: [
    '불행', '슬픔', '비애', '우울', '한탄', '비참', '비통',
    '절망', '낙담', '좌절', '실망', '고독', '외로', '쓸쓸',
    '처량', '애처로', '가엾', '안타까', '애통', '비감'
  ],

  poverty: [
    '가난', '빈곤', '궁핍', '곤궁', '궁색', '영세', '적빈',
    '가진것없', '재산없', '돈없', '구차', '구걸', '거지',
    '빈털터리', '알거지'
  ],

  ugliness: [
    '추', '못생', '흉', '보기흉', '추악', '흉측', '추잡',
    '추레', '볼품없', '흉물', '추남', '추녀', '못난', '흉한'
  ],

  crime: [
    '도적', '훔치', '속이', '거짓', '사기', '도둑', '절도',
    '강도', '협잡', '기만', '사취', '횡령', '배임', '범죄',
    '위법', '불법', '악행', '죄', '속일', '도적질', '머뭇거릴'
  ],

  decay: [
    '썩', '부패', '문드러', '허물어', '무너', '붕괴', '낡',
    '헤', '낙후', '쇠락', '쇠퇴', '몰락', '타락', '부식',
    '상', '변질'
  ],

  negative: [
    '나쁜', '악', '흉악', '저주', '원한', '미움', '증오',
    '악독', '간악', '악랄', '심술', '못된', '비열', '더러',
    '추잡', '부정', '음흉', '사악', '흉악', '잔인', '잔혹',
    '어리석', '우둔', '둔하', '미련', '멍청', '바보', '멍한',
    '막히', '체류', '지체', '정체', '막히다', '멈추', '흐를', '철철', '늦추', '더디',
    '쭈그리', '쭈그릴', '웅크리', '고구마', '감자', '비록', '같을', '의심',
    '원숭이', '거위', '까마귀', '쥐', '벌레'
  ],

  misfortune: [
    '불운', '불길', '액', '재수없', '운없', '팔자', '불우',
    '기구', '기박', '신세', '고생', '곤란', '어려', '힘든',
    '난관', '역경', '시련', '고초', '험난', '무거', '짐', '부담',
    '허물', '원망', '탓', '꾸짖', '책망'
  ]
};

/**
 * 한자 검증 결과
 */
export interface TabooCheckResult {
  character: string;
  isSafe: boolean;
  issues: TabooIssue[];
  safetyLevel: 'safe' | 'caution' | 'risky' | 'rejected';
  recommendation: 'approve' | 'review' | 'reject';
}

export interface TabooIssue {
  category: TabooCategory;
  matchedKeyword?: string;
  matchedCharacter?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * 현대에 흔하게 사용되는 좋은 한자 화이트리스트
 * 전통 불길문자 301자에 포함되어 있지만 현대에는 긍정적으로 쓰이는 한자들
 */
const MODERN_WHITELIST = [
  '珍', '英', '淑', '順', '美', '善', '愛', '玉', '貞', '花',
  '秀', '民', '智', '賢', '俊', '恩', '瑞', '麗', '惠', '慧',
  '雅', '敏', '貴', '榮', '炫', '璿', '瑛', '琳', '妍', '娜',
  '姸', '婉', '媛', '嬉', '姬', '姝', '娟', '嫣', '娥', '姮'
];

/**
 * 한자 안전성 검사
 */
export function checkCharacterSafety(
  character: string,
  meaning: string
): TabooCheckResult {
  const issues: TabooIssue[] = [];

  // 0. 화이트리스트 체크 - 현대에 흔하게 쓰이는 좋은 한자는 무조건 통과
  if (MODERN_WHITELIST.includes(character)) {
    return {
      character,
      isSafe: true,
      issues: [],
      safetyLevel: 'safe',
      recommendation: 'approve'
    };
  }

  // 1. 명시적 불용한자 체크
  const explicitTaboo = EXPLICIT_TABOO_CHARACTERS.find(t => t.character === character);
  if (explicitTaboo) {
    issues.push({
      category: explicitTaboo.category,
      matchedCharacter: character,
      severity: explicitTaboo.severity,
      reason: explicitTaboo.reason
    });
  }

  // 2. 의미 기반 키워드 매칭
  // Handle null/undefined meanings gracefully
  if (meaning) {
    const meaningLower = meaning.toLowerCase();

    for (const [category, keywords] of Object.entries(NEGATIVE_KEYWORD_CATEGORIES)) {
      for (const keyword of keywords) {
        if (meaningLower.includes(keyword)) {
          const severity = getSeverityByCategory(category as TabooCategory);
          issues.push({
            category: category as TabooCategory,
            matchedKeyword: keyword,
            severity,
            reason: `의미에 부정 키워드 "${keyword}" 포함`
          });
          break; // 카테고리당 하나만 기록
        }
      }
    }
  }

  // 3. 안전성 판정
  const safetyLevel = determineSafetyLevel(issues);
  const recommendation = determineRecommendation(safetyLevel, issues);

  return {
    character,
    isSafe: safetyLevel === 'safe',
    issues,
    safetyLevel,
    recommendation
  };
}

/**
 * 카테고리별 기본 심각도
 */
function getSeverityByCategory(category: TabooCategory): TabooIssue['severity'] {
  const criticalCategories: TabooCategory[] = ['death', 'violence', 'illness'];
  const highCategories: TabooCategory[] = ['disaster', 'crime'];

  if (criticalCategories.includes(category)) return 'critical';
  if (highCategories.includes(category)) return 'high';
  return 'medium';
}

/**
 * 안전성 수준 판정
 */
function determineSafetyLevel(issues: TabooIssue[]): TabooCheckResult['safetyLevel'] {
  if (issues.length === 0) return 'safe';

  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasHigh = issues.some(i => i.severity === 'high');
  const issueCount = issues.length;

  if (hasCritical) return 'rejected';
  if (hasHigh || issueCount >= 3) return 'risky';
  if (issueCount >= 2) return 'caution';
  return 'caution';
}

/**
 * 권장 조치 판정
 */
function determineRecommendation(
  safetyLevel: TabooCheckResult['safetyLevel'],
  issues: TabooIssue[]
): TabooCheckResult['recommendation'] {
  if (safetyLevel === 'rejected') return 'reject';
  if (safetyLevel === 'risky') return 'review';
  if (safetyLevel === 'caution') {
    // medium severity만 있으면 검토, 그 외는 승인
    const onlyMedium = issues.every(i => i.severity === 'medium' || i.severity === 'low');
    return onlyMedium ? 'review' : 'approve';
  }
  return 'approve';
}

/**
 * 배치 검사 (DB 전체 스캔용)
 */
export function batchCheckCharacters(
  characters: Array<{ character: string; meaning: string }>
): {
  safe: TabooCheckResult[];
  caution: TabooCheckResult[];
  risky: TabooCheckResult[];
  rejected: TabooCheckResult[];
} {
  const results = characters.map(c => checkCharacterSafety(c.character, c.meaning));

  return {
    safe: results.filter(r => r.safetyLevel === 'safe'),
    caution: results.filter(r => r.safetyLevel === 'caution'),
    risky: results.filter(r => r.safetyLevel === 'risky'),
    rejected: results.filter(r => r.safetyLevel === 'rejected')
  };
}

/**
 * 점수 감점 계산
 */
export function calculateTabooDeduction(result: TabooCheckResult): number {
  let deduction = 0;

  // 🎯 감점 강화로 점수 차별화 확대
  for (const issue of result.issues) {
    switch (issue.severity) {
      case 'critical':
        deduction += 100; // 완전 배제
        break;
      case 'high':
        deduction += 70;  // 50 → 70 (강력한 페널티)
        break;
      case 'medium':
        deduction += 45;  // 30 → 45 (차별화 강화)
        break;
      case 'low':
        deduction += 20;  // 10 → 20 (차별화 강화)
        break;
    }
  }

  return Math.min(100, deduction); // 최대 100점 감점
}
