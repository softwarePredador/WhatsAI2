import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StorageConfig {
  type: 'local' | 's3';
  local?: {
    basePath: string;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
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

  constructor(config: StorageConfig) {
    this.config = config;
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

    console.log(`💾 [MediaStorage] Arquivo salvo localmente: ${fullPath}`);
    return storedFile;
  }

  /**
   * Salva arquivo no S3 (placeholder - implementação futura)
   */
  private async saveToS3(
    buffer: Buffer,
    fileName: string,
    originalName: string,
    mimeType: string,
    mediaType: 'image' | 'audio' | 'document' | 'sticker'
  ): Promise<StoredFile> {
    // TODO: Implementar upload para S3
    throw new Error('Upload para S3 ainda não implementado');
  }

  /**
   * Remove arquivo do armazenamento
   */
  async deleteFile(filePath: string): Promise<void> {
    if (this.config.type === 'local') {
      try {
        await fs.unlink(filePath);
        console.log(`🗑️ [MediaStorage] Arquivo removido: ${filePath}`);
      } catch (error) {
        console.warn(`⚠️ [MediaStorage] Erro ao remover arquivo: ${filePath}`, error);
      }
    } else if (this.config.type === 's3') {
      // TODO: Implementar remoção do S3
      throw new Error('Remoção do S3 ainda não implementada');
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
    }
    return false; // TODO: Implementar para S3
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
    }
    return null; // TODO: Implementar para S3
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
}): MediaStorageService => {
  return new MediaStorageService({
    type: 's3',
    s3: config
  });
};