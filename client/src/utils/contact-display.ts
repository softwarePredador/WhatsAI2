/**
 * Utility to display contact name with fallback logic:
 * 1. nickname (user-editable custom name)
 * 2. contactName (WhatsApp pushName)
 * 3. formatted phone number
 */

export interface ContactInfo {
  nickname?: string | null;
  contactName?: string | null;
  remoteJid: string;
}

/**
 * Get display name for a contact following priority:
 * nickname → pushName → formatted number
 */
export function getDisplayName(contact: ContactInfo): string {
  // Priority 1: User-editable nickname
  if (contact.nickname && contact.nickname.trim()) {
    return contact.nickname;
  }
  
  // Priority 2: WhatsApp pushName
  if (contact.contactName && contact.contactName.trim()) {
    return contact.contactName;
  }
  
  // Priority 3: Formatted phone number
  return formatPhoneNumber(contact.remoteJid);
}

/**
 * Format phone number for display
 * Example: 5541991188909@s.whatsapp.net → +55 (41) 99118-8909
 */
export function formatPhoneNumber(remoteJid: string): string {
  const cleanNumber = remoteJid
    .replace('@s.whatsapp.net', '')
    .replace('@g.us', '')
    .replace('@c.us', '')
    .replace('@lid', '');
  
  // Brazilian phone format: +55 (XX) 9XXXX-XXXX
  if (cleanNumber.startsWith('55') && cleanNumber.length === 13) {
    const ddd = cleanNumber.substring(2, 4);
    const firstPart = cleanNumber.substring(4, 9);
    const secondPart = cleanNumber.substring(9);
    return `+55 (${ddd}) ${firstPart}-${secondPart}`;
  }
  
  // Other formats (international, groups, etc)
  return cleanNumber;
}
