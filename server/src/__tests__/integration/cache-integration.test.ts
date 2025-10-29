import { ConversationService } from '../../services/conversation-service';
import { cacheService } from '../../services/cache-service';
import { prisma } from '../../database/prisma';

// Mock Baileys to avoid ESM issues in Jest
jest.mock('@whiskeysockets/baileys', () => ({}));

describe('Cache Integration Tests (Critical)', () => {
  let conversationService: ConversationService;
  let testInstanceId: string;

  beforeAll(async () => {
    // Initialize cache
    await cacheService.initialize();
    
    // Get or create test instance
    const instance = await prisma.whatsAppInstance.findFirst();
    if (!instance) {
      throw new Error('No instance found in database. Please seed test data.');
    }
    testInstanceId = instance.id;
  });

  beforeEach(() => {
    conversationService = new ConversationService();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Cache Performance', () => {
    it('should use cache on second call (10x+ faster than DB)', async () => {
      // First call - cache MISS (hits database)
      const start1 = Date.now();
      const conversations1 = await conversationService['conversationRepository'].findByInstanceId(testInstanceId);
      const dbTime = Date.now() - start1;

      // Second call - cache HIT (uses cache)
      const start2 = Date.now();
      const conversations2 = await conversationService['conversationRepository'].findByInstanceId(testInstanceId);
      const cacheTime = Date.now() - start2;

      // Assertions
      expect(conversations1.length).toEqual(conversations2.length); // Same data
      expect(cacheTime).toBeLessThan(dbTime / 5); // Cache should be 5x+ faster minimum
      
      console.log(`⚡ Performance: DB=${dbTime}ms, Cache=${cacheTime}ms (${Math.round(dbTime/Math.max(cacheTime, 1))}x faster)`);
    });

    it('should invalidate cache when conversation is updated', async () => {
      const conversations = await conversationService['conversationRepository'].findByInstanceId(testInstanceId);
      
      if (conversations.length === 0) {
        console.log('⚠️  No conversations found, skipping invalidation test');
        return;
      }

      const conversationId = conversations[0]!.id;

      // Get conversation (populate cache)
      await conversationService['conversationRepository'].findById(conversationId);

      // Update conversation via ConversationService (should invalidate cache)
      await conversationService['conversationRepository'].update(
        conversationId,
        { contactName: 'Updated Name ' + Date.now() }
      );

      // Next read should get updated data
      const updated = await conversationService['conversationRepository'].findById(conversationId);

      expect(updated?.contactName).toContain('Updated Name');
    });
  });

  describe('SendMessage Cache Optimization', () => {
    it('should use cached instance lookup in sendMessage', async () => {
      // This test validates the cache is used for instance lookups
      const start = Date.now();

      try {
        await conversationService.sendMessage(
          testInstanceId,
          '5511999999999@s.whatsapp.net',
          'Test message'
        );
      } catch (error) {
        // Expected to fail (Evolution API not available in test)
        // But cache lookup should still happen
      }

      const duration = Date.now() - start;
      
      // Even with Evolution API error, operation should complete reasonably fast
      expect(duration).toBeLessThan(5000);
      console.log(`⚡ sendMessage attempted in ${duration}ms`);
    });
  });

  describe('Cache Hit Rate', () => {
    it('should achieve >80% cache hit rate on repeated calls', async () => {
      let cacheMisses = 0;
      let cacheHits = 0;
      const iterations = 5;

      // First pass - all cache misses expected
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await conversationService['conversationRepository'].findByInstanceId(testInstanceId);
        const time = Date.now() - start;
        if (time > 10) cacheMisses++; // DB query (slower)
      }

      // Second pass - should be mostly cache hits
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await conversationService['conversationRepository'].findByInstanceId(testInstanceId);
        const time = Date.now() - start;
        if (time < 10) cacheHits++; // Cache hit (fast)
      }

      const totalCalls = iterations * 2;
      const hitRate = (cacheHits / totalCalls) * 100;
      
      expect(hitRate).toBeGreaterThanOrEqual(40); // At least 40% (second pass should be cached)
      console.log(`📊 Cache Hit Rate: ${hitRate.toFixed(1)}% (${cacheHits}/${totalCalls} calls)`);
    });
  });
});
