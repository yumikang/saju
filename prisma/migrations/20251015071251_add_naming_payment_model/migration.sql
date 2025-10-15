-- CreateEnum
CREATE TYPE "TossPaymentStatus" AS ENUM ('pending', 'ready', 'in_progress', 'done', 'canceled', 'failed', 'expired');

-- CreateTable
CREATE TABLE "naming_payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "saju_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "payment_key" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "TossPaymentStatus" NOT NULL,
    "method" TEXT,
    "order_name" TEXT NOT NULL DEFAULT '사주 작명 결과 프리미엄 조회',
    "requested_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "failed_at" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3),
    "failure_code" TEXT,
    "failure_message" TEXT,
    "receipt_url" TEXT,
    "card_info" JSONB,

    CONSTRAINT "naming_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "naming_payments_order_id_key" ON "naming_payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "naming_payments_payment_key_key" ON "naming_payments"("payment_key");

-- CreateIndex
CREATE INDEX "naming_payments_user_id_status_idx" ON "naming_payments"("user_id", "status");

-- CreateIndex
CREATE INDEX "naming_payments_saju_id_idx" ON "naming_payments"("saju_id");

-- CreateIndex
CREATE INDEX "naming_payments_order_id_idx" ON "naming_payments"("order_id");

-- CreateIndex
CREATE INDEX "naming_payments_payment_key_idx" ON "naming_payments"("payment_key");

-- CreateIndex
CREATE INDEX "naming_payments_status_idx" ON "naming_payments"("status");

-- CreateIndex
CREATE INDEX "naming_payments_requested_at_idx" ON "naming_payments"("requested_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "naming_payments_user_id_saju_id_key" ON "naming_payments"("user_id", "saju_id");

-- AddForeignKey
ALTER TABLE "naming_payments" ADD CONSTRAINT "naming_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
