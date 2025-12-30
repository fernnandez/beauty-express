#!/usr/bin/env node

/**
 * Script para verificar se o ambiente está pronto para build do Windows
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando ambiente para build do Windows...\n');

let hasErrors = false;

// 1. Verificar se better-sqlite3 está instalado
console.log('1. Verificando better-sqlite3...');
const betterSqlite3Path = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');
if (fs.existsSync(betterSqlite3Path)) {
  console.log('   ✅ better-sqlite3 encontrado');
  
  // Verificar se tem os binários nativos
  const bindingPath = path.join(betterSqlite3Path, 'lib', 'binding');
  if (fs.existsSync(bindingPath)) {
    console.log('   ✅ Binários nativos encontrados');
    
    // Listar arquiteturas disponíveis
    const bindings = fs.readdirSync(bindingPath);
    console.log(`   📦 Arquiteturas disponíveis: ${bindings.join(', ')}`);
    
    // Verificar se tem binário para Windows
    const hasWindows = bindings.some(b => b.includes('win32') || b.includes('win'));
    if (hasWindows) {
      console.log('   ✅ Binário Windows encontrado');
    } else {
      console.log('   ⚠️  Binário Windows NÃO encontrado');
      console.log('   💡 Execute: npm rebuild better-sqlite3');
      hasErrors = true;
    }
  } else {
    console.log('   ⚠️  Binários nativos não encontrados');
    console.log('   💡 Execute: npm rebuild better-sqlite3');
    hasErrors = true;
  }
} else {
  console.log('   ❌ better-sqlite3 NÃO encontrado');
  console.log('   💡 Execute: npm install');
  hasErrors = true;
}

// 2. Verificar se dist/ existe
console.log('\n2. Verificando build TypeScript...');
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  console.log('   ✅ Pasta dist/ encontrada');
  
  const mainJs = path.join(distPath, 'main.js');
  if (fs.existsSync(mainJs)) {
    console.log('   ✅ main.js encontrado');
  } else {
    console.log('   ⚠️  main.js não encontrado');
    console.log('   💡 Execute: npm run build:ts');
    hasErrors = true;
  }
} else {
  console.log('   ⚠️  Pasta dist/ não encontrada');
  console.log('   💡 Execute: npm run build:ts');
  hasErrors = true;
}

// 3. Verificar renderer-dist
console.log('\n3. Verificando build do renderer...');
const rendererDistPath = path.join(__dirname, '..', 'dist', 'renderer-dist');
if (fs.existsSync(rendererDistPath)) {
  console.log('   ✅ renderer-dist encontrado');
  
  const indexHtml = path.join(rendererDistPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    console.log('   ✅ index.html encontrado');
  } else {
    console.log('   ⚠️  index.html não encontrado');
    console.log('   💡 Execute: npm run build:renderer');
    hasErrors = true;
  }
} else {
  console.log('   ⚠️  renderer-dist não encontrado');
  console.log('   💡 Execute: npm run build:renderer');
  hasErrors = true;
}

// 4. Verificar plataforma
console.log('\n4. Verificando plataforma...');
const platform = process.platform;
console.log(`   📱 Plataforma atual: ${platform}`);

if (platform === 'win32') {
  console.log('   ✅ Build nativo no Windows - Ideal!');
} else {
  console.log('   ⚠️  Build cross-platform detectado');
  console.log('   💡 Para melhor compatibilidade, faça o build no Windows');
  console.log('   💡 Ou use GitHub Actions / CI/CD para build nativo');
}

// Resumo
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Verificação encontrou problemas. Corrija antes de fazer o build.');
  process.exit(1);
} else {
  console.log('✅ Ambiente pronto para build!');
  console.log('\n💡 Execute: npm run build:win');
  process.exit(0);
}

