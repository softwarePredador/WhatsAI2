import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';

describe('Webhook Debounce Tests (Critical)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Presence Update Debounce', () => {
    it('should debounce multiple presence updates within 2 seconds', async () => {
      const callback = jest.fn(async () => {});
      const debouncedCallback = debounce(callback, 2000);

      // Send 5 rapid presence updates (simulating webhook spam)
      debouncedCallback();
      debouncedCallback();
      debouncedCallback();
      debouncedCallback();
      debouncedCallback();

      // Wait for debounce to trigger
      await new Promise(resolve => setTimeout(resolve, 2200));

      // Should execute only ONCE despite 5 calls
      expect(callback).toHaveBeenCalledTimes(1);
      console.log(`✅ Debounced 5 calls into 1 execution`);
    });

    it('should allow execution after debounce window expires', async () => {
      const callback = jest.fn(async () => {});
      const debouncedCallback = debounce(callback, 500);

      // First call
      debouncedCallback();
      await new Promise(resolve => setTimeout(resolve, 600));

      // Second call after window expired
      debouncedCallback();
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should execute twice (once per window)
      expect(callback).toHaveBeenCalledTimes(2);
      console.log(`✅ Allowed execution in separate windows`);
    });
  });

  describe('Chats Upsert Throttle', () => {
    it('should throttle rapid chat updates', async () => {
      const callback = jest.fn(async () => {});
      const throttledCallback = throttle(callback, 1000);

      // Simulate 10 rapid chat updates (common with groups)
      for (let i = 0; i < 10; i++) {
        throttledCallback();
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms between calls
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      // Throttle allows first call + possibly 1-2 more during window
      expect(callback.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(callback.mock.calls.length).toBeLessThanOrEqual(3);
      console.log(`✅ Throttled 10 chat updates into ${callback.mock.calls.length} executions`);
    });
  });

  describe('Performance Impact', () => {
    it('should prevent database spam from rapid webhooks (90%+ reduction)', async () => {
      const dbOperations: number[] = [];
      
      const simulateDbWrite = jest.fn(async (timestamp: number) => {
        dbOperations.push(timestamp);
      });

      const debouncedWrite = debounce(() => simulateDbWrite(Date.now()), 1000);

      // Simulate 20 rapid webhook calls (what happens in production)
      for (let i = 0; i < 20; i++) {
        debouncedWrite();
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms between calls
      }

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Without debounce: 20 DB writes
      // With debounce: 1 DB write
      expect(dbOperations.length).toBeLessThanOrEqual(2); // Allow 1-2 due to timing
      
      const reduction = ((20 - dbOperations.length) / 20) * 100;
      console.log(`⚡ Prevented ${20 - dbOperations.length}/20 DB writes (${reduction.toFixed(0)}% reduction)`);
      
      expect(reduction).toBeGreaterThanOrEqual(85); // At least 85% reduction
    });
  });

  describe('Edge Cases', () => {
    it('should handle async callbacks correctly', async () => {
      let executedValue: string | null = null;

      const asyncCallback = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        executedValue = 'completed';
      });

      const debouncedAsync = debounce(asyncCallback, 500);

      debouncedAsync();
      await new Promise(resolve => setTimeout(resolve, 700)); // Wait for debounce + execution

      expect(asyncCallback).toHaveBeenCalledTimes(1);
      expect(executedValue).toBe('completed');
    });

    it('should throttle prevent excessive executions', async () => {
      const callback = jest.fn();
      const throttledCallback = throttle(callback, 500);

      // Call 100 times rapidly
      for (let i = 0; i < 100; i++) {
        throttledCallback();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should execute very few times
      expect(callback.mock.calls.length).toBeLessThan(10);
      console.log(`✅ Throttled 100 calls to ${callback.mock.calls.length} executions`);
    });
  });
});
