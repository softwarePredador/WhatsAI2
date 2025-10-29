const fs = require('fs');
const path = require('path');

console.log('🧹 Iniciando limpeza inteligente do projeto...\n');

// ==========================================
// 1. REMOVER CONSOLE.LOG VERBOSOS
// ==========================================
console.log('📝 FASE 1: Removendo console.log verbosos\n');

const filesToClean = [
  'src/services/conversation-service.ts',
  'src/api/controllers/webhook-controller.ts',
  'src/services/evolution-api.ts',
  'src/services/incoming-media-service.ts',
  'src/api/controllers/conversation-controller.ts',
  'src/services/instance-service.ts',
  'src/api/controllers/instance-controller.ts',
  'src/services/image-optimizer.ts',
  'src/core/app.ts',
  'src/utils/baileys-helpers.ts',
];

let totalRemoved = 0;

filesToClean.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  Pulando ${filePath} (não existe)`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalLength = content.split('\n').length;
  let removed = 0;

  // MANTER apenas:
  // - console.error (erros críticos)
  // - console.warn em casos específicos de erro
  // REMOVER:
  // - console.log de debug/verbose
  // - console.log de "processando...", "iniciando...", etc
  
  const patternsToRemove = [
    // Logs de debug com emojis (muito verbosos)
    /\s*console\.log\(`[🔍📝📨💬📡🚨✅⚠️🔄👤📸📊💾🖼️📋🚀⏩📬🎯💡🔧ℹ️][^`]*`[^;]*\);?\n/g,
    
    // Logs simples de string
    /\s*console\.log\(['"]\w+:.*?['"]\);?\n/g,
    
    // Logs de objeto/JSON.stringify (verbosos)
    /\s*console\.log\([^,]+,\s*JSON\.stringify\([^)]+\)[^)]*\);?\n/g,
    
    // Separadores visuais
    /\s*console\.log\(`[=\-]{5,}`\);?\n/g,
  ];

  patternsToRemove.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      removed += matches.length;
      content = content.replace(pattern, '');
    }
  });

  // Limpar linhas vazias excessivas
  content = content.replace(/\n{3,}/g, '\n\n');

  if (removed > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    const newLength = content.split('\n').length;
    console.log(`✅ ${path.basename(filePath)}: ${removed} logs removidos (${originalLength} → ${newLength} linhas)`);
    totalRemoved += removed;
  } else {
    console.log(`⏭️  ${path.basename(filePath)}: já limpo`);
  }
});

console.log(`\n📊 Total de logs removidos: ${totalRemoved}\n`);

// ==========================================
// 2. ARQUIVOS .MD PARA REMOVER
// ==========================================
console.log('📄 FASE 2: Identificando arquivos .md desnecessários\n');

const mdToRemove = [
  // Documentação de fases antigas (já implementadas)
  '../FASE1-MUDANCA1-BAILEYS-HELPERS.md',
  '../FASE1-MUDANCA2-IMAGE-OPTIMIZER.md',
  '../FASE1-MUDANCA3-WEBHOOK-SCHEMAS.md',
  '../FASE1-MUDANCA4-FILE-TYPE-VALIDATION.md',
  '../FASE2-MUDANCA1-LIBPHONENUMBER.md',
  '../FASE2-MUDANCA2-CACHE-MANAGER.md',
  
  // Análises temporárias
  '../PERFORMANCE-OPTIMIZATIONS-COMPLETE.md',
  '../WEBHOOK-COMPLETE-ANALYSIS.md',
  '../VALIDACAO-LOGICA-HIBRIDA.md',
  '../LOGICA-FOTO-PERFIL-TEMPO-REAL.md',
  
  // Guias duplicados/desatualizados
  '../CROSS-PLATFORM-CHANGES.md',
  '../CROSS-PLATFORM-SETUP.md',
  '../easypanel-deploy.md',
  '../PLANO-MELHORIAS-BIBLIOTECAS.md',
];

console.log('Arquivos .md que PODEM ser removidos (documentação de trabalho temporária):\n');
mdToRemove.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    const kb = (stats.size / 1024).toFixed(1);
    console.log(`  - ${file.replace('../', '')} (${kb} KB)`);
  }
});

console.log('\n📌 ARQUIVOS .md IMPORTANTES (MANTER):');
console.log('  - README.md (documentação principal)');
console.log('  - DEPLOYMENT-GUIDE.md (deploy)');
console.log('  - DOCKER-GUIDE.md (docker)');
console.log('  - COMANDOS-TESTADOS.md (referência útil)');
console.log('  - ROADMAP-EMPRESA.md (planejamento)');
console.log('  - PROXIMOS-PASSOS.md (próximas features)');

console.log('\n💡 Para remover os arquivos .md listados, rode:');
console.log('   node cleanup-project.js --remove-md\n');

// Executar remoção se flag presente
if (process.argv.includes('--remove-md')) {
  console.log('🗑️  Removendo arquivos .md desnecessários...\n');
  let removedMd = 0;
  mdToRemove.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ Removido: ${file.replace('../', '')}`);
      removedMd++;
    }
  });
  console.log(`\n📊 Total: ${removedMd} arquivos .md removidos\n`);
}

console.log('✨ Limpeza concluída!\n');
