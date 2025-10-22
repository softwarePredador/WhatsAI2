const moduleAlias = require('module-alias');
const path = require('path');

// Register aliases
moduleAlias.addAliases({
  '@': path.join(__dirname, 'src'),
  '@/core': path.join(__dirname, 'src/core'),
  '@/api': path.join(__dirname, 'src/api'),
  '@/services': path.join(__dirname, 'src/services'),
  '@/database': path.join(__dirname, 'src/database'),
  '@/utils': path.join(__dirname, 'src/utils'),
  '@/types': path.join(__dirname, 'src/types'),
  '@/config': path.join(__dirname, 'src/config')
});