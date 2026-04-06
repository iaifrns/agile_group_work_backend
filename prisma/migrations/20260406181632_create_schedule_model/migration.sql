-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
