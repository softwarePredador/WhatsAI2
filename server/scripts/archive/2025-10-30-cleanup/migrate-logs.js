const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/conversation-service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Contador
let replaced = 0;

// Padrões multiline complexos - precisamos ser mais cuidadosos
const replacements = [
  // console.log simples
  {
    pattern: /console\.log\(`([^`]+)`\);/g,
    replacement: (match, message) => {
      replaced++;
      return `logger.debug(LogContext.DATABASE, \`${message}\`);`;
    }
  },
  // console.log com template string e data
  {
    pattern: /console\.log\(`([^`]+)`,(.*?)\);/g,
    replacement: (match, message, data) => {
      replaced++;
      return `logger.debug(LogContext.DATABASE, \`${message}\`,${data});`;
    }
  },
  // console.warn
  {
    pattern: /console\.warn\(`([^`]+)`\);/g,
    replacement: (match, message) => {
      replaced++;
      return `logger.warn(LogContext.DATABASE, \`${message}\`);`;
    }
  },
  {
    pattern: /console\.warn\(`([^`]+)`,(.*?)\);/g,
    replacement: (match, message, data) => {
      replaced++;
      return `logger.warn(LogContext.DATABASE, \`${message}\`,${data});`;
    }
  },
  // console.error
  {
    pattern: /console\.error\(`([^`]+)`\);/g,
    replacement: (match, message) => {
      replaced++;
      return `logger.error(LogContext.DATABASE, \`${message}\`);`;
    }
  },
  {
    pattern: /console\.error\(`([^`]+)`,(.*?)\);/g,
    replacement: (match, message, data) => {
      replaced++;
      return `logger.error(LogContext.DATABASE, \`${message}\`,${data});`;
    }
  }
];

// Aplicar todas as substituições
replacements.forEach(({ pattern, replacement }) => {
  content = content.replace(pattern, replacement);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`✅ Migração concluída! ${replaced} substituições realizadas.`);

