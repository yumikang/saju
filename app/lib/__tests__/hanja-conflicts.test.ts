import { expect, test, describe } from 'vitest';
import { 
  elementConflicts, 
  isConflictedElement, 
  getConflictInfo, 
  getMaskedElement,
  updateConflictStatus,
  getConflictResolutionStats 
} from '../hanja-conflicts';
import { getElementWithConflictHandling } from '../hanja-enhanced';

describe('한자 오행 충돌 관리 테스트', () => {
  test('충돌 한자 감지', () => {
    expect(isConflictedElement('賢')).toBe(true);
    expect(isConflictedElement('星')).toBe(true);
    expect(isConflictedElement('金')).toBe(false); // 충돌 없는 한자
  });

  test('충돌 정보 조회', () => {
    const conflict = getConflictInfo('賢');
    expect(conflict).toBeDefined();
    expect(conflict?.character).toBe('賢');
    expect(conflict?.baseElement).toBe('목');
    expect(conflict?.expandedElement).toBe('金');
    expect(conflict?.status).toBe('pending');
  });

  test('오행 마스킹', () => {
    // pending 상태의 충돌 한자는 null 반환
    expect(getMaskedElement('賢', '목')).toBe(null);
    expect(getMaskedElement('星', '화')).toBe(null);
    
    // 충돌 없는 한자는 원본 반환
    expect(getMaskedElement('金', '금')).toBe('금');
  });

  test('충돌 상태 업데이트', () => {
    // 상태 업데이트 전 백업
    const originalStatus = getConflictInfo('賢')?.status;
    
    updateConflictStatus('賢', 'resolved', '금', 'Korean_National_Dictionary');
    
    const updated = getConflictInfo('賢');
    expect(updated?.status).toBe('resolved');
    expect(updated?.resolvedElement).toBe('금');
    expect(updated?.authoritySource).toBe('Korean_National_Dictionary');
    
    // 원상 복구
    updateConflictStatus('賢', originalStatus as any);
  });

  test('충돌 해결 통계', () => {
    const stats = getConflictResolutionStats();
    expect(stats.total).toBe(2);
    expect(stats.pending).toBe(2);
    expect(stats.resolved).toBe(0);
    expect(stats.resolutionRate).toBe(0);
  });

  test('오행 충돌 처리 헬퍼', () => {
    // 충돌 한자는 마스킹됨
    expect(getElementWithConflictHandling('賢', '木')).toBe(null);
    expect(getElementWithConflictHandling('星', '火')).toBe(null);
    
    // 충돌 없는 한자는 원본 반환
    expect(getElementWithConflictHandling('金', '金')).toBe('金');
  });

  test('기본 충돌 데이터 검증', () => {
    expect(elementConflicts).toHaveLength(2);
    
    const conflicts = elementConflicts.map(c => c.character);
    expect(conflicts).toContain('賢');
    expect(conflicts).toContain('星');
    
    // 모든 충돌이 pending 상태인지 확인
    elementConflicts.forEach(conflict => {
      expect(conflict.status).toBe('pending');
      expect(conflict.priority).toBe('high');
    });
  });
});