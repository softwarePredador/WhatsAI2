-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "remoteJid" TEXT,
    "remoteJidAlt" TEXT,
    "participant" TEXT,
    "participantAlt" TEXT,
    "messageId" TEXT,
    "hasLid" BOOLEAN NOT NULL DEFAULT false,
    "hasAltField" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_logs_instanceId_idx" ON "webhook_logs"("instanceId");

-- CreateIndex
CREATE INDEX "webhook_logs_event_idx" ON "webhook_logs"("event");

-- CreateIndex
CREATE INDEX "webhook_logs_hasLid_idx" ON "webhook_logs"("hasLid");

-- CreateIndex
CREATE INDEX "webhook_logs_remoteJid_idx" ON "webhook_logs"("remoteJid");

-- CreateIndex
CREATE INDEX "webhook_logs_createdAt_idx" ON "webhook_logs"("createdAt");
