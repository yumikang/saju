-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "saju_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birth_date" DATETIME NOT NULL,
    "birth_time" TEXT NOT NULL,
    "is_lunar" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT NOT NULL,
    "year_gan" TEXT NOT NULL,
    "year_ji" TEXT NOT NULL,
    "month_gan" TEXT NOT NULL,
    "month_ji" TEXT NOT NULL,
    "day_gan" TEXT NOT NULL,
    "day_ji" TEXT NOT NULL,
    "hour_gan" TEXT NOT NULL,
    "hour_ji" TEXT NOT NULL,
    "wood_count" INTEGER NOT NULL,
    "fire_count" INTEGER NOT NULL,
    "earth_count" INTEGER NOT NULL,
    "metal_count" INTEGER NOT NULL,
    "water_count" INTEGER NOT NULL,
    "primary_yongsin" TEXT,
    "secondary_yongsin" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "saju_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "naming_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "saju_data_id" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "last_name_hanja" TEXT,
    "first_name_hanja" TEXT,
    "total_strokes" INTEGER NOT NULL,
    "balance_score" REAL NOT NULL,
    "sound_score" REAL NOT NULL,
    "meaning_score" REAL NOT NULL,
    "overall_score" REAL NOT NULL,
    "generation_method" TEXT NOT NULL,
    "ai_model" TEXT,
    "ai_prompt" TEXT,
    "preferred_values" JSONB,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "naming_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "naming_results_saju_data_id_fkey" FOREIGN KEY ("saju_data_id") REFERENCES "saju_data" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "naming_result_id" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_naming_result_id_fkey" FOREIGN KEY ("naming_result_id") REFERENCES "naming_results" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hanja_dict" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "character" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "korean_reading" TEXT NOT NULL,
    "chinese_reading" TEXT,
    "strokes" INTEGER NOT NULL,
    "radical" TEXT,
    "element" TEXT NOT NULL,
    "usage_frequency" INTEGER NOT NULL DEFAULT 0,
    "name_frequency" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "gender" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "saju_data_user_id_idx" ON "saju_data"("user_id");

-- CreateIndex
CREATE INDEX "naming_results_user_id_idx" ON "naming_results"("user_id");

-- CreateIndex
CREATE INDEX "naming_results_saju_data_id_idx" ON "naming_results"("saju_data_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_naming_result_id_key" ON "favorites"("user_id", "naming_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "hanja_dict_character_key" ON "hanja_dict"("character");

-- CreateIndex
CREATE INDEX "hanja_dict_element_idx" ON "hanja_dict"("element");

-- CreateIndex
CREATE INDEX "hanja_dict_strokes_idx" ON "hanja_dict"("strokes");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");
