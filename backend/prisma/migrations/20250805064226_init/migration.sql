-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('Manufacturer', 'Supplier', 'Distributor', 'Retailer', 'Logistics');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('Available', 'InEscrow', 'Sold', 'Delisted');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('AwaitingPayment', 'AwaitingShipment', 'InTransit', 'Delivered', 'Completed', 'Disputed', 'Cancelled');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(42) NOT NULL,
    "username" VARCHAR(50),
    "email" VARCHAR(255),
    "profile_image_url" VARCHAR(255),
    "bio" TEXT,
    "user_role" "public"."UserRole" NOT NULL,
    "reputation_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "on_chain_listing_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "price" DECIMAL(18,6) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "location" VARCHAR(255),
    "image_url" VARCHAR(255),
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'Available',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "transporter_id" INTEGER,
    "on_chain_tx_hash" VARCHAR(66) NOT NULL,
    "final_price" DECIMAL(18,6) NOT NULL,
    "quantity_purchased" INTEGER NOT NULL,
    "status" "public"."OrderStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shipments" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "transporter_id" INTEGER NOT NULL,
    "tracking_number" VARCHAR(100),
    "shipped_at" TIMESTAMP(3),
    "estimated_delivery" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "proof_of_delivery_hash" VARCHAR(66),

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "reviewee_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "on_chain_review_hash" VARCHAR(66),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attachments" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "public"."users"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "orders_on_chain_tx_hash_key" ON "public"."orders"("on_chain_tx_hash");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_order_id_key" ON "public"."shipments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_on_chain_review_hash_key" ON "public"."reviews"("on_chain_review_hash");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
