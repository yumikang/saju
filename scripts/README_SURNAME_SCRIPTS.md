# Surname Protection Scripts

This directory contains scripts for analyzing and implementing Korean surname protection in the naming algorithm.

---

## Quick Reference

### Main Scripts

| Script | Purpose | Run Command |
|--------|---------|-------------|
| `extract-surname-hanja.ts` | Extract 132 surnames from data | `npx tsx scripts/extract-surname-hanja.ts` |
| `analyze-surname-impact.ts` | Full database impact analysis | `npx tsx scripts/analyze-surname-impact.ts` |
| `verify-surname-migration.ts` | Verify migration success | `npx tsx scripts/verify-surname-migration.ts` |
| `check-element-distribution.ts` | Check element distribution | `npx tsx scripts/check-element-distribution.ts` |

### SQL Scripts

| Script | Purpose |
|--------|---------|
| `sql-migrations-surname-protection.sql` | Complete SQL migration with comments |

---

## Usage

### 1. Before Migration: Analysis

```bash
# Extract surname list
npx tsx scripts/extract-surname-hanja.ts

# Analyze database impact
npx tsx scripts/analyze-surname-impact.ts

# Check element distribution
npx tsx scripts/check-element-distribution.ts
```

### 2. During Migration: Apply Changes

```bash
# Option A: Use Prisma
npx prisma migrate deploy

# Option B: Apply SQL directly
psql $DATABASE_URL < scripts/sql-migrations-surname-protection.sql
```

### 3. After Migration: Verify

```bash
# Run comprehensive verification (IMPORTANT!)
npx tsx scripts/verify-surname-migration.ts
```

Expected output:
```
✅ Test 1: Surname Count (132) - PASS
✅ Test 2: Element Distribution - PASS
✅ Test 3: Remaining Pool (8,655) - PASS
✅ Test 4: Top Surnames Marked - PASS
✅ Test 5: Query Performance - PASS
✅ Test 6: Cross-Reference - PASS

✅ ALL TESTS PASSED - Migration successful!
```

---

## Script Details

### extract-surname-hanja.ts

**Purpose**: Extract all unique hanja characters from korean-surnames.data.ts

**Output**:
- List of 132 surnames (one per line)
- SQL-ready format (comma-separated)
- JavaScript array format

**Use Case**: Get the definitive list of surnames for SQL UPDATE

---

### analyze-surname-impact.ts

**Purpose**: Comprehensive database impact analysis

**What it checks**:
- Total hanja count
- Current usable pool
- Surnames in database
- Element distribution
- Top 30 surnames status
- Impact assessment
- Recommendations

**Output**: Detailed report with statistics and recommendations

**Use Case**: Understand the impact before applying migration

---

### verify-surname-migration.ts

**Purpose**: Post-migration verification (CRITICAL!)

**Tests performed**:
1. Surname count check (expect 132)
2. Element distribution validation
3. Remaining pool size check
4. Top 10 surnames spot check
5. Query performance test
6. Cross-reference with source data

**Exit codes**:
- `0`: All tests passed ✅
- `1`: Some tests failed ❌

**Use Case**: Verify migration applied correctly before deploying code

---

### check-element-distribution.ts

**Purpose**: Quick element distribution check

**What it shows**:
- Total hanja count
- Hanja with/without element data
- Breakdown by element (金木水火土)

**Use Case**: Quick sanity check of database state

---

### sql-migrations-surname-protection.sql

**Purpose**: Complete SQL migration with documentation

**Contains**:
- Script 1: Add column + indexes
- Script 2: Mark 132 surnames
- Script 3: Verification queries
- Script 4: Application code examples
- Script 5: Rollback instructions

**Use Case**: Reference for manual SQL execution or debugging

---

## Verification Checklist

After running migration, verify:

- [ ] Run `npx tsx scripts/verify-surname-migration.ts`
- [ ] All 6 tests pass ✅
- [ ] Exit code is 0
- [ ] Database has 132 surnames marked
- [ ] Query performance <1 second
- [ ] No errors in application logs

---

## Troubleshooting

### Issue: "Cannot find module '@prisma/client'"

**Solution**: Generate Prisma client first
```bash
npx prisma generate
```

### Issue: "Database connection failed"

**Solution**: Check DATABASE_URL environment variable
```bash
echo $DATABASE_URL
```

### Issue: "Verification test fails"

**Solution**: Check which test failed
```bash
npx tsx scripts/verify-surname-migration.ts
# Review failed test output
# Check SURNAME_IMPLEMENTATION_GUIDE.md for troubleshooting
```

### Issue: "SQL syntax error"

**Solution**: Ensure PostgreSQL compatibility
```bash
# Check PostgreSQL version
psql --version

# Review migration SQL
cat scripts/sql-migrations-surname-protection.sql
```

---

## Rollback

If issues occur, rollback with:

```sql
-- Quick rollback (keeps column, removes flags)
UPDATE "hanja_dict" SET "is_surname" = false;

-- Full rollback (removes column)
DROP INDEX IF EXISTS "hanja_dict_is_surname_idx";
DROP INDEX IF EXISTS "hanja_dict_element_surname_idx";
ALTER TABLE "hanja_dict" DROP COLUMN "is_surname";
```

---

## Documentation

For detailed information, see:

- **Full Analysis**: `/SURNAME_PROTECTION_REPORT.md`
- **Implementation Guide**: `/SURNAME_IMPLEMENTATION_GUIDE.md`
- **Executive Summary**: `/SURNAME_ANALYSIS_SUMMARY.md`

---

## Contributing

When adding new scripts:

1. Follow TypeScript naming conventions
2. Add error handling
3. Include usage documentation
4. Test thoroughly before committing
5. Update this README

---

**Last Updated**: 2025-10-30
**Version**: 1.0
