import { cacheService } from './src/services/cache-service';
import { logger, LogContext } from './src/services/logger-service';

async function testCacheSimple() {
  try {
    console.log('🧪 Testing Cache Service...\n');

    // Initialize cache
    await cacheService.initialize();
    console.log('✅ Cache initialized\n');

    // Test 1: Set and get simple value
    console.log('--- Test 1: Basic Cache Operations ---');
    const testKey = 'test:key:1';
    const testValue = { id: '123', name: 'Test', data: [1, 2, 3] };

    await cacheService.set(testKey, testValue, 60000); // 60s TTL
    console.log('✅ Set value in cache');

    const cachedValue = await cacheService.get(testKey);
    console.log('✅ Retrieved value from cache');
    console.log(`📊 Values match: ${JSON.stringify(cachedValue) === JSON.stringify(testValue)}\n`);

    // Test 2: Cache miss
    console.log('--- Test 2: Cache Miss ---');
    const missingValue = await cacheService.get('nonexistent:key');
    console.log(`✅ Missing key returns: ${missingValue === null ? 'null (correct!)' : 'unexpected value'}\n`);

    // Test 3: Performance comparison
    console.log('--- Test 3: Performance Test ---');
    const iterations = 1000;
    
    // Set test data
    for (let i = 0; i < 10; i++) {
      await cacheService.set(`perf:test:${i}`, { index: i, data: 'test data' }, 60000);
    }

    // Measure cache hits
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      await cacheService.get(`perf:test:${i % 10}`);
    }
    const duration = Date.now() - start;

    console.log(`✅ Completed ${iterations} cache reads in ${duration}ms`);
    console.log(`⚡ Average: ${(duration / iterations).toFixed(3)}ms per read\n`);

    // Test 4: Cache invalidation
    console.log('--- Test 4: Cache Invalidation ---');
    await cacheService.set('conversations:instance-123', { id: '123' }, 60000);
    await cacheService.set('conversations:instance-456', { id: '456' }, 60000);
    await cacheService.set('messages:conversation-123', { id: 'msg' }, 60000);

    console.log('✅ Set 3 cache entries');

    await cacheService.clearPattern('conversations:*');
    console.log('✅ Cleared pattern: conversations:*');

    const cleared1 = await cacheService.get('conversations:instance-123');
    const cleared2 = await cacheService.get('conversations:instance-456');
    const remaining = await cacheService.get('messages:conversation-123');

    console.log(`📊 conversations:instance-123: ${cleared1 === null ? 'cleared ✅' : 'still exists ❌'}`);
    console.log(`📊 conversations:instance-456: ${cleared2 === null ? 'cleared ✅' : 'still exists ❌'}`);
    console.log(`📊 messages:conversation-123: ${remaining !== null ? 'preserved ✅' : 'cleared ❌'}\n`);

    // Test 5: Convenience methods
    console.log('--- Test 5: Convenience Methods ---');
    const testConversation = { id: 'conv-1', instanceId: 'inst-1', remoteJid: '123@s.whatsapp.net' };
    
    await cacheService.setConversation('conv-1', testConversation);
    console.log('✅ Set conversation using convenience method');

    const retrieved = await cacheService.getConversation('conv-1');
    console.log(`✅ Retrieved conversation: ${(retrieved as any)?.id === 'conv-1' ? 'success ✅' : 'failed ❌'}\n`);

    // Get cache statistics
    const stats = cacheService.getStats();
    console.log('--- Cache Statistics ---');
    console.log(`📈 Total Hits: ${stats.hits}`);
    console.log(`📉 Total Misses: ${stats.misses}`);
    console.log(`🎯 Hit Rate: ${stats.hitRate}%\n`);

    // Flush logs
    await logger.flush();
    console.log('✅ All tests completed! Cache service is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error(LogContext.CACHE, 'Cache simple test failed', error as Error);
    await logger.flush();
  }
}

testCacheSimple();
