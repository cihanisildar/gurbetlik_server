-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
