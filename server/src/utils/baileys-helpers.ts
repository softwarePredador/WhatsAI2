/**
 * Baileys Helper Functions
 * 
 * Utiliza funções nativas do @whiskeysockets/baileys para normalização
 * e comparação de JIDs do WhatsApp de forma robusta e confiável.
 * 
 * Benefícios:
 * - Remove duplicação de código
 * - Usa lógica oficial do Baileys (testada e mantida)
 * - Resolve problemas de @lid vs @s.whatsapp.net
 * - Mantém compatibilidade com números brasileiros
 */

import { areJidsSameUser, jidNormalizedUser } from '@whiskeysockets/baileys';

/**
 * Compara dois JIDs do WhatsApp para verificar se são do mesmo usuário.
 * 
 * Esta função usa a lógica oficial do Baileys que resolve corretamente:
 * - @lid (identificador temporário) vs @s.whatsapp.net (número permanente)
 * - Variações de formato (@c.us, @s.whatsapp.net)
 * - IDs de dispositivo (sufixo :98@, :99@, etc)
 * 
 * @param jid1 - Primeiro JID (ex: "554191188909@s.whatsapp.net")
 * @param jid2 - Segundo JID (ex: "1234567@lid")
 * @returns true se ambos representam o mesmo usuário
 * 
 * @example
 * ```typescript
 * // Mesmo usuário com diferentes formatos
 * compareJids("554191188909@s.whatsapp.net", "554191188909@c.us") // true
 * 
 * // Resolvendo @lid corretamente
 * compareJids("1234567@lid", "554191188909@s.whatsapp.net") // true (se forem o mesmo)
 * 
 * // Diferentes usuários
 * compareJids("5541911111111@s.whatsapp.net", "5541922222222@s.whatsapp.net") // false
 * ```
 */
export function compareJids(jid1: string, jid2: string): boolean {
  try {
    const result = areJidsSameUser(jid1, jid2);
    console.log(`🔍 [compareJids] Comparing: ${jid1} === ${jid2} → ${result}`);
    return result;
  } catch (error) {
    console.warn(`⚠️ [compareJids] Error comparing JIDs: ${jid1} vs ${jid2}`, error);
    // Fallback: comparação simples de números
    return normalizeJid(jid1) === normalizeJid(jid2);
  }
}

/**
 * Normaliza um JID do WhatsApp usando a função oficial do Baileys.
 * 
 * Remove variações e padroniza o formato, mas NÃO adiciona o 9º dígito
 * para números brasileiros (isso é feito pela função normalizeWhatsAppNumber).
 * 
 * @param jid - JID a ser normalizado
 * @returns JID normalizado no formato padrão
 * 
 * @example
 * ```typescript
 * normalizeJid("5541911889909:98@s.whatsapp.net") // "5541911889909@s.whatsapp.net"
 * normalizeJid("5541911889909@c.us") // "5541911889909@s.whatsapp.net"
 * normalizeJid("1234567@lid") // "1234567@lid" (mantém @lid se não puder resolver)
 * ```
 */
export function normalizeJid(jid: string): string {
  try {
    const normalized = jidNormalizedUser(jid);
    console.log(`📞 [normalizeJid] Normalized: ${jid} → ${normalized}`);
    return normalized;
  } catch (error) {
    console.warn(`⚠️ [normalizeJid] Error normalizing: ${jid}`, error);
    // Fallback: limpeza básica manual
    return jid
      .replace(/:\d+@/, '@')  // Remove device ID
      .replace('@c.us', '@s.whatsapp.net')
      .replace(/\s/g, ''); // Remove espaços
  }
}

/**
 * Normaliza número do WhatsApp aplicando regras brasileiras + normalização Baileys.
 * 
 * Esta função combina o melhor de dois mundos:
 * 1. Usa jidNormalizedUser do Baileys para padronização oficial
 * 2. Adiciona lógica específica para números brasileiros (9º dígito)
 * 
 * Regras aplicadas (em ordem):
 * 1. Normalização via Baileys (remove device IDs, padroniza sufixos)
 * 2. Normalização brasileira (adiciona 9º dígito se necessário)
 * 3. Formato final: number@s.whatsapp.net ou number@g.us
 * 
 * @param remoteJid - JID do contato/grupo
 * @param isGroup - Se é um grupo (usa @g.us ao invés de @s.whatsapp.net)
 * @returns JID normalizado no formato correto
 * 
 * @example
 * ```typescript
 * // Número brasileiro sem 9º dígito → adiciona
 * normalizeWhatsAppNumber("554191188909@s.whatsapp.net") // "5541991188909@s.whatsapp.net"
 * 
 * // Número brasileiro já correto → mantém
 * normalizeWhatsAppNumber("5541991188909@s.whatsapp.net") // "5541991188909@s.whatsapp.net"
 * 
 * // Grupo → mantém @g.us
 * normalizeWhatsAppNumber("123456789@g.us", true) // "123456789@g.us"
 * 
 * // Device ID removido
 * normalizeWhatsAppNumber("5541991188909:98@s.whatsapp.net") // "5541991188909@s.whatsapp.net"
 * ```
 */
export function normalizeWhatsAppNumber(remoteJid: string, isGroup: boolean = false): string {
  // 1. Normalizar via Baileys primeiro (remove device IDs, padroniza sufixos)
  let normalized = normalizeJid(remoteJid);

  // 2. Detectar se é grupo (verificar antes de remover sufixos)
  const isGroupJid = isGroup || normalized.includes('@g.us');

  // 3. Extrair apenas o número (sem sufixos)
  let cleanNumber = normalized
    .replace('@s.whatsapp.net', '')
    .replace('@g.us', '')
    .replace('@c.us', '')
    .replace('@lid', '');

  // 4. Aplicar normalização brasileira (adicionar 9º dígito se necessário)
  if (cleanNumber.startsWith('55') && !isGroupJid) {
    cleanNumber = normalizeBrazilianNumber(cleanNumber);
  }

  // 5. Retornar com sufixo correto
  const result = isGroupJid ? `${cleanNumber}@g.us` : `${cleanNumber}@s.whatsapp.net`;

  console.log(`🇧🇷 [normalizeWhatsAppNumber] ${remoteJid} → ${result}`);
  return result;
}

/**
 * Normaliza números brasileiros adicionando o 9º dígito se necessário.
 * 
 * Formato moderno brasileiro: 55 (país) + 2 dígitos (DDD) + 9 dígitos (número)
 * Total: 13 dígitos
 * 
 * Exemplos de normalização:
 * - 554191188909 (12 dígitos) → 5541991188909 (adiciona 9)
 * - 5541991188909 (13 dígitos) → mantém (já está correto)
 * - 55419909 (8 dígitos) → 5541991889909 (assume DDD 41, adiciona 9)
 * 
 * @param number - Número brasileiro (sem sufixos, apenas dígitos)
 * @returns Número normalizado com 13 dígitos
 */
function normalizeBrazilianNumber(number: string): string {
  const withoutCountry = number.substring(2); // Remove "55"

  // Caso 1: 8 dígitos (formato muito antigo) - assumir DDD 11 e adicionar 9
  if (withoutCountry.length === 8) {
    const phone = withoutCountry;
    const result = `55119${phone}`; // DDD padrão 11 (São Paulo)
    console.log(`🇧🇷 [normalizeBrazilianNumber] 8→13 dígitos: ${number} → ${result}`);
    return result;
  }

  // Caso 2: 9 dígitos (DDD + 8 dígitos) - adicionar 9 após DDD
  if (withoutCountry.length === 9) {
    const ddd = withoutCountry.substring(0, 2);
    const phone = withoutCountry.substring(2);
    const result = `55${ddd}9${phone}`;
    console.log(`🇧🇷 [normalizeBrazilianNumber] 9→13 dígitos: ${number} → ${result}`);
    return result;
  }

  // Caso 3: 10 dígitos (DDD + telefone sem 9º dígito)
  if (withoutCountry.length === 10) {
    const ddd = withoutCountry.substring(0, 2);
    const phone = withoutCountry.substring(2);
    
    // Verificar se o telefone tem 8 dígitos (faltando o 9º)
    if (phone.length === 8) {
      const result = `55${ddd}9${phone}`;
      console.log(`🇧🇷 [normalizeBrazilianNumber] 10→13 dígitos: ${number} → ${result}`);
      return result;
    }
    // Se phone tem 9 dígitos, mas total é 10, está estranho - manter como está
    console.log(`⚠️ [normalizeBrazilianNumber] 10 dígitos estranho, mantendo: ${number}`);
    return number;
  }

  // Caso 4: 11 dígitos (formato correto moderno - não mexer)
  if (withoutCountry.length === 11) {
    console.log(`✅ [normalizeBrazilianNumber] Já tem 11 dígitos (correto): ${number}`);
    return number;
  }

  // Caso 5: 12 dígitos (DDD + 9 + telefone, mas falta o 55)
  if (withoutCountry.length === 12) {
    console.log(`⚠️ [normalizeBrazilianNumber] 12 dígitos inesperado, mantendo: ${number}`);
    return number;
  }

  // Outros casos: retornar como está
  console.log(`⚠️ [normalizeBrazilianNumber] Tamanho inesperado (${withoutCountry.length}), mantendo: ${number}`);
  return number;
}

/**
 * Extrai o número puro de um JID (sem sufixos).
 * 
 * @param jid - JID completo
 * @returns Apenas os dígitos do número
 * 
 * @example
 * ```typescript
 * extractNumber("5541991188909@s.whatsapp.net") // "5541991188909"
 * extractNumber("123456789@g.us") // "123456789"
 * extractNumber("1234567@lid") // "1234567"
 * ```
 */
export function extractNumber(jid: string): string {
  return jid
    .replace('@s.whatsapp.net', '')
    .replace('@g.us', '')
    .replace('@c.us', '')
    .replace('@lid', '')
    .replace(/:\d+@/g, ''); // Remove device IDs
}

/**
 * Verifica se um JID é de um grupo.
 * 
 * @param jid - JID a verificar
 * @returns true se for um grupo
 */
export function isGroupJid(jid: string): boolean {
  return jid.includes('@g.us');
}

/**
 * Verifica se um JID é um @lid (identificador temporário).
 * 
 * @param jid - JID a verificar
 * @returns true se for um @lid
 */
export function isLidJid(jid: string): boolean {
  return jid.includes('@lid');
}
