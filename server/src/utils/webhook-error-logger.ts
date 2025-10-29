/**
 * Webhook Error Logger
 * 
 * Sistema de logging de erros de validação de webhooks.
 * Captura e registra todos os erros para análise posterior.
 * 
 * Logs salvos em: /server/logs/webhook-errors.log
 */

import * as fs from 'fs';
import * as path from 'path';

export interface WebhookErrorLog {
  timestamp: string;
  instanceId: string;
  eventType: string;
  errorType: 'validation' | 'processing' | 'network' | 'unknown';
  errorMessage: string;
  validationErrors?: any[];
  webhookData?: any;
  stackTrace?: string;
}

export class WebhookErrorLogger {
  private logFilePath: string;
  private logsDir: string;

  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.logFilePath = path.join(this.logsDir, 'webhook-errors.log');
    this.ensureLogFileExists();
  }

  /**
   * Garante que o diretório e arquivo de log existem
   */
  private ensureLogFileExists(): void {
    try {
      // Criar diretório logs se não existir
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
        console.log(`📁 [WebhookErrorLogger] Diretório de logs criado: ${this.logsDir}`);
      }

      // Criar arquivo de log se não existir
      if (!fs.existsSync(this.logFilePath)) {
        const header = `=== WEBHOOK ERROR LOGS - INÍCIO ===\nCriado em: ${new Date().toISOString()}\n\n`;
        fs.writeFileSync(this.logFilePath, header, 'utf8');
        console.log(`📝 [WebhookErrorLogger] Arquivo de log criado: ${this.logFilePath}`);
      }
    } catch (error: any) {
      console.error(`❌ [WebhookErrorLogger] Erro ao criar arquivo de log:`, error.message);
    }
  }

  /**
   * Registra um erro de validação de schema Zod
   */
  logValidationError(
    instanceId: string,
    eventType: string,
    validationErrors: any[],
    webhookData?: any
  ): void {
    const errorLog: WebhookErrorLog = {
      timestamp: new Date().toISOString(),
      instanceId,
      eventType,
      errorType: 'validation',
      errorMessage: `Schema validation failed for ${eventType}`,
      validationErrors,
      webhookData: this.sanitizeWebhookData(webhookData)
    };

    this.writeLog(errorLog);
  }

  /**
   * Registra um erro de processamento (após validação)
   */
  logProcessingError(
    instanceId: string,
    eventType: string,
    error: Error,
    webhookData?: any
  ): void {
    const errorLog: WebhookErrorLog = {
      timestamp: new Date().toISOString(),
      instanceId,
      eventType,
      errorType: 'processing',
      errorMessage: error.message,
      ...(error.stack && { stackTrace: error.stack }),
      webhookData: this.sanitizeWebhookData(webhookData)
    };

    this.writeLog(errorLog);
  }

  /**
   * Registra um erro de rede (timeout, connection refused, etc)
   */
  logNetworkError(
    instanceId: string,
    eventType: string,
    error: Error
  ): void {
    const errorLog: WebhookErrorLog = {
      timestamp: new Date().toISOString(),
      instanceId,
      eventType,
      errorType: 'network',
      errorMessage: error.message,
      ...(error.stack && { stackTrace: error.stack })
    };

    this.writeLog(errorLog);
  }

  /**
   * Registra um erro genérico
   */
  logGenericError(
    instanceId: string,
    eventType: string,
    error: Error | string,
    webhookData?: any
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stackTrace = typeof error === 'string' ? undefined : error.stack;
    
    const errorLog: WebhookErrorLog = {
      timestamp: new Date().toISOString(),
      instanceId,
      eventType,
      errorType: 'unknown',
      errorMessage,
      ...(stackTrace && { stackTrace }),
      webhookData: this.sanitizeWebhookData(webhookData)
    };

    this.writeLog(errorLog);
  }

  /**
   * Escreve o log no arquivo
   */
  private writeLog(errorLog: WebhookErrorLog): void {
    try {
      const logEntry = this.formatLogEntry(errorLog);
      fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
      
      // Console também para debug imediato
      console.error(`\n📛 [WEBHOOK_ERROR_LOGGED] ${errorLog.errorType.toUpperCase()}`);
      console.error(`   Instance: ${errorLog.instanceId}`);
      console.error(`   Event: ${errorLog.eventType}`);
      console.error(`   Error: ${errorLog.errorMessage}`);
      console.error(`   Log saved to: ${this.logFilePath}\n`);
    } catch (error: any) {
      console.error(`❌ [WebhookErrorLogger] Falha ao escrever log:`, error.message);
    }
  }

  /**
   * Formata entrada de log para escrita
   */
  private formatLogEntry(errorLog: WebhookErrorLog): string {
    const separator = '='.repeat(80);
    let entry = `\n${separator}\n`;
    entry += `[${errorLog.timestamp}] ${errorLog.errorType.toUpperCase()} ERROR\n`;
    entry += `${separator}\n`;
    entry += `Instance ID: ${errorLog.instanceId}\n`;
    entry += `Event Type: ${errorLog.eventType}\n`;
    entry += `Error: ${errorLog.errorMessage}\n`;

    // Adicionar erros de validação se existirem
    if (errorLog.validationErrors && errorLog.validationErrors.length > 0) {
      entry += `\nValidation Errors:\n`;
      entry += JSON.stringify(errorLog.validationErrors, null, 2) + '\n';
    }

    // Adicionar stack trace se existir
    if (errorLog.stackTrace) {
      entry += `\nStack Trace:\n${errorLog.stackTrace}\n`;
    }

    // Adicionar dados do webhook (limitado)
    if (errorLog.webhookData) {
      entry += `\nWebhook Data (sanitized):\n`;
      entry += JSON.stringify(errorLog.webhookData, null, 2) + '\n';
    }

    entry += `${separator}\n`;
    return entry;
  }

  /**
   * Sanitiza dados do webhook para remover informações sensíveis
   * e limitar tamanho do log
   */
  private sanitizeWebhookData(webhookData?: any): any {
    if (!webhookData) return null;

    try {
      // Clone para não modificar original
      const sanitized = JSON.parse(JSON.stringify(webhookData));

      // Remover campos sensíveis
      const sensitiveFields = ['mediaKey', 'fileEncSha256', 'fileSha256', 'jpegThumbnail'];
      
      const removeSensitiveFields = (obj: any) => {
        if (typeof obj !== 'object' || obj === null) return;
        
        for (const key in obj) {
          if (sensitiveFields.includes(key)) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            removeSensitiveFields(obj[key]);
          }
        }
      };

      removeSensitiveFields(sanitized);

      // Limitar tamanho do JSON (max 5000 caracteres)
      const jsonString = JSON.stringify(sanitized);
      if (jsonString.length > 5000) {
        return {
          ...sanitized,
          _note: `Data truncated (original size: ${jsonString.length} chars)`
        };
      }

      return sanitized;
    } catch (error) {
      return { error: 'Failed to sanitize webhook data' };
    }
  }

  /**
   * Lê os últimos N erros do log
   */
  getRecentErrors(count: number = 10): string {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return 'No error logs found';
      }

      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const entries = content.split('='.repeat(80)).filter(e => e.trim().length > 0);
      
      // Pegar os últimos N entries
      const recent = entries.slice(-count);
      
      return recent.join('='.repeat(80));
    } catch (error: any) {
      return `Error reading log file: ${error.message}`;
    }
  }

  /**
   * Limpa logs antigos (mantém apenas últimos N dias)
   */
  cleanOldLogs(daysToKeep: number = 7): void {
    try {
      if (!fs.existsSync(this.logFilePath)) return;

      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const entries = content.split('='.repeat(80)).filter(e => e.trim().length > 0);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Filtrar entries mais recentes que cutoffDate
      const recentEntries = entries.filter(entry => {
        const timestampMatch = entry.match(/\[([\d-T:.Z]+)\]/);
        if (!timestampMatch || !timestampMatch[1]) return false;
        
        const entryDate = new Date(timestampMatch[1]);
        return entryDate > cutoffDate;
      });

      // Reescrever arquivo com apenas entries recentes
      const newContent = `=== WEBHOOK ERROR LOGS ===\nLast cleaned: ${new Date().toISOString()}\n\n` +
                        recentEntries.join('='.repeat(80));
      
      fs.writeFileSync(this.logFilePath, newContent, 'utf8');
      
      console.log(`🧹 [WebhookErrorLogger] Cleaned old logs. Kept ${recentEntries.length} recent entries.`);
    } catch (error: any) {
      console.error(`❌ [WebhookErrorLogger] Error cleaning logs:`, error.message);
    }
  }

  /**
   * Retorna estatísticas dos erros
   */
  getErrorStats(): {
    total: number;
    byType: { [key: string]: number };
    byEvent: { [key: string]: number };
    last24h: number;
  } {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return { total: 0, byType: {}, byEvent: {}, last24h: 0 };
      }

      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const entries = content.split('='.repeat(80)).filter(e => e.trim().length > 0);

      const stats = {
        total: entries.length,
        byType: {} as { [key: string]: number },
        byEvent: {} as { [key: string]: number },
        last24h: 0
      };

      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      entries.forEach(entry => {
        // Contar por tipo
        const typeMatch = entry.match(/(VALIDATION|PROCESSING|NETWORK|UNKNOWN) ERROR/);
        if (typeMatch && typeMatch[1]) {
          const type = typeMatch[1];
          stats.byType[type] = (stats.byType[type] || 0) + 1;
        }

        // Contar por evento
        const eventMatch = entry.match(/Event Type: ([^\n]+)/);
        if (eventMatch && eventMatch[1]) {
          const event = eventMatch[1];
          stats.byEvent[event] = (stats.byEvent[event] || 0) + 1;
        }

        // Contar últimas 24h
        const timestampMatch = entry.match(/\[([\d-T:.Z]+)\]/);
        if (timestampMatch && timestampMatch[1]) {
          const entryDate = new Date(timestampMatch[1]);
          if (entryDate > oneDayAgo) {
            stats.last24h++;
          }
        }
      });

      return stats;
    } catch (error) {
      return { total: 0, byType: {}, byEvent: {}, last24h: 0 };
    }
  }
}

// Singleton instance
export const webhookErrorLogger = new WebhookErrorLogger();
