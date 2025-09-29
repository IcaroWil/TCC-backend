/*
  Warnings:

  - You are about to drop the column `serviceId` on the `Schedule` table. All the data in the column will be lost.
  - Added the required column `serviceId` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Schedule" DROP CONSTRAINT "Schedule_serviceId_fkey";

-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "serviceId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Schedule" DROP COLUMN "serviceId";

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
