ALTER TABLE "RegionLaunchConfiguration"
ADD COLUMN "outreachBrandName" TEXT NOT NULL DEFAULT 'Saturn Star Movers';

UPDATE "RegionLaunchConfiguration" AS launch
SET "outreachBrandName" = 'Dexa'
FROM "Region" AS region
WHERE launch."regionId" = region."id" AND region."key" = 'ottawa';
