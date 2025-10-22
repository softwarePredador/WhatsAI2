#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

function convertImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Get the directory of the current file relative to src
  const relativePath = path.relative(path.join(__dirname, 'src'), path.dirname(filePath));
  const levelsUp = relativePath === '' ? '' : '../'.repeat(relativePath.split('/').length);

  // Replace @/ imports with relative paths
  content = content.replace(/from '@\/([^'"]*)'/g, (match, importPath) => {
    modified = true;
    return `from '${levelsUp}${importPath}'`;
  });

  content = content.replace(/import '@\/([^'"]*)'/g, (match, importPath) => {
    modified = true;
    return `import '${levelsUp}${importPath}'`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// Find all TypeScript files in src directory
const files = glob.sync('src/**/*.ts', { absolute: true });

files.forEach(convertImports);

console.log('Import conversion completed!');