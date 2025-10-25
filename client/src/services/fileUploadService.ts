export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mediaType: string;
}

export interface UploadError {
  code: string;
  message: string;
  retryable: boolean;
}

export class FileUploadService {
  /**
   * Tipos de arquivo suportados
   */
  static readonly SUPPORTED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/webm'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'],
    document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv'],
    sticker: ['image/webp']
  };

  /**
   * Tamanho máximo de arquivo (em bytes) - 16MB
   */
  static readonly MAX_FILE_SIZE = 16 * 1024 * 1024;

  /**
   * Timeout para upload (em ms)
   */
  static readonly UPLOAD_TIMEOUT = 30000;

  /**
   * Número máximo de tentativas de retry
   */
  static readonly MAX_RETRIES = 3;

  /**
   * Validar arquivo antes do upload
   */
  static validateFile(file: File, allowedTypes: string[]): { valid: boolean; error?: string } {
    // Verificar se o arquivo existe
    if (!file) {
      return {
        valid: false,
        error: 'Arquivo não encontrado'
      };
    }

    // Verificar tamanho
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${this.formatFileSize(this.MAX_FILE_SIZE)}`
      };
    }

    // Verificar tamanho mínimo (arquivos vazios)
    if (file.size === 0) {
      return {
        valid: false,
        error: 'Arquivo vazio não é permitido'
      };
    }

    // Verificar tipo
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de arquivo não suportado. Tipos aceitos: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`
      };
    }

    // Verificar nome do arquivo
    if (!file.name || file.name.trim().length === 0) {
      return {
        valid: false,
        error: 'Nome do arquivo inválido'
      };
    }

    return { valid: true };
  }

  /**
   * Converter arquivo para base64 com timeout
   */
  static async fileToBase64(file: File, timeout = 10000): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // Timeout
      const timeoutId = setTimeout(() => {
        reader.abort();
        reject(new Error('Timeout ao ler arquivo'));
      }, timeout);

      reader.onload = () => {
        clearTimeout(timeoutId);
        if (typeof reader.result === 'string') {
          try {
            // Remover o prefixo "data:mime/type;base64,"
            const base64 = reader.result.split(',')[1];
            if (!base64) {
              reject(new Error('Formato de arquivo inválido'));
              return;
            }
            resolve(base64);
          } catch (error) {
            reject(new Error('Erro ao processar arquivo'));
          }
        } else {
          reject(new Error('Falha ao converter arquivo'));
        }
      };

      reader.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Erro ao ler arquivo'));
      };

      reader.onabort = () => {
        clearTimeout(timeoutId);
        reject(new Error('Leitura do arquivo cancelada'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload file to server and get media info
   */
  static async uploadFileToServer(
    file: File,
    conversationId: string,
    token: string,
    caption?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      if (caption) {
        formData.append('caption', caption);
      }

      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage,
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve({
                url: response.data.upload.cdnUrl, // Use CDN URL for faster access
                fileName: response.data.upload.fileName,
                fileSize: response.data.upload.size,
                mediaType: this.getMediaTypeFromMimeType(file.type),
              });
            } else {
              reject(new Error(response.error || 'Upload failed'));
            }
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.open('POST', `/api/conversations/${conversationId}/upload-media`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  }

  /**
   * Legacy method - converts file to base64 (for backward compatibility)
   */
  static async uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    signal?: AbortSignal,
    conversationId?: string,
    token?: string,
    caption?: string
  ): Promise<UploadResult> {
    // Validar parâmetros obrigatórios para upload no servidor
    if (!conversationId || !token) {
      throw new Error('conversationId e token são obrigatórios para upload no servidor');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`📤 [FileUploadService] Tentativa ${attempt}/${this.MAX_RETRIES} para ${file.name} (servidor)`);

        // Verificar se foi cancelado
        if (signal?.aborted) {
          throw new Error('Upload cancelado');
        }

        // Usar o novo método de upload no servidor
        const result = await this.uploadFileToServer(
          file,
          conversationId,
          token,
          caption,
          onProgress
        );

        console.log(`✅ [FileUploadService] Upload concluído: ${file.name} (${this.formatFileSize(file.size)})`);
        return result;

      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ [FileUploadService] Tentativa ${attempt} falhou:`, error);

        // Se não é a última tentativa e o erro é retryable, aguardar antes de tentar novamente
        if (attempt < this.MAX_RETRIES && this.isRetryableError(error)) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
          console.log(`⏳ [FileUploadService] Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    const uploadError: UploadError = {
      code: 'UPLOAD_FAILED',
      message: lastError?.message || 'Falha no upload do arquivo após todas as tentativas',
      retryable: false
    };

    throw uploadError;
  }

  /**
   * Verificar se um erro permite retry
   */
  private static isRetryableError(error: any): boolean {
    if (!error) return false;

    const message = error.message?.toLowerCase() || '';
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'cancelled',
      'abort'
    ];

    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Obter tipo de mídia baseado no tipo MIME
   */
  private static getMediaTypeFromMimeType(mimeType: string): string {
    if (this.SUPPORTED_TYPES.image.includes(mimeType)) return 'image';
    if (this.SUPPORTED_TYPES.video.includes(mimeType)) return 'video';
    if (this.SUPPORTED_TYPES.audio.includes(mimeType)) return 'audio';
    if (this.SUPPORTED_TYPES.sticker.includes(mimeType)) return 'sticker';
    return 'document';
  }

  /**
   * Obter tipos MIME permitidos para um tipo de mídia
   */
  static getAllowedTypes(mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker'): string[] {
    return this.SUPPORTED_TYPES[mediaType] || [];
  }

  /**
   * Formatar tamanho de arquivo para exibição
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Calcular hash do arquivo para verificação de integridade (opcional)
   */
  static async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}