import { EvolutionApiService } from '../../services/evolution-api';

// Mock axios
const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: mockGet,
    post: mockPost,
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

import axios from 'axios';

describe('EvolutionApiService', () => {
  let evolutionApi: EvolutionApiService;
  const mockConfig = {
    baseURL: 'https://api.evolution.com',
    apiKey: 'test-api-key'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    evolutionApi = new EvolutionApiService(mockConfig.baseURL, mockConfig.apiKey);
  });

  describe('sendMediaMessage', () => {
    it('should send media message with correct payload structure', async () => {
      // Mock file download
      mockGet.mockResolvedValue({
        data: Buffer.from('test image data'),
        headers: { 'content-type': 'image/png' }
      });

      // Mock send response
      mockPost.mockResolvedValue({
        data: { key: { id: 'msg-123' }, status: 'PENDING' }
      });

      const result = await evolutionApi.sendMediaMessage(
        'instance-123',
        '5511999999999',
        'https://example.com/image.png',
        'Test caption',
        'image'
      );

      expect(mockGet).toHaveBeenCalledWith('https://example.com/image.png', {
        responseType: 'arraybuffer'
      });

      expect(mockPost).toHaveBeenCalledWith('/message/sendMedia/instance-123', {
        number: '5511999999999',
        mediatype: 'image',
        mimetype: 'image/png',
        caption: 'Test caption',
        media: expect.any(String), // base64 encoded
        fileName: expect.stringContaining('.png'),
        delay: 1200
      });

      expect(result).toEqual({ key: { id: 'msg-123' }, status: 'PENDING' });
    });
  });
});