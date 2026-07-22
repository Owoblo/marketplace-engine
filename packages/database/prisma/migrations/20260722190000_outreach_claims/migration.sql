ALTER TABLE "OutreachTask" ADD COLUMN "claimedById" TEXT;
ALTER TABLE "OutreachTask" ADD COLUMN "claimedAt" TIMESTAMP(3);
ALTER TABLE "OutreachTask" ADD COLUMN "claimExpiresAt" TIMESTAMP(3);
CREATE INDEX "OutreachTask_status_claimedById_claimExpiresAt_idx" ON "OutreachTask"("status", "claimedById", "claimExpiresAt");
ALTER TABLE "OutreachTask" ADD CONSTRAINT "OutreachTask_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
