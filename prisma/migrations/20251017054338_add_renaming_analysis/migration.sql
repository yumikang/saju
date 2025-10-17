-- CreateTable
CREATE TABLE "renaming_analyses" (
    "id" TEXT NOT NULL,
    "birth_date" TEXT NOT NULL,
    "birth_time" TEXT NOT NULL,
    "is_lunar" BOOLEAN NOT NULL,
    "current_name_hanja" TEXT NOT NULL,
    "current_score" DOUBLE PRECISION NOT NULL,
    "saju_data" JSONB NOT NULL,
    "analysis_data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "renaming_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "renaming_analyses_created_at_idx" ON "renaming_analyses"("created_at");
