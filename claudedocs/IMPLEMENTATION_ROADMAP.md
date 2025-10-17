# 한자 데이터 개선 실행 로드맵

## 🎯 Quick Start Guide

### Current Status (Oct 17, 2025)
```
총 한자: 8,787개
├─ 성별 분류: 24개 (0.27%) ❌
├─ 인기도 데이터: 0개 (0.00%) ❌
└─ 부정적 필터링: 52개 (0.59%) ⚠️
```

### Target Status (4 Weeks)
```
총 한자: 8,787개
├─ 성별 분류: 8,787개 (100%) ✅
├─ 인기도 데이터: 8,787개 (100%) ✅
└─ 부정적 필터링: 150-200개 (2-3%) ✅
```

---

## 📅 4-Week Implementation Plan

### Week 1: Gender Classification
```bash
# 1. Create data directories
mkdir -p data/gender-classification

# 2. Data collection
# → Manual: Create tier1-explicit.json with 200 explicit gender characters
# → Research: Collect 2024 newborn name statistics

# 3. Run classification
npx tsx scripts/etl/85_classify_gender.ts

# 4. Validate
npx tsx scripts/etl/86_validate_gender_classification.ts

# 5. Update database
npx tsx scripts/etl/87_update_gender_data.ts
```

**Deliverables**:
- ✅ 8,787 characters with gender classification
- ✅ Validation report with 90%+ accuracy
- ✅ Database updated with gender field

### Week 2-3: Popularity Scoring
```bash
# 1. Create data directories
mkdir -p data/popularity

# 2. Collect 2024 newborn name statistics
# → Target: Top 500-1000 most popular names
# → Source: 행정안전부 or manual dataset

# 3. Calculate character frequencies
npx tsx scripts/etl/88_collect_newborn_stats.ts

# 4. Update database
npx tsx scripts/etl/89_update_name_frequency.ts

# 5. Verify
npx tsx scripts/etl/check-db-stats.ts
```

**Deliverables**:
- ✅ Character frequency dataset from 2024 names
- ✅ 8,787 characters with popularity scores (0-10000)
- ✅ API updated to sort by popularity

### Week 4: Enhanced Negative Filtering
```bash
# 1. Create data directories
mkdir -p data/negative-characters

# 2. Define comprehensive negative character list
# → Research: 10 categories, 150-200 characters

# 3. Update database
npx tsx scripts/etl/90_expand_negative_characters.ts

# 4. Validate
npx tsx scripts/etl/91_validate_negative_characters.ts
```

**Deliverables**:
- ✅ 150-200 negative characters identified
- ✅ Categorized by severity (critical/high/medium/low)
- ✅ Database updated with expanded filtering

---

## 🚀 Quick Implementation Commands

### Step 1: Setup (5 minutes)
```bash
# Create directory structure
mkdir -p data/{gender-classification,popularity,negative-characters}

# Verify database connection
npx tsx scripts/etl/check-db-stats.ts
```

### Step 2: Gender Classification (Week 1)
```bash
# Create tier1-explicit.json manually
cat > data/gender-classification/tier1-explicit.json << 'EOF'
{
  "male": ["雄", "男", "夫", "父", "兄", "弟", "公", "侯", "將", "帥", "武", "伯"],
  "female": ["淑", "姬", "娥", "妍", "嬪", "姸", "娟", "妃", "姝", "媛", "婉", "嬌"],
  "reasoning": "Explicit gender-specific characters in Korean naming culture"
}
EOF

# Run classification (creates scripts if needed)
npx tsx scripts/etl/85_classify_gender.ts
npx tsx scripts/etl/87_update_gender_data.ts
```

### Step 3: Popularity Scoring (Week 2-3)
```bash
# Create newborn stats dataset (manual)
# See data/popularity/newborn-names-2024-template.json

# Run frequency calculation
npx tsx scripts/etl/88_collect_newborn_stats.ts
npx tsx scripts/etl/89_update_name_frequency.ts

# Verify results
npx tsx scripts/etl/check-db-stats.ts
```

### Step 4: Negative Filtering (Week 4)
```bash
# Expand negative character list
npx tsx scripts/etl/90_expand_negative_characters.ts

# Validate
npx tsx scripts/etl/91_validate_negative_characters.ts
```

---

## 📊 Data Source Templates

### Template 1: Tier 1 Gender Classification
```json
// data/gender-classification/tier1-explicit.json
{
  "male": [
    "雄", "男", "夫", "父", "子", "兄", "弟", "公", "侯", "將",
    "帥", "武", "伯", "叔", "翁", "郎", "君", "王", "帝"
  ],
  "female": [
    "淑", "姬", "娥", "妍", "嬪", "姸", "娟", "妃", "姝", "媛",
    "婉", "嬌", "姜", "娜", "姉", "妺", "妹"
  ]
}
```

### Template 2: 2024 Newborn Names
```json
// data/popularity/newborn-names-2024.json
{
  "source": "행정안전부 2024년 신생아 이름 통계",
  "year": 2024,
  "names": [
    { "rank": 1, "name": "서윤", "gender": "F", "count": 2431, "characters": ["서", "윤"] },
    { "rank": 2, "name": "하윤", "gender": "F", "count": 2184, "characters": ["하", "윤"] },
    { "rank": 3, "name": "지우", "gender": "M", "count": 2156, "characters": ["지", "우"] }
  ]
}
```

### Template 3: Negative Character Categories
```json
// data/negative-characters/categories.json
{
  "categories": {
    "death_disaster": {
      "severity": "critical",
      "characters": ["死", "亡", "喪", "殺", "屠", "刑", "斬"]
    },
    "disease_injury": {
      "severity": "critical",
      "characters": ["病", "患", "疾", "痛", "傷", "殘", "弱"]
    }
  }
}
```

---

## 🧪 Testing & Validation

### After Each Phase
```bash
# Run comprehensive statistics check
npx tsx scripts/etl/check-db-stats.ts

# Expected output after all phases:
# 성별 분류: 8,787개 (100%) ✅
# 인기도 데이터: 8,787개 (100%) ✅
# 부정적 필터링: 150-200개 (2-3%) ✅
```

### API Testing
```bash
# Test gender filtering
curl "http://localhost:3000/api/hanja/search?gender=male&limit=10"

# Test popularity sorting
curl "http://localhost:3000/api/hanja/search?sortBy=popularity&limit=10"

# Test negative filtering (should exclude bad characters)
curl "http://localhost:3000/api/hanja/search?element=FIRE&gender=female&limit=20"
```

---

## 📈 Success Metrics

### Quantitative KPIs
- ✅ Gender classification: 0.27% → 100%
- ✅ Popularity data: 0% → 100%
- ✅ Negative filtering: 0.59% → 2-3%
- ✅ API response time: < 200ms (p95)

### Qualitative KPIs
- ✅ User satisfaction: 8.5/10 for relevant suggestions
- ✅ Classification accuracy: 90%+ validation score
- ✅ Zero critical cultural sensitivity incidents

---

## 🚨 Critical Notes

### No Database Schema Changes Required
All fields already exist in `HanjaDict`:
- ✅ `gender: String?` - ready for use
- ✅ `nameFrequency: Int?` - ready for use
- ✅ `isGoodForNaming: Boolean` - ready for use
- ✅ `evidenceJSON: Json?` - for metadata storage

### Performance Considerations
- Batch updates: 100 records per transaction
- Expected update time: < 10 seconds for 8,787 characters
- Database indexes already optimized

### Data Source Priority
1. **Best**: Official 행정안전부 2024 statistics
2. **Good**: Korean naming service datasets
3. **Acceptable**: Manual curation + cultural research
4. **Fallback**: Partial data (top 500 names) + defaults

---

## 🔗 Related Documentation

- **Detailed Plan**: `/claudedocs/3-phase-data-enhancement-plan.md` (70+ pages)
- **Original Plan**: `/docs/HANJA_DATA_IMPROVEMENT_PLAN.md`
- **Current Stats**: Run `npx tsx scripts/etl/check-db-stats.ts`

---

## ✅ Ready to Start?

```bash
# 1. Verify current state
npx tsx scripts/etl/check-db-stats.ts

# 2. Create data directories
mkdir -p data/{gender-classification,popularity,negative-characters}

# 3. Start with Phase 1: Gender Classification
# → Create tier1-explicit.json (200 characters)
# → Implement 85_classify_gender.ts
# → Run classification

# See detailed plan for full implementation guide
open claudedocs/3-phase-data-enhancement-plan.md
```

**Estimated Total Effort**: 20-25 days (4 weeks)
**Team Size**: 1-2 developers
**Risk Level**: Low (no schema changes, incremental updates)
**Rollback**: Easy (all changes are data-only, no code changes)

---

**Last Updated**: October 17, 2025
**Status**: Ready for Implementation
**Next Step**: Create tier1-explicit.json and start Week 1
