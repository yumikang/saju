# Negative Hanja Update Script - Usage Guide

## Quick Start

```bash
# Run the expanded negative hanja update script
npx tsx scripts/update-negative-hanja-expanded.ts
```

## What This Script Does

Marks 183 negative/inauspicious hanja characters as unsuitable for naming (`isGoodForNaming = false`) across 13 comprehensive categories:

1. **죽음/재난** (Death/Disaster) - 18 chars
2. **질병/상해** (Illness/Injury) - 16 chars
3. **범죄/폭력** (Crime/Violence) - 20 chars
4. **가난/실패** (Poverty/Failure) - 15 chars
5. **부정적 감정** (Negative Emotions) - 18 chars
6. **추악함/외모** (Ugliness/Appearance) - 10 chars
7. **더러움/불결** (Dirty/Filthy) - 13 chars
8. **동물/벌레** (Animals/Insects) - 20 chars
9. **천한 직업** (Low Status Occupations) - 10 chars
10. **흉한 사물** (Inauspicious Objects) - 10 chars
11. **도덕적 타락** (Moral Corruption) - 15 chars
12. **천재지변** (Natural Disasters) - 8 chars
13. **음험함/사악함** (Sinister/Evil) - 18 chars

## Expected Output

```
🔄 부정적 한자 데이터 업데이트 시작...

📊 총 191개 한자를 작명 부적합으로 표시합니다.

📋 카테고리별 한자 수:
   죽음/재난: 18개
   질병/상해: 16개
   범죄/폭력: 20개
   ... (all 13 categories)

1️⃣ 부정적 한자 마킹 중...
✓ 183개 한자를 작명 부적합으로 표시 완료

📊 업데이트 통계:
전체 한자: 8,787개
작명 적합: 8,604개 (97.9%)
작명 부적합: 183개 (2.1%)

🔍 검증 중...
⚠️  데이터베이스에 없는 한자 7개:
   瘓, 丐, 怒, 奴, 銬, 謊, 狠

✅ 업데이트 완료!
```

## Files Created/Updated

### Scripts
- `/scripts/update-negative-hanja-expanded.ts` - Main update script (183 chars)
- `/scripts/update-negative-hanja.ts` - Original script (52 chars, kept for reference)

### Documentation
- `/docs/negative-hanja-list.md` - Complete character list with meanings
- `/docs/negative-hanja-implementation-summary.md` - Implementation overview
- `/docs/negative-hanja-comparison.md` - Before/after comparison
- `/scripts/README-negative-hanja.md` - This file

## Understanding the Output

### ✅ Success Indicators
- **183개 한자를 작명 부적합으로 표시**: All found characters successfully marked
- **97.9% suitable**: Most characters remain suitable for naming
- **✅ 업데이트 완료**: Script completed successfully

### ⚠️ Warnings (Normal)
- **데이터베이스에 없는 한자 7개**: 7 characters defined in script but not in DB
  - These are likely not in 인명용 한자 (approved naming characters)
  - Can be safely ignored unless they need to be added to database

### ❌ Errors (Need Attention)
If you see database connection errors or update failures, check:
- Database connection (DATABASE_URL environment variable)
- Prisma schema is up to date
- Database migrations are applied

## Database Schema

The script updates the `isGoodForNaming` field:

```prisma
model HanjaDict {
  id              String  @id @default(uuid())
  character       String  @unique
  meaning         String?
  isGoodForNaming Boolean @default(true) // ← This field
  // ... other fields
}
```

## How Filtering Works in Naming System

### Automatic Filtering

```typescript
// Example 1: Get suitable hanja for naming
const suitableHanja = await prisma.hanjaDict.findMany({
  where: {
    isGoodForNaming: true, // ← Filters out negative chars
    element: 'METAL',
  },
});

// Example 2: Find specific suitable characters
const metalChars = await prisma.hanjaDict.findMany({
  where: {
    element: 'METAL',
    isGoodForNaming: true, // ← Excludes 183 negative chars
    strokes: { gte: 5, lte: 15 },
  },
  orderBy: { nameFrequency: 'desc' },
});
```

### Query Performance

The database has indexes on `isGoodForNaming`:
```prisma
@@index([element, isGoodForNaming]) // Optimized for filtered queries
```

## Comparison with Original Script

| Aspect | Original | Expanded | Change |
|--------|----------|----------|--------|
| **Characters** | 52 | 183 | +131 (+252%) |
| **Categories** | 6 | 13 | +7 (+217%) |
| **Gender Logic** | ✅ Included | ❌ Removed | Separated |
| **Validation** | ❌ None | ✅ Complete | Added |
| **Documentation** | ❌ Minimal | ✅ Comprehensive | Added |

## Maintenance

### Adding New Negative Characters

1. Edit `/scripts/update-negative-hanja-expanded.ts`
2. Add character to appropriate category array
3. Update category count in comment
4. Run script to update database

Example:
```typescript
death_disaster: [
  '死', '亡', '喪', // ... existing chars
  '新', // Add new character here
],
```

### Removing Characters

1. Edit the script and remove character from array
2. Run script (it only sets `false`, doesn't reset others)
3. Manually reset if needed:
   ```sql
   UPDATE hanja_dict
   SET is_good_for_naming = true
   WHERE character = '字';
   ```

### Creating New Categories

```typescript
const NEGATIVE_CHARACTERS = {
  // ... existing categories

  new_category: [
    '字', // character
    '字', // character
  ],
};

// Update getCategoryDisplayName() function
function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    // ... existing
    new_category: '새로운 카테고리',
  };
  return names[category] || category;
}
```

## Troubleshooting

### Issue: "데이터베이스에 없는 한자" Warning

**Cause**: Characters defined in script but not in database

**Solutions**:
1. **Ignore**: If characters aren't in 인명용 한자, this is expected
2. **Add to DB**: If they should be included:
   ```sql
   INSERT INTO hanja_dict (character, meaning, strokes, is_good_for_naming)
   VALUES ('字', '의미', 10, false);
   ```
3. **Remove from script**: Delete from character array

### Issue: Database Connection Failed

**Cause**: DATABASE_URL not configured

**Solution**:
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Should see something like:
# DATABASE_URL="postgresql://user:pass@host:5432/db"
```

### Issue: Prisma Client Out of Sync

**Cause**: Schema changes not applied

**Solution**:
```bash
npx prisma generate
npx prisma db push
```

## Testing

### Verify Script Works
```bash
npx tsx scripts/update-negative-hanja-expanded.ts
```

### Check Database Results
```sql
-- Count negative characters
SELECT COUNT(*) FROM hanja_dict WHERE is_good_for_naming = false;
-- Should return: 183

-- List all negative characters
SELECT character, meaning FROM hanja_dict
WHERE is_good_for_naming = false
ORDER BY character;
```

### Test Naming System Integration
```typescript
// Test that negative characters are filtered
const negativeChars = ['死', '病', '貧', '賊', '醜'];
const results = await prisma.hanjaDict.findMany({
  where: {
    character: { in: negativeChars },
    isGoodForNaming: true, // Should return 0 results
  },
});

console.assert(results.length === 0, 'Negative chars should be filtered');
```

## Related Documentation

- **Complete Character List**: `/docs/negative-hanja-list.md`
- **Implementation Summary**: `/docs/negative-hanja-implementation-summary.md`
- **Before/After Comparison**: `/docs/negative-hanja-comparison.md`
- **Database Schema**: `/prisma/schema.prisma` (HanjaDict model)

## Support

For questions or issues:
1. Check the documentation files listed above
2. Review the script comments for detailed explanations
3. Verify database schema and migrations
4. Check environment variables (DATABASE_URL)

## Version History

- **v2.0** (2025-10-17): Expanded to 183 characters, 13 categories
- **v1.0** (Previous): Original 52 characters, 6 categories
