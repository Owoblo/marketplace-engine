CREATE TABLE "FacebookGroup" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupUrl" TEXT NOT NULL,
    "externalGroupId" TEXT,
    "accessType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "outreachPolicy" TEXT NOT NULL DEFAULT 'REVIEW_RULES',
    "rulesSummary" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "assignedRepEmail" TEXT,
    "searchPriority" INTEGER NOT NULL DEFAULT 50,
    "lastReviewedAt" TIMESTAMP(3),
    "lastSuccessfulScanAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FacebookGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FacebookGroupPost" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "externalPostId" TEXT,
    "postUrl" TEXT NOT NULL,
    "authorExternalId" TEXT,
    "authorDisplayName" TEXT,
    "originalText" TEXT NOT NULL,
    "imageUrls" JSONB NOT NULL DEFAULT '[]',
    "locationText" TEXT,
    "postedAt" TIMESTAMP(3),
    "firstCapturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHash" TEXT NOT NULL,
    "opportunityType" TEXT NOT NULL,
    "intentCategory" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "opportunityScore" INTEGER NOT NULL,
    "reasoningSummary" TEXT NOT NULL,
    "positiveSignals" JSONB NOT NULL DEFAULT '[]',
    "negativeSignals" JSONB NOT NULL DEFAULT '[]',
    "recommendedAction" TEXT NOT NULL,
    "suggestedComment" TEXT,
    "suggestedDirectMessage" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'UNREVIEWED',
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FacebookGroupPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FacebookGroup_groupUrl_key" ON "FacebookGroup"("groupUrl");
CREATE INDEX "FacebookGroup_regionId_enabled_idx" ON "FacebookGroup"("regionId", "enabled");
CREATE UNIQUE INDEX "FacebookGroupPost_postUrl_key" ON "FacebookGroupPost"("postUrl");
CREATE INDEX "FacebookGroupPost_contentHash_idx" ON "FacebookGroupPost"("contentHash");
CREATE INDEX "FacebookGroupPost_reviewStatus_opportunityScore_idx" ON "FacebookGroupPost"("reviewStatus", "opportunityScore");
CREATE INDEX "FacebookGroupPost_authorExternalId_idx" ON "FacebookGroupPost"("authorExternalId");
ALTER TABLE "FacebookGroup" ADD CONSTRAINT "FacebookGroup_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FacebookGroupPost" ADD CONSTRAINT "FacebookGroupPost_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FacebookGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
