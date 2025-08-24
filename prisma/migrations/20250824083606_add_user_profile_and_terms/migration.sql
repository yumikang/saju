-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('google', 'kakao', 'naver');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'operator', 'viewer', 'user');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('M', 'F', 'X');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_login_at" TIMESTAMPTZ(3),
ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'user',
ADD COLUMN     "status" "public"."UserStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "public"."user_oauth" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "public"."AuthProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "email" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "profile_image" TEXT,
    "profile_raw" JSONB,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMPTZ(3),
    "linked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_oauth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "before_value" JSONB,
    "after_value" JSONB,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_profiles" (
    "user_id" TEXT NOT NULL,
    "nickname" TEXT,
    "gender" "public"."Gender",
    "birth_date" DATE,
    "phone" TEXT,
    "bio" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."terms_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "tos_agreed" BOOLEAN NOT NULL,
    "privacy_agreed" BOOLEAN NOT NULL,
    "marketing_agreed" BOOLEAN NOT NULL DEFAULT false,
    "agreed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "terms_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_oauth_user_id_idx" ON "public"."user_oauth"("user_id");

-- CreateIndex
CREATE INDEX "user_oauth_email_idx" ON "public"."user_oauth"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_oauth_provider_provider_user_id_key" ON "public"."user_oauth"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_actor_id_idx" ON "public"."admin_audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_idx" ON "public"."admin_audit_logs"("action");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_type_target_id_idx" ON "public"."admin_audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_created_at_idx" ON "public"."admin_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "terms_consents_user_id_version_idx" ON "public"."terms_consents"("user_id", "version");

-- CreateIndex
CREATE INDEX "terms_consents_agreed_at_idx" ON "public"."terms_consents"("agreed_at");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- AddForeignKey
ALTER TABLE "public"."user_oauth" ADD CONSTRAINT "user_oauth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."terms_consents" ADD CONSTRAINT "terms_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
