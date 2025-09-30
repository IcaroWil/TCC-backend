/*
  Warnings:

  - A unique constraint covering the columns `[serviceId,date,startTime]` on the table `Schedule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serviceId` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Schedule" ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "serviceId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "daysOfWeek" TEXT[],
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "interval" INTEGER,
ADD COLUMN     "startTime" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_serviceId_date_startTime_key" ON "public"."Schedule"("serviceId", "date", "startTime");

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
