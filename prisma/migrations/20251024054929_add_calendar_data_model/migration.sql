-- CreateEnum
CREATE TYPE "ZodiacAnimal" AS ENUM ('쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지');

-- CreateTable
CREATE TABLE "calendar_data" (
    "cd_no" SERIAL NOT NULL,
    "cd_sgi" INTEGER NOT NULL,
    "cd_sy" INTEGER NOT NULL,
    "cd_sm" INTEGER NOT NULL,
    "cd_sd" INTEGER NOT NULL,
    "cd_ly" INTEGER NOT NULL,
    "cd_lm" INTEGER NOT NULL,
    "cd_ld" INTEGER NOT NULL,
    "cd_hyganjee" VARCHAR(6),
    "cd_kyganjee" VARCHAR(6),
    "cd_hmganjee" VARCHAR(6),
    "cd_kmganjee" VARCHAR(6),
    "cd_hdganjee" VARCHAR(6),
    "cd_kdganjee" VARCHAR(6),
    "cd_hweek" CHAR(3),
    "cd_kweek" CHAR(3),
    "cd_week" CHAR(3),
    "cd_stars" CHAR(3),
    "cd_moon_state" CHAR(3),
    "cd_moon_time" VARCHAR(12),
    "cd_leap_month" BOOLEAN NOT NULL DEFAULT false,
    "cd_month_size" INTEGER NOT NULL DEFAULT 0,
    "cd_hterms" VARCHAR(6),
    "cd_kterms" VARCHAR(6),
    "cd_terms_time" VARCHAR(12),
    "cd_keventday" VARCHAR(6),
    "cd_dogday" VARCHAR(6),
    "cd_ddi" "ZodiacAnimal" NOT NULL,
    "cd_sol_plan" VARCHAR(50),
    "cd_lun_plan" VARCHAR(50),
    "holiday" INTEGER NOT NULL DEFAULT 0,
    "cd_kk" BOOLEAN NOT NULL DEFAULT false,
    "data_source" VARCHAR(20),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "calendar_data_pkey" PRIMARY KEY ("cd_no")
);

-- CreateIndex
CREATE INDEX "solar_date_idx" ON "calendar_data"("cd_sy", "cd_sm", "cd_sd");

-- CreateIndex
CREATE INDEX "lunar_date_idx" ON "calendar_data"("cd_ly", "cd_lm", "cd_ld");

-- CreateIndex
CREATE INDEX "calendar_data_cd_sy_idx" ON "calendar_data"("cd_sy");

-- CreateIndex
CREATE INDEX "calendar_data_cd_ly_idx" ON "calendar_data"("cd_ly");

-- CreateIndex
CREATE INDEX "calendar_data_holiday_idx" ON "calendar_data"("holiday");

-- CreateIndex
CREATE INDEX "calendar_data_cd_ddi_idx" ON "calendar_data"("cd_ddi");

-- CreateIndex
CREATE INDEX "calendar_data_cd_kterms_idx" ON "calendar_data"("cd_kterms");

-- CreateIndex
CREATE INDEX "calendar_data_cd_leap_month_idx" ON "calendar_data"("cd_leap_month");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_data_cd_sy_cd_sm_cd_sd_key" ON "calendar_data"("cd_sy", "cd_sm", "cd_sd");
