/*
  Warnings:

  - You are about to drop the `_StudentToTask` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_StudentToTask" DROP CONSTRAINT "_StudentToTask_A_fkey";

-- DropForeignKey
ALTER TABLE "_StudentToTask" DROP CONSTRAINT "_StudentToTask_B_fkey";

-- DropTable
DROP TABLE "_StudentToTask";

-- CreateTable
CREATE TABLE "_TaskToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TaskToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TaskToStudent_B_index" ON "_TaskToStudent"("B");

-- AddForeignKey
ALTER TABLE "_TaskToStudent" ADD CONSTRAINT "_TaskToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskToStudent" ADD CONSTRAINT "_TaskToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
