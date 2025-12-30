# 🎨 Guia de Ícones e Splash Screen

Este documento explica como melhorar os ícones e o splash screen do Beauty Express.

## ✅ O que foi implementado

### 1. Splash Screen
- ✅ Componente `SplashScreen` criado com animações suaves
- ✅ Integrado no `main.tsx` para aparecer durante o carregamento
- ✅ Verifica se o banco de dados está pronto antes de esconder
- ✅ Design moderno com gradiente e animações

### 2. Ícones
- ✅ Ícone base copiado para `assets/icon.png`
- ✅ Configuração do electron-builder atualizada
- ✅ Favicon atualizado no `index.html`

## 📋 Próximos Passos (Opcional)

### Para melhorar ainda mais os ícones:

1. **Gerar ícones para cada plataforma**:

   ```bash
   cd electron-app/build
   ```

   - **macOS**: Precisa de `icon.icns`
   - **Windows**: Precisa de `icon.ico`  
   - **Linux**: Já tem `icon.png` (512x512+)

2. **Ferramentas recomendadas**:
   - [IconKitchen](https://icon.kitchen/) - Gera ícones para todas as plataformas
   - [CloudConvert](https://cloudconvert.com/) - Converte PNG para ICO/ICNS
   - [electron-icon-maker](https://www.npmjs.com/package/electron-icon-maker) - Ferramenta CLI

3. **Tamanhos recomendados**:
   - macOS: 512x512 (será convertido para .icns com múltiplos tamanhos)
   - Windows: 256x256 (será convertido para .ico com múltiplos tamanhos)
   - Linux: 512x512 PNG

### Para personalizar o Splash Screen:

Edite o arquivo `renderer/src/components/SplashScreen.tsx` e `SplashScreen.css`:
- Cores do gradiente
- Texto e logo
- Duração das animações
- Estilo geral

## 🚀 Como testar

1. **Modo desenvolvimento**:
   ```bash
   cd electron-app
   npm run dev
   ```

2. **Build de produção**:
   ```bash
   npm run build:mac  # ou build:win, build:linux
   ```

O splash screen aparecerá automaticamente ao iniciar o app, e os ícones serão usados no executável final.

