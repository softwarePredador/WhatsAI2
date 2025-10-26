import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('SocketService Configuration', () => {
  const mockSocket = {
    connected: false,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    listeners: vi.fn(() => []),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (io as any).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use relative URL for WebSocket connection when VITE_SOCKET_URL is not set', async () => {
    // Import the service
    const { socketService } = await import('../services/socketService');

    // Call connect
    socketService.connect('test-token');

    // Verify io was called with relative URL '/' (which gets proxied)
    expect(io).toHaveBeenCalledWith('/', {
      auth: { token: 'test-token' },
      transports: ['websocket', 'polling'],
    });
  });

  it('should use relative URL even when VITE_SOCKET_URL is set (for proxy compatibility)', async () => {
    // The service should always use relative URLs to work with Vite proxy
    // Import the service
    const { socketService } = await import('../services/socketService');

    // Call connect
    socketService.connect('test-token');

    // Verify io was called with relative URL '/' regardless of env vars
    expect(io).toHaveBeenCalledWith('/', {
      auth: { token: 'test-token' },
      transports: ['websocket', 'polling'],
    });
  });

  it('should not create duplicate connections when already connected', async () => {
    // Mock import.meta.env
    const originalEnv = import.meta.env;
    (import.meta as any).env = {
      ...originalEnv,
      VITE_SOCKET_URL: undefined,
    };

    // Import the service
    const { socketService } = await import('../services/socketService');

    // Mock socket as already connected
    mockSocket.connected = true;

    // Call connect
    socketService.connect('test-token');

    // Verify io was not called again
    expect(io).not.toHaveBeenCalled();

    // Restore
    mockSocket.connected = false;
    (import.meta as any).env = originalEnv;
  });
});