# Korean Surname Protection - Quick Implementation Guide

**Status**: ✅ Ready for implementation
**Risk Level**: 🟢 LOW
**Estimated Time**: 30 minutes

---

## TL;DR

Add `isSurname: false` to all first-name hanja queries to prevent surnames from appearing in generated first names.

**Impact**: Filters out 132 surname hanja (1.5% of database), leaves 8,655 hanja for first names.

---

## Quick Start (5 Steps)

### Step 1: Update Prisma Schema (2 min)

Edit `prisma/schema.prisma`:

```diff
model HanjaDict {
  // ... existing fields ...
  isGoodForNaming  Boolean      @default(true) @map("is_good_for_naming")
+ isSurname        Boolean      @default(false) @map("is_surname")
  createdAt        DateTime     @default(now()) @map("created_at") @db.Timestamptz(3)

  @@index([element, isGoodForNaming])
+ @@index([element, isSurname])
+ @@index([isSurname])
}
```

Generate Prisma client:
```bash
npx prisma generate
```

### Step 2: Run Database Migration (5 min)

**IMPORTANT**: Backup database first!

```bash
# Option A: Use Prisma migrate
npx prisma migrate deploy

# Option B: Run SQL directly
psql $DATABASE_URL < prisma/migrations/20251030_add_surname_protection/migration.sql
```

### Step 3: Update Application Code (10 min)

Find all `hanjaDict.findMany()` calls that query for **first name characters**.

**Before**:
```typescript
const hanja = await prisma.hanjaDict.findMany({
  where: {
    element: targetElement,
    isGoodForNaming: true,
    strokes: { gte: minStrokes, lte: maxStrokes }
  }
});
```

**After**:
```typescript
const hanja = await prisma.hanjaDict.findMany({
  where: {
    element: targetElement,
    isGoodForNaming: true,
    isSurname: false,  // ← ADD THIS
    strokes: { gte: minStrokes, lte: maxStrokes }
  }
});
```

**⚠️ IMPORTANT**: Only add this filter for FIRST NAME queries, NOT for surname/last name queries!

### Step 4: Verify Migration (3 min)

Run verification script:

```bash
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

✅ ALL TESTS PASSED
```

### Step 5: Test Naming Algorithm (10 min)

Generate test names and verify no surnames in first name position:

```typescript
import { generateNames } from './naming-algorithm';
import { isSurnameHanja } from './korean-surnames.data';

async function testNoSurnames() {
  const results = await generateNames(100);

  for (const name of results) {
    const firstNameChars = name.firstNameHanja.split('');
    for (const char of firstNameChars) {
      if (isSurnameHanja(char)) {
        console.error(`❌ Found surname ${char} in first name: ${name.fullName}`);
        return false;
      }
    }
  }

  console.log('✅ No surnames found in 100 generated names');
  return true;
}
```

---

## Files Reference

### Generated Files

| File | Purpose |
|------|---------|
| `scripts/extract-surname-hanja.ts` | Extract 132 surnames from data |
| `scripts/analyze-surname-impact.ts` | Comprehensive impact analysis |
| `scripts/verify-surname-migration.ts` | Post-migration verification |
| `scripts/sql-migrations-surname-protection.sql` | Raw SQL scripts |
| `prisma/migrations/20251030_add_surname_protection/migration.sql` | Prisma migration |
| `SURNAME_PROTECTION_REPORT.md` | Full analysis report |
| `SURNAME_IMPLEMENTATION_GUIDE.md` | This file |

### 132 Surname Characters

```
丁 丘 于 京 任 伍 元 全 兪 公
具 劉 千 卓 南 卜 卞 印 原 史
吉 吳 呂 周 咸 嚴 國 夏 天 奇
姜 孔 孟 孫 安 宋 宣 宮 尹 崔
康 廉 延 張 强 徐 慕 慶 成 房
扈 文 方 施 明 星 晉 智 曺 朱
朴 李 杜 林 柳 梁 楊 權 殷 毛
池 沈 河 洪 潘 燕 片 牟 玄 玉
王 琴 田 申 白 皮 盛 盧 睦 石
禁 禹 秋 秦 箕 紀 羅 莊 蔡 蔣
薛 蘇 表 裴 裵 許 諸 賈 趙 車
辛 邢 邵 郭 都 鄭 金 閔 陳 陶
陸 韋 韓 顧 馬 高 魏 魚 魯 鮮
黃 龍
```

---

## Code Locations to Update

Search your codebase for these patterns and add `isSurname: false`:

### Pattern 1: Element-based queries
```typescript
// Search for: prisma.hanjaDict.findMany + element
where: {
  element: ...,
  isSurname: false  // ADD THIS
}
```

### Pattern 2: Stroke-based queries
```typescript
// Search for: prisma.hanjaDict.findMany + strokes
where: {
  strokes: { ... },
  isSurname: false  // ADD THIS
}
```

### Pattern 3: Name generation queries
```typescript
// Search for: naming algorithm, first name, 이름
where: {
  isGoodForNaming: true,
  isSurname: false  // ADD THIS
}
```

### ⚠️ DO NOT UPDATE

- Surname/last name queries (these SHOULD use surnames)
- Analysis/statistics queries
- Admin panel surname displays

---

## Verification Checklist

After implementing, verify:

- [ ] Database has exactly 132 surnames marked (`isSurname: true`)
- [ ] All queries for first names include `isSurname: false`
- [ ] Naming algorithm generates 0 surnames in first names
- [ ] Query performance is acceptable (<1 second)
- [ ] No errors in application logs
- [ ] User-facing naming service works correctly

---

## Rollback Plan

If issues occur:

```sql
-- Quick rollback (removes filtering, keeps column)
UPDATE "hanja_dict" SET "is_surname" = false;

-- Full rollback (removes column entirely)
ALTER TABLE "hanja_dict" DROP COLUMN "is_surname";
```

Then remove `isSurname: false` from application code.

---

## FAQ

**Q: Will this affect existing names in the database?**
A: No, this only affects NEW name generation. Existing names are unchanged.

**Q: What if a user specifically wants a surname in their first name?**
A: This is culturally inappropriate in Korean naming, but you could add a future feature for advanced users with a warning.

**Q: How do I test this locally?**
A: Run `npx tsx scripts/verify-surname-migration.ts` after migration.

**Q: What's the performance impact?**
A: Negligible. Indexes added ensure queries remain fast (<1s).

**Q: Can I customize the surname list?**
A: Yes, edit the UPDATE query in the migration SQL to add/remove characters.

---

## Support

For issues or questions:
1. Check `SURNAME_PROTECTION_REPORT.md` for detailed analysis
2. Run verification script: `npx tsx scripts/verify-surname-migration.ts`
3. Review SQL scripts in `scripts/sql-migrations-surname-protection.sql`

---

**Last Updated**: 2025-10-30
**Version**: 1.0
