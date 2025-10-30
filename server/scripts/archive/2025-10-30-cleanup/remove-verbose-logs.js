const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/conversation-service.ts');
let content = fs.readFileSync(filePath, 'utf8');
let removed = 0;

// Padrões de logs VERBOSOS que devem ser REMOVIDOS (executam em cada request)
const verbosePatterns = [
  // Logs de normalização (executam SEMPRE)
  /\s*logger\.debug\(LogContext\.DATABASE,\s*`📞 \[normalizeRemoteJid\] Input:.*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.DATABASE,\s*`🇧🇷 \[normalizeRemoteJid\] Número BR.*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.DATABASE,\s*`🔄 \[normalizeWhatsAppNumber\].*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.DATABASE,\s*`📞 \[normalizeWhatsAppNumber\].*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.DATABASE,\s*`🔄 \[formatRemoteJid\].*?\);?\n/g,
  
  // Logs de "Starting..." e "Processing..." (verbosos)
  /\s*logger\.debug\(LogContext\.WEBHOOK,\s*`👤 \[CONTACT_UPDATE\] Starting update.*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.WEBHOOK,\s*`👤 \[CONTACT_UPDATE\] Normalized JID:.*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.WEBHOOK,\s*`👤 \[CONTACT_UPDATE\] Found \$\{.*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.WEBHOOK,\s*`👤 \[CONTACT_UPDATE\] Direct match found.*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.WEBHOOK,\s*`👤 \[CONTACT_UPDATE\] Trying.*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.WEBHOOK,\s*`🔄 \[CONTACT_UPDATE\] Found by.*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.WEBHOOK,\s*`🚨🚨🚨 \[CONTACT_UPDATE\].*?\);?\n/g,
  
  // Logs de getConversationsByInstance (executam sempre)
  /\s*logger\.debug\(LogContext\.DATABASE,\s*'🔍 \[ConversationService\].*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.DATABASE,\s*`📸 Buscando fotos.*?\);?\n/g,
  
  // Logs de background updates (verbosos)
  /\s*logger\.debug\(LogContext\.DATABASE,\s*`👤 PushName atualizado em background.*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.DATABASE,\s*`📸 Foto de perfil atualizada.*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.DATABASE,\s*`⚠️  Não foi possível buscar informações.*?\);?\n/g,
  
  // Logs de mapping @lid (verbosos)
  /\s*logger\.debug\(LogContext\.DATABASE,\s*`✅ Mapped:.*?\);?\n/g,
  /\s*logger\.debug\(LogContext\.DATABASE,\s*`🔄 Resolved @lid:.*?\);?\n/g,
  
  // Logs de WebSocket (verbosos - já tem no socket-service)
  /\s*logger\.debug\(LogContext\.WEBHOOK,\s*`📡 \[WebSocket\] Emitindo conversation:updated.*?\n.*?\n.*?\n.*?\);?\n/gs,
];

// MANTER warnings e errors importantes
// logger.warn() e logger.error() não serão removidos

// Remover logs verbosos
verbosePatterns.forEach(pattern => {
  const matches = content.match(pattern);
  if (matches) {
    removed += matches.length;
    content = content.replace(pattern, '');
  }
});

// Limpar linhas vazias consecutivas (máximo 2)
content = content.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log(`✅ Remoção concluída! ${removed} logs verbosos removidos.`);
console.log(`📊 Impacto esperado: ~${removed * 2}ms de economia por request (média 2ms por log)`);
