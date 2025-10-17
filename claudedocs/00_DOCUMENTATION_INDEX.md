# 📚 사주 작명 플랫폼 문서 인덱스

**최종 업데이트**: 2025-10-17
**프로젝트 상태**: v1.0 Production Ready
**문서 버전**: 2.0

---

## 🎯 문서 읽기 가이드

### 👥 역할별 추천 문서

#### 1️⃣ 신규 팀원 / 처음 시작하는 분
```
QUICK_START.md
→ 00_DOCUMENTATION_INDEX.md (이 파일)
→ 01_PROJECT_OVERVIEW.md
→ 02_TECH_STACK.md
```

#### 2️⃣ 프로덕트 매니저 / 경영진
```
01_PROJECT_OVERVIEW.md
→ EXECUTIVE_SUMMARY.md (한자 데이터 개선 프로젝트)
→ 03_FEATURE_SPECIFICATIONS.md
```

#### 3️⃣ 백엔드 개발자
```
02_TECH_STACK.md
→ 04_SAJU_ALGORITHM.md
→ 05_HANJA_DATABASE.md
→ 06_API_SPECIFICATIONS.md
```

#### 4️⃣ 프론트엔드 개발자
```
02_TECH_STACK.md
→ 03_FEATURE_SPECIFICATIONS.md
→ 06_API_SPECIFICATIONS.md
```

#### 5️⃣ 데브옵스 / 인프라
```
07_DEPLOYMENT.md
→ DNS_SETUP.md
→ VPS_SETUP.md
```

#### 6️⃣ 데이터 엔지니어
```
05_HANJA_DATABASE.md
→ 08_DATA_ENHANCEMENT_PLAN.md
→ DATA_ENHANCEMENT_INDEX.md
→ IMPLEMENTATION_ROADMAP.md
```

---

## 📂 문서 분류 및 설명

### 🟢 **Phase 1: 프로젝트 이해 (필수)**

| 파일명 | 설명 | 독자 | 길이 |
|--------|------|------|------|
| `QUICK_START.md` | ⭐ 시작 가이드 | 모든 팀원 | 2페이지 |
| `00_DOCUMENTATION_INDEX.md` | 📚 이 파일 - 문서 네비게이션 | 모든 팀원 | 3페이지 |
| `01_PROJECT_OVERVIEW.md` | 🎯 프로젝트 개요 및 비전 | 모든 팀원 | 5페이지 |
| `02_TECH_STACK.md` | 🛠️ 기술 스택 상세 | 개발자 | 4페이지 |

### 🟡 **Phase 2: 기능 및 API (개발 필수)**

| 파일명 | 설명 | 독자 | 길이 |
|--------|------|------|------|
| `03_FEATURE_SPECIFICATIONS.md` | 📋 기능 명세서 | PM, 개발자 | 10페이지 |
| `04_SAJU_ALGORITHM.md` | 🔮 사주 계산 알고리즘 | 백엔드 개발자 | 15페이지 |
| `05_HANJA_DATABASE.md` | 📚 한자 DB 설계 및 관리 | 백엔드, 데이터 | 12페이지 |
| `06_API_SPECIFICATIONS.md` | 🌐 API 문서 | 풀스택 개발자 | 8페이지 |

### 🔵 **Phase 3: 인프라 및 배포**

| 파일명 | 설명 | 독자 | 길이 |
|--------|------|------|------|
| `07_DEPLOYMENT.md` | 🚀 배포 가이드 | DevOps | 6페이지 |
| `DNS_SETUP.md` | 🌐 DNS 설정 가이드 | DevOps | 3페이지 |
| `VPS_SETUP.md` | 🖥️ VPS 서버 설정 | DevOps | 8페이지 |

### 🟣 **Phase 4: 데이터 개선 프로젝트**

| 파일명 | 설명 | 독자 | 길이 |
|--------|------|------|------|
| `DATA_ENHANCEMENT_INDEX.md` | 📑 데이터 개선 인덱스 | 데이터 팀 | 3페이지 |
| `EXECUTIVE_SUMMARY.md` | 📊 개선 프로젝트 요약 | 경영진, PM | 2페이지 |
| `08_DATA_ENHANCEMENT_PLAN.md` | 📈 3단계 개선 계획 (상세) | 데이터 엔지니어 | 70페이지 |
| `IMPLEMENTATION_ROADMAP.md` | 🗺️ 실행 로드맵 | 데이터 팀 | 4페이지 |

### ⚫ **Phase 5: 레거시 문서 (참고용)**

| 파일명 | 설명 | 상태 | 비고 |
|--------|------|------|------|
| `prd.md` | 초기 PRD | 🟡 참고용 | 최신: `01_PROJECT_OVERVIEW.md` |
| `prd2.md` | Remix 기반 PRD | 🟡 참고용 | 최신: `02_TECH_STACK.md` |
| `prd3.md` | 한자 DB 로드맵 | 🟡 참고용 | 최신: `08_DATA_ENHANCEMENT_PLAN.md` |
| `logic-prd.md` | 사주 로직 구현 | 🟡 참고용 | 최신: `04_SAJU_ALGORITHM.md` |
| `prd_datebase.md` | DB 설계 문서 | 🟡 참고용 | 최신: `05_HANJA_DATABASE.md` |
| `PRD_UPGRADE_2025.md` | 2025 업그레이드 계획 | 🟡 참고용 | 대부분 완료됨 |
| `contracts.md` | 데이터 규칙 | 🟡 참고용 | 통합: `05_HANJA_DATABASE.md` |
| `1_step_prd.md` | 1단계 MVP 로드맵 | 🟡 참고용 | 통합: `08_DATA_ENHANCEMENT_PLAN.md` |

---

## 🚀 빠른 작업 가이드

### ✅ 로컬 개발 환경 시작
```bash
# 1. 환경 확인
cat QUICK_START.md

# 2. 개발 서버 실행
npm run dev

# 3. 문서 열기
open claudedocs/00_DOCUMENTATION_INDEX.md
```

### 🔧 새로운 기능 개발
```bash
# 1. 기능 명세 확인
open claudedocs/03_FEATURE_SPECIFICATIONS.md

# 2. API 스펙 확인
open claudedocs/06_API_SPECIFICATIONS.md

# 3. 개발 시작
git checkout -b feature/your-feature
```

### 📊 데이터 개선 작업
```bash
# 1. 현황 확인
npx tsx scripts/etl/check-db-stats.ts

# 2. 개선 계획 확인
open claudedocs/08_DATA_ENHANCEMENT_PLAN.md

# 3. 로드맵 확인
open claudedocs/IMPLEMENTATION_ROADMAP.md
```

### 🚢 배포 작업
```bash
# 1. 배포 가이드 확인
open claudedocs/07_DEPLOYMENT.md

# 2. DNS 설정 (필요시)
open claudedocs/DNS_SETUP.md

# 3. VPS 설정 (필요시)
open claudedocs/VPS_SETUP.md
```

---

## 📊 문서 현황 요약

### ✅ 최신 문서 (사용 권장)
**위치**: `/claudedocs/`
- `00_DOCUMENTATION_INDEX.md` - 이 파일
- `01_PROJECT_OVERVIEW.md` - 프로젝트 개요 (작성 예정)
- `02_TECH_STACK.md` - 기술 스택 (작성 예정)
- `03_FEATURE_SPECIFICATIONS.md` - 기능 명세 (작성 예정)
- `04_SAJU_ALGORITHM.md` - 사주 알고리즘 (작성 예정)
- `05_HANJA_DATABASE.md` - 한자 DB 설계 (작성 예정)
- `06_API_SPECIFICATIONS.md` - API 문서 (작성 예정)
- `07_DEPLOYMENT.md` - 배포 가이드 (작성 예정)
- `08_DATA_ENHANCEMENT_PLAN.md` - 데이터 개선 계획 (작성 예정)

### 🔄 유지 관리 문서
**위치**: `/docs/`
- `QUICK_START.md` - 빠른 시작 가이드
- `DATA_ENHANCEMENT_INDEX.md` - 데이터 개선 인덱스
- `EXECUTIVE_SUMMARY.md` - 경영진 요약
- `IMPLEMENTATION_ROADMAP.md` - 실행 로드맵
- `DNS_SETUP.md` - DNS 설정
- `VPS_SETUP.md` - VPS 설정

### 🗄️ 레거시 문서 (참고용)
**위치**: `/legacy/`
- `prd.md`, `prd2.md`, `prd3.md` - 초기 PRD 문서
- `logic-prd.md` - 사주 로직 구현 가이드
- `prd_datebase.md` - DB 설계 문서
- `PRD_UPGRADE_2025.md` - 2025 업그레이드 계획
- `contracts.md` - 데이터 규칙
- `1_step_prd.md` - 1단계 MVP 로드맵

---

## 🎓 학습 경로

### 초급 (1-2주)
1. QUICK_START.md
2. 01_PROJECT_OVERVIEW.md
3. 02_TECH_STACK.md
4. 03_FEATURE_SPECIFICATIONS.md

### 중급 (2-4주)
1. 04_SAJU_ALGORITHM.md
2. 05_HANJA_DATABASE.md
3. 06_API_SPECIFICATIONS.md
4. 08_DATA_ENHANCEMENT_PLAN.md

### 고급 (1개월+)
1. 전체 코드베이스 이해
2. 데이터 개선 프로젝트 참여
3. 새로운 기능 설계 및 구현
4. 성능 최적화 및 스케일링

---

## 📝 문서 작성 규칙

### 파일명 규칙
- 핵심 문서: `00-99_TITLE.md` (번호로 정렬)
- 보조 문서: `TITLE_NAME.md` (대문자)
- 레거시: `title.md` or `title2.md` (소문자)

### 마크다운 규칙
- 헤딩: `#` (H1), `##` (H2), `###` (H3)
- 강조: **굵게**, *기울임*
- 코드: `` `inline` ``, ` ```block``` `
- 링크: `[텍스트](URL)`
- 이모지: 섹션 구분 및 강조

### 업데이트 규칙
- 문서 상단에 "최종 업데이트" 날짜 명시
- 버전 변경 시 CHANGELOG 섹션 추가
- 레거시 문서 삭제 금지 (참고용 보관)

---

## 🔗 외부 리소스

### 공식 문서
- [Remix Framework](https://remix.run/docs)
- [Prisma ORM](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

### 도메인 지식
- [행정안전부 (신생아 통계)](https://www.mois.go.kr)
- [통계청 (인구동향)](https://kostat.go.kr)
- [대법원 (인명용 한자)](https://www.scourt.go.kr)

### 인프라
- [Vercel 배포 가이드](https://vercel.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)

---

## 🆘 도움이 필요하신가요?

### 문서 관련 질문
1. **어떤 문서를 읽어야 할까요?**
   - 위의 "역할별 추천 문서" 섹션 참고

2. **최신 정보는 어디에 있나요?**
   - `00-99_` 번호가 붙은 문서가 최신입니다

3. **레거시 문서는 왜 남겨두나요?**
   - 이전 의사결정 과정과 맥락을 이해하기 위함입니다

### 기술 질문
1. **개발 환경 설정**: `QUICK_START.md` 참고
2. **API 사용법**: `06_API_SPECIFICATIONS.md` 참고
3. **배포 문제**: `07_DEPLOYMENT.md` 참고

---

## ✅ 체크리스트: 문서 정리 완료

- [x] 모든 문서 읽기 및 분석
- [x] 문서 분류 체계 수립
- [x] 최신 문서 vs 레거시 문서 구분
- [x] 역할별 추천 독서 경로 작성
- [x] 빠른 참조 가이드 작성
- [x] 문서 인덱스 파일 생성
- [ ] 레거시 문서를 `/legacy/` 폴더로 이동 (선택사항)
- [ ] 새 문서 8개 작성 (진행 중)

---

**다음 단계**: 레거시 문서를 통합하여 최신 문서 8개 작성

**작성자**: AI Assistant
**리뷰어**: Product Owner, Tech Lead
**승인 상태**: Draft → Review Needed
