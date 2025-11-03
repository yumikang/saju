# Migration Summary: Database Schema Mismatch Fix

**Date**: 2025-11-03
**Issue**: Schema-database mismatch causing negative hanja in names
**Status**: Ready for implementation

---

## Problem Summary

### What's Wrong?
- **Prisma schema** defines `isGoodForNaming`, `seedProtected`, `genderHint` columns
- **SQLite database** does NOT have these columns (only has `is_surname`)
- **Service code** tries to filter by `isGoodForNaming: true`
- **Result**: Filter fails silently, ALL hanja pass through including negative ones

### Impact
Users are seeing inappropriate names like:
- **수수** (愁愁) = "worry-worry"
- **사병** (死病) = "death-disease"
- **흉악** (凶惡) = "evil-evil"

### Root Cause
Migration `20251015041923_add_naming_optimization_fields` was created but never applied to SQLite database.

---

## Solution Overview

### Three Phases

**Phase 1: Add Missing Columns** ✅ (REQUIRED)
- Add `is_good_for_naming BOOLEAN` (nullable)
- Add `seed_protected BOOLEAN` (default: false)
- Add `gender_hint TEXT` (nullable)
- Create 4 performance indexes

**Phase 2: Mark Negative Hanja** ✅ (REQUIRED)
- Mark 65 objectively negative characters as FALSE
- Categories: death, disease, disaster, evil, extreme sorrow, danger, destruction, deceit, poverty
- Conservative approach: only mark severe negatives

**Phase 3: Mark Positive Hanja** ⏳ (OPTIONAL)
- Gradually mark common/good hanja as TRUE
- Protect rare but excellent characters
- Requires manual curation

---

## Key Statistics

### Current State (Before Migration)
```
Total hanja:           8,787
Surnames (filtered):     132
Negative (unfiltered): 119+
Passing filter:        ALL (broken)
```

### After Migration
```
Total hanja:           8,787
Marked FALSE:             65  (severe negatives)
Marked TRUE:               0  (needs curation)
Unreviewed (NULL):     8,722  (safe by default)
Protected:                 0  (needs curation)
```

---

## Negative Hanja Categories (65 marked)

| Category | Count | Examples |
|----------|-------|----------|
| Death/Killing | 17 | 死(die), 殺(kill), 夭(die young) |
| Disease/Illness | 9 | 病(disease), 痛(pain), 疾(illness) |
| Disaster/Calamity | 8 | 災(disaster), 禍(calamity), 厄(hardship) |
| Evil/Wickedness | 3 | 凶(evil), 兇(vicious), 慝(wicked) |
| Extreme Sorrow | 6 | 愁(worry), 憂(anxiety), 悲(sad), 哀(grief) |
| Danger/Harm | 4 | 殆(danger), 忮(harm) |
| Destruction/Ruin | 5 | 敗(defeat), 罪(crime) |
| Deceit/Fraud | 10 | 僞(fake), 欺(deceive), 騙(cheat) |
| Poverty | 2 | 貧(poor), 窶(impoverished) |

**Total: 65 characters with objectively inappropriate meanings**

---

## Migration Files

### 1. Comprehensive Strategy Document
📄 **`claudedocs/migration-strategy-hanja-filtering.md`**
- Complete analysis (70+ pages)
- SQL migration statements
- Validation procedures
- Rollback strategies
- Risk assessment
- Implementation checklist

### 2. Executable Shell Script
📄 **`scripts/migrate-negative-hanja.sh`**
- Automated migration execution
- Built-in validation
- Backup creation
- Error handling
- Usage: `./scripts/migrate-negative-hanja.sh`

### 3. SQL Queries File
📄 **`scripts/migration-queries.sql`**
- Manual execution option
- Commented SQL statements
- Validation queries
- Rollback queries
- Usage: `sqlite3 prisma/dev.db < scripts/migration-queries.sql`

---

## Critical Code Change Required

### Current Code (BROKEN)
```typescript
// app/lib/naming/pipeline/services.ts:56-63
if (options.isGoodForNaming !== false) {
  andConditions.push({
    OR: [
      { seedProtected: true },
      { isGoodForNaming: true }, // ❌ Filters out ALL NULL (8,722 hanja)
    ],
  });
}
```

### Recommended Fix (Option 1)
```typescript
// Allow NULL (unreviewed) hanja - gradual curation approach
if (options.isGoodForNaming !== false) {
  andConditions.push({
    isGoodForNaming: { not: false } // ✅ Allows TRUE and NULL, blocks FALSE
  });
}
```

### Alternative Fix (Option 2)
```typescript
// Explicit OR condition
if (options.isGoodForNaming !== false) {
  andConditions.push({
    OR: [
      { seedProtected: true },
      { isGoodForNaming: true },
      { isGoodForNaming: null } // ✅ Explicitly include unreviewed
    ],
  });
}
```

**Rationale**:
- 65 negative hanja marked FALSE = BLOCKED ✅
- 8,722 unreviewed hanja stay NULL = ALLOWED ✅
- Gradual curation: mark good ones TRUE over time
- No disruption to existing service

---

## Implementation Steps

### Step 1: Backup (CRITICAL)
```bash
cp prisma/dev.db prisma/backups/backup-pre-migration-$(date +%Y%m%d-%H%M%S).db
```

### Step 2: Run Migration
```bash
cd /Users/blee/Downloads/saju/saju
./scripts/migrate-negative-hanja.sh
```

### Step 3: Update Service Code
Edit `app/lib/naming/pipeline/services.ts`:
- Change line 60: `{ isGoodForNaming: true }`
- To: `{ isGoodForNaming: { not: false } }`

### Step 4: Test
```bash
# Run dev server
npm run dev

# Generate test names
# Visit: http://localhost:3000/naming
# Input: 김 (Kim), male, any birthdate
# Verify: NO names with 愁, 殺, 病, 死, 凶, etc.
```

### Step 5: Validate
```sql
-- Check negative hanja filtered
SELECT character, meaning
FROM hanja_dict
WHERE character IN ('愁','殺','病')
  AND is_good_for_naming != false;
-- Expected: 0 rows

-- Test naming query
SELECT character, meaning
FROM hanja_dict
WHERE is_good_for_naming != false
  AND is_surname = false
  AND strokes BETWEEN 3 AND 20
LIMIT 10;
-- Expected: Characters WITHOUT negative meanings
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| No names generated (all filtered) | LOW | HIGH | Use `not: false` filter (allows NULL) |
| Performance degradation | VERY LOW | LOW | Indexes already created |
| Too aggressive filtering | LOW | MEDIUM | Conservative marking (65 vs 119 found) |
| Production mismatch | MEDIUM | HIGH | Test in staging first |

---

## Success Criteria

### Immediate (After Migration)
- [ ] Columns exist: `is_good_for_naming`, `seed_protected`, `gender_hint`
- [ ] 65 negative hanja marked FALSE
- [ ] Service code updated to handle NULL
- [ ] Test names generated WITHOUT negative hanja

### Short-term (Week 1)
- [ ] No user reports of negative names
- [ ] Name generation rate unchanged
- [ ] Query performance stable
- [ ] Manual review of remaining 54 moderate negatives

### Long-term (Month 1)
- [ ] Top 500 popular hanja marked TRUE
- [ ] Seed protection for rare excellent characters
- [ ] User feedback on name quality
- [ ] Complete curation roadmap

---

## Next Steps

### This Week
1. ✅ Review migration strategy
2. ⏳ Get approval from team
3. ⏳ Apply migration to staging
4. ⏳ Test thoroughly
5. ⏳ Deploy to production

### Next Week
1. Monitor user feedback
2. Review remaining 54 negative hanja
3. Start marking popular positive hanja
4. Implement seed protection

### Next Month
1. Complete hanja curation (8,787 total)
2. Implement quality scoring system
3. A/B test name quality improvements
4. User satisfaction metrics

---

## Rollback Plan

### If Migration Fails
```bash
# Restore from backup
cp prisma/backups/backup-pre-migration-TIMESTAMP.db prisma/dev.db

# Verify restoration
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM hanja_dict;"
```

### If Application Breaks
```sql
-- Emergency: Mark common hanja as good
UPDATE hanja_dict
SET is_good_for_naming = true
WHERE name_frequency > 0
  AND is_good_for_naming IS NULL
  AND character NOT IN (
    SELECT character FROM hanja_dict WHERE is_good_for_naming = false
  );
```

---

## Contact & Support

- **Migration Strategy**: See `claudedocs/migration-strategy-hanja-filtering.md`
- **Executable Script**: `scripts/migrate-negative-hanja.sh`
- **SQL Queries**: `scripts/migration-queries.sql`
- **Issue Tracker**: Document any problems encountered
- **Team Review**: Get approval before production deployment

---

## Appendix: Quick Reference

### Verify Migration Status
```sql
-- Check columns exist
PRAGMA table_info(hanja_dict);

-- Check data
SELECT
  CASE WHEN is_good_for_naming IS NULL THEN 'Unreviewed'
       WHEN is_good_for_naming = 1 THEN 'Good'
       ELSE 'Bad' END as status,
  COUNT(*) as count
FROM hanja_dict
GROUP BY is_good_for_naming;
```

### Test Negative Filtering
```sql
-- Should return 0 rows
SELECT character, meaning
FROM hanja_dict
WHERE character IN ('愁','殺','病','死','凶')
  AND is_good_for_naming != false;
```

### Generate Safe Names
```typescript
// Service code test
const safeHanja = await db.hanjaDict.findMany({
  where: {
    isGoodForNaming: { not: false }, // Allows TRUE and NULL
    isSurname: false,
    strokes: { gte: 3, lte: 20 }
  },
  take: 10
});
console.log('Safe hanja:', safeHanja.map(h => h.character).join(', '));
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Status**: Ready for Implementation
