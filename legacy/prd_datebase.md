
A. 현실 체크 (중요)
	•	Unihan(유니한): 부수/획수/독음/지역별 변형 같은 형태·코드 정보는 제공하지만 오행 정보는 제공하지 않습니다.
	•	KS X 1001: 문자 집합/부호화 표준이지 오행 근거는 없음.
	•	즉, 오행은 전통 문헌·성명학/역학 자료나 **내부 규칙(수리/음운/어원 해석)**에서 근거를 세워야 합니다.
	•	그래서 **출처(provenance)**와 결정 로직을 데이터로 남겨야 “왜 이렇게 결정했는가”가 추적됩니다.

B. 지금 당장 돌릴 수 있는 “임시 운영 정책”
	1.	권위 소스 비어있을 때의 기본 룰(Temporary Resolution Policy v1)
	•	동일 문자 충돌 시 다음 순서로 임시 결정:
	1.	stroke-based element(수리오행 규칙)와 sound-based element(음운오행) 합의점이 있으면 그 값 채택
	2.	없으면 기존(base) 값을 유지, review='needs_review' 플래그
	3.	설명문/노출에는 오행 직접 표기 마스킹(“오행 조화형” 등 중립 문구)
	•	언제든 권위 소스가 들어오면 자동 재결정(recompute)
	2.	賢/星 임시 처리
	•	賢: base=목, expanded=금 → base 유지=‘목’ + needs_review
	•	星: base=화, expanded=금 → base 유지=‘화’ + needs_review
	•	점수 계산에는 반영하되, UI 표기는 마스킹.

⸻

C. 스키마(Prisma) 확장 — 근거·리뷰·버전 추적

enum ReviewStatus {
  ok
  needs_review
}

model HanjaDict {
  id            Int       @id @default(autoincrement())
  character     String    @unique
  element       String?   // '金木水火土'
  yinYang       String?   // '음'|'양'
  strokes       Int?
  // ...
  review        ReviewStatus @default(ok)
  evidenceScore Int?      // 0~100 (근거 누적 점수)
  evidenceJSON  String?   // [{source:"...", weight:.., note:"..."}]
  decidedBy     String?   // "base", "expanded", "strokeRule", "soundRule", "manual"
  ruleset       String?   // ex) "RULESET_V2_2025_08"
  updatedAt     DateTime  @updatedAt
}

포인트
	•	evidenceJSON: 각 근거의 배열(출처, 가중치, 코멘트) 저장 → 나중에 대치 가능
	•	decidedBy: 어떤 메커니즘으로 최종 결정했는지 기록
	•	review: 노출/UX에서 마스킹/표시용

⸻

D. 충돌 리졸버(코드 골격)

type Element = '金'|'木'|'水'|'火'|'土';

interface Evidence {
  source: string;         // "base" | "expanded" | "strokeRule" | "soundRule" | "Kangxi" ...
  weight: number;         // 0~1
  suggested: Element;
  note?: string;
}

interface ResolveInput {
  character: string;
  base?: Element;
  expanded?: Element;
  strokeRule?: Element;  // getStrokeElement(...)
  soundRule?: Element;   // getSoundElement(...)
}

export function resolveElement(input: ResolveInput) {
  const ev: Evidence[] = [];

  if (input.base)     ev.push({ source: 'base',     weight: 0.4, suggested: input.base });
  if (input.expanded) ev.push({ source: 'expanded', weight: 0.4, suggested: input.expanded });
  if (input.strokeRule) ev.push({ source: 'strokeRule', weight: 0.3, suggested: input.strokeRule });
  if (input.soundRule)  ev.push({ source: 'soundRule',  weight: 0.3, suggested: input.soundRule });

  // 임시 정책 v1: 합의가 있으면 그 값 채택
  const byElem = new Map<Element, number>();
  for (const e of ev) byElem.set(e.suggested, (byElem.get(e.suggested) ?? 0) + e.weight);

  // 최고 득표
  const ranked = [...byElem.entries()].sort((a,b)=>b[1]-a[1]);
  const top = ranked[0];

  // 동점/근거 약함 등 조건 판단
  let review: 'ok'|'needs_review' = 'ok';
  if (!top || ranked.length > 1 && ranked[0][1] === ranked[1][1]) review = 'needs_review';
  if ((top?.[1] ?? 0) < 0.5) review = 'needs_review';

  // 근거 점수(0~100)로 저장
  const evidenceScore = Math.round((top?.[1] ?? 0) * 100);

  // 최종 element (없으면 base 우선 폴백)
  const element: Element | undefined = top?.[0] ?? input.base ?? input.expanded;
  return {
    element,
    review,
    decidedBy: review === 'ok' ? 'auto' : 'base', // 임시
    evidenceScore,
    evidenceJSON: JSON.stringify(ev),
  };
}

	•	가중치는 임시값. 실제 권위 소스 들어오면 source→weight 테이블에서 가중조정.
	•	리뷰가 필요한 상태면 review='needs_review'로 저장하고, UI에서 오행 텍스트 대신 중립 표현 사용.

⸻

E. 리뷰 큐(운영 워크플로)
	1.	배치 감지
	•	SELECT character FROM HanjaDict WHERE review='needs_review' ORDER BY evidenceScore ASC LIMIT 100
	•	가장 애매한 것부터 리뷰 리스트 생성
	2.	리뷰 UI
	•	내부 콘솔: (문자/의미/획수/발음/현재 결정/대안 후보/근거 로그) + 원클릭 확정
	•	확정 시: review='ok', decidedBy='manual', evidenceJSON에 코멘트 추가
	3.	노출 정책
	•	needs_review 상태 문자는 사용자 설명에서 오행 직접 표기 생략, “균형형/조화형” 같은 안전한 문구 사용
	•	점수 계산은 유지(사용자 경험 상 일관성)

⸻

F. 권위 소스 ETL(데이터 들어오는 즉시 결합)
	•	Unihan: kTotalStrokes, kRSKangXi, kCangjie, kDefinition 등 형태·해석은 보강 가능(오행은 없음)
	•	Kangxi/전통 자료: 내부 리서치로 오행 맵핑 테이블을 만들면 **source=‘Kangxi’**로 증거 추가
	•	국립국어원/표준국어대사전: 독음/용례 보강 → soundRule·독음 검증 강화
	•	사주/성명학 문헌: 내부 룰테이블화 → source 가중치 상향

들어온 순간 resolveElement를 재실행해서 review → ok로 자동 전환.

⸻

G. 테스트 & 회귀 방지 포인트
	•	충돌 목록 스냅샷: needs_review 개수/목록이 갑자기 늘면 CI 경고
	•	결정성: 같은 입력+같은 가중치 테이블 ⇒ 항상 같은 결과
	•	설명 마스킹 테스트: needs_review 문자는 오행 문자열이 렌더링되지 않아야 함

⸻

