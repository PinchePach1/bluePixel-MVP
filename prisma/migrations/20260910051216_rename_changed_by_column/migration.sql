/*
  Warnings:

  - You are about to drop the column `changeById` on the `RequestHistory` table. All the data in the column will be lost.
  - Added the required column `changedById` to the `RequestHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RequestHistory" DROP CONSTRAINT "RequestHistory_changeById_fkey";

-- DropIndex
DROP INDEX "RequestHistory_changeById_idx";

-- DropIndex
DROP INDEX "RequestHistory_requestId_idx";

-- AlterTable
ALTER TABLE "RequestHistory" DROP COLUMN "changeById",
ADD COLUMN     "changedById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "RequestHistory" ADD CONSTRAINT "RequestHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
