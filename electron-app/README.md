# 💅 Beauty Express - Aplicativo Electron Nativo

Sistema completo de gestão para salões de beleza desenvolvido como aplicativo desktop nativo usando Electron, TypeScript, TypeORM e React.

## 📋 Sobre o Projeto

Este é um aplicativo Electron **100% nativo**, sem dependências externas da API. Toda a arquitetura foi replicada dentro do Electron:

- **Backend TypeScript**: Serviços e lógica de negócio nativos
- **TypeORM**: Acesso direto ao banco de dados SQLite
- **React Frontend**: Interface moderna integrada
- **Arquitetura Limpa**: Separação de responsabilidades (entities, services, database)

## 🏗️ Arquitetura

```
electron-app/
├── src/                    # Código TypeScript do backend
│   ├── entities/          # Entidades TypeORM
│   ├── services/          # Serviços de negócio
│   └── database/          # Configuração do banco
├── renderer/              # Frontend React
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas
│   │   └── hooks/        # Custom hooks
│   └── package.json
├── main.ts                # Processo principal Electron
├── preload.js             # Bridge IPC
└── package.json
```

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

1. **Instale as dependências do Electron:**
```bash
cd electron-app
npm install
```

2. **Instale as dependências do renderer (React):**
```bash
cd renderer
npm install
cd ..
```

3. **Compile o TypeScript:**
```bash
npm run build:ts
```

## 🏃 Executando

### Modo Desenvolvimento

```bash
npm run dev
```

Isso irá:
- Compilar o TypeScript
- Iniciar o Vite dev server (React)
- Iniciar o Electron

### Modo Produção

```bash
npm start
```

Compila tudo e inicia o aplicativo.

## 📦 Build para Distribuição

### Verificação Pré-Build

Antes de fazer o build, especialmente para Windows, verifique o ambiente:

```bash
npm run check:build
```

Este script verifica se todas as dependências estão corretas.

### Build por Plataforma

```bash
# macOS
npm run build:mac

# Windows (⚠️ IMPORTANTE: Melhor fazer no Windows)
npm run build:win

# Linux
npm run build:linux
```

### ⚠️ Problemas no Windows?

Se o aplicativo não funcionar no Windows após a instalação, consulte:
- [TROUBLESHOOTING-WINDOWS.md](./TROUBLESHOOTING-WINDOWS.md) - Guia completo de solução de problemas

**Problema mais comum:** O `better-sqlite3` precisa ser compilado para Windows. Se você fez o build no Mac, o executável pode não funcionar no Windows. **Solução:** Faça o build diretamente no Windows ou use GitHub Actions/CI/CD.

## 🔧 Tecnologias

### Backend (Main Process)
- **TypeScript**: Tipagem estática
- **TypeORM**: ORM para SQLite
- **SQLite**: Banco de dados local
- **Electron**: Framework desktop

### Frontend (Renderer Process)
- **React 19**: Biblioteca UI
- **TypeScript**: Tipagem estática
- **Vite**: Build tool
- **React Router**: Roteamento
- **React Query**: Gerenciamento de estado

## 📝 Estrutura de Serviços

Os serviços seguem o mesmo padrão da API original:

- `CollaboratorService`: Gestão de colaboradores
- `ServiceService`: Gestão de serviços
- `AppointmentService`: Gestão de agendamentos
- `CommissionService`: Gestão de comissões
- `FinancialReportService`: Relatórios financeiros

## 🗄️ Banco de Dados

O banco SQLite é criado automaticamente em:

- **macOS**: `~/Library/Application Support/beauty-express-electron/beauty-express.db`
- **Windows**: `%APPDATA%/beauty-express-electron/beauty-express.db`
- **Linux**: `~/.config/beauty-express-electron/beauty-express.db`

## ✨ Funcionalidades

- ✅ Gestão completa de colaboradores
- ✅ Catálogo de serviços
- ✅ Sistema de agendamentos
- ✅ Cálculo automático de comissões
- ✅ Relatórios financeiros mensais
- ✅ Interface React moderna
- ✅ 100% offline
- ✅ Dados locais seguros

## 🔄 Próximos Passos

Para completar a integração do React:

1. Copiar componentes do frontend original para `renderer/src/`
2. Adaptar os hooks para usar `window.electronAPI` ao invés de axios
3. Configurar React Router
4. Ajustar estilos e temas

## 📄 Licença

Este projeto é privado e de uso interno.

---

**Beauty Express** - Gestão completa para seu salão de beleza 💅✨
