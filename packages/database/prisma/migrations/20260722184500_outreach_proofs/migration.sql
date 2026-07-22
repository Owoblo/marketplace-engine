CREATE TABLE "OutreachProof" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OutreachProof_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OutreachProof_storageKey_key" ON "OutreachProof"("storageKey");
CREATE INDEX "OutreachProof_taskId_createdAt_idx" ON "OutreachProof"("taskId", "createdAt");
ALTER TABLE "OutreachProof" ADD CONSTRAINT "OutreachProof_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "OutreachTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OutreachProof" ADD CONSTRAINT "OutreachProof_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
