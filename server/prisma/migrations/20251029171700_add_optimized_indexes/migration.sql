-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_instanceId_timestamp_idx" ON "messages"("instanceId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_conversationId_fromMe_idx" ON "messages"("conversationId", "fromMe");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_status_idx" ON "messages"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_instanceId_isPinned_lastMessageAt_idx" ON "conversations"("instanceId", "isPinned", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_instanceId_isArchived_idx" ON "conversations"("instanceId", "isArchived");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_instanceId_unreadCount_idx" ON "conversations"("instanceId", "unreadCount");
