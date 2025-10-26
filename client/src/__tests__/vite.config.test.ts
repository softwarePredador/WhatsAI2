import { describe, it, expect } from 'vitest';
import viteConfig from '../../vite.config';

describe('Vite Configuration', () => {
  it('should have correct server port', () => {
    expect(viteConfig.server?.port).toBe(3000);
  });

  it('should have API proxy configured correctly', () => {
    const proxy = viteConfig.server?.proxy as any;

    expect(proxy).toBeDefined();
    expect(proxy['/api']).toBeDefined();
    expect(proxy['/api'].target).toBe('http://localhost:3001');
    expect(proxy['/api'].changeOrigin).toBe(true);
  });

  it('should have WebSocket proxy configured correctly', () => {
    const proxy = viteConfig.server?.proxy as any;

    expect(proxy).toBeDefined();
    expect(proxy['/socket.io']).toBeDefined();
    expect(proxy['/socket.io'].target).toBe('http://localhost:3001');
    expect(proxy['/socket.io'].changeOrigin).toBe(true);
    expect(proxy['/socket.io'].ws).toBe(true);
  });

  it('should allow external connections', () => {
    expect(viteConfig.server?.host).toBe(true);
    expect(viteConfig.server?.allowedHosts).toBe(true);
  });
});