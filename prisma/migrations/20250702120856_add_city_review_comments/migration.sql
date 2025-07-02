-- AlterTable
ALTER TABLE "city_reviews" ADD COLUMN     "commentsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "city_review_comments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityReviewId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_review_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_review_comment_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityReviewCommentId" TEXT NOT NULL,
    "type" "VoteType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_review_comment_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "city_review_comment_votes_cityReviewCommentId_idx" ON "city_review_comment_votes"("cityReviewCommentId");

-- CreateIndex
CREATE INDEX "city_review_comment_votes_userId_idx" ON "city_review_comment_votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "city_review_comment_votes_userId_cityReviewCommentId_key" ON "city_review_comment_votes"("userId", "cityReviewCommentId");

-- AddForeignKey
ALTER TABLE "city_review_comments" ADD CONSTRAINT "city_review_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_review_comments" ADD CONSTRAINT "city_review_comments_cityReviewId_fkey" FOREIGN KEY ("cityReviewId") REFERENCES "city_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_review_comments" ADD CONSTRAINT "city_review_comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "city_review_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_review_comment_votes" ADD CONSTRAINT "city_review_comment_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_review_comment_votes" ADD CONSTRAINT "city_review_comment_votes_cityReviewCommentId_fkey" FOREIGN KEY ("cityReviewCommentId") REFERENCES "city_review_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
