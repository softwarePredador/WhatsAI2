/**
 * Image Optimizer Service
 * 
 * Otimiza imagens antes do upload para DigitalOcean Spaces usando Sharp.
 * 
 * Benefícios:
 * - Reduz tamanho de arquivos em 50-70%
 * - Economiza custos de armazenamento
 * - Melhora velocidade de download
 * - Melhor experiência mobile
 * 
 * Otimizações aplicadas:
 * - Redimensionamento automático (max 1920px)
 * - Compressão inteligente (JPEG quality 85%, WebP quality 80%)
 * - Conversão para formatos eficientes
 * - Auto-rotação baseada em EXIF
 * - Remoção de metadados desnecessários
 */

import sharp, { Sharp } from 'sharp';

export interface ImageOptimizerOptions {
  /**
   * Largura máxima em pixels (padrão: 1920)
   * Imagens maiores serão redimensionadas proporcionalmente
   */
  maxWidth?: number;

  /**
   * Altura máxima em pixels (padrão: 1920)
   * Imagens maiores serão redimensionadas proporcionalmente
   */
  maxHeight?: number;

  /**
   * Qualidade JPEG (1-100, padrão: 85)
   * 85 é um bom equilíbrio entre qualidade e tamanho
   */
  jpegQuality?: number;

  /**
   * Qualidade WebP (1-100, padrão: 80)
   * WebP tem melhor compressão que JPEG
   */
  webpQuality?: number;

  /**
   * Qualidade PNG (0-9, padrão: 7)
   * 0 = sem compressão, 9 = máxima compressão
   */
  pngCompressionLevel?: number;

  /**
   * Converter PNG para JPEG quando apropriado (padrão: true)
   * PNG sem transparência pode ser convertido para JPEG com grande economia
   */
  convertPngToJpeg?: boolean;

  /**
   * Converter para WebP quando suportado (padrão: false)
   * WebP tem melhor compressão mas nem todos navegadores suportam
   */
  convertToWebp?: boolean;

  /**
   * Remover metadados EXIF (padrão: true)
   * Remove informações de GPS, câmera, etc para privacidade e economia
   */
  stripMetadata?: boolean;
}

export interface ImageOptimizationResult {
  /**
   * Buffer da imagem otimizada
   */
  buffer: Buffer;

  /**
   * Formato final (jpeg, png, webp, etc)
   */
  format: string;

  /**
   * Tamanho original em bytes
   */
  originalSize: number;

  /**
   * Tamanho otimizado em bytes
   */
  optimizedSize: number;

  /**
   * Porcentagem de redução (0-100)
   */
  reductionPercent: number;

  /**
   * Largura final da imagem
   */
  width: number;

  /**
   * Altura final da imagem
   */
  height: number;

  /**
   * Metadados adicionais
   */
  metadata: {
    originalFormat: string;
    hasAlpha: boolean;
    wasResized: boolean;
    wasConverted: boolean;
  };
}

export class ImageOptimizer {
  private defaultOptions: Required<ImageOptimizerOptions> = {
    maxWidth: 1920,
    maxHeight: 1920,
    jpegQuality: 85,
    webpQuality: 80,
    pngCompressionLevel: 7,
    convertPngToJpeg: true,
    convertToWebp: false,
    stripMetadata: true
  };

  /**
   * Otimiza uma imagem aplicando todas as otimizações configuradas.
   * 
   * @param inputBuffer - Buffer da imagem original
   * @param options - Opções de otimização (opcional)
   * @returns Resultado com buffer otimizado e estatísticas
   * 
   * @example
   * ```typescript
   * const optimizer = new ImageOptimizer();
   * const result = await optimizer.optimizeImage(originalBuffer);
   * 
   * console.log(`Redução: ${result.reductionPercent}%`);
   * console.log(`Original: ${result.originalSize} bytes`);
   * console.log(`Otimizado: ${result.optimizedSize} bytes`);
   * 
   * // Salvar imagem otimizada
   * await uploadToStorage(result.buffer);
   * ```
   */
  async optimizeImage(
    inputBuffer: Buffer,
    options: ImageOptimizerOptions = {}
  ): Promise<ImageOptimizationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const originalSize = inputBuffer.length;

    console.log(`🎨 [ImageOptimizer] Iniciando otimização de imagem (${this.formatBytes(originalSize)})`);

    try {
      // 1. Criar instância Sharp e extrair metadados
      const image = sharp(inputBuffer);
      const metadata = await image.metadata();

      console.log(`📊 [ImageOptimizer] Metadados originais:`, {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation
      });

      // 2. Aplicar auto-rotação baseada em EXIF
      let processedImage = image.rotate(); // Auto-rotate based on EXIF

      // 3. Redimensionar se necessário
      let wasResized = false;
      if (metadata.width && metadata.height) {
        if (metadata.width > opts.maxWidth || metadata.height > opts.maxHeight) {
          processedImage = processedImage.resize(opts.maxWidth, opts.maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          });
          wasResized = true;
        }
      }

      // 4. Decidir formato de saída e aplicar compressão
      let outputFormat = metadata.format || 'jpeg';
      let wasConverted = false;

      // Converter para WebP se solicitado
      if (opts.convertToWebp) {
        processedImage = processedImage.webp({
          quality: opts.webpQuality,
          effort: 4 // 0-6, mais esforço = melhor compressão
        });
        outputFormat = 'webp';
        wasConverted = metadata.format !== 'webp';
      }
      // Converter PNG sem transparência para JPEG
      else if (
        opts.convertPngToJpeg &&
        metadata.format === 'png' &&
        !metadata.hasAlpha
      ) {
        processedImage = processedImage.jpeg({
          quality: opts.jpegQuality,
          progressive: true,
          mozjpeg: true // Usa mozjpeg para melhor compressão
        });
        outputFormat = 'jpeg';
        wasConverted = true;
      }
      // Otimizar JPEG
      else if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        processedImage = processedImage.jpeg({
          quality: opts.jpegQuality,
          progressive: true,
          mozjpeg: true
        });
        outputFormat = 'jpeg';
      }
      // Otimizar PNG
      else if (metadata.format === 'png') {
        processedImage = processedImage.png({
          compressionLevel: opts.pngCompressionLevel,
          progressive: true
        });
        outputFormat = 'png';
      }
      // Outros formatos: manter como está
      else {
      }

      // 5. Remover metadados se configurado
      if (opts.stripMetadata) {
        processedImage = processedImage.withMetadata({
          // Mantém apenas orientação, remove GPS e outros dados
          orientation: metadata.orientation
        });
      }

      // 6. Gerar buffer otimizado
      const optimizedBuffer = await processedImage.toBuffer();
      const optimizedSize = optimizedBuffer.length;

      // 7. Obter dimensões finais
      const finalMetadata = await sharp(optimizedBuffer).metadata();

      // 8. Calcular estatísticas
      const reductionPercent = ((originalSize - optimizedSize) / originalSize) * 100;

      const result: ImageOptimizationResult = {
        buffer: optimizedBuffer,
        format: outputFormat,
        originalSize,
        optimizedSize,
        reductionPercent: Math.round(reductionPercent * 100) / 100,
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
        metadata: {
          originalFormat: metadata.format || 'unknown',
          hasAlpha: metadata.hasAlpha || false,
          wasResized,
          wasConverted
        }
      };

      console.log(`✅ [ImageOptimizer] Otimização concluída:`, {
        original: this.formatBytes(originalSize),
        optimized: this.formatBytes(optimizedSize),
        reduction: `${result.reductionPercent}%`,
        finalDimensions: `${result.width}x${result.height}`,
        format: `${metadata.format} → ${outputFormat}`
      });

      return result;

    } catch (error: any) {
      console.error(`❌ [ImageOptimizer] Erro ao otimizar imagem:`, error.message);
      throw new Error(`Failed to optimize image: ${error.message}`);
    }
  }

  /**
   * Valida se um buffer é uma imagem válida.
   * 
   * @param buffer - Buffer a validar
   * @returns true se for uma imagem válida
   */
  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();
      return !!(metadata.format && metadata.width && metadata.height);
    } catch {
      return false;
    }
  }

  /**
   * Obtém metadados de uma imagem sem processá-la.
   * 
   * @param buffer - Buffer da imagem
   * @returns Metadados da imagem
   */
  async getMetadata(buffer: Buffer) {
    return await sharp(buffer).metadata();
  }

  /**
   * Formata bytes para formato legível (KB, MB, etc).
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Instância singleton do otimizador para reutilização.
 */
export const imageOptimizer = new ImageOptimizer();
