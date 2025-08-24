-- CreateEnum
CREATE TYPE "public"."Element" AS ENUM ('金', '木', '水', '火', '土');

-- CreateEnum
CREATE TYPE "public"."YinYang" AS ENUM ('음', '양');

-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('ok', 'needs_review');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."saju_data" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
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
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "saju_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."naming_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "saju_data_id" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "last_name_hanja" TEXT,
    "first_name_hanja" TEXT,
    "total_strokes" INTEGER NOT NULL,
    "balance_score" DOUBLE PRECISION NOT NULL,
    "sound_score" DOUBLE PRECISION NOT NULL,
    "meaning_score" DOUBLE PRECISION NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "generation_method" TEXT NOT NULL,
    "ai_model" TEXT,
    "ai_prompt" TEXT,
    "preferred_values" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "naming_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "naming_result_id" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hanja_dict" (
    "id" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "meaning" TEXT,
    "strokes" INTEGER,
    "element" "public"."Element",
    "yin_yang" "public"."YinYang",
    "review" "public"."ReviewStatus" NOT NULL DEFAULT 'ok',
    "evidence_json" JSONB,
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
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "hanja_dict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hanja_reading" (
    "id" SERIAL NOT NULL,
    "character" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "sound_elem" "public"."Element",
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "hanja_reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "saju_data_user_id_idx" ON "public"."saju_data"("user_id");

-- CreateIndex
CREATE INDEX "naming_results_user_id_idx" ON "public"."naming_results"("user_id");

-- CreateIndex
CREATE INDEX "naming_results_saju_data_id_idx" ON "public"."naming_results"("saju_data_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_naming_result_id_key" ON "public"."favorites"("user_id", "naming_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "hanja_dict_character_key" ON "public"."hanja_dict"("character");

-- CreateIndex
CREATE INDEX "hanja_dict_element_idx" ON "public"."hanja_dict"("element");

-- CreateIndex
CREATE INDEX "hanja_dict_strokes_idx" ON "public"."hanja_dict"("strokes");

-- CreateIndex
CREATE INDEX "usage_frequency_idx" ON "public"."hanja_dict"("usage_frequency");

-- CreateIndex
CREATE INDEX "hanja_reading_reading_idx" ON "public"."hanja_reading"("reading");

-- CreateIndex
CREATE UNIQUE INDEX "hanja_reading_character_reading_key" ON "public"."hanja_reading"("character", "reading");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "public"."user_sessions"("token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "public"."user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "public"."user_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."saju_data" ADD CONSTRAINT "saju_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."naming_results" ADD CONSTRAINT "naming_results_saju_data_id_fkey" FOREIGN KEY ("saju_data_id") REFERENCES "public"."saju_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."naming_results" ADD CONSTRAINT "naming_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_naming_result_id_fkey" FOREIGN KEY ("naming_result_id") REFERENCES "public"."naming_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
