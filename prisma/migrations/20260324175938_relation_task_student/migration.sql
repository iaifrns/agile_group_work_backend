/*
  Warnings:

  - You are about to drop the column `assign` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "assign";

-- CreateTable
CREATE TABLE "_StudentToTask" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StudentToTask_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_StudentToTask_B_index" ON "_StudentToTask"("B");

-- AddForeignKey
ALTER TABLE "_StudentToTask" ADD CONSTRAINT "_StudentToTask_A_fkey" FOREIGN KEY ("A") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentToTask" ADD CONSTRAINT "_StudentToTask_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
