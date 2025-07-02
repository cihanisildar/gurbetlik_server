/*
  Warnings:

  - You are about to drop the column `googleId` on the `users` table. All the data in the column will be lost.
  - The `techStack` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `password` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "users_googleId_key";

-- AlterTable
ALTER TABLE "city_reviews" ADD COLUMN     "downvotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "upvotes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "googleId",
ALTER COLUMN "password" SET NOT NULL,
DROP COLUMN "techStack",
ADD COLUMN     "techStack" TEXT[],
ALTER COLUMN "lastSeen" DROP NOT NULL,
ALTER COLUMN "lastSeen" DROP DEFAULT;

-- CreateTable
CREATE TABLE "city_review_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityReviewId" TEXT NOT NULL,
    "type" "VoteType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_review_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "city_review_votes_cityReviewId_idx" ON "city_review_votes"("cityReviewId");

-- CreateIndex
CREATE INDEX "city_review_votes_userId_idx" ON "city_review_votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "city_review_votes_userId_cityReviewId_key" ON "city_review_votes"("userId", "cityReviewId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "city_review_votes" ADD CONSTRAINT "city_review_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_review_votes" ADD CONSTRAINT "city_review_votes_cityReviewId_fkey" FOREIGN KEY ("cityReviewId") REFERENCES "city_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
