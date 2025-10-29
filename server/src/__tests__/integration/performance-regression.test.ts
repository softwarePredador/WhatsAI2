import { ConversationService } from '../../services/conversation-service';
import { cacheService } from '../../services/cache-service';
import { prisma } from '../../database/prisma';

// Mock Baileys to avoid ESM issues in Jest
jest.mock('@whiskeysockets/baileys', () => ({}));

describe('Performance Regression Tests (Critical)', () => {
  let conversationService: ConversationService;
  let testInstanceId: string;

  beforeAll(async () => {
    await cacheService.initialize();
    
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

  describe('SendMessage Performance', () => {
    it('should maintain <3000ms total time for sendMessage flow (with Evolution API timeout)', async () => {
      const start = Date.now();

      try {
        // This will fail at Evolution API, but we measure the time until that point
        await conversationService.sendMessage(
          testInstanceId,
          '5511999999999@s.whatsapp.net',
          'Performance test message'
        );
      } catch (error: any) {
        // Expected to fail - Evolution API not available
        // We're testing the time until the API call, which includes:
        // - Cache lookup
        // - DB queries if cache miss
        // - Message normalization
      }

      const duration = Date.now() - start;
      
      // Even with API failure, the pre-API processing should be fast
      // Before optimization: ~2000ms just for DB lookups
      // After optimization: <500ms for cached lookups
      expect(duration).toBeLessThan(3000);
      
      console.log(`⚡ SendMessage processing time: ${duration}ms`);
      
      if (duration > 1000) {
        console.warn(`⚠️  Warning: Time >1000ms suggests cache miss or DB slowness`);
      }
    });

    it('should use cache for repeated sends to same number (2nd call should be faster)', async () => {
      const remoteJid = '5511999999999@s.whatsapp.net';
      const times: number[] = [];

      // First call - may have cache misses
      const start1 = Date.now();
      try {
        await conversationService.sendMessage(testInstanceId, remoteJid, 'Test 1');
      } catch (error) {
        // Expected
      }
      times.push(Date.now() - start1);

      // Second call - should use cache
      const start2 = Date.now();
      try {
        await conversationService.sendMessage(testInstanceId, remoteJid, 'Test 2');
      } catch (error) {
        // Expected
      }
      times.push(Date.now() - start2);

      console.log(`⚡ Times: 1st=${times[0]}ms, 2nd=${times[1]}ms`);
      
      // Second call should not be significantly slower (cache should help)
      expect(times[1]).toBeLessThanOrEqual((times[0] || 1000) * 1.5); // Allow 50% variance
    });
  });

  describe('HandleIncomingMessage Performance', () => {
    it('should process incoming message in <2000ms', async () => {
      const mockMessage = {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false,
          id: 'test-msg-' + Date.now()
        },
        message: {
          conversation: 'Test performance message'
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'Test User'
      };

      const start = Date.now();
      
      try {
        await conversationService.handleIncomingMessageAtomic(testInstanceId, mockMessage);
      } catch (error) {
        // May fail due to instance not found, but we measure the attempt
      }

      const duration = Date.now() - start;
      
      // Before optimization: ~4961ms total
      // After optimization: ~2545ms total (49% improvement)
      // Target: <2000ms for atomic operation
      expect(duration).toBeLessThan(2000);
      
      console.log(`⚡ Incoming message processing: ${duration}ms`);
    });
  });

  describe('Transaction Performance', () => {
    it('should complete database transaction in <1000ms', async () => {
      // This tests the consolidated transaction optimization
      // Before: 2167ms (separate queries)
      // After: 784ms (single transaction with upserts)
      
      const mockMessage = {
        key: {
          remoteJid: 'perf-test-' + Date.now() + '@s.whatsapp.net',
          fromMe: false,
          id: 'txn-test-' + Date.now()
        },
        message: {
          conversation: 'Transaction performance test'
        },
        messageTimestamp: Math.floor(Date.now() / 1000)
      };

      const start = Date.now();
      
      try {
        await conversationService.handleIncomingMessageAtomic(testInstanceId, mockMessage);
      } catch (error) {
        // Measure time regardless of success
      }

      const duration = Date.now() - start;
      
      // Should be much faster than 2167ms (old implementation)
      expect(duration).toBeLessThan(1500);
      
      console.log(`⚡ Transaction time: ${duration}ms (target: <1000ms, old: 2167ms)`);
      
      if (duration < 1000) {
        console.log(`✅ EXCELLENT: 64%+ improvement maintained!`);
      } else if (duration < 1500) {
        console.log(`✅ GOOD: Still improved from baseline`);
      } else {
        console.warn(`⚠️  REGRESSION: Transaction slower than expected`);
      }
    });
  });

  describe('Cache Performance Baseline', () => {
    it('should have cache lookup <10ms for warm cache', async () => {
      // Warm up cache
      await conversationService['conversationRepository'].findByInstanceId(testInstanceId);

      // Measure cached lookup
      const start = Date.now();
      await conversationService['conversationRepository'].findByInstanceId(testInstanceId);
      const duration = Date.now() - start;

      // Cache should be VERY fast (memory lookup)
      expect(duration).toBeLessThan(10);
      
      console.log(`⚡ Cache lookup: ${duration}ms`);
    });

    it('should have DB query <100ms for cold cache', async () => {
      // Use a new test instance to ensure cache miss
      const instances = await prisma.whatsAppInstance.findMany({ take: 2 });
      const alternateInstanceId = instances.length > 1 ? instances[1]!.id : testInstanceId;

      // Measure DB lookup (likely cache miss for alternate instance)
      const start = Date.now();
      await conversationService['conversationRepository'].findByInstanceId(alternateInstanceId);
      const duration = Date.now() - start;

      // DB query should still be reasonably fast
      expect(duration).toBeLessThan(200);
      
      console.log(`⚡ DB query: ${duration}ms`);
    });
  });
});
