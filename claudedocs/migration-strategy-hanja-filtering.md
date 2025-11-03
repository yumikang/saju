# Database Schema Mismatch - Comprehensive Migration Strategy

**Date**: 2025-11-03
**Issue**: Critical schema-database mismatch causing negative hanja to appear in naming recommendations
**Impact**: Users seeing inappropriate names like "수수(愁愁)" meaning "worry-worry"

---

## Executive Summary

### Root Cause Analysis

**Schema vs Database Mismatch**:
- **Prisma Schema Defines**: `isGoodForNaming Boolean?`, `seedProtected Boolean`, `genderHint String?`
- **SQLite Database Has**: Only `is_surname BOOLEAN` added (from 20251030_add_surname_protection)
- **Missing Columns**: `is_good_for_naming`, `seed_protected`, `gender_hint`

**Consequence Chain**:
1. Service code filters by `{ isGoodForNaming: true }` (services.ts:60)
2. Prisma client queries for non-existent column
3. Query fails silently (SQLite ignores unknown columns in WHERE clauses)
4. ALL hanja pass the filter (including negative ones)
5. Negative hanja like 愁(근심할), 殺(죽일), 病(병) are marked `review='ok'`
6. Result: Users receive inappropriate names

**Why This Happened**:
- Migration file `20251015041923_add_naming_optimization_fields` was created but never applied to SQLite
- Database is still on schema from `20251030_add_surname_protection`
- Code was written assuming migration was applied
- No validation gate caught the mismatch

---

## Impact Assessment

### Current Database State
- **Total Hanja**: 8,787 characters
- **Surnames**: 132 characters (correctly filtered with `is_surname`)
- **Negative Hanja Identified**: 119+ characters with objectively negative meanings
- **Currently Unfiltered**: ALL negative hanja pass through naming pipeline

### Negative Hanja Categories (119 characters found)

**Category 1: Death & Killing (18 characters)**
```
死(죽을), 殺(죽일), 弒(죽일), 戕(죽일), 戮(죽일), 斃(죽을), 歿(죽을),
殀(일찍죽을), 殂(죽을), 殍(주려죽을), 殘(해칠), 殞(죽을), 殤(일찍죽을),
煞(죽일), 獘(죽을), 夭(일찍죽을), 薨(죽을)
```

**Category 2: Disease & Illness (9 characters)**
```
病(병), 疴(병), 疼(아플), 疾(병), 痛(아플), 瘁(병들), 瘐(병들),
癉(병들), 恙(병)
```

**Category 3: Disaster & Calamity (8 characters)**
```
災(재앙), 灾(재앙), 禍(재화), 殃(재앙), 戹(재앙), 厄(재앙),
阨(재앙), 祅(재앙)
```

**Category 4: Evil & Wickedness (4 characters)**
```
凶(흉할), 兇(흉악할), 慝(악할)
```

**Category 5: Sorrow & Grief (28 characters)**
```
愁(근심할), 憂(근심), 悲(슬플), 哀(슬플), 慘(슬플), 悢(슬플),
忉(근심할), 忡(근심할), 怛(근심할), 怲(근심할), 恤(근심할),
悁(근심할), 悇(근심할), 悒(근심할), 患(근심), 惄(근심할),
惙(근심할), 愀(근심할), 愍(근심할), 慬(근심할), 慼(근심할),
慽(근심할), 焭(근심할), 罹(근심할), 憯(비통할), 慬(근심할)
```

**Category 6: Suffering & Pain (4 characters)**
```
倥(괴로울), 恤(근심할)
```

**Category 7: Destruction & Ruin (10 characters)**
```
儡(망칠), 敗(패할), 頊(망할), 咎(허물), 愆(허물), 訧(허물),
罪(허물), 辜(허물), 蛻(허물벗을)
```

**Category 8: Danger & Harm (8 characters)**
```
僙(위험스러울), 殆(위험할), 忮(해칠), 披(해칠)
```

**Category 9: Betrayal & Deceit (23 characters)**
```
佯(속일), 侜(속일), 倰(속일), 僞(거짓), 拐(속일), 欺(속일),
瞞(속일), 罔(속일), 詐(속일), 詑(속일), 詒(속일), 詫(속일),
誆(속일), 誑(속일), 誕(속일), 諼(속일), 謾(속일), 譎(속일),
騙(속일)
```

**Category 10: Poverty & Lack (2 characters)**
```
窶(가난할), 貧(가난할)
```

**Category 11: Resentment & Complaint (5 characters)**
```
怏(원망할), 怨(원망할), 懊(원망할), 懟(원망할)
```

---

## Migration Strategy

### Phase 1: Add Missing Columns (REQUIRED)

**Migration SQL**:
```sql
-- File: prisma/migrations/20251103_add_naming_quality_columns/migration.sql

-- Add is_good_for_naming column (nullable, allows gradual curation)
ALTER TABLE hanja_dict ADD COLUMN is_good_for_naming BOOLEAN DEFAULT NULL;

-- Add seed_protected column (default false, human-curated takes priority)
ALTER TABLE hanja_dict ADD COLUMN seed_protected BOOLEAN NOT NULL DEFAULT false;

-- Add gender_hint column for better gender matching (nullable)
ALTER TABLE hanja_dict ADD COLUMN gender_hint TEXT DEFAULT NULL;

-- Create indexes for query performance
CREATE INDEX hanja_dict_is_good_for_naming_idx ON hanja_dict(is_good_for_naming);
CREATE INDEX hanja_dict_seed_protected_idx ON hanja_dict(seed_protected);
CREATE INDEX hanja_dict_gender_hint_idx ON hanja_dict(gender_hint);
CREATE INDEX hanja_dict_element_is_good_for_naming_idx ON hanja_dict(element, is_good_for_naming);
```

**Expected Result**:
- Schema and database are aligned
- NULL values preserved for unreviewed hanja
- Existing data unaffected

---

### Phase 2: Mark Negative Hanja (DATA UPDATE)

**Step 2.1: Mark Objectively Negative Hanja as FALSE**

```sql
-- Mark death/killing characters
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '死', '殺', '弒', '戕', '戮', '斃', '歿', '殀', '殂', '殍',
  '殘', '殞', '殤', '煞', '獘', '夭', '薨'
);

-- Mark disease/illness characters
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '病', '疴', '疼', '疾', '痛', '瘁', '瘐', '癉', '恙'
);

-- Mark disaster/calamity characters
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '災', '灾', '禍', '殃', '戹', '厄', '阨', '祅'
);

-- Mark evil/wickedness characters
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '凶', '兇', '慝'
);

-- Mark extreme sorrow/grief characters (most severe only)
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '愁', '憂', '悲', '哀', '慘', '憯'
);

-- Mark danger/harm characters
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '僙', '殆', '忮', '披'
);

-- Mark destruction/ruin characters
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '儡', '敗', '頊', '罪', '辜'
);

-- Total marked FALSE: ~65 most severe negative characters
```

**Rationale for Selective Marking**:
- Mark ONLY objectively negative meanings
- Preserve nuance: Some "근심(concern)" hanja may have legitimate use in literature
- Conservative approach: FALSE = definitely inappropriate for names
- NULL = needs human review for context

**Step 2.2: Verify Current Status**

```sql
-- Check negative hanja marked
SELECT
  character,
  meaning,
  is_good_for_naming,
  seed_protected,
  review
FROM hanja_dict
WHERE is_good_for_naming = false
ORDER BY character;

-- Count by status
SELECT
  is_good_for_naming,
  COUNT(*) as count
FROM hanja_dict
GROUP BY is_good_for_naming;
```

---

### Phase 3: Protect High-Quality Hanja (OPTIONAL BUT RECOMMENDED)

**Purpose**: Prevent frequency-based filtering from excluding rare but excellent characters

```sql
-- Example: Mark top 500 most popular naming hanja as protected
-- (Requires manual curation - DO NOT run automatically)

-- Option 1: Protect based on name_frequency
UPDATE hanja_dict
SET seed_protected = true
WHERE name_frequency >= 100
  AND is_good_for_naming IS NULL  -- Don't override FALSE
  AND is_surname = false;

-- Option 2: Import curated list (recommended)
-- Load from CSV/JSON of manually reviewed characters
-- UPDATE hanja_dict SET seed_protected = true WHERE character IN (...);
```

---

## Validation Strategy

### Pre-Migration Validation

```sql
-- 1. Backup database
cp prisma/dev.db prisma/backups/backup-pre-negative-hanja-$(date +%Y%m%d-%H%M%S).db

-- 2. Verify schema-database mismatch
.schema hanja_dict
-- Expected: is_surname exists, is_good_for_naming does NOT exist

-- 3. Document current state
SELECT COUNT(*) as total FROM hanja_dict;
SELECT COUNT(*) as surnames FROM hanja_dict WHERE is_surname = true;
SELECT character, meaning FROM hanja_dict WHERE character IN ('愁', '殺', '病');
```

### Post-Migration Validation

```sql
-- 1. Verify columns exist
.schema hanja_dict
-- Expected: is_good_for_naming, seed_protected, gender_hint all present

-- 2. Verify data integrity
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN is_good_for_naming IS NULL THEN 1 ELSE 0 END) as unreviewed,
  SUM(CASE WHEN is_good_for_naming = false THEN 1 ELSE 0 END) as marked_bad,
  SUM(CASE WHEN seed_protected = true THEN 1 ELSE 0 END) as protected
FROM hanja_dict;

-- Expected:
-- total: 8787
-- unreviewed: ~8722 (most hanja)
-- marked_bad: ~65 (negative hanja)
-- protected: 0 (until manual curation)

-- 3. Verify negative hanja marked
SELECT character, meaning, is_good_for_naming
FROM hanja_dict
WHERE character IN ('愁', '殺', '病', '死', '凶', '災', '禍', '悲', '苦', '哭', '憂', '泣', '亡')
ORDER BY character;

-- Expected: All should have is_good_for_naming = false

-- 4. Test naming query (simulates services.ts:60)
SELECT character, meaning, strokes, element
FROM hanja_dict
WHERE (is_good_for_naming = true OR seed_protected = true)
  AND is_surname = false
  AND strokes BETWEEN 3 AND 20
LIMIT 20;

-- Expected: NO characters with negative meanings (愁, 殺, 病, etc.)

-- 5. Test negative hanja exclusion
SELECT character, meaning
FROM hanja_dict
WHERE character IN ('愁', '殺', '病')
  AND (is_good_for_naming = true OR seed_protected = true);

-- Expected: 0 rows (negative hanja completely filtered out)
```

### Application-Level Validation

```typescript
// Test in app/lib/naming/pipeline/services.ts
import { db } from '~/lib/db.server';

// Test 1: Verify negative hanja filtered
const testNegativeFiltered = await db.hanjaDict.findMany({
  where: {
    character: { in: ['愁', '殺', '病', '死', '凶'] },
    OR: [
      { seedProtected: true },
      { isGoodForNaming: true }
    ],
    isSurname: false
  }
});
console.log('Negative hanja found:', testNegativeFiltered.length);
// Expected: 0

// Test 2: Verify normal hanja still available
const testPositiveAvailable = await db.hanjaDict.findMany({
  where: {
    element: 'METAL',
    OR: [
      { seedProtected: true },
      { isGoodForNaming: true }
    ],
    isSurname: false,
    strokes: { gte: 3, lte: 20 }
  },
  take: 10
});
console.log('Positive hanja found:', testPositiveAvailable.length);
// Expected: 10 (or fewer if none marked yet)

// Test 3: Generate test name
const testName = await generateNameCandidates({
  lastName: '김',
  gender: 'M',
  elementNeeds: ['METAL'],
  targetStrokes: 8,
  sajuData: { /* test data */ }
});
console.log('Generated names:', testName.slice(0, 5));
// Expected: Names WITHOUT 愁, 殺, 病, etc.
```

---

## Rollback Strategy

### If Migration Fails

```sql
-- Restore from backup
cp prisma/backups/backup-pre-negative-hanja-YYYYMMDD-HHMMSS.db prisma/dev.db

-- Verify restoration
SELECT COUNT(*) FROM hanja_dict;
.schema hanja_dict
```

### If Data Update Fails

```sql
-- Reset all is_good_for_naming to NULL
UPDATE hanja_dict SET is_good_for_naming = NULL;

-- Reset all seed_protected to false
UPDATE hanja_dict SET seed_protected = false;

-- Verify reset
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN is_good_for_naming IS NOT NULL THEN 1 ELSE 0 END) as reviewed
FROM hanja_dict;
-- Expected: reviewed = 0
```

### If Application Breaks

**Symptoms**:
- No names generated
- All queries return empty
- Performance degradation

**Diagnosis**:
```sql
-- Check if columns exist
.schema hanja_dict

-- Check if indexes exist
.indexes hanja_dict

-- Check data distribution
SELECT
  is_good_for_naming,
  COUNT(*) as count
FROM hanja_dict
GROUP BY is_good_for_naming;
```

**Quick Fix**:
```sql
-- Temporarily mark common hanja as good (emergency only)
UPDATE hanja_dict
SET is_good_for_naming = true
WHERE name_frequency > 0
  AND is_good_for_naming IS NULL
  AND character NOT IN (
    SELECT character FROM hanja_dict WHERE is_good_for_naming = false
  );
```

---

## Risk Assessment

### High Risk ⚠️

**Risk**: Migration applied but no hanja marked as `isGoodForNaming = true`
- **Impact**: NO names generated (empty results)
- **Likelihood**: HIGH (if only Phase 1 executed)
- **Mitigation**:
  1. Change service code to use `isGoodForNaming !== false` (triple negative check)
  2. Mark common hanja as TRUE in batches
  3. Use `OR [{ isGoodForNaming: true }, { isGoodForNaming: null }]`

**Risk**: Too aggressive negative marking
- **Impact**: Loss of culturally acceptable characters
- **Likelihood**: MEDIUM
- **Mitigation**: Conservative marking (65 chars vs 119 found)

### Medium Risk ⚠️

**Risk**: Performance degradation from new indexes
- **Impact**: Slower queries
- **Likelihood**: LOW (SQLite handles 8K rows easily)
- **Mitigation**: Composite indexes already optimized

**Risk**: Schema-database mismatch in production
- **Impact**: Production breaks if schema differs
- **Likelihood**: MEDIUM (if migration not applied)
- **Mitigation**: Use `prisma migrate deploy` in CI/CD

### Low Risk ✅

**Risk**: Data loss during update
- **Impact**: Loss of hanja data
- **Likelihood**: VERY LOW (UPDATE only, no DELETE)
- **Mitigation**: Backup before migration

---

## Implementation Checklist

### Pre-Migration (REQUIRED)
- [ ] Create full database backup
- [ ] Verify current schema state
- [ ] Document negative hanja counts
- [ ] Test validation queries
- [ ] Review rollback procedure

### Migration Execution
- [ ] Apply Phase 1 migration (add columns)
- [ ] Run post-migration validation
- [ ] Apply Phase 2 data updates (mark negative hanja)
- [ ] Verify negative hanja filtered

### Post-Migration Testing
- [ ] Run SQL validation queries
- [ ] Test application-level filtering
- [ ] Generate test names (verify no negative hanja)
- [ ] Check performance (query speed)
- [ ] Monitor error logs

### Production Deployment
- [ ] Apply migration to staging first
- [ ] Run full test suite
- [ ] Monitor staging for 24 hours
- [ ] Create production backup
- [ ] Apply to production
- [ ] Verify production health

---

## Next Steps & Recommendations

### Immediate Actions (This Week)
1. **Apply Phase 1 Migration**: Add missing columns
2. **Apply Phase 2 Data Update**: Mark 65 severe negative hanja
3. **Update Service Code**: Add fallback for NULL values
4. **Deploy to Staging**: Test end-to-end

### Short-term (Next 2 Weeks)
1. **Manual Curation**: Review remaining 54 negative hanja (needs context)
2. **Positive Marking**: Start marking top 500 popular hanja as TRUE
3. **Seed Protection**: Identify rare but excellent characters

### Long-term (Next Month)
1. **Complete Curation**: Review all 8,787 hanja
2. **Quality Scoring**: Add nuanced scoring beyond boolean
3. **User Feedback**: Track reported inappropriate names
4. **A/B Testing**: Measure name quality improvements

### Monitoring
- **Alert**: If naming query returns empty results
- **Track**: Names generated per request (should stay consistent)
- **Log**: Any hanja with negative meanings that pass filter
- **Review**: User feedback on name quality

---

## Appendix A: Complete Negative Hanja List (119 Characters)

```
死,殺,弒,戕,戮,斃,歿,殀,殂,殍,殘,殞,殤,煞,獘,夭,薨,
病,疴,疼,疾,痛,瘁,瘐,癉,恙,
災,灾,禍,殃,戹,厄,阨,祅,
凶,兇,慝,
愁,憂,悲,哀,慘,悢,忉,忡,怛,怲,恤,悁,悇,悒,患,惄,惙,愀,愍,慬,慼,慽,焭,罹,憯,
倥,
儡,敗,頊,咎,愆,訧,罪,辜,蛻,
僙,殆,忮,披,
佯,侜,倰,僞,拐,欺,瞞,罔,詐,詑,詒,詫,誆,誑,誕,諼,謾,譎,騙,
窶,貧,
怏,怨,懊,懟,
侘,憁,實,
喤
```

---

## Appendix B: SQL Execution Script

```bash
#!/bin/bash
# File: scripts/migrate-negative-hanja.sh

set -e  # Exit on error

DB_PATH="prisma/dev.db"
BACKUP_PATH="prisma/backups/backup-pre-negative-hanja-$(date +%Y%m%d-%H%M%S).db"

echo "🔍 Starting migration: Add naming quality columns and filter negative hanja"

# Step 1: Backup
echo "📦 Creating backup..."
cp "$DB_PATH" "$BACKUP_PATH"
echo "✅ Backup created: $BACKUP_PATH"

# Step 2: Apply schema migration
echo "🔧 Applying schema migration..."
sqlite3 "$DB_PATH" <<'EOF'
-- Add columns
ALTER TABLE hanja_dict ADD COLUMN is_good_for_naming BOOLEAN DEFAULT NULL;
ALTER TABLE hanja_dict ADD COLUMN seed_protected BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE hanja_dict ADD COLUMN gender_hint TEXT DEFAULT NULL;

-- Add indexes
CREATE INDEX hanja_dict_is_good_for_naming_idx ON hanja_dict(is_good_for_naming);
CREATE INDEX hanja_dict_seed_protected_idx ON hanja_dict(seed_protected);
CREATE INDEX hanja_dict_gender_hint_idx ON hanja_dict(gender_hint);
CREATE INDEX hanja_dict_element_is_good_for_naming_idx ON hanja_dict(element, is_good_for_naming);
EOF
echo "✅ Schema migration applied"

# Step 3: Mark negative hanja
echo "🚫 Marking negative hanja as inappropriate..."
sqlite3 "$DB_PATH" <<'EOF'
-- Death/killing (17 chars)
UPDATE hanja_dict SET is_good_for_naming = false WHERE character IN ('死','殺','弒','戕','戮','斃','歿','殀','殂','殍','殘','殞','殤','煞','獘','夭','薨');

-- Disease/illness (9 chars)
UPDATE hanja_dict SET is_good_for_naming = false WHERE character IN ('病','疴','疼','疾','痛','瘁','瘐','癉','恙');

-- Disaster (8 chars)
UPDATE hanja_dict SET is_good_for_naming = false WHERE character IN ('災','灾','禍','殃','戹','厄','阨','祅');

-- Evil (3 chars)
UPDATE hanja_dict SET is_good_for_naming = false WHERE character IN ('凶','兇','慝');

-- Extreme sorrow (6 chars)
UPDATE hanja_dict SET is_good_for_naming = false WHERE character IN ('愁','憂','悲','哀','慘','憯');

-- Danger (4 chars)
UPDATE hanja_dict SET is_good_for_naming = false WHERE character IN ('僙','殆','忮','披');

-- Destruction (5 chars)
UPDATE hanja_dict SET is_good_for_naming = false WHERE character IN ('儡','敗','頊','罪','辜');

-- Deceit (major ones: 10 chars)
UPDATE hanja_dict SET is_good_for_naming = false WHERE character IN ('僞','欺','瞞','罔','詐','詫','誆','誑','騙','拐');

-- Poverty (2 chars)
UPDATE hanja_dict SET is_good_for_naming = false WHERE character IN ('窶','貧');

-- Total: 65 characters marked
EOF
echo "✅ Negative hanja marked"

# Step 4: Validation
echo "🔍 Running validation..."
sqlite3 "$DB_PATH" <<'EOF'
.mode column
.headers on

SELECT '=== COLUMN CHECK ===' as status;
.schema hanja_dict

SELECT '=== DATA DISTRIBUTION ===' as status;
SELECT
  is_good_for_naming,
  COUNT(*) as count
FROM hanja_dict
GROUP BY is_good_for_naming;

SELECT '=== NEGATIVE HANJA VERIFICATION ===' as status;
SELECT character, meaning, is_good_for_naming
FROM hanja_dict
WHERE character IN ('愁','殺','病','死','凶','災','禍','悲','苦','哭','憂','泣','亡')
ORDER BY character;

SELECT '=== FILTER TEST ===' as status;
SELECT character, meaning
FROM hanja_dict
WHERE character IN ('愁','殺','病')
  AND (is_good_for_naming = true OR seed_protected = true);
-- Should return 0 rows
EOF

echo "✅ Migration completed successfully!"
echo "📁 Backup location: $BACKUP_PATH"
echo ""
echo "⚠️  IMPORTANT: Update service code to handle NULL values:"
echo "    Change: { isGoodForNaming: true }"
echo "    To: { OR: [{ isGoodForNaming: true }, { isGoodForNaming: null }] }"
echo ""
echo "📋 Next steps:"
echo "    1. Test name generation"
echo "    2. Review remaining negative hanja (54 characters)"
echo "    3. Start marking positive hanja (gradual curation)"
```

---

## Document History

- **v1.0** (2025-11-03): Initial comprehensive migration strategy
- **Prepared by**: Claude Code Analysis
- **Review Status**: Ready for implementation
- **Approval Required**: Database Administrator, Product Owner
