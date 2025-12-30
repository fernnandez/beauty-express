#!/usr/bin/env node

/**
 * Script cross-platform para copiar preload.js para dist/
 */

const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '..', 'preload.js');
const targetDir = path.join(__dirname, '..', 'dist');
const targetFile = path.join(targetDir, 'preload.js');

try {
  // Garante que o diretório dist existe
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('📁 Diretório dist/ criado');
  }

  // Copia o arquivo
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    console.log('✅ preload.js copiado para dist/');
  } else {
    console.error('❌ Arquivo preload.js não encontrado em:', sourceFile);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Erro ao copiar preload.js:', error.message);
  process.exit(1);
}

