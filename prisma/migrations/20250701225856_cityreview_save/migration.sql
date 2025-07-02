-- CreateTable
CREATE TABLE "city_review_saves" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityReviewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_review_saves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "city_review_saves_cityReviewId_idx" ON "city_review_saves"("cityReviewId");

-- CreateIndex
CREATE INDEX "city_review_saves_userId_idx" ON "city_review_saves"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "city_review_saves_userId_cityReviewId_key" ON "city_review_saves"("userId", "cityReviewId");

-- AddForeignKey
ALTER TABLE "city_review_saves" ADD CONSTRAINT "city_review_saves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_review_saves" ADD CONSTRAINT "city_review_saves_cityReviewId_fkey" FOREIGN KEY ("cityReviewId") REFERENCES "city_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
