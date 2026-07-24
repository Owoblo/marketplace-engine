ALTER TABLE "FacebookGroup"
  ADD COLUMN "rulesText" TEXT,
  ADD COLUMN "rulesAssessment" JSONB,
  ADD COLUMN "suggestedAdminMessage" TEXT,
  ADD COLUMN "adminOutreachStatus" TEXT NOT NULL DEFAULT 'NOT_CONTACTED';

CREATE TABLE "FacebookGroupAdmin" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "profileUrl" TEXT,
  "role" TEXT NOT NULL DEFAULT 'ADMIN',
  "contactStatus" TEXT NOT NULL DEFAULT 'NOT_CONTACTED',
  "contactedAt" TIMESTAMP(3),
  "responseNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FacebookGroupAdmin_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FacebookGroupAdmin_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "FacebookGroup"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FacebookGroupAdmin_groupId_displayName_key"
  ON "FacebookGroupAdmin"("groupId", "displayName");
CREATE INDEX "FacebookGroupAdmin_groupId_contactStatus_idx"
  ON "FacebookGroupAdmin"("groupId", "contactStatus");

CREATE TABLE "FacebookGroupContentDraft" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "contentAngle" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "scheduledFor" TIMESTAMP(3),
  "postedAt" TIMESTAMP(3),
  "facebookPostUrl" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FacebookGroupContentDraft_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FacebookGroupContentDraft_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "FacebookGroup"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FacebookGroupContentDraft_groupId_status_scheduledFor_idx"
  ON "FacebookGroupContentDraft"("groupId", "status", "scheduledFor");
