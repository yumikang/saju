-- ============================================================
-- KOREAN SURNAME PROTECTION SQL MIGRATION
-- ============================================================
-- Purpose: Add isSurname column and mark 132 surname hanja
-- to prevent them from appearing in first name generation
--
-- Impact: 132 surnames / 8,787 total (1.5% reduction)
-- Remaining pool: 8,655 hanja (99.85%)
-- ============================================================

-- Script 1: Add isSurname column to schema
-- ============================================================
ALTER TABLE "hanja_dict"
ADD COLUMN "is_surname" BOOLEAN NOT NULL DEFAULT false;

-- Create index for efficient filtering
CREATE INDEX "hanja_dict_is_surname_idx" ON "hanja_dict"("is_surname");

-- Create compound index for common query pattern (element + is_surname)
CREATE INDEX "hanja_dict_element_surname_idx" ON "hanja_dict"("element", "is_surname");


-- Script 2: Mark all 132 Korean surname hanja
-- ============================================================
-- Source: korean-surnames.data.ts (Top 100 surnames, 95% coverage)
-- Extracted: 132 unique hanja characters (including compound surnames)
-- ============================================================

UPDATE "hanja_dict"
SET "is_surname" = true
WHERE "character" IN (
  '丁', '丘', '于', '京', '任', '伍', '元', '全', '兪', '公',
  '具', '劉', '千', '卓', '南', '卜', '卞', '印', '原', '史',
  '吉', '吳', '呂', '周', '咸', '嚴', '國', '夏', '天', '奇',
  '姜', '孔', '孟', '孫', '安', '宋', '宣', '宮', '尹', '崔',
  '康', '廉', '延', '張', '强', '徐', '慕', '慶', '成', '房',
  '扈', '文', '方', '施', '明', '星', '晉', '智', '曺', '朱',
  '朴', '李', '杜', '林', '柳', '梁', '楊', '權', '殷', '毛',
  '池', '沈', '河', '洪', '潘', '燕', '片', '牟', '玄', '玉',
  '王', '琴', '田', '申', '白', '皮', '盛', '盧', '睦', '石',
  '禁', '禹', '秋', '秦', '箕', '紀', '羅', '莊', '蔡', '蔣',
  '薛', '蘇', '表', '裴', '裵', '許', '諸', '賈', '趙', '車',
  '辛', '邢', '邵', '郭', '都', '鄭', '金', '閔', '陳', '陶',
  '陸', '韋', '韓', '顧', '馬', '高', '魏', '魚', '魯', '鮮',
  '黃', '龍'
);


-- Script 3: Verification queries
-- ============================================================

-- Verify surname count
SELECT COUNT(*) as surname_count
FROM "hanja_dict"
WHERE "is_surname" = true;
-- Expected: 132

-- Check element distribution of surnames
SELECT element, COUNT(*) as count
FROM "hanja_dict"
WHERE "is_surname" = true
GROUP BY element
ORDER BY count DESC;

-- Top 10 most frequent surnames (by name_frequency)
SELECT character, element, name_frequency, strokes
FROM "hanja_dict"
WHERE "is_surname" = true
ORDER BY name_frequency DESC NULLS LAST
LIMIT 10;

-- Remaining usable hanja for first names
SELECT COUNT(*) as available_for_first_names
FROM "hanja_dict"
WHERE "is_surname" = false
  AND "is_good_for_naming" = true;
-- Expected: ~8,655


-- Script 4: Update WHERE clauses in application queries
-- ============================================================
-- BEFORE:
-- SELECT * FROM hanja_dict
-- WHERE element = ?
--   AND is_good_for_naming = true
--   AND strokes BETWEEN ? AND ?
--
-- AFTER:
-- SELECT * FROM hanja_dict
-- WHERE element = ?
--   AND is_good_for_naming = true
--   AND is_surname = false  -- ← ADD THIS
--   AND strokes BETWEEN ? AND ?


-- Script 5: Rollback (if needed)
-- ============================================================
-- To rollback the changes:
/*
-- Remove surname flag
UPDATE "hanja_dict" SET "is_surname" = false WHERE "is_surname" = true;

-- Drop indexes
DROP INDEX IF EXISTS "hanja_dict_is_surname_idx";
DROP INDEX IF EXISTS "hanja_dict_element_surname_idx";

-- Drop column
ALTER TABLE "hanja_dict" DROP COLUMN "is_surname";
*/


-- ============================================================
-- DEPLOYMENT CHECKLIST
-- ============================================================
-- [ ] Backup database before migration
-- [ ] Run Script 1 (ADD COLUMN + INDEXES)
-- [ ] Run Script 2 (UPDATE surnames)
-- [ ] Run Script 3 (VERIFICATION)
-- [ ] Update application code:
--     - Add isSurname to Prisma schema
--     - Run prisma generate
--     - Update naming algorithm WHERE clauses
--     - Add isSurname: false to all first name queries
-- [ ] Test naming algorithm with new filter
-- [ ] Verify no surnames in generated first names
-- [ ] Deploy to production
-- ============================================================
