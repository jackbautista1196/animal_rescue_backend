-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'CONTACTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "status" "MatchStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "resolutionNote" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "shareAsSuccess" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Report_resolvedAt_idx" ON "Report"("resolvedAt");
