/*
  Warnings:

  - Added the required column `staus` to the `GroupMembers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('REQUEST', 'MEMBER');

-- AlterTable
ALTER TABLE "GroupMembers" ADD COLUMN     "staus" "GroupStatus" NOT NULL;
