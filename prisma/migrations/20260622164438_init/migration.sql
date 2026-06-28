-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'success', 'failed');

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "paymentId" TEXT,
    "orderId" TEXT,
    "rideId" TEXT NOT NULL,
    "captainId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "captain_commission" INTEGER NOT NULL,
    "platform_commission" INTEGER NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'pending',

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentId_key" ON "payments"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_rideId_key" ON "payments"("rideId");
