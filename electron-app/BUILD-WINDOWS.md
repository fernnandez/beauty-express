# 🪟 Guia de Build no Windows

Este guia ajuda a resolver problemas ao executar `npm run build:win` no Windows.

## ✅ Correções Aplicadas

- ✅ Substituído `cp` (Unix) por script Node.js cross-platform
- ✅ Scripts agora funcionam no Windows, Mac e Linux

## 🚀 Como Fazer o Build

### Passo a Passo

1. **Abra o PowerShell ou CMD como Administrador** (recomendado)

2. **Navegue até a pasta do projeto:**
```powershell
cd C:\caminho\para\beauty-express\electron-app
```

3. **Instale as dependências:**
```powershell
npm install
```

4. **Verifique o ambiente:**
```powershell
npm run check:build
```

5. **Faça o build:**
```powershell
npm run build:win
```

## ❌ Problemas Comuns e Soluções

### 1. Erro: "cp não é reconhecido como comando"

**Status:** ✅ **CORRIGIDO** - Agora usa script Node.js

Se ainda aparecer, certifique-se de que está usando a versão mais recente do código.

### 2. Erro: "tsc não é reconhecido"

**Causa:** TypeScript não está instalado globalmente ou localmente

**Solução:**
```powershell
npm install
```

Se persistir:
```powershell
npm install -g typescript
```

### 3. Erro: "electron-builder não encontrado"

**Solução:**
```powershell
npm install
```

Ou instale globalmente:
```powershell
npm install -g electron-builder
```

### 4. Erro: "better-sqlite3 não compila"

**Causa:** Falta de ferramentas de build do Windows

**Solução:**

Instale o **Visual Studio Build Tools**:
1. Baixe: https://visualstudio.microsoft.com/downloads/
2. Instale "Build Tools for Visual Studio"
3. Marque "Desktop development with C++"
4. Reinstale as dependências:
```powershell
npm rebuild better-sqlite3
```

**Alternativa mais leve:**
```powershell
npm install --global windows-build-tools
```

### 5. Erro: "Python não encontrado"

**Causa:** better-sqlite3 precisa do Python para compilar

**Solução:**
1. Instale Python 3.x: https://www.python.org/downloads/
2. Marque "Add Python to PATH" durante a instalação
3. Reinicie o terminal
4. Reinstale:
```powershell
npm rebuild better-sqlite3
```

### 6. Erro de Permissão

**Sintomas:**
- "EACCES", "EPERM"
- "Access is denied"

**Solução:**
- Execute o PowerShell/CMD como **Administrador**
- Desative temporariamente o antivírus
- Verifique permissões da pasta do projeto

### 7. Erro: "Out of memory" ou Build muito lento

**Solução:**
```powershell
# Aumente o limite de memória do Node.js
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build:win
```

### 8. Build completa mas executável não funciona

Consulte: [TROUBLESHOOTING-WINDOWS.md](./TROUBLESHOOTING-WINDOWS.md)

## 🔍 Verificações

### Verificar se tudo está instalado:

```powershell
# Node.js
node --version  # Deve ser 18+

# npm
npm --version

# TypeScript (local)
npm list typescript

# Electron Builder
npm list electron-builder

# better-sqlite3
npm list better-sqlite3
```

### Verificar estrutura de pastas:

```powershell
# Deve existir:
dir dist\main.js
dir dist\preload.js
dir dist\renderer-dist\index.html
dir node_modules\better-sqlite3
```

## 🛠️ Comandos Úteis

```powershell
# Limpar e reinstalar tudo
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Recompilar módulos nativos
npm run rebuild:native

# Verificar ambiente
npm run check:build

# Build apenas TypeScript
npm run build:ts

# Build apenas renderer
npm run build:renderer

# Build completo
npm run build:all

# Build para Windows
npm run build:win
```

## 📋 Checklist Pré-Build

Antes de fazer o build, verifique:

- [ ] Node.js 18+ instalado
- [ ] npm funcionando
- [ ] Terminal aberto como Administrador
- [ ] Dependências instaladas (`npm install`)
- [ ] TypeScript compila sem erros (`npm run build:ts`)
- [ ] Renderer compila sem erros (`npm run build:renderer`)
- [ ] better-sqlite3 instalado e compilado
- [ ] Visual Studio Build Tools instalado (se necessário)
- [ ] Python instalado e no PATH (se necessário)

## 🎯 Build Rápido (Resumo)

```powershell
# 1. Instalar dependências
npm install

# 2. Verificar ambiente
npm run check:build

# 3. Build
npm run build:win

# 4. Executável estará em: release\Beauty Express Setup 1.0.0.exe
```

## 🆘 Ainda com Problemas?

1. **Capture o erro completo** - Copie toda a mensagem de erro
2. **Execute o check:**
   ```powershell
   npm run check:build
   ```
3. **Verifique as versões:**
   ```powershell
   node --version
   npm --version
   ```
4. **Tente limpar tudo:**
   ```powershell
   Remove-Item -Recurse -Force node_modules dist release
   npm install
   npm run build:win
   ```

## 📝 Informações para Debug

Quando reportar um problema, inclua:

- Versão do Windows (10/11)
- Versão do Node.js (`node --version`)
- Versão do npm (`npm --version`)
- Mensagem de erro completa
- Saída de `npm run check:build`
- Se tem Visual Studio Build Tools instalado
- Se tem Python instalado

