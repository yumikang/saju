좋아요! 아래는 **「작명/개명 서비스 기획 의사결정 PRD」**를 텍스트 형식으로 정리한 버전입니다. Notion, 문서 편집기, GitHub 등에 그대로 붙여넣어 사용하시면 됩니다.

⸻

작명/개명 서비스 기획 의사결정 PRD

1. 프로젝트 개요
	•	빠르게 서비스를 출시할 수 있는 작명/개명 MVP 버전을 우선 구축
	•	Remix 기반 단일 아키텍처 유지 (Python 도입은 이후 단계 고려)
	•	사주 계산, 점수화, 대운/세운, 궁합 등은 후속 단계에서 점진적 확장
	•	Supabase를 중심으로 한자 DB 구성, 태깅 시스템, 기본 추천 알고리즘 우선 적용

⸻

2. 현재 구조 vs PRD 제안 비교

항목	현재 구현 (MVP)	logic-prd 제안안
백엔드	Remix 내부에서 처리	Python FastAPI 별도 구성
사주 계산	간단한 모의값 사용	실제 절기·천간지지·오행 분석 기반
데이터베이스	500자 수준 Supabase	5,000자 이상 검수 완료 한자 DB
아키텍처	단일 앱 (Remix + Supabase)	프론트 + FastAPI 마이크로서비스 분리
기능 범위	작명/개명 + 추천 이름	작명/개명 + 사주 분석 + 궁합 + 캘리
배포 구조	Vercel 단독	Docker + Railway + Redis


⸻

3. 의사결정 요약
	•	✅ 현재는 MVP 구조로 간단하게 구축하고, 시장에 빠르게 런칭하는 것이 목적
	•	✅ Supabase 환경에서 한자 데이터를 먼저 구축 및 테스트
	•	✅ 결제 시스템(Stripe 등)은 MVP 단계부터 적용 준비
	•	✅ Python FastAPI는 실제 사주 계산 로직을 구현할 필요가 생기면 도입
	•	✅ 복잡한 점수화/궁합/대운은 추후 기능 확장 시 적용

⸻

4. 향후 확장 전략
	1.	사주 계산 엔진 (Python) → 모듈화 도입
	2.	이름 점수화 알고리즘 적용 (오행/음양/획수 등)
	3.	한자 DB 5,000자 구축 완료
	4.	작명 외 기능 확장 (개명, 궁합, 캘리그라피 등)
	5.	API 모듈을 기준으로 마이크로서비스 분할

⸻

5. 현재 구조 파일 예시

/apps
  └── remix-app/
        └── routes/naming-simple.tsx
        └── routes/renaming-simple.tsx
        └── services/naming.service.ts
        └── api/supabase.ts
        └── components/NameCard.tsx
        └── .env (Supabase 환경 변수)

/data
        └── hanja-dictionary.json
        └── hanja-score-rules.yaml

/docs
        └── DECISION_LOG.txt (본 문서)
        └── logic-prd.md


⸻

6. 결론

MVP 단계에서는 빠르게 핵심 작명/개명 기능만 구현하여 시장에 출시하고,
실제 사용자 반응을 기반으로 Python 기반 사주 분석 및 점수화 시스템을
후속 단계에서 점진적으로 도입하는 전략을 채택한다.
