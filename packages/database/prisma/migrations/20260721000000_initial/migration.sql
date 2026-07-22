-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'MARKETPLACE_REP');

-- CreateEnum
CREATE TYPE "LaunchPhase" AS ENUM ('ACTIVE', 'PLANNED', 'PAUSED');

-- CreateEnum
CREATE TYPE "SourceHealth" AS ENUM ('HEALTHY', 'DEGRADED', 'UNAVAILABLE', 'AUTH_REQUIRED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'PENDING', 'SOLD', 'REMOVED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('READY', 'SENT', 'SKIPPED', 'SNOOZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('INITIAL_OUTREACH', 'FOLLOW_UP', 'MANUAL_SOURCE_ACTION');

-- CreateEnum
CREATE TYPE "QualificationStatus" AS ENUM ('UNREVIEWED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'APPROVED', 'POSTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MARKETPLACE_REP',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "healthStatus" "SourceHealth" NOT NULL DEFAULT 'UNKNOWN',
    "lastSuccessfulSync" TIMESTAMP(3),
    "lastFailure" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "west" DOUBLE PRECISION NOT NULL,
    "east" DOUBLE PRECISION NOT NULL,
    "south" DOUBLE PRECISION NOT NULL,
    "north" DOUBLE PRECISION NOT NULL,
    "gridColumns" INTEGER NOT NULL,
    "gridRows" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "launchPhase" "LaunchPhase" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionGridDefinition" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "longitudeBreakpoints" JSONB NOT NULL,
    "latitudeBreakpoints" JSONB NOT NULL,
    "expectedCellCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionGridDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeographicSearchCell" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "cellKey" TEXT NOT NULL,
    "columnIndex" INTEGER NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "west" DOUBLE PRECISION NOT NULL,
    "east" DOUBLE PRECISION NOT NULL,
    "south" DOUBLE PRECISION NOT NULL,
    "north" DOUBLE PRECISION NOT NULL,
    "centerLongitude" DOUBLE PRECISION NOT NULL,
    "centerLatitude" DOUBLE PRECISION NOT NULL,
    "widthKm" DOUBLE PRECISION NOT NULL,
    "heightKm" DOUBLE PRECISION NOT NULL,
    "diagonalKm" DOUBLE PRECISION NOT NULL,
    "facebookRadiusKm" DOUBLE PRECISION NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeographicSearchCell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionLaunchConfiguration" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "marketplaceDiscoveryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "outreachEnabled" BOOLEAN NOT NULL DEFAULT false,
    "followUpsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "crmPushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dailyTaskLimit" INTEGER,
    "dailySellerContactLimit" INTEGER,
    "minimumOpportunityScore" INTEGER NOT NULL DEFAULT 70,
    "activeFrom" TIMESTAMP(3),
    "activeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionLaunchConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "municipalityType" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityAlias" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CityAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionCityCoverage" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "primaryRegionId" TEXT NOT NULL,
    "secondaryRegionIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionCityCoverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Territory" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryCity" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "defaultRadiusKm" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "assignedRepId" TEXT,
    "operatingHours" JSONB NOT NULL DEFAULT '{}',
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Territory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryFamily" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "terms" JSONB NOT NULL,
    "priority" INTEGER NOT NULL,
    "frequencyMinutes" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueryFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchDefinition" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,
    "queryFamilyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "category" TEXT,
    "minimumPrice" DECIMAL(12,2),
    "maximumPrice" DECIMAL(12,2),
    "radiusKm" DOUBLE PRECISION NOT NULL,
    "searchFrequencyMinutes" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchRun" (
    "id" TEXT NOT NULL,
    "searchDefinitionId" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lockKey" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "newCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalSellerId" TEXT NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "firstObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "knownListingCount" INTEGER NOT NULL DEFAULT 0,
    "territoriesObserved" JSONB NOT NULL DEFAULT '[]',
    "previousOutreachCount" INTEGER NOT NULL DEFAULT 0,
    "lastOutreachAt" TIMESTAMP(3),
    "suppressionStatus" BOOLEAN NOT NULL DEFAULT false,
    "suppressionReason" TEXT,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalListingId" TEXT NOT NULL,
    "listingUrl" TEXT NOT NULL,
    "sellerId" TEXT,
    "sellerDisplayName" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "category" TEXT,
    "condition" TEXT,
    "locationText" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "imageUrls" JSONB NOT NULL DEFAULT '[]',
    "publishedAt" TIMESTAMP(3),
    "firstObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ListingStatus" NOT NULL DEFAULT 'UNKNOWN',
    "contentHash" TEXT NOT NULL,
    "rawSourcePayload" JSONB NOT NULL,
    "materialVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,
    "opportunityType" TEXT NOT NULL,
    "intentCategory" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "opportunityScore" INTEGER NOT NULL,
    "urgencyScore" INTEGER NOT NULL,
    "estimatedServiceType" TEXT NOT NULL,
    "estimatedJobSize" TEXT NOT NULL,
    "reasoningSummary" TEXT NOT NULL,
    "positiveSignals" JSONB NOT NULL,
    "negativeSignals" JSONB NOT NULL,
    "scoreExplanation" JSONB NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "qualificationStatus" "QualificationStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "assignedRepId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachTask" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "assignedRepId" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'READY',
    "priority" INTEGER NOT NULL,
    "suggestedMessage" TEXT NOT NULL,
    "finalMessage" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "conversationUrl" TEXT,
    "result" TEXT,
    "skipReason" TEXT,
    "followUpEligibility" BOOLEAN NOT NULL DEFAULT false,
    "snoozedUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactAttempt" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "sellerId" TEXT,
    "repId" TEXT,
    "channel" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "actualMessage" TEXT NOT NULL,
    "sentManually" BOOLEAN NOT NULL DEFAULT true,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "responseStatus" TEXT,
    "responseAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "crmExternalId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "serviceType" TEXT NOT NULL,
    "originCity" TEXT,
    "destinationCity" TEXT,
    "estimatedMoveDate" TIMESTAMP(3),
    "qualificationStatus" TEXT NOT NULL,
    "leadStatus" TEXT NOT NULL,
    "valueEstimate" DECIMAL(12,2),
    "crmSyncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuppressionRecord" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT,
    "listingId" TEXT,
    "sourceId" TEXT NOT NULL,
    "suppressionType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "permanent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuppressionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "actorId" TEXT,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringConfiguration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "weights" JSONB NOT NULL,
    "thresholds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnedListingCampaign" (
    "id" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "weeklyLimit" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnedListingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnedListingDraft" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "imageUrls" JSONB NOT NULL DEFAULT '[]',
    "status" "DraftStatus" NOT NULL DEFAULT 'DRAFT',
    "marketplaceListingUrl" TEXT,
    "reviewNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnedListingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Source_type_key" ON "Source"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Region_key_key" ON "Region"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RegionGridDefinition_regionId_key" ON "RegionGridDefinition"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "GeographicSearchCell_cellKey_key" ON "GeographicSearchCell"("cellKey");

-- CreateIndex
CREATE UNIQUE INDEX "GeographicSearchCell_regionId_rowIndex_columnIndex_key" ON "GeographicSearchCell"("regionId", "rowIndex", "columnIndex");

-- CreateIndex
CREATE UNIQUE INDEX "RegionLaunchConfiguration_regionId_key" ON "RegionLaunchConfiguration"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "City_regionId_normalizedName_key" ON "City"("regionId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "CityAlias_cityId_normalizedAlias_key" ON "CityAlias"("cityId", "normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "RegionCityCoverage_cityId_key" ON "RegionCityCoverage"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "QueryFamily_key_key" ON "QueryFamily"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SearchDefinition_sourceId_cellId_query_key" ON "SearchDefinition"("sourceId", "cellId", "query");

-- CreateIndex
CREATE UNIQUE INDEX "SearchRun_lockKey_key" ON "SearchRun"("lockKey");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_sourceId_externalSellerId_key" ON "SellerProfile"("sourceId", "externalSellerId");

-- CreateIndex
CREATE INDEX "Listing_contentHash_idx" ON "Listing"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_sourceId_externalListingId_key" ON "Listing"("sourceId", "externalListingId");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_listingId_territoryId_key" ON "Opportunity"("listingId", "territoryId");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachTask_opportunityId_taskType_status_key" ON "OutreachTask"("opportunityId", "taskType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_opportunityId_key" ON "Lead"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_idempotencyKey_key" ON "Lead"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_createdAt_idx" ON "AuditEvent"("eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringConfiguration_key_key" ON "ScoringConfiguration"("key");

-- AddForeignKey
ALTER TABLE "RegionGridDefinition" ADD CONSTRAINT "RegionGridDefinition_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeographicSearchCell" ADD CONSTRAINT "GeographicSearchCell_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionLaunchConfiguration" ADD CONSTRAINT "RegionLaunchConfiguration_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityAlias" ADD CONSTRAINT "CityAlias_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionCityCoverage" ADD CONSTRAINT "RegionCityCoverage_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Territory" ADD CONSTRAINT "Territory_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Territory" ADD CONSTRAINT "Territory_assignedRepId_fkey" FOREIGN KEY ("assignedRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchDefinition" ADD CONSTRAINT "SearchDefinition_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchDefinition" ADD CONSTRAINT "SearchDefinition_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchDefinition" ADD CONSTRAINT "SearchDefinition_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "GeographicSearchCell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchDefinition" ADD CONSTRAINT "SearchDefinition_queryFamilyId_fkey" FOREIGN KEY ("queryFamilyId") REFERENCES "QueryFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchRun" ADD CONSTRAINT "SearchRun_searchDefinitionId_fkey" FOREIGN KEY ("searchDefinitionId") REFERENCES "SearchDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchRun" ADD CONSTRAINT "SearchRun_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "GeographicSearchCell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTask" ADD CONSTRAINT "OutreachTask_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTask" ADD CONSTRAINT "OutreachTask_assignedRepId_fkey" FOREIGN KEY ("assignedRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttempt" ADD CONSTRAINT "ContactAttempt_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttempt" ADD CONSTRAINT "ContactAttempt_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttempt" ADD CONSTRAINT "ContactAttempt_repId_fkey" FOREIGN KEY ("repId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuppressionRecord" ADD CONSTRAINT "SuppressionRecord_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuppressionRecord" ADD CONSTRAINT "SuppressionRecord_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuppressionRecord" ADD CONSTRAINT "SuppressionRecord_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedListingDraft" ADD CONSTRAINT "OwnedListingDraft_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OwnedListingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
