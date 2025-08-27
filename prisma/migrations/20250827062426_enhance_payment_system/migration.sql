-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('card', 'bank_transfer', 'kakao_pay', 'naver_pay', 'toss');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('KRW', 'USD');

-- CreateEnum
CREATE TYPE "public"."PaymentEventType" AS ENUM ('requested', 'approved', 'failed', 'cancelled', 'refunded', 'webhook_received');

-- CreateEnum
CREATE TYPE "public"."ServiceType" AS ENUM ('naming', 'renaming', 'saju_compatibility');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('pending', 'paid', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'KRW',
    "paid_at" TIMESTAMPTZ(3),
    "failed_at" TIMESTAMPTZ(3),
    "refunded_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_events" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "event_type" "public"."PaymentEventType" NOT NULL,
    "status" "public"."PaymentStatus",
    "amount" INTEGER,
    "currency" "public"."Currency",
    "message" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_type" "public"."ServiceType" NOT NULL,
    "status" "public"."OrderStatus" NOT NULL,
    "price" INTEGER NOT NULL,
    "result_data" JSONB,
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_service_order_id_key" ON "public"."payments"("service_order_id");

-- CreateIndex
CREATE INDEX "payments_user_id_created_at_idx" ON "public"."payments"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payments_user_id_status_created_at_idx" ON "public"."payments"("user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payments_transaction_id_idx" ON "public"."payments"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_transaction_id_key" ON "public"."payments"("provider", "transaction_id");

-- CreateIndex
CREATE INDEX "payment_events_payment_id_created_at_idx" ON "public"."payment_events"("payment_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payment_events_event_type_idx" ON "public"."payment_events"("event_type");

-- CreateIndex
CREATE INDEX "payment_events_created_at_idx" ON "public"."payment_events"("created_at");

-- CreateIndex
CREATE INDEX "service_orders_user_id_idx" ON "public"."service_orders"("user_id");

-- CreateIndex
CREATE INDEX "service_orders_service_type_idx" ON "public"."service_orders"("service_type");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "public"."service_orders"("status");

-- CreateIndex
CREATE INDEX "service_orders_created_at_idx" ON "public"."service_orders"("created_at");

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_events" ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_orders" ADD CONSTRAINT "service_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
