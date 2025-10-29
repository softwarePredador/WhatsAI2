import { prisma } from '../database/prisma';
import { MediaStorageService } from './media-storage';
import { SpacesConfig } from './digitalocean-spaces';
import { EvolutionApiService } from './evolution-api';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { mediaLogger } from '../utils/media-logger';
import sharp from 'sharp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export interface IncomingMediaOptions {
  messageId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio' | 'sticker' | 'document';
  fileName?: string;
  caption?: string;
  mimeType?: string;
  instanceName?: string; // Nome da instância Evolution API
  messageData?: any; // Dados completos da mensagem do webhook (necessário para descriptografar)
}

export class IncomingMediaService {
  private mediaStorageService: MediaStorageService;
  private evolutionApiService: EvolutionApiService;

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
    this.evolutionApiService = new EvolutionApiService();
  }

  /**
   * Processa mídia recebida via webhook
   */
  async processIncomingMedia(options: IncomingMediaOptions): Promise<string | null> {
    const { messageId, mediaUrl, mediaType, fileName, caption, mimeType, instanceName, messageData } = options;

    console.log(`🔥 [TEST_DEBUG] processIncomingMedia chamado com mediaUrl: ${mediaUrl}`);

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

      // 1. Baixar a mídia - usa Evolution API se for URL criptografada do WhatsApp
      const downloadedBuffer = await this.downloadMedia(mediaUrl, instanceName, messageData);
      console.log(`✅ [IncomingMedia] Mídia baixada: ${downloadedBuffer.length} bytes`);

      // 1.5 Validar se a imagem não está corrompida (usando sharp)
      if (mediaType === 'image' || mimeType?.includes('image')) {
        try {
          console.log(`🔍 [IMAGE_VALIDATION] Validando imagem com sharp...`);
          const metadata = await sharp(downloadedBuffer).metadata();
          console.log(`✅ [IMAGE_VALIDATION] Imagem válida: ${metadata.width}x${metadata.height} ${metadata.format}`);
          mediaLogger.log('✅ [IMAGE_VALIDATION] Validação sharp bem-sucedida', {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            size: metadata.size,
            hasAlpha: metadata.hasAlpha
          });
        } catch (sharpError: any) {
          console.error(`❌ [IMAGE_VALIDATION] IMAGEM CORROMPIDA! sharp falhou:`, sharpError.message);
          mediaLogger.error('❌ [IMAGE_VALIDATION] Imagem corrompida detectada', {
            error: sharpError.message,
            bufferSize: downloadedBuffer.length,
            bufferStart: downloadedBuffer.subarray(0, 16).toString('hex')
          });
          throw new Error(`Imagem corrompida detectada: ${sharpError.message}`);
        }
      }

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
   * Para URLs do WhatsApp criptografadas, usa Evolution API para descriptografar
   */
  private async downloadMedia(mediaUrl: string, instanceName?: string, messageData?: any): Promise<Buffer> {
    mediaLogger.log('🔄 [DOWNLOAD_START] Iniciando download da mídia', {
      url: mediaUrl.substring(0, 100) + '...'
    });

    try {
      console.log(`📥 [DOWNLOAD_REQUEST] Fazendo requisição HTTP...`);

      // Para URLs do WhatsApp (mmg.whatsapp.net), a mídia está CRIPTOGRAFADA
      // Usamos o Baileys para baixar e descriptografar automaticamente
      const isWhatsAppUrl = mediaUrl.includes('mmg.whatsapp.net');

      if (isWhatsAppUrl) {
        console.log(`🔐 [DOWNLOAD_BAILEYS] URL criptografada do WhatsApp detectada!`);
        
        if (!messageData) {
          console.error(`⚠️ [DOWNLOAD_ERROR] messageData não fornecido para descriptografar mídia!`);
          throw new Error('Cannot download encrypted WhatsApp media without messageData');
        }

        console.log(`🔧 [DOWNLOAD_BAILEYS] Preparando dados para descriptografia...`);
        
        // O webhook envia os campos de criptografia como objetos numéricos {"0": 63, "1": 7, ...}
        // Precisamos converter para Buffer antes de passar para o Baileys
        const message = messageData.message;
        const mediaMessage = message.imageMessage || message.videoMessage || message.audioMessage || message.documentMessage || message.stickerMessage;
        
        if (mediaMessage) {
          // Converter arrays numéricos para Buffers
          if (mediaMessage.mediaKey && typeof mediaMessage.mediaKey === 'object' && !Buffer.isBuffer(mediaMessage.mediaKey)) {
            mediaMessage.mediaKey = Buffer.from(Object.values(mediaMessage.mediaKey));
            console.log(`   ✅ mediaKey convertida: ${mediaMessage.mediaKey.length} bytes`);
          }
          
          if (mediaMessage.fileEncSha256 && typeof mediaMessage.fileEncSha256 === 'object' && !Buffer.isBuffer(mediaMessage.fileEncSha256)) {
            mediaMessage.fileEncSha256 = Buffer.from(Object.values(mediaMessage.fileEncSha256));
            console.log(`   ✅ fileEncSha256 convertida: ${mediaMessage.fileEncSha256.length} bytes`);
          }
          
          if (mediaMessage.fileSha256 && typeof mediaMessage.fileSha256 === 'object' && !Buffer.isBuffer(mediaMessage.fileSha256)) {
            mediaMessage.fileSha256 = Buffer.from(Object.values(mediaMessage.fileSha256));
            console.log(`   ✅ fileSha256 convertida: ${mediaMessage.fileSha256.length} bytes`);
          }
          
          if (mediaMessage.jpegThumbnail && typeof mediaMessage.jpegThumbnail === 'object' && !Buffer.isBuffer(mediaMessage.jpegThumbnail)) {
            mediaMessage.jpegThumbnail = Buffer.from(Object.values(mediaMessage.jpegThumbnail));
          }
        }

        console.log(`🚀 [DOWNLOAD_BAILEYS] Chamando Baileys downloadMediaMessage...`);
        
        // downloadMediaMessage do Baileys baixa e descriptografa automaticamente
        const buffer = await downloadMediaMessage(
          { key: messageData.key, message: messageData.message },
          'buffer',
          {},
          {
            logger: {
              fatal: () => {},
              error: (msg: string) => console.error(`[Baileys Error] ${msg}`),
              warn: (msg: string) => console.warn(`[Baileys Warn] ${msg}`),
              info: () => {},
              debug: () => {},
              trace: () => {}
            } as any,
            reuploadRequest: async () => {
              throw new Error('Media reupload not supported');
            }
          }
        );

        if (!buffer) {
          throw new Error('downloadMediaMessage returned null or undefined');
        }

        console.log(`✅ [DOWNLOAD_BAILEYS] Mídia descriptografada com sucesso: ${buffer.length} bytes`);
        return buffer;
      }

      // Para URLs normais (CDN, etc), baixar direto
      const headers: any = {
        'User-Agent': 'WhatsAI/1.0'
      };

      const response = await axios.get(mediaUrl, {
        responseType: 'arraybuffer', // Axios retorna ArrayBuffer, não Buffer diretamente
        timeout: 30000, // 30 segundos timeout
        headers,
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        maxBodyLength: 50 * 1024 * 1024,
        validateStatus: (status) => status < 400 // Aceitar redirects
        // IMPORTANTE: NÃO usar transformResponse com arraybuffer - deixe o Axios processar
        // IMPORTANTE: NÃO usar decompress: false - isso pode corromper dados binários
      });

      mediaLogger.log('✅ [DOWNLOAD_SUCCESS] Download concluído', {
        status: response.status,
        contentType: response.headers['content-type'],
        size: response.data.byteLength || response.data.length,
        isWhatsApp: isWhatsAppUrl
      });

      console.log(`🔍 [DOWNLOAD_DEBUG] Response data type: ${typeof response.data}`);
      console.log(`🔍 [DOWNLOAD_DEBUG] Response data constructor: ${response.data?.constructor?.name}`);
      console.log(`🔍 [DOWNLOAD_DEBUG] Response data isBuffer: ${Buffer.isBuffer(response.data)}`);
      console.log(`🔍 [DOWNLOAD_DEBUG] Response data byteLength: ${response.data.byteLength || 'N/A'}`);

      // Converter ArrayBuffer para Buffer de forma segura
      // Se já for Buffer, use direto; senão converta do ArrayBuffer
      let buffer: Buffer;
      if (Buffer.isBuffer(response.data)) {
        buffer = response.data;
        console.log(`✅ [DOWNLOAD_BUFFER] Dados já são Buffer: ${buffer.length} bytes`);
      } else if (response.data instanceof ArrayBuffer) {
        buffer = Buffer.from(response.data);
        console.log(`✅ [DOWNLOAD_BUFFER] Convertido de ArrayBuffer para Buffer: ${buffer.length} bytes`);
      } else {
        // Fallback: assume que é Uint8Array ou similar
        buffer = Buffer.from(response.data);
        console.log(`✅ [DOWNLOAD_BUFFER] Convertido para Buffer: ${buffer.length} bytes`);
      }
      
      console.log(`🔄 [DOWNLOAD_BUFFER] Buffer final criado com ${buffer.length} bytes`);

      // Validação básica para imagens
      if (buffer.length === 0) {
        throw new Error('Buffer vazio recebido');
      }

      console.log(`🔍 [VALIDATION_CHECK] Iniciando validação - isWhatsAppUrl: ${isWhatsAppUrl}, buffer.length: ${buffer.length}`);

      // SEMPRE verificar assinatura para URLs do WhatsApp (elas são sempre mídia)
      if (isWhatsAppUrl && buffer.length > 4) {
        console.log(`🔍 [VALIDATION_WHATSAPP] Executando validação WhatsApp`);
        const signature = buffer.subarray(0, 4).toString('hex');
        console.log(`🖼️ [DOWNLOAD_SIGNATURE] Assinatura da mídia WhatsApp: ${signature}`);

        // Verificar assinaturas comuns de imagem/vídeo
        const validImageSignatures = ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', '89504e47', '47494638'];
        const validVideoSignatures = ['00000018', '00000020']; // MP4 signatures
        const allValidSignatures = [...validImageSignatures, ...validVideoSignatures];

        if (!allValidSignatures.some(sig => signature.startsWith(sig))) {
          console.warn(`⚠️ [DOWNLOAD_SIGNATURE] Assinatura inválida detectada: ${signature}`);
          console.warn(`⚠️ [DOWNLOAD_SIGNATURE] Buffer corrompido? Verificando primeiros 16 bytes:`, buffer.subarray(0, 16).toString('hex'));
          // Não falhar por enquanto, mas logar para investigar
        } else {
          console.log(`✅ [DOWNLOAD_SIGNATURE] Assinatura válida detectada: ${signature}`);
        }
      }

      // Para imagens, verificar se começa com assinatura válida (fallback para outros casos)
      if (response.headers['content-type']?.includes('image/')) {
        const signature = buffer.subarray(0, 4).toString('hex');
        console.log(`🖼️ [DOWNLOAD_SIGNATURE] Assinatura da imagem (header): ${signature}`);

        // Verificar assinaturas comuns de imagem
        const validSignatures = ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', '89504e47', '47494638'];
        if (!validSignatures.some(sig => signature.startsWith(sig))) {
          console.warn(`⚠️ [DOWNLOAD_SIGNATURE] Assinatura inválida detectada: ${signature}`);
          // Não falhar, apenas logar - pode ser um formato não padrão
        }
      }

      return buffer;
    } catch (error: any) {
      mediaLogger.error('❌ [DOWNLOAD_ERROR] Falha no download', {
        error: error.message,
        status: error.response?.status,
        response: error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) : 'N/A',
        url: mediaUrl.substring(0, 100) + '...'
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

      // Determinar MIME type baseado no buffer e nome do arquivo
      const mimeType = this.getMimeTypeFromBuffer(buffer, fileName);
      mediaLogger.log('🏷️ [UPLOAD_MIME] MIME type determinado', { mimeType });

      // Validação adicional para imagens
      if (mediaType === 'image' && buffer.length > 0) {
        const firstBytes = buffer.subarray(0, 8).toString('hex');
        console.log(`🖼️ [UPLOAD_VALIDATION] Primeiros bytes da imagem: ${firstBytes}`);

        // Verificar se parece uma imagem válida
        if (buffer.length < 100) {
          console.warn(`⚠️ [UPLOAD_VALIDATION] Buffer muito pequeno para imagem: ${buffer.length} bytes`);
        }
      }

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
            source: 'incoming_webhook',
            bufferSize: buffer.length.toString()
          }
        }
      );

      mediaLogger.log('✅ [UPLOAD_SUCCESS] Upload concluído', {
        key: uploadResult.key,
        size: buffer.length
      });

      return uploadResult;
    } catch (error: any) {
      console.error(`❌ [UPLOAD_ERROR] Falha no upload:`);
      console.error(`   💥 Erro: ${error.message}`);
      console.error(`   📊 Status: ${error.statusCode || 'N/A'}`);
      console.error(`   📏 Buffer size: ${buffer.length}`);
      throw error;
    }
  }

  /**
   * Determina o tipo MIME baseado no buffer e nome do arquivo
   */
  private getMimeTypeFromBuffer(buffer: Buffer, fileName: string): string {
    const extension = path.extname(fileName).toLowerCase();

    // Primeiro tentar detectar pelo conteúdo do buffer (magic numbers)
    if (buffer.length >= 4) {
      const signature = buffer.subarray(0, 4).toString('hex');

      // JPEG
      if (signature.startsWith('ffd8')) {
        return 'image/jpeg';
      }
      // PNG
      if (signature === '89504e47') {
        return 'image/png';
      }
      // GIF
      if (signature.startsWith('474946')) {
        return 'image/gif';
      }
      // WebP
      if (signature === '52494646' && buffer.length >= 12) {
        const webpSignature = buffer.subarray(8, 12).toString('ascii');
        if (webpSignature === 'WEBP') {
          return 'image/webp';
        }
      }
    }

    // Fallback para extensão do arquivo
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