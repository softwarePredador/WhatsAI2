import { cacheService } from './src/services/cache-service';
import { logger, LogContext } from './src/services/logger-service';
import { ConversationRepository } from './src/database/repositories/conversation-repository';
import { prisma } from './src/database/prisma';

async function testCachePerformance() {
  try {
    console.log('🧪 Testing Cache Performance...\n');

    // Initialize cache
    await cacheService.initialize();
    console.log('✅ Cache initialized\n');

    // Create repository instance
    const conversationRepo = new ConversationRepository(prisma);

    // Get test instance ID from database
    const instances = await (prisma as any).instance.findMany({ take: 1 });
    if (!instances || instances.length === 0) {
      console.log('⚠️  No instances found in database. Please create an instance first.');
      return;
    }

    const testInstanceId = instances[0].id;
    console.log(`📱 Using instance: ${testInstanceId}\n`);

    // Test 1: First query (cache miss - should hit database)
    console.log('--- Test 1: First Query (Cache Miss) ---');
    const start1 = Date.now();
    const result1 = await conversationRepo.findAllByInstanceId(testInstanceId);
    const time1 = Date.now() - start1;
    console.log(`✅ Query completed in ${time1}ms`);
    console.log(`📊 Found ${result1.length} conversations`);
    console.log(`🎯 Expected: Cache MISS (database query)\n`);

    // Test 2: Second query (cache hit - should use cache)
    console.log('--- Test 2: Second Query (Cache Hit) ---');
    const start2 = Date.now();
    const result2 = await conversationRepo.findAllByInstanceId(testInstanceId);
    const time2 = Date.now() - start2;
    console.log(`✅ Query completed in ${time2}ms`);
    console.log(`📊 Found ${result2.length} conversations`);
    console.log(`🎯 Expected: Cache HIT (memory lookup)\n`);

    // Test 3: Individual conversation lookup
    if (result1.length > 0) {
      const testConversationId = result1[0].id;
      
      console.log('--- Test 3: Individual Conversation Lookup ---');
      const start3 = Date.now();
      const result3 = await conversationRepo.findById(testConversationId);
      const time3 = Date.now() - start3;
      console.log(`✅ Query completed in ${time3}ms`);
      console.log(`📊 Found conversation: ${result3?.remoteJid || 'N/A'}`);
      console.log(`🎯 Expected: Cache MISS (first individual lookup)\n`);

      console.log('--- Test 4: Second Individual Lookup (Cache Hit) ---');
      const start4 = Date.now();
      const result4 = await conversationRepo.findById(testConversationId);
      const time4 = Date.now() - start4;
      console.log(`✅ Query completed in ${time4}ms`);
      console.log(`📊 Found conversation: ${result4?.remoteJid || 'N/A'}`);
      console.log(`🎯 Expected: Cache HIT (cached individual)\n`);
    }

    // Get cache statistics
    const stats = cacheService.getStats();
    console.log('--- Cache Statistics ---');
    console.log(`📈 Total Hits: ${stats.hits}`);
    console.log(`📉 Total Misses: ${stats.misses}`);
    console.log(`🎯 Hit Rate: ${stats.hitRate}%`);
    console.log(`⚡ Performance Improvement: ${Math.round(((time1 - time2) / time1) * 100)}%\n`);

    // Performance comparison
    console.log('--- Performance Analysis ---');
    console.log(`🐌 First query (DB): ${time1}ms`);
    console.log(`⚡ Second query (Cache): ${time2}ms`);
    console.log(`🚀 Speedup: ${(time1 / time2).toFixed(2)}x faster\n`);

    // Flush logs
    await logger.flush();
    console.log('✅ All tests completed! Check logs/cache-errors.log for detailed logs.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error(LogContext.CACHE, 'Cache performance test failed', error as Error);
    await logger.flush();
  } finally {
    await prisma.$disconnect();
  }
}

testCachePerformance();
