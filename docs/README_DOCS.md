# 📚 사주 작명 플랫폼 문서 구조

**최종 업데이트**: 2025-11-18

## 📂 폴더 구조

```
/
├── README.md                # 프로젝트 메인 README
└── docs/                    # 모든 문서
    ├── README_DOCS.md      # 이 파일 - 문서 구조 안내
    │
    ├── freemium-v2/        # 프리미엄 V2 구현 문서
    │   ├── FREEMIUM_V2_INDEX.md                  # ⭐ 시작점
    │   ├── EXECUTIVE_SUMMARY.md                  # 경영진 요약
    │   ├── README_FREEMIUM_V2.md                 # 프로젝트 개요
    │   ├── FREEMIUM_V2_IMPLEMENTATION_PLAN.md    # 상세 기술 명세
    │   ├── TASK_BREAKDOWN_SUMMARY.md             # 작업 분해 요약
    │   └── IMPLEMENTATION_WORKFLOW.md            # 구현 워크플로우
    │
    ├── surname-protection/  # 성씨 보호 분석 문서
    │   ├── SURNAME_PROTECTION_REPORT.md          # 전체 분석 보고서
    │   ├── SURNAME_IMPLEMENTATION_GUIDE.md       # 구현 가이드
    │   └── SURNAME_ANALYSIS_SUMMARY.md           # 분석 요약
    │
    ├── hanja-analysis/      # 한자 데이터 분석 문서
    │   ├── DATA_ENHANCEMENT_INDEX.md             # 데이터 개선 인덱스
    │   ├── HANJA_DATA_IMPROVEMENT_PLAN.md        # 개선 계획
    │   ├── negative-hanja-*.md                   # 부적 한자 관련 문서
    │   └── hanja-*.md                            # 한자 분석 문서
    │
    ├── team/                # 팀 협업 문서
    │   ├── ONBOARDING.md                         # 팀원 온보딩 가이드
    │   ├── QUICK_START.md                        # 빠른 시작 가이드
    │   ├── PROJECT_MANUAL.md                     # 프로젝트 매뉴얼
    │   ├── CHANGELOG.md                          # 변경 이력
    │   ├── development-progress.md               # 개발 진행 상황
    │   └── remix-navigation-guidelines.md        # Remix 네비게이션 가이드
    │
    └── operations/          # 운영 및 배포 문서
        ├── PRODUCTION_SETUP.md                   # 프로덕션 환경 설정
        ├── VPS_SETUP.md                          # VPS 서버 설정
        ├── DNS_SETUP.md                          # DNS 설정
        ├── ADMIN_DASHBOARD_SETUP.md              # 관리자 대시보드 설정
        └── POSTGRESQL_MIGRATION_COMPLETE.md      # PostgreSQL 마이그레이션
```

## 🚀 빠른 시작

### 신규 팀원이라면
1. **[team/ONBOARDING.md](./team/ONBOARDING.md)** → 개발 환경 설정
2. **[team/QUICK_START.md](./team/QUICK_START.md)** → 빠른 시작 가이드
3. **[team/PROJECT_MANUAL.md](./team/PROJECT_MANUAL.md)** → 프로젝트 구조 이해

### 프리미엄 V2 구현 중이라면
1. **[freemium-v2/FREEMIUM_V2_INDEX.md](./freemium-v2/FREEMIUM_V2_INDEX.md)** → 역할별 문서 가이드
2. 개발자: **[freemium-v2/TASK_BREAKDOWN_SUMMARY.md](./freemium-v2/TASK_BREAKDOWN_SUMMARY.md)**
3. 비즈니스: **[freemium-v2/EXECUTIVE_SUMMARY.md](./freemium-v2/EXECUTIVE_SUMMARY.md)**

### 배포하려면
1. **[operations/PRODUCTION_SETUP.md](./operations/PRODUCTION_SETUP.md)** → 프로덕션 환경 설정
2. **[operations/VPS_SETUP.md](./operations/VPS_SETUP.md)** → VPS 서버 설정
3. **[operations/DNS_SETUP.md](./operations/DNS_SETUP.md)** → DNS 설정

## 📋 문서 분류

### 🟢 프리미엄 V2 문서 (`freemium-v2/`)
개명 및 사주 궁합 서비스의 프리미엄 결제 기능 구현 문서

**주요 문서:**
- 📍 **FREEMIUM_V2_INDEX.md** - 역할별 문서 안내 (시작점)
- 💼 **EXECUTIVE_SUMMARY.md** - 비즈니스 케이스 및 ROI
- 📖 **README_FREEMIUM_V2.md** - 프로젝트 개요
- 🔧 **FREEMIUM_V2_IMPLEMENTATION_PLAN.md** - 상세 기술 명세서
- ✅ **TASK_BREAKDOWN_SUMMARY.md** - 실행 가능한 작업 목록
- 📊 **IMPLEMENTATION_WORKFLOW.md** - 시각적 워크플로우

### 🔵 성씨 보호 문서 (`surname-protection/`)
한국 성씨 132개를 이름 생성에서 제외하는 기능 분석 및 구현

**주요 문서:**
- 📄 **SURNAME_PROTECTION_REPORT.md** - 전체 분석 보고서 (60페이지)
- ⚡ **SURNAME_IMPLEMENTATION_GUIDE.md** - 30분 구현 가이드
- 📊 **SURNAME_ANALYSIS_SUMMARY.md** - 경영진 요약

### 🟡 한자 분석 문서 (`hanja-analysis/`)
한자 데이터베이스 품질 개선 및 부적 한자 필터링 관련 문서

**주요 문서:**
- 📍 **DATA_ENHANCEMENT_INDEX.md** - 데이터 개선 인덱스
- 📋 **HANJA_DATA_IMPROVEMENT_PLAN.md** - 개선 계획
- ⚠️ **negative-hanja-*.md** - 부적 한자 필터링 문서

### 🟣 팀 협업 문서 (`team/`)
팀원 온보딩, 개발 가이드, 프로젝트 진행 상황

**주요 문서:**
- 👥 **ONBOARDING.md** - 신규 팀원 온보딩 가이드 (필독!)
- 🚀 **QUICK_START.md** - 빠른 시작 가이드
- 📖 **PROJECT_MANUAL.md** - 프로젝트 매뉴얼
- 📝 **CHANGELOG.md** - 변경 이력

### 🔴 운영 문서 (`operations/`)
프로덕션 배포, 서버 설정, 인프라 관리

**주요 문서:**
- 🚀 **PRODUCTION_SETUP.md** - 프로덕션 환경 설정
- 🖥️ **VPS_SETUP.md** - VPS 서버 설정
- 🌐 **DNS_SETUP.md** - DNS 및 도메인 설정
- 👨‍💼 **ADMIN_DASHBOARD_SETUP.md** - 관리자 대시보드

## ✅ 문서 정리 완료 사항

- [x] 불필요한 SETUP.md 삭제
- [x] 중복 EXECUTIVE_SUMMARY.md 제거
- [x] 주제별로 서브폴더 생성 및 그룹화
- [x] 프리미엄 V2 문서 → `freemium-v2/`
- [x] 성씨 보호 문서 → `surname-protection/`
- [x] 한자 분석 문서 → `hanja-analysis/`
- [x] 팀 협업 문서 → `team/`
- [x] 운영 문서 → `operations/`

## 🎯 문서 작성 가이드

### 새로운 문서 작성 시

1. **적절한 폴더 선택**
   - 프리미엄 기능 → `freemium-v2/`
   - 한자 데이터 → `hanja-analysis/`
   - 팀 가이드 → `team/`
   - 배포/운영 → `operations/`

2. **명확한 파일명 사용**
   - 대문자 사용 (예: `README.md`)
   - 언더스코어 또는 하이픈 (예: `FEATURE_NAME.md` 또는 `feature-name.md`)
   - 명확한 목적 표시

3. **문서 헤더 포함**
   ```markdown
   # 문서 제목

   **작성일**: YYYY-MM-DD
   **작성자**: 이름
   **상태**: 초안/검토중/완료
   ```

## 🔍 문서 검색

### 주제별 빠른 찾기

**프리미엄 결제 구현?**
→ `docs/freemium-v2/FREEMIUM_V2_INDEX.md`

**성씨 필터링?**
→ `docs/surname-protection/SURNAME_IMPLEMENTATION_GUIDE.md`

**신규 팀원 온보딩?**
→ `docs/team/ONBOARDING.md`

**서버 배포?**
→ `docs/operations/PRODUCTION_SETUP.md`

**한자 데이터 문제?**
→ `docs/hanja-analysis/DATA_ENHANCEMENT_INDEX.md`

## 📞 문서 관련 문의

**문서 오류 발견**: GitHub Issues에 보고
**새 문서 추가 제안**: 팀 리더에게 문의
**문서 구조 개선**: Pull Request로 제안

---

**최종 정리일**: 2025-11-18
**담당**: Documentation Team
**버전**: 2.0
