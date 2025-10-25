import { DigitalOceanSpacesService, SpacesConfig } from '../../services/digitalocean-spaces';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: jest.fn().mockResolvedValue({
      Location: 'https://test-bucket.nyc3.digitaloceanspaces.com/test-image.png',
      Key: 'test-image.png',
      Bucket: 'test-bucket',
      ETag: '"test-etag"'
    })
  }))
}));

const mockS3Client = S3Client as jest.MockedClass<typeof S3Client>;
const mockPutObjectCommand = PutObjectCommand as jest.MockedClass<typeof PutObjectCommand>;
const mockDeleteObjectCommand = DeleteObjectCommand as jest.MockedClass<typeof DeleteObjectCommand>;
const mockGetObjectCommand = GetObjectCommand as jest.MockedClass<typeof GetObjectCommand>;
const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

// Mock getSignedUrl to return a signed URL
mockGetSignedUrl.mockResolvedValue('https://signed-url.com');

describe('DigitalOceanSpacesService', () => {
  let spacesService: DigitalOceanSpacesService;
  const mockConfig: SpacesConfig = {
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    region: 'nyc3',
    bucket: 'test-bucket',
    endpoint: 'https://nyc3.digitaloceanspaces.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variables
    process.env['DO_SPACES_ACCESS_KEY'] = mockConfig.accessKeyId;
    process.env['DO_SPACES_SECRET_KEY'] = mockConfig.secretAccessKey;
    process.env['DO_SPACES_REGION'] = mockConfig.region;
    process.env['DO_SPACES_BUCKET'] = mockConfig.bucket;
    process.env['DO_SPACES_CDN_URL'] = 'https://test-cdn.com';

    spacesService = new DigitalOceanSpacesService(mockConfig);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env['DO_SPACES_ACCESS_KEY'];
    delete process.env['DO_SPACES_SECRET_KEY'];
    delete process.env['DO_SPACES_REGION'];
    delete process.env['DO_SPACES_BUCKET'];
    delete process.env['DO_SPACES_CDN_URL'];
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      mockS3Client.prototype.send = mockSend;

      const fileBuffer = Buffer.from('test file content');
      const fileName = 'test-image.png';
      const mimeType = 'image/png';

      const result = await spacesService.uploadFile(fileBuffer, fileName, mimeType);

      expect(result).toHaveProperty('url', 'https://test-bucket.nyc3.digitaloceanspaces.com/test-image.png');
      expect(result).toHaveProperty('key', 'test-image.png');
      expect(result).toHaveProperty('bucket', 'test-bucket');
      expect(result).toHaveProperty('contentType', 'image/png');
      expect(result).toHaveProperty('signedUrl', 'https://signed-url.com');
    });

    it('should handle upload errors', async () => {
      // Create a mock Upload that rejects
      const mockUploadError = {
        done: jest.fn().mockRejectedValue(new Error('Upload failed'))
      };

      // Temporarily replace the Upload constructor
      const originalUpload = require('@aws-sdk/lib-storage').Upload;
      require('@aws-sdk/lib-storage').Upload = jest.fn(() => mockUploadError);

      const fileBuffer = Buffer.from('test content');
      const fileName = 'test.png';

      await expect(spacesService.uploadFile(fileBuffer, fileName, 'image/png'))
        .rejects.toThrow('Failed to upload file');

      // Restore original
      require('@aws-sdk/lib-storage').Upload = originalUpload;
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      mockS3Client.prototype.send = mockSend;

      const fileName = 'test-image.png';

      await spacesService.deleteFile(fileName);

      expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: mockConfig.bucket,
        Key: fileName
      });

      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('should handle delete errors', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Delete failed'));
      mockS3Client.prototype.send = mockSend;

      const fileName = 'test.png';

      await expect(spacesService.deleteFile(fileName))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('getSignedUrl', () => {
    it('should generate signed URL successfully', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-url.com');

      const fileName = 'test-image.png';
      const expiresIn = 3600;

      const result = await spacesService.getSignedUrl(fileName, expiresIn);

      expect(mockGetObjectCommand).toHaveBeenCalledWith({
        Bucket: mockConfig.bucket,
        Key: fileName
      });

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(GetObjectCommand),
        { expiresIn }
      );

      expect(result).toBe('https://signed-url.com');
    });
  });

  describe('getCdnUrl', () => {
    it('should return CDN URL for file', () => {
      const fileName = 'test-image.png';
      const result = spacesService.getCdnUrl(fileName);

      expect(result).toBe(`https://${mockConfig.bucket}.${mockConfig.region}.cdn.digitaloceanspaces.com/${fileName}`);
    });
  });

  describe('generateFileKey', () => {
    it('should generate unique file key with timestamp', () => {
      const conversationId = 'conv-123';
      const originalName = 'test-image.png';
      const mediaType = 'image';
      const result = DigitalOceanSpacesService.generateFileKey(conversationId, originalName, mediaType);

      expect(result).toContain('conversations/conv-123/image');
      expect(result).toContain('.png');
      expect(result).toMatch(/^conversations\/conv-123\/image\/\d+_[a-z0-9]+\.png$/);
    });
  });
});