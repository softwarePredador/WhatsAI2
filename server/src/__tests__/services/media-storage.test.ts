import { MediaStorageService, MediaUploadOptions } from '../../services/media-storage';
import { DigitalOceanSpacesService, SpacesConfig, UploadResult } from '../../services/digitalocean-spaces';
import { MediaMessageService, SendMediaOptions } from '../../services/messages';
import { Message } from '@prisma/client';

// Mock dependencies
jest.mock('../../services/digitalocean-spaces');
jest.mock('../../services/messages');

const mockSpacesService = DigitalOceanSpacesService as jest.MockedClass<typeof DigitalOceanSpacesService>;
const mockMediaMessageService = MediaMessageService as jest.MockedClass<typeof MediaMessageService>;

describe('MediaStorageService', () => {
  let mediaStorageService: MediaStorageService;
  let mockSpacesInstance: jest.Mocked<DigitalOceanSpacesService>;
  let mockMediaMessageInstance: jest.Mocked<MediaMessageService>;
  let mockSpacesConfig: SpacesConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSpacesConfig = {
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      region: 'nyc3',
      bucket: 'test-bucket',
      endpoint: 'https://nyc3.digitaloceanspaces.com'
    };

    // Create mock instance with all methods
    mockSpacesInstance = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      getCdnUrl: jest.fn().mockReturnValue('https://test-cdn.com/uploaded-file.png'),
      generateFileKey: jest.fn()
    } as any;

    mockMediaMessageInstance = {
      sendMediaMessage: jest.fn()
    } as any;

    // Mock the constructor to return our mocked instance
    mockSpacesService.mockImplementation(() => mockSpacesInstance);
    mockMediaMessageService.mockImplementation(() => mockMediaMessageInstance);

    mediaStorageService = new MediaStorageService(mockSpacesConfig);
  });

  describe('uploadAndSendMedia', () => {
    const mockOptions: MediaUploadOptions & { instanceId: string; remoteJid: string } = {
      file: Buffer.from('test image data'),
      fileName: 'test-image.png',
      contentType: 'image/png',
      conversationId: 'conv-123',
      mediaType: 'image',
      instanceId: 'inst-123',
      remoteJid: '5511999999999@s.whatsapp.net',
      caption: 'Test caption'
    };

    it('should upload file and send media successfully', async () => {
      const mockUploadResult: UploadResult = {
        key: 'uploaded-file.png',
        url: 'https://spaces.com/uploaded-file.png',
        signedUrl: 'https://signed-url.com',
        bucket: 'test-bucket',
        size: 1024,
        contentType: 'image/png'
      };

      const mockMessageResult: Message = {
        id: 'msg-123',
        instanceId: 'inst-123',
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: true,
        messageType: 'IMAGE',
        content: '[Imagem]',
        mediaUrl: 'https://spaces.com/uploaded-file.png',
        fileName: 'test-image.png',
        caption: 'Test caption',
        messageId: 'evo-msg-123',
        timestamp: new Date(),
        status: 'SENT',
        conversationId: 'conv-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (DigitalOceanSpacesService.generateFileKey as jest.Mock).mockReturnValue('generated-key.png');
      mockSpacesInstance.uploadFile.mockResolvedValue(mockUploadResult);
      mockMediaMessageInstance.sendMediaMessage.mockResolvedValue(mockMessageResult);

      const result = await mediaStorageService.uploadAndSendMedia(mockOptions);

      expect(DigitalOceanSpacesService.generateFileKey).toHaveBeenCalledWith(
        mockOptions.conversationId,
        mockOptions.fileName,
        mockOptions.mediaType
      );
      expect(mockSpacesInstance.uploadFile).toHaveBeenCalledWith(
        mockOptions.file,
        'generated-key.png',
        mockOptions.contentType,
        {
          acl: 'public-read',
          metadata: {
            conversationId: mockOptions.conversationId,
            mediaType: mockOptions.mediaType,
            originalName: mockOptions.fileName,
            uploadedAt: expect.any(String)
          }
        }
      );

      expect(mockMediaMessageInstance.sendMediaMessage).toHaveBeenCalledWith({
        instanceId: mockOptions.instanceId,
        remoteJid: mockOptions.remoteJid,
        mediaUrl: expect.any(String),
        mediaType: mockOptions.mediaType,
        caption: mockOptions.caption,
        fileName: mockOptions.fileName
      });

      expect(result).toEqual({
        message: mockMessageResult,
        upload: mockUploadResult
      });
    });

    it('should handle different media types', async () => {
      const videoOptions: MediaUploadOptions & { instanceId: string; remoteJid: string } = {
        ...mockOptions,
        mediaType: 'video',
        fileName: 'test-video.mp4',
        contentType: 'video/mp4'
      };

      const mockUploadResult: UploadResult = {
        key: 'uploaded-video.mp4',
        url: 'https://spaces.com/uploaded-video.mp4',
        signedUrl: 'https://signed-url.com',
        bucket: 'test-bucket',
        size: 2048,
        contentType: 'video/mp4'
      };

      (DigitalOceanSpacesService.generateFileKey as jest.Mock).mockReturnValue('generated-video.mp4');
      mockSpacesInstance.uploadFile.mockResolvedValue(mockUploadResult);
      mockMediaMessageInstance.sendMediaMessage.mockResolvedValue({} as Message);

      await mediaStorageService.uploadAndSendMedia(videoOptions);

      expect(mockMediaMessageInstance.sendMediaMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaType: 'video'
        })
      );
    });

    it('should rollback upload on send failure', async () => {
      const mockUploadResult: UploadResult = {
        key: 'uploaded-file.png',
        url: 'https://spaces.com/uploaded-file.png',
        signedUrl: 'https://signed-url.com',
        bucket: 'test-bucket',
        size: 1024,
        contentType: 'image/png'
      };

      (DigitalOceanSpacesService.generateFileKey as jest.Mock).mockReturnValue('generated-key.png');
      mockSpacesInstance.uploadFile.mockResolvedValue(mockUploadResult);
      mockMediaMessageInstance.sendMediaMessage.mockRejectedValue(new Error('Send failed'));

      // Spy on the deleteFile method
      const deleteFileSpy = jest.spyOn(mockSpacesInstance, 'deleteFile');

      await expect(mediaStorageService.uploadAndSendMedia(mockOptions))
        .rejects.toThrow('Send failed');

      expect(deleteFileSpy).toHaveBeenCalledWith('uploaded-file.png');
    });

    it('should validate required parameters', async () => {
      const invalidOptions = {
        ...mockOptions,
        file: undefined as any
      };

      await expect(mediaStorageService.uploadAndSendMedia(invalidOptions))
        .rejects.toThrow('Missing required parameters');
    });
  });
});