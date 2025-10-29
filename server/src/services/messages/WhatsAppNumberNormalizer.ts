/**
 * WhatsApp Number Normalizer
 * 
 * Serviço responsável por normalização de números do WhatsApp e resolução de @lid.
 * Agora utiliza libphonenumber-js via phone-helper para validação internacional robusta.
 * 
 * REFATORADO (Fase 2): Migrado de Baileys helpers para libphonenumber-js
 * - Validação internacional de números de telefone
 * - Formatação consistente E.164
 * - Mantém cache de @lid → número real
 * - Suporte a grupos (@g.us) e newsletters (@newsletter)
 */

import { 
  compareJids,
  normalizeJid,
  isLidJid,
  extractNumber
} from '../../utils/baileys-helpers';
import { normalizeWhatsAppJid, isGroupJid } from '../../utils/phone-helper';

export class WhatsAppNumberNormalizer {
  /**
   * Cache para mapeamento @lid → número real
   */
  private static lidToRealNumberCache = new Map<string, string>();

  /**
   * Cache para mapeamento keyId → @lid
   */
  private static keyIdToLidCache = new Map<string, string>();

  /**
   * Cache para mapeamento keyId → número real
   */
  private static keyIdToRealCache = new Map<string, string>();

  /**
   * Normaliza número do WhatsApp aplicando todas as regras em ordem correta.
   * 
   * REFATORADO (Fase 2): Usa libphonenumber-js via phone-helper + lógica de @lid cache
   * 
   * @param remoteJid - JID do contato/grupo
   * @param remoteJidAlt - JID alternativo (pode resolver @lid)
   * @param isGroup - Se é um grupo
   * @returns JID normalizado no formato: number@s.whatsapp.net ou number@g.us
   */
  static normalizeWhatsAppNumber(
    remoteJid: string,
    remoteJidAlt?: string | null,
    isGroup: boolean = false
  ): string {
    // 1. PRIORITY: Usar remoteJidAlt se for um número real (não @lid)
    let number = remoteJid;
    if (remoteJidAlt && !isLidJid(remoteJidAlt)) {
      number = remoteJidAlt;
    }

    // 2. Resolver @lid se possível (cache ou remoteJidAlt)
    if (isLidJid(number)) {
      if (remoteJidAlt && remoteJidAlt.includes('@s.whatsapp.net')) {
        number = remoteJidAlt;
      } else {
        const cached = this.lidToRealNumberCache.get(number);
        if (cached) {
          number = cached;
        } else {
          console.warn(`⚠️ [normalizeWhatsAppNumber] Não foi possível resolver @lid: ${number} - usando as-is`);
          // Se não conseguiu resolver @lid, mantém como está
          return number;
        }
      }
    }

    // 3. Se for grupo, não normaliza (mantém @g.us)
    if (isGroup || isGroupJid(number)) {
      return number;
    }

    // 4. Usa phone-helper para normalização robusta (suporta internacional)
    const result = normalizeWhatsAppJid(number);

    return result;
  }

  /**
   * Normaliza remoteJid (versão simplificada).
   * 
   * REFATORADO (Fase 2): Usa phone-helper com detecção automática de grupo
   */
  static normalizeRemoteJid(remoteJid: string): string {
    return normalizeWhatsAppJid(remoteJid);
  }

  /**
   * Formatar número com sufixo @s.whatsapp.net para Evolution API.
   * NUNCA usar @lid - sempre converter para @s.whatsapp.net
   * 
   * REFATORADO (Fase 2): Usa phone-helper para normalização robusta
   */
  static formatRemoteJid(number: string): string {
    // Se já tem @, verificar se é @lid e substituir
    if (number.includes('@')) {
      // Se é @lid, normalizar via normalizeJid do Baileys (mantém compatibilidade)
      if (isLidJid(number)) {
        const normalized = normalizeJid(number);
        return normalized;
      }
      // Se já é JID válido, apenas normaliza
      return normalizeJid(number);
    }

    // Verificar se é grupo (contém traço no ID)
    if (number.includes('-')) {
      return `${number}@g.us`;
    }

    // Números individuais: usa phone-helper para normalização internacional
    return normalizeWhatsAppJid(number);
  }

  /**
   * Registrar mapeamento entre @lid e número real dos eventos messages.update
   */
  static recordLidMapping(keyId: string, lidNumber: string | null, realNumber: string | null): void {
    if (lidNumber && isLidJid(lidNumber)) {
      this.keyIdToLidCache.set(keyId, lidNumber);
    }

    if (realNumber && realNumber.includes('@s.whatsapp.net')) {
      this.keyIdToRealCache.set(keyId, realNumber);
    }

    // Se temos ambos para este keyId, criar o mapeamento
    const lid = this.keyIdToLidCache.get(keyId);
    const real = this.keyIdToRealCache.get(keyId);

    if (lid && real) {
      this.lidToRealNumberCache.set(lid, real);
    }
  }

  /**
   * Resolver @lid para número real se disponível no cache
   */
  static resolveLidToRealNumber(remoteJid: string): string {
    if (isLidJid(remoteJid)) {
      const realNumber = this.lidToRealNumberCache.get(remoteJid);
      if (realNumber) {
        return realNumber;
      }
    }
    return remoteJid;
  }

  /**
   * Compara dois JIDs para verificar se são do mesmo usuário.
   * 
   * NOVO: Usa areJidsSameUser do Baileys para comparação robusta
   */
  static compareJids(jid1: string, jid2: string): boolean {
    return compareJids(jid1, jid2);
  }
}
