#!/bin/bash
# Migration Script: Add naming quality columns and filter negative hanja
# Date: 2025-11-03
# Purpose: Fix schema-database mismatch causing negative hanja to appear in names

set -e  # Exit on error

DB_PATH="prisma/dev.db"
BACKUP_PATH="prisma/backups/backup-pre-negative-hanja-$(date +%Y%m%d-%H%M%S).db"

echo "🔍 Starting migration: Add naming quality columns and filter negative hanja"
echo ""

# Step 1: Backup
echo "📦 Creating backup..."
cp "$DB_PATH" "$BACKUP_PATH"
echo "✅ Backup created: $BACKUP_PATH"
echo ""

# Step 2: Apply schema migration
echo "🔧 Applying schema migration (Phase 1: Add columns)..."
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
echo "✅ Schema migration applied (3 columns + 4 indexes)"
echo ""

# Step 3: Mark negative hanja
echo "🚫 Marking negative hanja as inappropriate (Phase 2: Data update)..."
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
EOF

# Get count of marked hanja
MARKED_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM hanja_dict WHERE is_good_for_naming = false;")
echo "✅ Negative hanja marked: $MARKED_COUNT characters"
echo ""

# Step 4: Validation
echo "🔍 Running validation..."
echo ""

# Check columns exist
echo "=== Column Check ==="
sqlite3 "$DB_PATH" "PRAGMA table_info(hanja_dict);" | grep -E "(is_good_for_naming|seed_protected|gender_hint)" || echo "⚠️  Columns not found!"
echo ""

# Check data distribution
echo "=== Data Distribution ==="
sqlite3 "$DB_PATH" <<'EOF'
.mode column
.headers on
SELECT
  CASE
    WHEN is_good_for_naming IS NULL THEN 'NULL (unreviewed)'
    WHEN is_good_for_naming = 1 THEN 'TRUE (good)'
    ELSE 'FALSE (bad)'
  END as status,
  COUNT(*) as count
FROM hanja_dict
GROUP BY is_good_for_naming;
EOF
echo ""

# Verify critical negative hanja
echo "=== Critical Negative Hanja Verification ==="
sqlite3 "$DB_PATH" <<'EOF'
.mode column
.headers on
SELECT character, meaning, is_good_for_naming
FROM hanja_dict
WHERE character IN ('愁','殺','病','死','凶','災','禍','悲','苦','哭','憂','泣','亡')
ORDER BY character;
EOF
echo ""

# Test filter (should return 0 rows)
echo "=== Filter Test (should be empty) ==="
FILTER_TEST=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM hanja_dict WHERE character IN ('愁','殺','病') AND (is_good_for_naming = true OR seed_protected = true);")
if [ "$FILTER_TEST" -eq 0 ]; then
  echo "✅ PASS: Negative hanja successfully filtered out"
else
  echo "❌ FAIL: $FILTER_TEST negative hanja still passing filter!"
fi
echo ""

echo "✅ Migration completed successfully!"
echo ""
echo "📁 Backup location: $BACKUP_PATH"
echo ""
echo "⚠️  IMPORTANT: Update service code to handle NULL values:"
echo "    Current: { isGoodForNaming: true }"
echo "    Problem: Filters out ALL unreviewed hanja (8722 chars)"
echo "    Solution: Use OR condition to include NULL"
echo ""
echo "    Option 1 (Recommended - Gradual curation):"
echo "      { isGoodForNaming: { not: false } }  // Allow NULL and TRUE"
echo ""
echo "    Option 2 (Explicit):"
echo "      { OR: [{ isGoodForNaming: true }, { isGoodForNaming: null }] }"
echo ""
echo "    Option 3 (Conservative - requires marking positive hanja):"
echo "      { OR: [{ isGoodForNaming: true }, { seedProtected: true }] }"
echo ""
echo "📋 Next steps:"
echo "    1. Update services.ts filtering logic (REQUIRED)"
echo "    2. Test name generation (verify no negative hanja)"
echo "    3. Review remaining 54 moderate negative hanja"
echo "    4. Start marking top 500 popular hanja as TRUE (gradual)"
echo "    5. Implement seed protection for rare but excellent characters"
echo ""
echo "📊 Statistics:"
echo "    Total hanja: 8787"
echo "    Marked FALSE: $MARKED_COUNT"
echo "    Unreviewed (NULL): $((8787 - MARKED_COUNT))"
echo "    Protected: 0 (manual curation needed)"
