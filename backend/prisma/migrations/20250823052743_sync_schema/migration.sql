/*
  Warnings:

  - You are about to drop the column `createdAt` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `coupon_usage` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `product_attributes` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `product_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `product_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `wishlist` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `wishlist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."audit_log" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."coupon_usage" DROP COLUMN "usedAt",
ADD COLUMN     "used_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."notifications" DROP COLUMN "readAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "read_at" TIMESTAMPTZ(6),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."product_attributes" DROP COLUMN "updatedAt",
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."product_images" DROP COLUMN "updatedAt",
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."product_reviews" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."user_addresses" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."wishlist" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;
