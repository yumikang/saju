# 🚀 Quick Start: 한자 데이터 개선 프로젝트

## 현황 (Oct 17, 2025)

```bash
npx tsx scripts/etl/check-db-stats.ts
```

```
총 8,787개 한자
├─ 성별 분류: 24개 (0.27%) ❌ → 100% 필요
├─ 인기도 데이터: 0개 (0%) ❌ → 100% 필요
└─ 부정적 필터: 52개 (0.59%) ⚠️ → 2-3% 권장
```

---

## 📋 체크리스트 (4주 계획)

### Week 1: 성별 분류
- [ ] 데이터 디렉토리 생성
- [ ] tier1-explicit.json 작성 (200자)
- [ ] 2024 신생아 통계 수집
- [ ] 85_classify_gender.ts 구현
- [ ] 86_validate_*.ts 구현
- [ ] 87_update_gender_data.ts 구현
- [ ] 데이터베이스 업데이트
- [ ] 검증 (목표: 90%+ 정확도)

### Week 2-3: 인기도 점수
- [ ] newborn-names-2024.json 수집
- [ ] 88_collect_newborn_stats.ts 구현
- [ ] 89_update_name_frequency.ts 구현
- [ ] 빈도 계산 (0-10,000 범위)
- [ ] 데이터베이스 업데이트
- [ ] API 통합 (정렬 기본값 변경)
- [ ] 검증

### Week 4: 부정적 필터 확장
- [ ] categories.json 작성 (150-200자)
- [ ] 90_expand_negative_characters.ts 구현
- [ ] 91_validate_*.ts 구현
- [ ] 데이터베이스 업데이트
- [ ] 전문가 리뷰
- [ ] 최종 통합 테스트

---

## 💻 명령어 모음

### 1. 초기 설정
```bash
# 디렉토리 생성
mkdir -p data/{gender-classification,popularity,negative-characters}

# 현재 상태 확인
npx tsx scripts/etl/check-db-stats.ts
```

### 2. Phase 1: 성별 분류
```bash
# tier1-explicit.json 작성 (수동)
cat > data/gender-classification/tier1-explicit.json << 'EOF'
{
  "male": ["雄", "男", "夫", "父", "兄", "弟", "公", "侯", "將", "帥", "武", "伯"],
  "female": ["淑", "姬", "娥", "妍", "嬪", "姸", "娟", "妃", "姝", "媛", "婉", "嬌"]
}
EOF

# 분류 실행
npx tsx scripts/etl/85_classify_gender.ts
npx tsx scripts/etl/86_validate_gender_classification.ts
npx tsx scripts/etl/87_update_gender_data.ts

# 결과 확인
npx tsx scripts/etl/check-db-stats.ts
```

### 3. Phase 2: 인기도 점수
```bash
# newborn-names-2024.json 작성 (수동 또는 스크래핑)
# 템플릿: /claudedocs/3-phase-data-enhancement-plan.md 참고

# 빈도 계산
npx tsx scripts/etl/88_collect_newborn_stats.ts

# 데이터베이스 업데이트
npx tsx scripts/etl/89_update_name_frequency.ts

# 결과 확인
npx tsx scripts/etl/check-db-stats.ts
```

### 4. Phase 3: 부정적 필터
```bash
# categories.json 작성 (수동)
# 템플릿: /claudedocs/3-phase-data-enhancement-plan.md 참고

# 업데이트
npx tsx scripts/etl/90_expand_negative_characters.ts
npx tsx scripts/etl/91_validate_negative_characters.ts

# 결과 확인
npx tsx scripts/etl/check-db-stats.ts
```

### 5. API 테스트
```bash
# 성별 필터 테스트
curl "http://localhost:3000/api/hanja/search?gender=male&limit=10"

# 인기도 정렬 테스트
curl "http://localhost:3000/api/hanja/search?sortBy=popularity&limit=10"

# 복합 필터 테스트
curl "http://localhost:3000/api/hanja/search?element=FIRE&gender=female&limit=20"
```

---

## 📚 문서 위치

| 문서 | 용도 | 위치 |
|------|------|------|
| **Executive Summary** | 프로젝트 개요 (2페이지) | `/EXECUTIVE_SUMMARY.md` |
| **Quick Roadmap** | 빠른 실행 가이드 (4페이지) | `/claudedocs/IMPLEMENTATION_ROADMAP.md` |
| **Detailed Plan** | 상세 기술 문서 (70페이지) | `/claudedocs/3-phase-data-enhancement-plan.md` |
| **Script Guide** | ETL 스크립트 가이드 | `/scripts/etl/README-DATA-ENHANCEMENT.md` |
| **DB Stats** | 현황 체크 스크립트 | `/scripts/etl/check-db-stats.ts` |

---

## 🎯 성공 지표

### 정량적
- ✅ 성별 분류: 0.27% → **100%**
- ✅ 인기도 데이터: 0% → **100%**
- ✅ 부정적 필터: 0.59% → **2-3%**
- ✅ API 응답시간: **< 200ms** (p95)

### 정성적
- ✅ 분류 정확도: **90%+**
- ✅ 사용자 만족도: **8.5/10**
- ✅ 전문가 리뷰: **85%+**

---

## 🚨 주의사항

### ✅ 안전
- **스키마 변경 없음** (기존 필드 사용)
- **배치 처리** (100개/트랜잭션)
- **롤백 가능** (데이터만 변경)
- **서비스 무중단**

### ⚠️ 리스크
1. **데이터 소스 부재** → 수동 데이터셋 대비
2. **분류 정확도** → 10% 샘플 검증
3. **성능 저하** → 인덱싱 최적화

---

## 🔗 외부 리소스

- 행정안전부: https://www.mois.go.kr
- 통계청: https://kostat.go.kr
- 대법원 인명용 한자: https://www.scourt.go.kr

---

## 📞 지원

- **기술 문서**: `/claudedocs/` 디렉토리
- **스크립트**: `/scripts/etl/` 디렉토리
- **테스트**: `/scripts/etl/__tests__/` 디렉토리

---

## 🎉 시작하기

```bash
# 1. 현재 상태 확인
npx tsx scripts/etl/check-db-stats.ts

# 2. 상세 계획 열기
open claudedocs/3-phase-data-enhancement-plan.md

# 3. 디렉토리 생성
mkdir -p data/{gender-classification,popularity,negative-characters}

# 4. Week 1 시작
# → tier1-explicit.json 작성
# → 스크립트 구현 시작
```

---

**Last Updated**: Oct 17, 2025
**Status**: Ready to Start
**Estimated Time**: 4 weeks
**Difficulty**: Medium
**Impact**: High
