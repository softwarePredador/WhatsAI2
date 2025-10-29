import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, 'src', 'services', 'conversation-service.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Encontrar e substituir a condição
const oldCondition = `if (messageCreateData.mediaUrl) {`;
const newCondition = `// Só processar se for URL do WhatsApp (não CDN)
        const isWhatsAppMediaUrl = messageCreateData.mediaUrl?.includes('mmg.whatsapp.net');
        
        if (messageCreateData.mediaUrl && isWhatsAppMediaUrl) {`;

if (content.includes(oldCondition)) {
  content = content.replace(oldCondition, newCondition);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✅ Arquivo atualizado com sucesso!');
  console.log('🔧 Correção aplicada: verificação de URL WhatsApp adicionada');
} else {
  console.log('⚠️ Condição não encontrada no arquivo');
}
