-- Migration Queries: Add naming quality columns and filter negative hanja
-- Date: 2025-11-03
-- Database: SQLite (prisma/dev.db)
--
-- USAGE:
--   sqlite3 prisma/dev.db < scripts/migration-queries.sql
--
-- BACKUP FIRST:
--   cp prisma/dev.db prisma/backups/backup-$(date +%Y%m%d-%H%M%S).db

-- ============================================================
-- PHASE 1: ADD MISSING COLUMNS
-- ============================================================

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

-- ============================================================
-- PHASE 2: MARK NEGATIVE HANJA
-- ============================================================

-- Category 1: Death/Killing (17 characters)
-- Characters that literally mean death, killing, or premature death
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '死',  -- 죽을 (die)
  '殺',  -- 죽일 (kill)
  '弒',  -- 죽일 (kill a superior)
  '戕',  -- 죽일 (injure/kill)
  '戮',  -- 죽일 (kill/slaughter)
  '斃',  -- 죽을 (die/fall dead)
  '歿',  -- 죽을 (die)
  '殀',  -- 일찍죽을 (die young)
  '殂',  -- 죽을 (die)
  '殍',  -- 주려죽을 (starve to death)
  '殘',  -- 해칠 (harm/injure)
  '殞',  -- 죽을 (die)
  '殤',  -- 일찍죽을 (die young)
  '煞',  -- 죽일 (kill)
  '獘',  -- 죽을 (die/collapse)
  '夭',  -- 일찍죽을 (die young)
  '薨'   -- 죽을 (die - royal)
);

-- Category 2: Disease/Illness (9 characters)
-- Characters meaning disease, sickness, or pain
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '病',  -- 병 (disease)
  '疴',  -- 병 (illness)
  '疼',  -- 아플 (ache/pain)
  '疾',  -- 병 (disease/illness)
  '痛',  -- 아플 (pain/ache)
  '瘁',  -- 병들 (be sick/exhausted)
  '瘐',  -- 병들 (fall ill in prison)
  '癉',  -- 병들 (be sick)
  '恙'   -- 병 (illness)
);

-- Category 3: Disaster/Calamity (8 characters)
-- Characters meaning disaster, calamity, or misfortune
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '災',  -- 재앙 (disaster)
  '灾',  -- 재앙 (disaster - variant)
  '禍',  -- 재화 (calamity)
  '殃',  -- 재앙 (disaster/misfortune)
  '戹',  -- 재앙 (disaster)
  '厄',  -- 재앙 (disaster/hardship)
  '阨',  -- 재앙 (disaster)
  '祅'   -- 재앙 (evil omen)
);

-- Category 4: Evil/Wickedness (3 characters)
-- Characters meaning evil, wickedness, or inauspicious
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '凶',  -- 흉할 (evil/inauspicious)
  '兇',  -- 흉악할 (vicious/fierce)
  '慝'   -- 악할 (evil/wicked)
);

-- Category 5: Extreme Sorrow/Grief (6 characters)
-- Only the most severe sorrow characters (not all 근심 variants)
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '愁',  -- 근심할 (worry/anxiety) - commonly used in bad names
  '憂',  -- 근심 (worry/anxiety)
  '悲',  -- 슬플 (sad/sorrowful)
  '哀',  -- 슬플 (sorrow/grief)
  '慘',  -- 슬플 (miserable/tragic)
  '憯'   -- 비통할 (sorrowful/grieved)
);

-- Category 6: Danger/Harm (4 characters)
-- Characters meaning danger or causing harm
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '僙',  -- 위험스러울 (dangerous)
  '殆',  -- 위험할 (dangerous/perilous)
  '忮',  -- 해칠 (harm/injure)
  '披'   -- 해칠 (split/tear - can mean harm)
);

-- Category 7: Destruction/Ruin (5 characters)
-- Characters meaning destruction, ruin, or moral failing
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '儡',  -- 망칠 (ruin/spoil)
  '敗',  -- 패할 (defeat/fail)
  '頊',  -- 망할 (perish/decline)
  '罪',  -- 허물 (crime/sin)
  '辜'   -- 허물 (crime/sin)
);

-- Category 8: Deceit/Fraud (10 characters)
-- Major characters meaning deception or fraud
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '僞',  -- 거짓 (false/fake)
  '欺',  -- 속일 (deceive)
  '瞞',  -- 속일 (deceive/hide)
  '罔',  -- 속일 (deceive/mislead)
  '詐',  -- 속일 (cheat/deceive)
  '詫',  -- 속일 (deceive)
  '誆',  -- 속일 (deceive/swindle)
  '誑',  -- 속일 (deceive/cheat)
  '騙',  -- 속일 (deceive/cheat)
  '拐'   -- 속일 (kidnap/deceive)
);

-- Category 9: Poverty (2 characters)
-- Characters meaning poverty or lack
UPDATE hanja_dict SET is_good_for_naming = false
WHERE character IN (
  '窶',  -- 가난할 (poor/impoverished)
  '貧'   -- 가난할 (poor/poverty)
);

-- Total marked: 65 characters with objectively negative meanings

-- ============================================================
-- VALIDATION QUERIES
-- ============================================================

-- Check column existence
.schema hanja_dict

-- Check data distribution
SELECT
  CASE
    WHEN is_good_for_naming IS NULL THEN 'NULL (unreviewed)'
    WHEN is_good_for_naming = 1 THEN 'TRUE (good)'
    ELSE 'FALSE (bad)'
  END as status,
  COUNT(*) as count
FROM hanja_dict
GROUP BY is_good_for_naming;

-- Verify critical negative hanja marked
SELECT character, meaning, is_good_for_naming
FROM hanja_dict
WHERE character IN ('愁','殺','病','死','凶','災','禍','悲','苦','哭','憂','泣','亡')
ORDER BY character;

-- Test filter (should return 0 rows)
SELECT character, meaning
FROM hanja_dict
WHERE character IN ('愁','殺','病')
  AND (is_good_for_naming = true OR seed_protected = true);

-- Expected: 0 rows (negative hanja completely filtered)

-- ============================================================
-- ROLLBACK QUERIES (if needed)
-- ============================================================

-- WARNING: This will undo all changes!
-- Only use if migration fails or needs to be reverted

-- Reset is_good_for_naming to NULL
-- UPDATE hanja_dict SET is_good_for_naming = NULL;

-- Reset seed_protected to false
-- UPDATE hanja_dict SET seed_protected = false;

-- Drop columns (SQLite doesn't support DROP COLUMN easily)
-- You'll need to restore from backup instead
-- cp prisma/backups/backup-TIMESTAMP.db prisma/dev.db

-- ============================================================
-- OPTIONAL: MARK POSITIVE HANJA (Phase 3)
-- ============================================================

-- NOTE: Run this ONLY after manual review
-- DO NOT run automatically without human curation

-- Example: Mark high-frequency naming hanja as good
-- UPDATE hanja_dict
-- SET is_good_for_naming = true
-- WHERE name_frequency >= 100
--   AND is_good_for_naming IS NULL
--   AND is_surname = false;

-- Example: Protect rare but excellent characters
-- UPDATE hanja_dict
-- SET seed_protected = true
-- WHERE character IN (
--   -- Add manually curated list here
--   '睿', '瑞', '瑛', '璟', '瓏'
-- );

-- ============================================================
-- USEFUL QUERIES FOR ONGOING CURATION
-- ============================================================

-- Find all unreviewed hanja (NULL)
SELECT character, meaning, strokes, element, name_frequency
FROM hanja_dict
WHERE is_good_for_naming IS NULL
  AND is_surname = false
ORDER BY name_frequency DESC
LIMIT 100;

-- Find hanja marked FALSE (for review)
SELECT character, meaning, strokes, element
FROM hanja_dict
WHERE is_good_for_naming = false
ORDER BY character;

-- Find protected hanja
SELECT character, meaning, strokes, element, name_frequency
FROM hanja_dict
WHERE seed_protected = true
ORDER BY character;

-- Count by status
SELECT
  CASE
    WHEN is_good_for_naming IS NULL THEN 'Unreviewed'
    WHEN is_good_for_naming = 1 THEN 'Good'
    ELSE 'Bad'
  END as status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM hanja_dict), 2) as percentage
FROM hanja_dict
GROUP BY is_good_for_naming;

-- Find potential negative hanja for manual review
SELECT character, meaning, strokes, element
FROM hanja_dict
WHERE (
  meaning LIKE '%근심%' OR
  meaning LIKE '%울%' OR
  meaning LIKE '%원망%' OR
  meaning LIKE '%괴로%' OR
  meaning LIKE '%낙망%'
)
AND is_good_for_naming IS NULL
ORDER BY character;
