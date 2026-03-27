/*
  Warnings:

  - Added the required column `navigate` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "navigate" TEXT NOT NULL;
