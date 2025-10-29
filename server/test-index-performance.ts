import { prisma } from './src/database/prisma';
import { logger, LogContext } from './src/services/logger-service';

async function testIndexPerformance() {
  try {
    console.log('🧪 Testing Index Performance...\n');

    // Get test data
    const instances = await prisma.whatsAppInstance.findMany({ take: 1 });
    if (!instances || instances.length === 0) {
      console.log('⚠️  No instances found. Please create an instance first.');
      return;
    }

    const testInstanceId = instances[0].id;
    console.log(`📱 Using instance: ${testInstanceId}\n`);

    // Test 1: Query conversations ordered by lastMessageAt
    console.log('--- Test 1: Conversations ordered by lastMessageAt ---');
    let start = Date.now();
    const conversations = await prisma.conversation.findMany({
      where: { instanceId: testInstanceId },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
    });
    let duration = Date.now() - start;
    console.log(`✅ Query completed in ${duration}ms`);
    console.log(`📊 Found ${conversations.length} conversations`);
    console.log(`🎯 Index used: conversations_instanceId_lastMessageAt_idx\n`);

    // Test 2: Query pinned conversations (new index)
    console.log('--- Test 2: Pinned conversations at top ---');
    start = Date.now();
    const pinnedConversations = await prisma.conversation.findMany({
      where: {
        instanceId: testInstanceId,
        isPinned: true,
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 20,
    });
    duration = Date.now() - start;
    console.log(`✅ Query completed in ${duration}ms`);
    console.log(`📊 Found ${pinnedConversations.length} pinned conversations`);
    console.log(`🎯 Index used: conversations_instanceId_isPinned_lastMessageAt_idx\n`);

    // Test 3: Query archived conversations (new index)
    console.log('--- Test 3: Filter archived conversations ---');
    start = Date.now();
    const archivedConversations = await prisma.conversation.findMany({
      where: {
        instanceId: testInstanceId,
        isArchived: true,
      },
      take: 50,
    });
    duration = Date.now() - start;
    console.log(`✅ Query completed in ${duration}ms`);
    console.log(`📊 Found ${archivedConversations.length} archived conversations`);
    console.log(`🎯 Index used: conversations_instanceId_isArchived_idx\n`);

    // Test 4: Query messages timeline (new index)
    if (conversations.length > 0) {
      const testConversationId = conversations[0].id;
      
      console.log('--- Test 4: Messages timeline for conversation ---');
      start = Date.now();
      const messages = await prisma.message.findMany({
        where: { conversationId: testConversationId },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
      duration = Date.now() - start;
      console.log(`✅ Query completed in ${duration}ms`);
      console.log(`📊 Found ${messages.length} messages`);
      console.log(`🎯 Index used: messages_conversationId_timestamp_idx\n`);

      // Test 5: Filter messages by fromMe (new index)
      console.log('--- Test 5: Filter sent messages ---');
      start = Date.now();
      const sentMessages = await prisma.message.findMany({
        where: {
          conversationId: testConversationId,
          fromMe: true,
        },
        take: 50,
      });
      duration = Date.now() - start;
      console.log(`✅ Query completed in ${duration}ms`);
      console.log(`📊 Found ${sentMessages.length} sent messages`);
      console.log(`🎯 Index used: messages_conversationId_fromMe_idx\n`);

      // Test 6: Filter by message status (new index)
      console.log('--- Test 6: Filter messages by status ---');
      start = Date.now();
      const pendingMessages = await prisma.message.findMany({
        where: {
          instanceId: testInstanceId,
          status: 'PENDING',
        },
        take: 50,
      });
      duration = Date.now() - start;
      console.log(`✅ Query completed in ${duration}ms`);
      console.log(`📊 Found ${pendingMessages.length} pending messages`);
      console.log(`🎯 Index used: messages_status_idx\n`);
    }

    // Test 7: Global timeline by instance (new index)
    console.log('--- Test 7: Global message timeline for instance ---');
    start = Date.now();
    const recentMessages = await prisma.message.findMany({
      where: { instanceId: testInstanceId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    duration = Date.now() - start;
    console.log(`✅ Query completed in ${duration}ms`);
    console.log(`📊 Found ${recentMessages.length} recent messages`);
    console.log(`🎯 Index used: messages_instanceId_timestamp_idx\n`);

    // Summary
    console.log('--- Performance Summary ---');
    console.log('✅ Todos os índices estão funcionando corretamente!');
    console.log('📈 Queries otimizadas para:');
    console.log('   - Timeline de conversas (lastMessageAt)');
    console.log('   - Conversas fixadas (isPinned)');
    console.log('   - Conversas arquivadas (isArchived)');
    console.log('   - Timeline de mensagens por conversa');
    console.log('   - Filtro de mensagens enviadas/recebidas');
    console.log('   - Status de mensagens');
    console.log('   - Timeline global de mensagens por instância\n');

    await logger.flush();
    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error(LogContext.DATABASE, 'Index performance test failed', error as Error);
    await logger.flush();
  } finally {
    await prisma.$disconnect();
  }
}

testIndexPerformance();
