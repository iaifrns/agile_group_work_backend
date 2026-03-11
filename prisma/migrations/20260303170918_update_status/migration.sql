/*
  Warnings:

  - You are about to drop the column `staus` on the `GroupMembers` table. All the data in the column will be lost.
  - Added the required column `status` to the `GroupMembers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GroupMembers" DROP COLUMN "staus",
ADD COLUMN     "status" "GroupStatus" NOT NULL;
