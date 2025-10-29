import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { logger, LogContext } from './logger-service';

/**
 * Configurações de debounce/throttle por tipo de evento
 */
export const DEBOUNCE_CONFIGS = {
  // Presence updates podem ser muito frequentes (composing, available, unavailable)
  // Debounce de 2s - apenas processa o último evento de presença
  PRESENCE_UPDATE: {
    wait: 2000, // 2 segundos
    maxWait: 5000, // máximo 5s de espera
    type: 'debounce' as const,
  },
  
  // Chat upserts podem vir em rajadas
  // Throttle de 1s - processa no máximo 1 por segundo
  CHAT_UPSERT: {
    wait: 1000, // 1 segundo
    type: 'throttle' as const,
  },
  
  // Message status updates (SERVER_ACK, READ, etc)
  // Throttle de 500ms - permite atualizações mas não em excesso
  MESSAGE_STATUS: {
    wait: 500, // 500ms
    type: 'throttle' as const,
  },
  
  // Connection status updates
  // Debounce de 3s - apenas processa mudanças estáveis
  CONNECTION_UPDATE: {
    wait: 3000, // 3 segundos
    maxWait: 10000, // máximo 10s
    type: 'debounce' as const,
  },
} as const;

/**
 * Estatísticas de debounce/throttle
 */
interface DebounceStats {
  eventType: string;
  totalCalls: number;
  processedCalls: number;
  skippedCalls: number;
  skipRate: number;
}

class DebounceService {
  private stats: Map<string, { total: number; processed: number; skipped: number }> = new Map();
  private debouncedFunctions: Map<string, Function> = new Map();
  private throttledFunctions: Map<string, Function> = new Map();

  /**
   * Inicializa o serviço de debounce
   */
  initialize(): void {
    logger.info(LogContext.GENERAL, 'Debounce service initialized');
  }

  /**
   * Cria uma função debounced para presence updates
   * Múltiplas chamadas resetam o timer, apenas a última é executada
   */
  debouncePresenceUpdate<T>(
    fn: (data: T) => void | Promise<void>,
    remoteJid: string
  ): (data: T) => void {
    const key = `presence:${remoteJid}`;
    
    if (!this.debouncedFunctions.has(key)) {
      const config = DEBOUNCE_CONFIGS.PRESENCE_UPDATE;
      
      // Wrapper que atualiza estatísticas
      const wrapped = (data: T) => {
        this.incrementProcessed('presence.update');
        return fn(data);
      };
      
      const debouncedFn = debounce(wrapped, config.wait, {
        maxWait: config.maxWait,
        leading: false,
        trailing: true,
      });
      
      this.debouncedFunctions.set(key, debouncedFn);
    }

    // Incrementa total de chamadas
    this.incrementTotal('presence.update');
    
    return this.debouncedFunctions.get(key) as (data: T) => void;
  }

  /**
   * Cria uma função throttled para chat upserts
   * Limita a frequência máxima de execução
   */
  throttleChatUpsert<T>(
    fn: (data: T) => void | Promise<void>,
    instanceId: string
  ): (data: T) => void {
    const key = `chat:${instanceId}`;
    
    if (!this.throttledFunctions.has(key)) {
      const config = DEBOUNCE_CONFIGS.CHAT_UPSERT;
      
      // Wrapper que atualiza estatísticas
      const wrapped = (data: T) => {
        this.incrementProcessed('chats.upsert');
        return fn(data);
      };
      
      const throttledFn = throttle(wrapped, config.wait, {
        leading: true,
        trailing: true,
      });
      
      this.throttledFunctions.set(key, throttledFn);
    }

    // Incrementa total de chamadas
    this.incrementTotal('chats.upsert');
    
    return this.throttledFunctions.get(key) as (data: T) => void;
  }

  /**
   * Cria uma função throttled para message status updates
   */
  throttleMessageStatus<T>(
    fn: (data: T) => void | Promise<void>,
    messageId: string
  ): (data: T) => void {
    const key = `message:${messageId}`;
    
    if (!this.throttledFunctions.has(key)) {
      const config = DEBOUNCE_CONFIGS.MESSAGE_STATUS;
      
      // Wrapper que atualiza estatísticas
      const wrapped = (data: T) => {
        this.incrementProcessed('messages.update');
        return fn(data);
      };
      
      const throttledFn = throttle(wrapped, config.wait, {
        leading: true,
        trailing: true,
      });
      
      this.throttledFunctions.set(key, throttledFn);
    }

    // Incrementa total de chamadas
    this.incrementTotal('messages.update');
    
    return this.throttledFunctions.get(key) as (data: T) => void;
  }

  /**
   * Cria uma função debounced para connection updates
   */
  debounceConnectionUpdate<T>(
    fn: (data: T) => void | Promise<void>,
    instanceId: string
  ): (data: T) => void {
    const key = `connection:${instanceId}`;
    
    if (!this.debouncedFunctions.has(key)) {
      const config = DEBOUNCE_CONFIGS.CONNECTION_UPDATE;
      
      // Wrapper que atualiza estatísticas
      const wrapped = (data: T) => {
        this.incrementProcessed('connection.update');
        return fn(data);
      };
      
      const debouncedFn = debounce(wrapped, config.wait, {
        maxWait: config.maxWait,
        leading: false,
        trailing: true,
      });
      
      this.debouncedFunctions.set(key, debouncedFn);
    }

    // Incrementa total de chamadas
    this.incrementTotal('connection.update');
    
    return this.debouncedFunctions.get(key) as (data: T) => void;
  }

  /**
   * Incrementa contador de chamadas totais
   */
  private incrementTotal(eventType: string): void {
    const current = this.stats.get(eventType) || { total: 0, processed: 0, skipped: 0 };
    current.total++;
    this.stats.set(eventType, current);
  }

  /**
   * Incrementa contador de chamadas processadas
   */
  private incrementProcessed(eventType: string): void {
    const current = this.stats.get(eventType) || { total: 0, processed: 0, skipped: 0 };
    current.processed++;
    this.stats.set(eventType, current);
  }

  /**
   * Retorna estatísticas de debounce/throttle
   */
  getStats(): DebounceStats[] {
    const stats: DebounceStats[] = [];
    
    for (const [eventType, counts] of this.stats.entries()) {
      const skipped = counts.total - counts.processed;
      const skipRate = counts.total > 0 ? (skipped / counts.total) * 100 : 0;
      
      stats.push({
        eventType,
        totalCalls: counts.total,
        processedCalls: counts.processed,
        skippedCalls: skipped,
        skipRate: parseFloat(skipRate.toFixed(2)),
      });
    }
    
    return stats.sort((a, b) => b.skippedCalls - a.skippedCalls);
  }

  /**
   * Reseta estatísticas
   */
  resetStats(): void {
    this.stats.clear();
    logger.info(LogContext.GENERAL, 'Debounce stats reset');
  }

  /**
   * Limpa todas as funções debounced/throttled
   * Útil para testes ou cleanup
   */
  clear(): void {
    // Cancela todas as funções pendentes
    this.debouncedFunctions.forEach((fn: any) => {
      if (fn.cancel) fn.cancel();
    });
    
    this.throttledFunctions.forEach((fn: any) => {
      if (fn.cancel) fn.cancel();
    });
    
    this.debouncedFunctions.clear();
    this.throttledFunctions.clear();
    
    logger.info(LogContext.GENERAL, 'Debounce service cleared');
  }

  /**
   * Força a execução imediata de todas as funções pendentes
   * Útil antes de shutdown
   */
  flush(): void {
    // Executa imediatamente todas as funções pendentes
    this.debouncedFunctions.forEach((fn: any) => {
      if (fn.flush) fn.flush();
    });
    
    this.throttledFunctions.forEach((fn: any) => {
      if (fn.flush) fn.flush();
    });
    
    logger.info(LogContext.GENERAL, 'Debounce service flushed');
  }
}

// Exporta instância singleton
export const debounceService = new DebounceService();
