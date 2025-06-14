/*
  Warnings:

  - You are about to drop the column `authorId` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `PhoneNumber` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Email` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `PhoneNumber` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `Email` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phoneNumber` on table `PhoneNumber` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_authorId_fkey";

-- DropForeignKey
ALTER TABLE "PhoneNumber" DROP CONSTRAINT "PhoneNumber_authorId_fkey";

-- AlterTable
ALTER TABLE "Email" DROP COLUMN "authorId",
ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
ALTER TABLE "PhoneNumber" DROP COLUMN "authorId",
ALTER COLUMN "phoneNumber" SET NOT NULL;

-- CreateTable
CREATE TABLE "AuthorEmail" (
    "authorId" INTEGER NOT NULL,
    "emailId" INTEGER NOT NULL,

    CONSTRAINT "AuthorEmail_pkey" PRIMARY KEY ("authorId","emailId")
);

-- CreateTable
CREATE TABLE "AuthorPhone" (
    "authorId" INTEGER NOT NULL,
    "phoneNumberId" INTEGER NOT NULL,

    CONSTRAINT "AuthorPhone_pkey" PRIMARY KEY ("authorId","phoneNumberId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Email_email_key" ON "Email"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_phoneNumber_key" ON "PhoneNumber"("phoneNumber");

-- AddForeignKey
ALTER TABLE "AuthorEmail" ADD CONSTRAINT "AuthorEmail_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorEmail" ADD CONSTRAINT "AuthorEmail_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorPhone" ADD CONSTRAINT "AuthorPhone_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorPhone" ADD CONSTRAINT "AuthorPhone_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "PhoneNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
