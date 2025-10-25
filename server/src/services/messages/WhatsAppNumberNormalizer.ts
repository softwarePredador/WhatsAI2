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
   * Normaliza número do WhatsApp aplicando todas as regras em ordem correta
   * Retorna sempre formato: number@s.whatsapp.net ou number@g.us
   */
  static normalizeWhatsAppNumber(
    remoteJid: string,
    remoteJidAlt?: string | null,
    isGroup: boolean = false
  ): string {
    // 1. PRIORITY: Usar remoteJidAlt se for um número real (não @lid)
    let number = remoteJid;
    if (remoteJidAlt && !remoteJidAlt.includes('@lid')) {
      console.log(`🔄 [normalizeWhatsAppNumber] Usando remoteJidAlt: ${remoteJid} → ${remoteJidAlt}`);
      number = remoteJidAlt;
    }

    // 2. Resolver @lid se possível (cache ou remoteJidAlt)
    if (number.includes('@lid')) {
      if (remoteJidAlt && remoteJidAlt.includes('@s.whatsapp.net')) {
        console.log(`🔄 [normalizeWhatsAppNumber] Resolvendo @lid via remoteJidAlt: ${number} → ${remoteJidAlt}`);
        number = remoteJidAlt;
      } else {
        const cached = this.lidToRealNumberCache.get(number);
        if (cached) {
          console.log(`🔄 [normalizeWhatsAppNumber] Resolvendo @lid via cache: ${number} → ${cached}`);
          number = cached;
        } else {
          console.warn(`⚠️ [normalizeWhatsAppNumber] Não foi possível resolver @lid: ${number} - removendo @lid e assumindo número direto`);
          // Fallback: remover @lid e assumir que é um número direto
          number = number.replace('@lid', '');
        }
      }
    }

    // 3. Limpar sufixos e IDs de dispositivo
    let cleanNumber = number
      .replace(/:\d+@/, '@')  // Remover ID de dispositivo (ex: :98@)
      .replace('@s.whatsapp.net', '')
      .replace('@g.us', '')
      .replace('@c.us', '')
      .replace('@lid', '');

    // 4. Normalização brasileira - COMPREENSIVA para evitar conversas duplicadas
    if (cleanNumber.startsWith('55') && !isGroup) {
      const withoutCountry = cleanNumber.substring(2); // Remover "55"

      if (withoutCountry.length === 8) {
        // Formato brasileiro antigo (8 dígitos) - assumir DDD 11 + adicionar 9º dígito
        const phone = withoutCountry;
        cleanNumber = `55119${phone}`;
        console.log(`🇧🇷 [normalizeWhatsAppNumber] Brasileiro 8→11 dígitos: ${number} → ${cleanNumber}`);
      } else if (withoutCountry.length === 9) {
        // 9 dígitos (DDD + 8 dígitos telefone) - adicionar 9º dígito após DDD
        const ddd = withoutCountry.substring(0, 2);
        const phone = withoutCountry.substring(2);
        cleanNumber = `55${ddd}9${phone}`;
        console.log(`🇧🇷 [normalizeWhatsAppNumber] Brasileiro 9→11 dígitos: ${number} → ${cleanNumber}`);
      } else if (withoutCountry.length === 10) {
        // 10 dígitos (DDD + 9 dígitos) - verificar se parte telefone tem 8 dígitos (faltando 9º)
        const ddd = withoutCountry.substring(0, 2);
        const phone = withoutCountry.substring(2);
        if (phone.length === 8) {
          // Faltando 9º dígito
          cleanNumber = `55${ddd}9${phone}`;
          console.log(`🇧🇷 [normalizeWhatsAppNumber] Brasileiro 10→11 dígitos: ${number} → ${cleanNumber}`);
        }
        // Se phone.length === 9, já tem 9º dígito, manter como está
      }
      // Se já tem 11 dígitos, manter como está (formato moderno com 9º dígito)
    }

    // 5. Formatar com sufixo correto
    const result = isGroup ? `${cleanNumber}@g.us` : `${cleanNumber}@s.whatsapp.net`;

    console.log(`📞 [normalizeWhatsAppNumber] Final: ${remoteJid} → ${result}`);
    return result;
  }

  /**
   * Normaliza remoteJid (versão simplificada)
   */
  static normalizeRemoteJid(remoteJid: string): string {
    // Remover sufixos
    let cleanNumber = remoteJid
      .replace('@s.whatsapp.net', '')
      .replace('@g.us', '')
      .replace('@c.us', '')
      .replace('@lid', '');

    // 🇧🇷 NORMALIZAÇÃO BRASILEIRA: Adicionar 9º dígito se faltar
    if (cleanNumber.startsWith('55')) {
      const withoutCountryCode = cleanNumber.substring(2); // Remover "55"

      // Se tem 10 dígitos (DDD + 8 dígitos), adicionar o 9
      if (withoutCountryCode.length === 10) {
        const ddd = withoutCountryCode.substring(0, 2);
        const numero = withoutCountryCode.substring(2);
        cleanNumber = `55${ddd}9${numero}`; // Adicionar o 9 antes do número
        console.log(`🇧🇷 [normalizeRemoteJid] Número BR antigo detectado! Adicionando 9: ${remoteJid} → ${cleanNumber}`);
      }
    }

    // Adicionar sufixo correto (SEMPRE usar @s.whatsapp.net ou @g.us)
    if (remoteJid.includes('@g.us')) {
      return cleanNumber + '@g.us';
    } else {
      return cleanNumber + '@s.whatsapp.net';
    }
  }

  /**
   * Formatar número com sufixo @s.whatsapp.net para Evolution API
   * NUNCA usar @lid - sempre converter para @s.whatsapp.net
   */
  static formatRemoteJid(number: string): string {
    // Se já tem @, verificar se é @lid e substituir
    if (number.includes('@')) {
      // Se é @lid, remover e formatar como número normal
      if (number.includes('@lid')) {
        const cleanNumber = number.replace('@lid', '');
        console.log(`🔄 [formatRemoteJid] Convertendo @lid para @s.whatsapp.net: ${number} → ${cleanNumber}@s.whatsapp.net`);
        return `${cleanNumber}@s.whatsapp.net`;
      }
      return number; // Já formatado corretamente
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
    if (lidNumber && lidNumber.includes('@lid')) {
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
      console.log(`✅ Mapped: ${lid} → ${real}`);
    }
  }

  /**
   * Resolver @lid para número real se disponível no cache
   */
  static resolveLidToRealNumber(remoteJid: string): string {
    if (remoteJid.includes('@lid')) {
      const realNumber = this.lidToRealNumberCache.get(remoteJid);
      if (realNumber) {
        console.log(`🔄 Resolved @lid: ${remoteJid} → ${realNumber}`);
        return realNumber;
      }
    }
    return remoteJid;
  }
}