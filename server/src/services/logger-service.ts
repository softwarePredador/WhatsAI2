import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Logger Service - Sistema de logs estruturado
 * 
 * Salva erros em arquivos .log separados por contexto para facilitar debug
 * e acompanhamento de problemas em produção.
 * 
 * Features:
 * - Logs separados por contexto (cache, api, webhook, etc)
 * - Rotação automática de logs (máx 10MB por arquivo)
 * - Formato estruturado com timestamp, level, contexto
 * -Async/non-blocking para não impactar performance
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum LogContext {
  CACHE = 'CACHE',
  API = 'API',
  WEBHOOK = 'WEBHOOK',
  DATABASE = 'DATABASE',
  EVOLUTION = 'EVOLUTION',
  MEDIA = 'MEDIA',
  GENERAL = 'GENERAL'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: LogContext;
  message: string;
  data?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class LoggerService {
  private logsDir: string;
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private writeQueue: Map<string, LogEntry[]> = new Map();
  private isProcessing = false;

  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
    this.ensureLogsDir();
  }

  /**
   * Garante que o diretório de logs existe
   */
  private async ensureLogsDir(): Promise<void> {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
    } catch (error) {
      console.error('❌ [LOGGER] Failed to create logs directory:', error);
    }
  }

  /**
   * Formata um log entry para string legível
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts = [
      entry.timestamp,
      `[${entry.level}]`,
      `[${entry.context}]`,
      entry.message
    ];

    if (entry.data) {
      parts.push(`\nData: ${JSON.stringify(entry.data, null, 2)}`);
    }

    if (entry.error) {
      parts.push(`\nError: ${entry.error.name}: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`\nStack: ${entry.error.stack}`);
      }
    }

    return parts.join(' ') + '\n' + '-'.repeat(100) + '\n';
  }

  /**
   * Retorna o caminho do arquivo de log para um contexto
   */
  private getLogFilePath(context: LogContext): string {
    const filename = `${context.toLowerCase()}-errors.log`;
    return path.join(this.logsDir, filename);
  }

  /**
   * Verifica se precisa rotacionar o arquivo de log
   */
  private async shouldRotate(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size >= this.maxFileSize;
    } catch (error) {
      // Arquivo não existe ainda
      return false;
    }
  }

  /**
   * Rotaciona arquivo de log (renomeia para .old)
   */
  private async rotateLogFile(filePath: string): Promise<void> {
    try {
      const oldPath = filePath.replace('.log', '.old.log');
      // Remove arquivo .old anterior se existir
      try {
        await fs.unlink(oldPath);
      } catch {}
      // Renomeia atual para .old
      await fs.rename(filePath, oldPath);
      console.log(`🔄 [LOGGER] Rotated log file: ${path.basename(filePath)}`);
    } catch (error) {
      console.error('❌ [LOGGER] Failed to rotate log file:', error);
    }
  }

  /**
   * Adiciona log à fila de escrita
   */
  private enqueueLog(context: LogContext, entry: LogEntry): void {
    const key = context;
    if (!this.writeQueue.has(key)) {
      this.writeQueue.set(key, []);
    }
    this.writeQueue.get(key)!.push(entry);
    
    // Processa fila se não estiver processando
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Processa fila de logs de forma assíncrona
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const entries = Array.from(this.writeQueue.entries());
      for (const [context, logEntries] of entries) {
        if (logEntries.length === 0) continue;

        const filePath = this.getLogFilePath(context as LogContext);
        
        // Verifica se precisa rotacionar
        if (await this.shouldRotate(filePath)) {
          await this.rotateLogFile(filePath);
        }

        // Formata e escreve todos os logs
        const content = logEntries.map(entry => this.formatLogEntry(entry)).join('');
        await fs.appendFile(filePath, content, 'utf8');

        // Limpa fila
        this.writeQueue.set(context, []);
      }
    } catch (error) {
      console.error('❌ [LOGGER] Failed to process queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Loga uma mensagem de DEBUG
   */
  debug(context: LogContext, message: string, data?: any): void {
    // Debug logs não são salvos em arquivo por padrão (apenas console)
    console.log(`🔍 [${context}] ${message}`, data || '');
  }

  /**
   * Loga uma mensagem de INFO
   */
  info(context: LogContext, message: string, data?: any): void {
    console.log(`ℹ️ [${context}] ${message}`, data || '');
  }

  /**
   * Loga uma mensagem de WARNING (salva em arquivo)
   */
  warn(context: LogContext, message: string, data?: any): void {
    console.warn(`⚠️ [${context}] ${message}`, data || '');
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      context,
      message,
      data
    };
    
    this.enqueueLog(context, entry);
  }

  /**
   * Loga um erro (salva em arquivo)
   */
  error(context: LogContext, message: string, error?: Error, data?: any): void {
    console.error(`❌ [${context}] ${message}`, error || '', data || '');
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      context,
      message,
      ...(data && { data }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          ...(error.stack && { stack: error.stack })
        }
      })
    };
    
    this.enqueueLog(context, entry);
  }

  /**
   * Loga um erro fatal (salva em arquivo)
   */
  fatal(context: LogContext, message: string, error?: Error, data?: any): void {
    console.error(`🔥 [${context}] FATAL: ${message}`, error || '', data || '');
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      context,
      message,
      ...(data && { data }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          ...(error.stack && { stack: error.stack })
        }
      })
    };
    
    this.enqueueLog(context, entry);
  }

  /**
   * Força escrita imediata de todos os logs pendentes
   */
  async flush(): Promise<void> {
    await this.processQueue();
  }
}

// Singleton
export const logger = new LoggerService();
