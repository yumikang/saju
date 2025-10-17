# 📚 사주 작명 플랫폼 문서 구조

**최종 업데이트**: 2025-10-17

## 📂 폴더 구조

```
/
├── claudedocs/              # 최신 기술 문서
│   └── 00_DOCUMENTATION_INDEX.md    # ⭐ 시작점
├── docs/                    # 유지 관리 문서
│   ├── QUICK_START.md
│   ├── EXECUTIVE_SUMMARY.md
│   └── ...
├── legacy/                  # 레거시 문서 (참고용)
│   ├── prd.md
│   ├── prd2.md
│   └── ...
├── README.md               # 프로젝트 README
└── README_DOCS.md          # 이 파일
```

## 🚀 빠른 시작

1. **문서 인덱스 확인**:
   ```bash
   cat claudedocs/00_DOCUMENTATION_INDEX.md
   ```

2. **역할별 추천 문서**:
   - 신규 팀원: `docs/QUICK_START.md` → `claudedocs/00_DOCUMENTATION_INDEX.md`
   - 개발자: `claudedocs/00_DOCUMENTATION_INDEX.md` 참고
   - PM: `docs/EXECUTIVE_SUMMARY.md` → `claudedocs/00_DOCUMENTATION_INDEX.md`

3. **웹에서 보기**:
   ```bash
   # VS Code에서
   code claudedocs/00_DOCUMENTATION_INDEX.md
   
   # 브라우저에서 (Markdown 뷰어 필요)
   open claudedocs/00_DOCUMENTATION_INDEX.md
   ```

## 📋 문서 분류

### 🟢 최신 문서 (`/claudedocs/`)
프로젝트의 최신 기술 문서가 있는 곳입니다.
- `00_DOCUMENTATION_INDEX.md` - 모든 문서의 인덱스

### 🔵 유지 관리 문서 (`/docs/`)
빠른 참조 및 운영 가이드가 있는 곳입니다.
- `QUICK_START.md` - 빠른 시작 가이드
- `EXECUTIVE_SUMMARY.md` - 경영진 요약
- `DNS_SETUP.md`, `VPS_SETUP.md` - 인프라 설정

### ⚫ 레거시 문서 (`/legacy/`)
이전 PRD 및 설계 문서 (참고용)
- 삭제하지 마세요 - 의사결정 과정 추적용

## ✅ 문서 정리 완료 사항

- [x] 레거시 문서 → `/legacy/` 이동
- [x] 유지 관리 문서 → `/docs/` 이동
- [x] 문서 인덱스 생성 (`00_DOCUMENTATION_INDEX.md`)
- [x] 문서 구조 README 작성

## 🎯 다음 단계

새로운 문서 작성 시:
1. `/claudedocs/` 폴더에 `01-08` 번호로 작성
2. `00_DOCUMENTATION_INDEX.md`에 링크 추가
3. 레거시 문서는 참고만 하고 수정하지 않음

---

**작성**: 2025-10-17
**담당**: Documentation Team
