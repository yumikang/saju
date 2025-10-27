-- AlterTable
ALTER TABLE "naming_payments" ADD COLUMN     "unlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unlocked_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "naming_sessions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL DEFAULT NOW() + interval '7 days',
    "last_name" TEXT NOT NULL,
    "last_name_strokes" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "birth_time" TEXT NOT NULL,
    "is_lunar" BOOLEAN NOT NULL,
    "selected_values" TEXT[],
    "saju" JSONB NOT NULL,
    "yongsin" JSONB NOT NULL,
    "top5" JSONB NOT NULL,
    "remaining15" JSONB NOT NULL,
    "allCandidates" JSONB NOT NULL,
    "payment_id" TEXT,

    CONSTRAINT "naming_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "naming_sessions_payment_id_key" ON "naming_sessions"("payment_id");

-- CreateIndex
CREATE INDEX "naming_sessions_created_at_idx" ON "naming_sessions"("created_at");

-- CreateIndex
CREATE INDEX "naming_sessions_expires_at_idx" ON "naming_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "naming_sessions_payment_id_idx" ON "naming_sessions"("payment_id");

-- CreateIndex
CREATE INDEX "naming_payments_unlocked_idx" ON "naming_payments"("unlocked");

-- AddForeignKey
ALTER TABLE "naming_sessions" ADD CONSTRAINT "naming_sessions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "naming_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
