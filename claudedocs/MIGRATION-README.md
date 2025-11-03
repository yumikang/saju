# Database Migration: Negative Hanja Filtering System

**Status**: ⚠️ CRITICAL - Ready for Implementation
**Date**: 2025-11-03
**Impact**: HIGH - Prevents inappropriate names from being generated

---

## 🚨 Critical Issue

**Problem**: Users are seeing inappropriate names like:
- 수수 (愁愁) = "worry-worry"
- 사병 (死病) = "death-disease"
- 흉악 (凶惡) = "evil-evil"

**Root Cause**: Database schema mismatch
- Prisma schema defines `isGoodForNaming` column
- SQLite database does NOT have this column
- Filter fails silently, ALL hanja pass through

**Result**: 119+ negative meaning hanja appearing in user names

---

## 📋 Migration Files (All Created ✅)

### 1. Executive Summary (START HERE)
📄 **`claudedocs/migration-summary.md`** (9KB)
- Quick overview of problem and solution
- Implementation steps
- Success criteria
- Risk assessment

### 2. Comprehensive Strategy Document
📄 **`claudedocs/migration-strategy-hanja-filtering.md`** (19KB)
- Complete analysis with 119 negative hanja identified
- Detailed migration phases (1, 2, 3)
- Validation procedures
- Rollback strategies
- Risk assessment matrix
- Implementation checklist

### 3. Visual Diagram
📄 **`claudedocs/migration-visual-diagram.md`** (28KB)
- Problem flow visualization
- Solution flow visualization
- Data distribution charts
- Timeline and success metrics

### 4. Executable Shell Script
📄 **`scripts/migrate-negative-hanja.sh`** (5.5KB, executable)
- Automated migration execution
- Built-in backup creation
- Validation checks
- Error handling

### 5. SQL Queries File
📄 **`scripts/migration-queries.sql`** (8.6KB)
- Manual execution option
- Well-commented SQL statements
- Validation and rollback queries
- Ongoing curation queries

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Backup (REQUIRED)
```bash
cd /Users/blee/Downloads/saju/saju
cp prisma/dev.db prisma/backups/backup-$(date +%Y%m%d-%H%M%S).db
```

### Step 2: Run Migration
```bash
./scripts/migrate-negative-hanja.sh
```

### Step 3: Update Code
Edit `app/lib/naming/pipeline/services.ts` line 60:
```typescript
// Change from:
{ isGoodForNaming: true }

// To:
{ isGoodForNaming: { not: false } }
```

### Step 4: Test
```bash
npm run dev
# Visit naming page, verify NO negative hanja in generated names
```

---

## 📊 Migration Impact

### Before Migration
```
Total hanja:           8,787
Surnames (filtered):     132
Non-surnames:          8,655
Negative (passing):    119+ ❌
Filter status:         BROKEN
```

### After Migration
```
Total hanja:           8,787
Marked FALSE:             65 (blocked)
Unreviewed (NULL):     8,722 (allowed)
Filter status:         WORKING ✅
User impact:           NO negative names
```

---

## 🎯 What Gets Fixed

### ✅ Blocked Hanja (65 characters)
All hanja with objectively negative meanings:
- **Death**: 死(die), 殺(kill), 夭(die young)
- **Disease**: 病(disease), 痛(pain), 疾(illness)
- **Disaster**: 災(disaster), 禍(calamity), 厄(hardship)
- **Evil**: 凶(evil), 兇(vicious)
- **Sorrow**: 愁(worry), 憂(anxiety), 悲(sad), 哀(grief)
- **Deceit**: 僞(fake), 欺(deceive), 騙(cheat)
- **Poverty**: 貧(poor)

### ⚠️ Needs Manual Review (54 characters)
Moderate negatives requiring context:
- Minor sorrow/concern variants
- Context-dependent meanings
- Literary/historical usage

### ✅ Safe by Default (8,722 characters)
All unreviewed hanja allowed until marked otherwise

---

## 🔒 Safety & Rollback

### Pre-Migration Safety
- ✅ Automatic backup creation
- ✅ Non-destructive operations (UPDATE only, no DELETE)
- ✅ Preserves existing data
- ✅ Rollback procedures documented

### Rollback Command (If Needed)
```bash
cp prisma/backups/backup-TIMESTAMP.db prisma/dev.db
```

### Risk Level: **LOW**
- Database size: 8,787 rows (small, fast operations)
- Operation type: Schema addition + UPDATE queries
- Backup required: YES ✅
- Production impact: After testing only

---

## ✅ Success Criteria

### Immediate (Day 1)
- [ ] Migration script runs without errors
- [ ] 65 negative hanja marked as FALSE
- [ ] Columns exist: `is_good_for_naming`, `seed_protected`, `gender_hint`
- [ ] Service code updated
- [ ] Test names generated WITHOUT negative hanja

### Week 1
- [ ] No user reports of negative names
- [ ] Name generation rate stable
- [ ] Query performance unchanged
- [ ] Team review completed

### Month 1
- [ ] Manual review of remaining 54 negatives
- [ ] Start marking positive hanja (top 500)
- [ ] User satisfaction metrics tracked

---

## 📖 Document Guide

### Read First
1. **migration-summary.md** - Quick overview (10 min read)
2. **migration-visual-diagram.md** - Visual understanding (5 min)

### Deep Dive
3. **migration-strategy-hanja-filtering.md** - Complete analysis (30 min)

### Execution
4. **migrate-negative-hanja.sh** - Run the migration
5. **migration-queries.sql** - Manual SQL option

---

## 🚀 Next Steps

### This Week (Required)
1. ✅ Review migration strategy (DONE)
2. ⏳ Get team approval
3. ⏳ Apply to staging
4. ⏳ Test thoroughly
5. ⏳ Deploy to production

### Next Week (Recommended)
1. Monitor user feedback
2. Review remaining 54 negative hanja
3. Start marking popular positive hanja

### Next Month (Strategic)
1. Complete hanja curation (8,787 total)
2. Implement quality scoring
3. A/B test improvements
4. User satisfaction tracking

---

## 🔍 Validation Queries

### Check Migration Success
```sql
-- Verify columns exist
PRAGMA table_info(hanja_dict);
-- Should show: is_good_for_naming, seed_protected, gender_hint

-- Count negative hanja
SELECT COUNT(*) FROM hanja_dict WHERE is_good_for_naming = false;
-- Expected: 65

-- Test filter (should be empty)
SELECT character, meaning FROM hanja_dict
WHERE character IN ('愁','殺','病')
  AND is_good_for_naming != false;
-- Expected: 0 rows
```

### Application Test
```typescript
// Generate test names
const names = await generateNameCandidates({
  lastName: '김',
  gender: 'M',
  elementNeeds: ['METAL'],
  targetStrokes: 8
});

// Verify: NO names with 愁, 殺, 病, 死, 凶, etc.
console.log('Generated:', names.slice(0, 5));
```

---

## 🛠️ Troubleshooting

### Issue: Migration fails
**Solution**: Check backup exists, review error message, consult strategy document

### Issue: No names generated
**Solution**: Code likely filtering too aggressively
```typescript
// Use this filter instead:
{ isGoodForNaming: { not: false } }
```

### Issue: Negative hanja still appearing
**Solution**: Verify migration applied
```sql
SELECT is_good_for_naming FROM hanja_dict WHERE character = '愁';
-- Expected: false (0)
```

---

## 📞 Support

- **Strategy Document**: See `migration-strategy-hanja-filtering.md`
- **Visual Guide**: See `migration-visual-diagram.md`
- **SQL Reference**: See `migration-queries.sql`
- **Execution Script**: Run `./scripts/migrate-negative-hanja.sh`

---

## 📈 Statistics

```
Database Size:         8,787 hanja
Surnames:                132 (already filtered)
Non-surnames:          8,655 (available for names)
Negative Found:          119 (by semantic analysis)
Marked FALSE:             65 (severe negatives only)
Unreviewed:            8,722 (safe by default)
Migration Time:       ~5 seconds
Backup Size:          ~2.5 MB
Risk Level:           LOW
Impact:               HIGH (prevents bad names)
```

---

## 🎓 Key Learnings

### Why This Happened
1. Migration file created but never applied to SQLite
2. Code written assuming columns exist
3. SQLite silently ignores missing columns in WHERE clauses
4. No validation gate caught the mismatch

### Prevention for Future
1. Always verify migration applied (CI/CD check)
2. Add schema validation in application startup
3. Test filters with known negative cases
4. Monitor for empty result sets (signal of over-filtering)

---

## 📝 Summary

**Problem**: Schema mismatch causing negative hanja in names
**Solution**: Add missing columns + mark 65 negative hanja as FALSE
**Implementation**: Run `migrate-negative-hanja.sh` + update service code
**Testing**: Verify no names with 愁, 殺, 病, 死, 凶, 災, 禍, etc.
**Timeline**: 5 minutes to apply, 1 week to validate
**Risk**: LOW (backup + rollback available)
**Impact**: HIGH (prevents inappropriate names)

---

**Status**: Ready for Implementation ✅
**Approval Required**: Team Lead, Database Admin
**Next Action**: Review and schedule migration
