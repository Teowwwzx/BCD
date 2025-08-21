/*
  Warnings:

  - You are about to drop the column `created_at` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `used_at` on the `coupon_usage` table. All the data in the column will be lost.
  - You are about to drop the column `read_at` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `confirmed_at` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `product_attributes` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `product_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `product_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `user_wallets` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `user_wallets` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `wishlist` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `wishlist` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION');

-- AlterTable
ALTER TABLE "public"."audit_log" DROP COLUMN "created_at",
ADD COLUMN     "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."coupon_usage" DROP COLUMN "used_at",
ADD COLUMN     "usedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."notifications" DROP COLUMN "read_at",
DROP COLUMN "updated_at",
ADD COLUMN     "readAt" TIMESTAMPTZ(6),
ADD COLUMN     "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."payment_transactions" DROP COLUMN "confirmed_at",
ADD COLUMN     "confirmedAt" TIMESTAMPTZ(6),
ALTER COLUMN "payment_method" SET DEFAULT 'blockchain';

-- AlterTable
ALTER TABLE "public"."product_attributes" DROP COLUMN "updated_at",
ADD COLUMN     "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."product_images" DROP COLUMN "updated_at",
ADD COLUMN     "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."product_reviews" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."user_addresses" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."user_wallets" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."wishlist" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "public"."tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "type" "public"."TokenType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "public"."tokens"("token");

-- AddForeignKey
ALTER TABLE "public"."tokens" ADD CONSTRAINT "tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
