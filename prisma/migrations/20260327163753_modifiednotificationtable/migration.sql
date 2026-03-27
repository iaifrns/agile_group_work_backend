-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "isRead" SET DEFAULT ARRAY[]::TEXT[];
