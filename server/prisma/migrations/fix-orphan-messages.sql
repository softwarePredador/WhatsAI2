-- Script para verificar e corrigir mensagens órfãs antes da migration
-- Executar ANTES de tornar conversationId obrigatório

-- 1. Verificar quantas mensagens órfãs existem
SELECT COUNT(*) as orphan_messages
FROM messages
WHERE conversationId IS NULL;

-- 2. Verificar detalhes das mensagens órfãs
SELECT id, instanceId, remoteJid, content, messageId, timestamp, fromMe
FROM messages
WHERE conversationId IS NULL
ORDER BY timestamp DESC
LIMIT 10;

-- 3. Tentar associar mensagens órfãs a conversas existentes
-- (Buscar conversa pelo instanceId + remoteJid)
UPDATE messages m
SET conversationId = c.id
FROM conversations c
WHERE m.conversationId IS NULL
  AND m.instanceId = c.instanceId
  AND m.remoteJid = c.remoteJid;

-- 4. Criar conversas para mensagens órfãs que não têm conversa
-- (Inserir novas conversas para remoteJids sem conversa)
INSERT INTO conversations (
  id,
  instanceId,
  remoteJid,
  isGroup,
  unreadCount,
  isArchived,
  isPinned,
  createdAt,
  updatedAt
)
SELECT 
  gen_random_uuid()::text as id,
  m.instanceId,
  m.remoteJid,
  (m.remoteJid LIKE '%@g.us') as isGroup,
  0 as unreadCount,
  false as isArchived,
  false as isPinned,
  MIN(m.createdAt) as createdAt,
  NOW() as updatedAt
FROM messages m
WHERE m.conversationId IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.instanceId = m.instanceId 
    AND c.remoteJid = m.remoteJid
  )
GROUP BY m.instanceId, m.remoteJid;

-- 5. Associar mensagens órfãs às conversas recém-criadas
UPDATE messages m
SET conversationId = c.id
FROM conversations c
WHERE m.conversationId IS NULL
  AND m.instanceId = c.instanceId
  AND m.remoteJid = c.remoteJid;

-- 6. Deletar mensagens órfãs que AINDA não têm conversationId
-- (Último recurso - mensagens impossíveis de associar)
DELETE FROM messages
WHERE conversationId IS NULL;

-- 7. Verificar que não há mais mensagens órfãs
SELECT COUNT(*) as remaining_orphans
FROM messages
WHERE conversationId IS NULL;
-- Deve retornar 0

-- 8. Agora é seguro tornar conversationId NOT NULL
ALTER TABLE messages ALTER COLUMN conversationId SET NOT NULL;
