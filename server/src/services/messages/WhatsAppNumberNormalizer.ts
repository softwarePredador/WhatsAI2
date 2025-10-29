/**
 * WhatsApp Number Normalizer
 * 
 * Serviço responsável por normalização de números do WhatsApp e resolução de @lid.
 * Agora utiliza helpers do Baileys para maior confiabilidade.
 * 
 * REFATORADO: Agora usa baileys-helpers.ts com funções nativas do Baileys
 * - areJidsSameUser: Comparação robusta de JIDs
 * - jidNormalizedUser: Normalização oficial
 * - Mantém cache de @lid → número real
 */

import { 
  normalizeWhatsAppNumber as normalizeWithBaileys,
  compareJids,
  normalizeJid,
  isLidJid,
  extractNumber
} from '../../utils/baileys-helpers';

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
   * REFATORADO: Agora usa helpers do Baileys + lógica de @lid cache
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
      console.log(`🔄 [normalizeWhatsAppNumber] Usando remoteJidAlt: ${remoteJid} → ${remoteJidAlt}`);
      number = remoteJidAlt;
    }

    // 2. Resolver @lid se possível (cache ou remoteJidAlt)
    if (isLidJid(number)) {
      if (remoteJidAlt && remoteJidAlt.includes('@s.whatsapp.net')) {
        console.log(`🔄 [normalizeWhatsAppNumber] Resolvendo @lid via remoteJidAlt: ${number} → ${remoteJidAlt}`);
        number = remoteJidAlt;
      } else {
        const cached = this.lidToRealNumberCache.get(number);
        if (cached) {
          console.log(`🔄 [normalizeWhatsAppNumber] Resolvendo @lid via cache: ${number} → ${cached}`);
          number = cached;
        } else {
          console.warn(`⚠️ [normalizeWhatsAppNumber] Não foi possível resolver @lid: ${number} - usando Baileys normalizer`);
          // Baileys vai lidar com @lid da melhor forma possível
        }
      }
    }

    // 3. Usar helper do Baileys para normalização completa (inclui lógica brasileira)
    const result = normalizeWithBaileys(number, isGroup);

    console.log(`📞 [normalizeWhatsAppNumber] Final: ${remoteJid} → ${result}`);
    return result;
  }

  /**
   * Normaliza remoteJid (versão simplificada).
   * 
   * REFATORADO: Usa normalizeJid do Baileys
   */
  static normalizeRemoteJid(remoteJid: string): string {
    const isGroup = remoteJid.includes('@g.us');
    return normalizeWithBaileys(remoteJid, isGroup);
  }

  /**
   * Formatar número com sufixo @s.whatsapp.net para Evolution API.
   * NUNCA usar @lid - sempre converter para @s.whatsapp.net
   * 
   * REFATORADO: Usa helper do Baileys
   */
  static formatRemoteJid(number: string): string {
    // Se já tem @, verificar se é @lid e substituir
    if (number.includes('@')) {
      // Se é @lid, normalizar via Baileys
      if (isLidJid(number)) {
        const normalized = normalizeJid(number);
        console.log(`🔄 [formatRemoteJid] Convertendo @lid: ${number} → ${normalized}`);
        return normalized;
      }
      return normalizeJid(number); // Normalizar via Baileys
    }

    // Verificar se é grupo
    if (number.includes('-')) {
      return `${number}@g.us`;
    }

    return `${number}@s.whatsapp.net`;
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
      console.log(`✅ [recordLidMapping] Mapped: ${lid} → ${real}`);
    }
  }

  /**
   * Resolver @lid para número real se disponível no cache
   */
  static resolveLidToRealNumber(remoteJid: string): string {
    if (isLidJid(remoteJid)) {
      const realNumber = this.lidToRealNumberCache.get(remoteJid);
      if (realNumber) {
        console.log(`🔄 [resolveLidToRealNumber] Resolved @lid: ${remoteJid} → ${realNumber}`);
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
