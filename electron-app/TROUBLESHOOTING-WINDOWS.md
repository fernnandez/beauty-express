# 🔧 Troubleshooting - Problemas no Windows

Este guia ajuda a resolver problemas comuns quando o aplicativo não funciona no Windows.

## ❌ Problema: Aplicativo não inicia ou trava no Windows

### Possíveis Causas e Soluções

#### 1. **better-sqlite3 não encontrado** (Mais Comum)

**Sintomas:**
- Aplicativo não inicia
- Erro: "Cannot find module 'better-sqlite3'"
- Erro: "The specified module could not be found"

**Solução:**

O `better-sqlite3` é um módulo nativo que precisa ser compilado para Windows. Siga estes passos:

1. **Certifique-se de que está fazendo o build no Windows ou com a arquitetura correta:**

```bash
# No Windows, instale as dependências e faça o build
npm install
npm run build:win
```

2. **Se estiver fazendo cross-compilation (build no Mac para Windows):**

O electron-builder pode ter problemas com módulos nativos. Você tem duas opções:

**Opção A: Build nativo no Windows (Recomendado)**
- Use uma máquina Windows ou VM Windows
- Instale Node.js e npm
- Execute: `npm install && npm run build:win`

**Opção B: Usar GitHub Actions ou CI/CD**
- Configure um workflow que faça o build no Windows automaticamente

#### 2. **Permissões de Diretório**

**Sintomas:**
- Erro ao criar/ler banco de dados
- Erro: "EACCES" ou "EPERM"

**Solução:**
- Execute o aplicativo como Administrador (temporariamente para testar)
- Verifique se o antivírus não está bloqueando
- O banco de dados é criado em: `%APPDATA%\beauty-express\beauty-express.db`

#### 3. **Antivírus Bloqueando**

**Sintomas:**
- Aplicativo inicia mas trava
- Banco de dados não é criado
- Erros de acesso negado

**Solução:**
- Adicione o aplicativo à lista de exceções do antivírus
- O Windows Defender pode marcar executáveis Electron como suspeitos (falso positivo)

#### 4. **Arquitetura Incompatível**

**Sintomas:**
- Erro: "The module was compiled against a different Node.js version"

**Solução:**
- Certifique-se de que o build foi feito para a arquitetura correta (x64, arm64)
- No Windows, geralmente é x64

## 🔍 Como Diagnosticar

### 1. Verificar Logs

O aplicativo agora mostra logs detalhados no console. Se você conseguir abrir o DevTools:

1. Pressione `Ctrl+Shift+I` (ou `F12`)
2. Vá na aba "Console"
3. Procure por mensagens de erro

### 2. Verificar se o Banco de Dados foi Criado

O banco de dados deve estar em:
```
C:\Users\[SEU_USUARIO]\AppData\Roaming\beauty-express\beauty-express.db
```

### 3. Testar better-sqlite3 Manualmente

Se você tiver acesso ao código, pode testar:

```javascript
try {
  const Database = require('better-sqlite3');
  console.log('✅ better-sqlite3 carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar better-sqlite3:', error);
}
```

## 🛠️ Soluções de Build

### Build Correto para Windows

```bash
# 1. Limpe o cache e reinstale
rm -rf node_modules package-lock.json
npm install

# 2. Certifique-se de que better-sqlite3 está instalado
npm list better-sqlite3

# 3. Faça o build
npm run build:win
```

### Verificar o Build

Após o build, verifique se o executável contém o better-sqlite3:

1. Extraia o `.exe` ou verifique a pasta `release/win-arm64-unpacked/`
2. Procure por: `resources/app.asar.unpacked/node_modules/better-sqlite3/`
3. Deve conter os binários nativos (`.node` files)

## 📝 Checklist de Build

- [ ] Node.js instalado (versão 18+)
- [ ] Dependências instaladas (`npm install`)
- [ ] Build feito no Windows ou com arquitetura correta
- [ ] `better-sqlite3` aparece em `node_modules`
- [ ] Build completo sem erros
- [ ] Executável gerado em `release/`

## 🚀 Próximos Passos

Se o problema persistir:

1. **Capture o erro completo** - A mensagem de erro agora é mais detalhada
2. **Verifique a versão do Windows** - Windows 10/11, arquitetura (x64/arm64)
3. **Teste em outra máquina Windows** - Para isolar problemas de ambiente
4. **Considere usar uma alternativa** - Se necessário, podemos migrar para `sql.js` (SQLite em JavaScript puro, sem dependências nativas)

## 📞 Informações para Debug

Quando reportar um problema, inclua:

- Versão do Windows
- Arquitetura (x64 ou arm64)
- Mensagem de erro completa
- Localização do banco de dados tentada
- Se o executável foi gerado no Windows ou cross-compiled

