ALTER TABLE "Listing" ADD COLUMN "publicContactPhone" TEXT;

ALTER TABLE "Lead" ADD COLUMN "contactSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN "contactPermissionStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "Lead" ADD COLUMN "contactPermissionNotes" TEXT;
