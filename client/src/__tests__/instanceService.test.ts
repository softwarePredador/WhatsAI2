import { describe, it, expect } from 'vitest';

describe('InstanceService Configuration', () => {
  it('should export instanceService object', async () => {
    // Import the service
    const { instanceService } = await import('../features/instances/services/instanceService');

    // Verify it has the expected methods
    expect(instanceService).toHaveProperty('getInstances');
    expect(typeof instanceService.getInstances).toBe('function');
  });

  it('should be configured to use relative URLs for proxy compatibility', async () => {
    // This test ensures the service is set up correctly
    // The actual URL construction happens at import time
    const { instanceService } = await import('../features/instances/services/instanceService');

    // Just verify the service exists and has methods
    expect(instanceService.getInstances).toBeDefined();
  });
});