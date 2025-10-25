import { DigitalOceanSpacesService, SpacesConfig, UploadResult } from './digitalocean-spaces';
import { MediaMessageService, SendMediaOptions } from './messages';
import { Message } from '@prisma/client';

export interface MediaUploadOptions {
  file: Buffer;
  fileName: string;
  contentType: string;
  conversationId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  caption?: string;
}

export interface MediaUploadResult {
  upload: UploadResult;
  message: Message;
}

export class MediaStorageService {
  private spacesService: DigitalOceanSpacesService;
  private mediaService: MediaMessageService;

  constructor(spacesConfig: SpacesConfig) {
    this.spacesService = new DigitalOceanSpacesService(spacesConfig);
    this.mediaService = new MediaMessageService();
  }

  /**
   * Upload file to DigitalOcean Spaces and send as WhatsApp message
   */
  async uploadAndSendMedia(
    options: MediaUploadOptions & { instanceId: string; remoteJid: string }
  ): Promise<MediaUploadResult> {
    const { file, fileName, contentType, conversationId, mediaType, caption, instanceId, remoteJid } = options;

    try {
      console.log(`🚀 [MediaStorage] Starting upload and send process for ${fileName}`);

      // 1. Generate unique key for the file
      const fileKey = DigitalOceanSpacesService.generateFileKey(
        conversationId,
        fileName,
        mediaType
      );

      // 2. Upload to DigitalOcean Spaces
      console.log(`📤 [MediaStorage] Uploading to Spaces: ${fileKey}`);
      const uploadResult = await this.spacesService.uploadFile(
        file,
        fileKey,
        contentType,
        {
          acl: 'public-read', // Make file publicly accessible
          metadata: {
            conversationId,
            mediaType,
            originalName: fileName,
            uploadedAt: new Date().toISOString(),
          },
        }
      );

      // 3. Get CDN URL for faster access
      const cdnUrl = this.spacesService.getCdnUrl(uploadResult.key);

      console.log(`✅ [MediaStorage] File uploaded. CDN URL: ${cdnUrl}`);

      // 4. Send as WhatsApp message
      console.log(`📱 [MediaStorage] Sending as WhatsApp message`);
      const message = await this.mediaService.sendMediaMessage({
        instanceId,
        remoteJid,
        mediaUrl: cdnUrl, // Use CDN URL instead of direct Spaces URL
        mediaType,
        caption,
        fileName,
      });

      console.log(`🎉 [MediaStorage] Process completed successfully`);

      return {
        upload: uploadResult,
        message,
      };

    } catch (error) {
      console.error(`❌ [MediaStorage] Process failed:`, error);

      // If upload succeeded but message failed, we might want to cleanup
      // For now, just throw the error
      throw error;
    }
  }

  /**
   * Upload file to Spaces only (without sending message)
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    conversationId: string,
    mediaType: string
  ): Promise<UploadResult> {
    const fileKey = DigitalOceanSpacesService.generateFileKey(
      conversationId,
      fileName,
      mediaType
    );

    return this.spacesService.uploadFile(file, fileKey, contentType, {
      acl: 'public-read',
      metadata: {
        conversationId,
        mediaType,
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Delete file from Spaces
   */
  async deleteFile(fileKey: string): Promise<void> {
    return this.spacesService.deleteFile(fileKey);
  }

  /**
   * Get signed URL for private access
   */
  async getSignedUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
    return this.spacesService.getSignedUrl(fileKey, expiresIn);
  }

  /**
   * Get CDN URL for public access
   */
  getCdnUrl(fileKey: string): string {
    return this.spacesService.getCdnUrl(fileKey);
  }
}