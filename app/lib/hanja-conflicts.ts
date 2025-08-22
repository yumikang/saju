// 한자 오행 충돌 관리 시스템

export interface ElementConflict {
  character: string;
  meaning: string;
  reading: string;
  baseElement: string;
  expandedElement: string;
  status: 'pending' | 'resolved' | 'masked';
  reason: string;
  priority: 'high' | 'medium' | 'low';
  resolvedElement?: string;
  authoritySource?: string;
}

// 현재 확인된 오행 충돌 목록
export const elementConflicts: ElementConflict[] = [
  {
    character: '賢',
    meaning: '어질',
    reading: '현',
    baseElement: '목',
    expandedElement: '金',
    status: 'pending',
    reason: 'Base data shows 목(wood), expanded data shows 金(metal) - requires authority source validation',
    priority: 'high'
  },
  {
    character: '星',
    meaning: '별',
    reading: '별/성',
    baseElement: '화',
    expandedElement: '金',
    status: 'pending', 
    reason: 'Base data shows 화(fire), expanded data shows 金(metal) - requires authority source validation',
    priority: 'high'
  }
];

// 충돌 해결 함수
export function isConflictedElement(character: string): boolean {
  return elementConflicts.some(conflict => conflict.character === character);
}

export function getConflictInfo(character: string): ElementConflict | undefined {
  return elementConflicts.find(conflict => conflict.character === character);
}

// 오행 마스킹 함수 - 충돌 시 오행을 직접 노출하지 않음
export function getMaskedElement(character: string, originalElement: string): string | null {
  const conflict = getConflictInfo(character);
  if (conflict && conflict.status === 'pending') {
    return null; // 마스킹 - 오행 정보 숨김
  }
  return originalElement;
}

// 충돌 상태 업데이트
export function updateConflictStatus(
  character: string, 
  status: ElementConflict['status'],
  resolvedElement?: string,
  authoritySource?: string
): void {
  const conflict = elementConflicts.find(c => c.character === character);
  if (conflict) {
    conflict.status = status;
    if (resolvedElement) conflict.resolvedElement = resolvedElement;
    if (authoritySource) conflict.authoritySource = authoritySource;
  }
}

// 충돌 해결 진행률
export function getConflictResolutionStats() {
  const total = elementConflicts.length;
  const resolved = elementConflicts.filter(c => c.status === 'resolved').length;
  const pending = elementConflicts.filter(c => c.status === 'pending').length;
  const masked = elementConflicts.filter(c => c.status === 'masked').length;
  
  return {
    total,
    resolved,
    pending,
    masked,
    resolutionRate: total > 0 ? (resolved / total) * 100 : 0
  };
}

// 권위 소스 우선순위 (추후 확장 가능)
export const authoritySourcePriority = [
  'KS_X_1001', // 한국산업표준
  'Unicode_Unihan', // 유니코드 한한대자전
  'Kangxi_Dictionary', // 강희자전
  'Korean_National_Dictionary', // 국립국어원 표준국어대사전
  'Traditional_Reference', // 전통 한의학/역학 서적
  'Statistical_Analysis' // 통계적 분석 결과
] as const;

export type AuthoritySource = typeof authoritySourcePriority[number];

// 충돌 해결 가이드라인
export const conflictResolutionGuidelines = {
  process: [
    '1. 권위 소스에서 정확한 오행 확인',
    '2. 여러 소스 간 일치도 확인', 
    '3. 사주학/한의학 전문가 검토',
    '4. 최종 결정 및 문서화',
    '5. 시스템 반영 및 테스트'
  ],
  fallbackStrategy: [
    '충돌 해결 전까지 해당 한자의 오행 정보 마스킹',
    '사용자에게 "오행 정보 검토 중" 메시지 표시',
    '대체 한자 추천 기능 활성화'
  ]
};