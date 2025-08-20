-- CreateTable
CREATE TABLE "hanja_reading" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "character" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "sound_elem" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_hanja_dict" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "character" TEXT NOT NULL,
    "meaning" TEXT,
    "strokes" INTEGER,
    "element" TEXT,
    "yin_yang" TEXT,
    "review" TEXT NOT NULL DEFAULT 'ok',
    "evidence_json" TEXT,
    "decided_by" TEXT,
    "ruleset" TEXT,
    "codepoint" INTEGER,
    "korean_reading" TEXT,
    "chinese_reading" TEXT,
    "radical" TEXT,
    "usage_frequency" INTEGER DEFAULT 0,
    "name_frequency" INTEGER DEFAULT 0,
    "category" TEXT,
    "gender" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_hanja_dict" ("category", "character", "chinese_reading", "created_at", "element", "gender", "id", "korean_reading", "meaning", "name_frequency", "radical", "strokes", "updated_at", "usage_frequency") SELECT "category", "character", "chinese_reading", "created_at", "element", "gender", "id", "korean_reading", "meaning", "name_frequency", "radical", "strokes", "updated_at", "usage_frequency" FROM "hanja_dict";
DROP TABLE "hanja_dict";
ALTER TABLE "new_hanja_dict" RENAME TO "hanja_dict";
CREATE UNIQUE INDEX "hanja_dict_character_key" ON "hanja_dict"("character");
CREATE INDEX "hanja_dict_element_idx" ON "hanja_dict"("element");
CREATE INDEX "hanja_dict_strokes_idx" ON "hanja_dict"("strokes");
CREATE INDEX "usage_frequency_idx" ON "hanja_dict"("usage_frequency");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "hanja_reading_reading_idx" ON "hanja_reading"("reading");

-- CreateIndex
CREATE UNIQUE INDEX "hanja_reading_character_reading_key" ON "hanja_reading"("character", "reading");
