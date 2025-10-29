import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DigitalOceanSpacesService, SpacesConfig } from './digitalocean-spaces';

export interface StorageConfig {
  type: 'local' | 's3';
  local?: {
    basePath: string;
  };
  s3?: SpacesConfig;
}

export interface StoredFile {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
  uploadedAt: Date;
}

export class MediaStorageService {
  private config: StorageConfig;
  private spacesService?: DigitalOceanSpacesService;

  constructor(config: StorageConfig) {
    this.config = config;
    
    // Inicializar DigitalOcean Spaces se configurado
    if (config.type === 's3' && config.s3) {
      this.spacesService = new DigitalOceanSpacesService(config.s3);
    }
  }

  /**
   * Salva arquivo no armazenamento configurado
   */
  async saveFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    mediaType: 'image' | 'audio' | 'document' | 'sticker'
  ): Promise<StoredFile> {
    const fileId = uuidv4();
    const extension = this.getExtensionFromMimeType(mimeType);
    const fileName = `${fileId}.${extension}`;

    if (this.config.type === 'local') {
      return this.saveToLocal(buffer, fileName, originalName, mimeType, mediaType);
    } else if (this.config.type === 's3') {
      return this.saveToS3(buffer, fileName, originalName, mimeType, mediaType);
    }

    throw new Error(`Tipo de armazenamento não suportado: ${this.config.type}`);
  }

  /**
   * Salva arquivo localmente
   */
  private async saveToLocal(
    buffer: Buffer,
    fileName: string,
    originalName: string,
    mimeType: string,
    mediaType: 'image' | 'audio' | 'document' | 'sticker'
  ): Promise<StoredFile> {
    const basePath = this.config.local?.basePath || './uploads/media';
    const mediaPath = path.join(basePath, mediaType);
    const fullPath = path.join(mediaPath, fileName);

    // Garantir que o diretório existe
    await fs.mkdir(mediaPath, { recursive: true });

    // Salvar arquivo
    await fs.writeFile(fullPath, buffer);

    const storedFile: StoredFile = {
      id: fileName.split('.')[0] || fileName, // Use filename without extension, or full filename if no extension
      originalName,
      fileName,
      mimeType,
      size: buffer.length,
      url: `/uploads/media/${mediaType}/${fileName}`, // URL relativa para servir via static
      path: fullPath,
      uploadedAt: new Date()
    };

    return storedFile;
  }

  /**
   * Salva arquivo no S3/Spaces com retry logic
   */
  private async saveToS3(
    buffer: Buffer,
    fileName: string,
    originalName: string,
    mimeType: string,
    mediaType: 'image' | 'audio' | 'document' | 'sticker'
  ): Promise<StoredFile> {
    if (!this.spacesService) {
      throw new Error('DigitalOcean Spaces não configurado');
    }

    const key = `media/${mediaType}/${fileName}`;
    
    try {
      // Upload com retry automático (3 tentativas)
      const uploadResult = await this.uploadWithRetry(
        buffer,
        key,
        mimeType,
        {
          originalName,
          mediaType
        },
        3 // max tentativas
      );

      const storedFile: StoredFile = {
        id: fileName.split('.')[0] || fileName,
        originalName,
        fileName,
        mimeType,
        size: uploadResult.size,
        url: uploadResult.url, // URL pública do CDN
        path: key, // Path no S3
        uploadedAt: new Date()
      };

      return storedFile;
    } catch (error) {
      console.error(`❌ [MediaStorage] Erro ao fazer upload para S3:`, error);
      throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload com retry logic automático
   */
  private async uploadWithRetry(
    buffer: Buffer,
    key: string,
    contentType: string,
    metadata: Record<string, string>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.spacesService!.uploadFile(buffer, key, contentType, {
          metadata,
          acl: 'public-read'
        });
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ [MediaStorage] Upload falhou (tentativa ${attempt}/${maxRetries}):`, error);
        
        if (attempt < maxRetries) {
          // Esperar antes de tentar novamente (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    throw lastError || new Error('Upload failed after retries');
  }

  /**
   * Remove arquivo do armazenamento
   */
  async deleteFile(filePath: string): Promise<void> {
    if (this.config.type === 'local') {
      try {
        await fs.unlink(filePath);
        console.log(`✅ [MediaStorage] Arquivo removido: ${filePath}`);
      } catch (error) {
        console.warn(`⚠️ [MediaStorage] Erro ao remover arquivo: ${filePath}`, error);
      }
    } else if (this.config.type === 's3') {
      if (!this.spacesService) {
        throw new Error('DigitalOcean Spaces não configurado');
      }

      try {
        await this.spacesService.deleteFile(filePath);
        console.log(`✅ [MediaStorage] Arquivo removido do S3: ${filePath}`);
      } catch (error) {
        console.warn(`⚠️ [MediaStorage] Erro ao remover arquivo do S3: ${filePath}`, error);
        throw error;
      }
    }
  }

  /**
   * Obtém extensão do arquivo baseada no MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/m4a': 'm4a',
      'audio/aac': 'aac',
      'video/mp4': 'mp4',
      'video/avi': 'avi',
      'video/mov': 'mov',
      'video/quicktime': 'mov',
      'video/webm': 'webm',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/csv': 'csv'
    };

    return extensions[mimeType] || 'bin';
  }

  /**
   * Valida se o arquivo existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    if (this.config.type === 'local') {
      try {
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    } else if (this.config.type === 's3') {
      if (!this.spacesService) {
        return false;
      }

      try {
        // Tenta obter metadados do arquivo (mais leve que download)
        const exists = await this.spacesService.fileExists(filePath);
        return exists;
      } catch {
        return false;
      }
    }
    
    return false;
  }

  /**
   * Obtém informações do arquivo
   */
  async getFileInfo(filePath: string): Promise<{ size: number; modified: Date } | null> {
    if (this.config.type === 'local') {
      try {
        const stats = await fs.stat(filePath);
        return {
          size: stats.size,
          modified: stats.mtime
        };
      } catch {
        return null;
      }
    } else if (this.config.type === 's3') {
      if (!this.spacesService) {
        return null;
      }

      try {
        const info = await this.spacesService.getFileInfo(filePath);
        return info;
      } catch {
        return null;
      }
    }
    
    return null;
  }

  /**
   * Faz download de arquivo do S3 (retorna buffer)
   */
  async downloadFile(filePath: string): Promise<Buffer | null> {
    if (this.config.type === 'local') {
      try {
        return await fs.readFile(filePath);
      } catch {
        return null;
      }
    } else if (this.config.type === 's3') {
      if (!this.spacesService) {
        return null;
      }

      try {
        return await this.spacesService.downloadFile(filePath);
      } catch {
        return null;
      }
    }
    
    return null;
  }

  /**
   * Obtém URL assinada (válida por tempo limitado) para arquivo privado
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    if (this.config.type === 's3' && this.spacesService) {
      try {
        return await this.spacesService.getSignedUrl(filePath, expiresIn);
      } catch {
        return null;
      }
    }
    
    return null;
  }
}

// Configuração padrão para desenvolvimento
export const createLocalStorage = (basePath = './uploads/media'): MediaStorageService => {
  return new MediaStorageService({
    type: 'local',
    local: { basePath }
  });
};

// Configuração para produção com S3
export const createS3Storage = (config: {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}): MediaStorageService => {
  return new MediaStorageService({
    type: 's3',
    s3: {
      ...config,
      endpoint: config.endpoint || `https://${config.region}.digitaloceanspaces.com`
    }
  });
};