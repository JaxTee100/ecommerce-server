/*
  Warnings:

  - You are about to drop the column `sessionId` on the `Cart` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Cart_sessionId_key";

-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "sessionId";
