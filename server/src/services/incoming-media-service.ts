import { prisma } from '../database/prisma';
import { MediaStorageService } from './media-storage';
import { SpacesConfig } from './digitalocean-spaces';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { mediaLogger } from '../utils/media-logger';

export interface IncomingMediaOptions {
  messageId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio' | 'sticker' | 'document';
  fileName?: string;
  caption?: string;
  mimeType?: string;
}

export class IncomingMediaService {
  private mediaStorageService: MediaStorageService;

  constructor(spacesConfig?: SpacesConfig) {
    // Usar configuração fornecida ou ler das variáveis de ambiente
    const config = spacesConfig || {
      accessKeyId: process.env['DO_SPACES_ACCESS_KEY'] || '',
      secretAccessKey: process.env['DO_SPACES_SECRET_KEY'] || '',
      region: process.env['DO_SPACES_REGION'] || 'sfo3',
      bucket: process.env['DO_SPACES_BUCKET'] || 'whatsais3',
      endpoint: process.env['DO_SPACES_ENDPOINT'] || 'https://sfo3.digitaloceanspaces.com'
    };

    console.log('🔧 [IncomingMediaService] Spaces config:', {
      hasAccessKey: !!config.accessKeyId,
      hasSecretKey: !!config.secretAccessKey,
      region: config.region,
      bucket: config.bucket,
      endpoint: config.endpoint
    });

    this.mediaStorageService = new MediaStorageService(config);
  }

  /**
   * Processa mídia recebida via webhook
   */
  async processIncomingMedia(options: IncomingMediaOptions): Promise<string | null> {
    const { messageId, mediaUrl, mediaType, fileName, caption, mimeType } = options;

    mediaLogger.log('🚀 [INCOMING_MEDIA_START] Iniciando processamento de mídia:', {
      messageId,
      mediaType,
      mediaUrl: mediaUrl.substring(0, 100) + '...',
      fileName,
      caption,
      mimeType
    });

    try {
      console.log(`📥 [IncomingMedia] Processando mídia recebida: ${mediaType} - ${messageId}`);

      // 1. Baixar a mídia do WhatsApp/Evolution API
      const downloadedBuffer = await this.downloadMedia(mediaUrl);
      console.log(`✅ [IncomingMedia] Mídia baixada: ${downloadedBuffer.length} bytes`);

      // 2. Determinar nome do arquivo
      const finalFileName = this.generateFileName(messageId, mediaType, fileName, mimeType);

      // 3. Upload para DigitalOcean Spaces
      const uploadResult = await this.uploadToSpaces(downloadedBuffer, finalFileName, mediaType, caption);
      mediaLogger.log('✅ [INCOMING_MEDIA] Mídia enviada para Spaces', { key: uploadResult.key });

      // 4. Retornar a URL CDN para armazenamento no banco
      const cdnUrl = this.mediaStorageService['spacesService'].getCdnUrl(uploadResult.key);
      mediaLogger.log('🎉 [INCOMING_MEDIA] URL CDN gerada', { cdnUrl });

      return cdnUrl;

    } catch (error: any) {
      mediaLogger.error('❌ [INCOMING_MEDIA] Erro ao processar mídia', {
        messageId,
        error: error.message,
        stack: error.stack
      });
      // Em caso de erro, retornar null para manter a URL original
      return null;
    }
  }

  /**
   * Baixa mídia da URL fornecida
   */
  private async downloadMedia(mediaUrl: string): Promise<Buffer> {
    mediaLogger.log('🔄 [DOWNLOAD_START] Iniciando download da mídia', {
      url: mediaUrl.substring(0, 100) + '...'
    });

    try {
      console.log(`📥 [DOWNLOAD_REQUEST] Fazendo requisição HTTP...`);

      const response = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 segundos timeout
        headers: {
          'User-Agent': 'WhatsAI/1.0'
        }
      });

      mediaLogger.log('✅ [DOWNLOAD_SUCCESS] Download concluído', {
        status: response.status,
        contentType: response.headers['content-type'],
        size: response.data.length
      });

      const buffer = Buffer.from(response.data);
      console.log(`🔄 [DOWNLOAD_BUFFER] Buffer criado com ${buffer.length} bytes`);

      return buffer;
    } catch (error: any) {
      mediaLogger.error('❌ [DOWNLOAD_ERROR] Falha no download', {
        error: error.message,
        status: error.response?.status,
        response: error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) : 'N/A'
      });
      throw new Error(`Falha ao baixar mídia: ${error.message}`);
    }
  }

  /**
   * Gera nome único para o arquivo
   */
  private generateFileName(messageId: string, mediaType: string, originalFileName?: string, mimeType?: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);

    // Extrair extensão do mimeType ou usar padrão
    let extension = '.bin'; // fallback
    if (mimeType) {
      const mimeLower = mimeType.toLowerCase();
      if (mimeLower.includes('jpeg') || mimeLower.includes('jpg')) extension = '.jpg';
      else if (mimeLower.includes('png')) extension = '.png';
      else if (mimeLower.includes('gif')) extension = '.gif';
      else if (mimeLower.includes('mp4')) extension = '.mp4';
      else if (mimeLower.includes('webm')) extension = '.webm';
      else if (mimeLower.includes('mp3')) extension = '.mp3';
      else if (mimeLower.includes('ogg')) extension = '.ogg';
      else if (mimeLower.includes('webp')) extension = '.webp';
      else if (mimeLower.includes('aac')) extension = '.aac';
      else if (mimeLower.includes('wav')) extension = '.wav';
    }

    // Usar nome original se disponível, senão gerar
    const baseName = originalFileName ?
      path.parse(originalFileName).name :
      `${mediaType}_${messageId}_${randomId}`;

    return `${baseName}_${timestamp}${extension}`;
  }

  /**
   * Upload para DigitalOcean Spaces
   */
  private async uploadToSpaces(
    buffer: Buffer,
    fileName: string,
    mediaType: string,
    caption?: string
  ): Promise<any> {
    mediaLogger.log('🔄 [UPLOAD_START] Iniciando upload para Spaces', {
      fileName,
      mediaType,
      bufferSize: buffer.length,
      caption
    });

    try {
      const fileKey = `incoming/${mediaType}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${fileName}`;
      mediaLogger.log('🔑 [UPLOAD_KEY] Chave gerada', { fileKey });

      // Determinar MIME type
      const mimeType = this.getMimeTypeFromBuffer(buffer, fileName);
      mediaLogger.log('🏷️ [UPLOAD_MIME] MIME type determinado', { mimeType });

      mediaLogger.log('📤 [UPLOAD_REQUEST] Fazendo upload para Spaces...');

      // Upload usando o serviço DigitalOcean Spaces diretamente
      const uploadResult = await this.mediaStorageService['spacesService'].uploadFile(
        buffer,
        fileKey,
        mimeType,
        {
          acl: 'public-read',
          metadata: {
            mediaType,
            originalName: fileName,
            caption: caption || '',
            uploadedAt: new Date().toISOString(),
            source: 'incoming_webhook'
          }
        }
      );

      mediaLogger.log('✅ [UPLOAD_SUCCESS] Upload concluído', {
        key: uploadResult.key
      });

      return uploadResult;
    } catch (error: any) {
      console.error(`❌ [UPLOAD_ERROR] Falha no upload:`);
      console.error(`   💥 Erro: ${error.message}`);
      console.error(`   📊 Status: ${error.statusCode || 'N/A'}`);
      throw error;
    }
  }

  /**
   * Determina o tipo MIME baseado no buffer e nome do arquivo
   */
  private getMimeTypeFromBuffer(buffer: Buffer, fileName: string): string {
    const extension = path.extname(fileName).toLowerCase();

    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.aac': 'audio/aac'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Verifica se uma URL é válida e acessível
   */
  async validateMediaUrl(mediaUrl: string): Promise<boolean> {
    try {
      const response = await axios.head(mediaUrl, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}