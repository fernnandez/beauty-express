# Ícones do Aplicativo

Esta pasta contém os ícones do aplicativo em diferentes formatos para cada plataforma.

## Formatos Necessários

- **macOS**: `icon.icns` (formato de ícone do macOS)
- **Windows**: `icon.ico` (formato de ícone do Windows)
- **Linux**: `icon.png` (PNG de alta resolução, mínimo 512x512)

## Como Gerar os Ícones

### Opção 1: Usando ferramentas online

1. **Para macOS (.icns)**:
   - Use [CloudConvert](https://cloudconvert.com/png-to-icns) ou
   - Use [IconKitchen](https://icon.kitchen/)
   - Ou use o comando: `iconutil -c icns icon.iconset` (macOS apenas)

2. **Para Windows (.ico)**:
   - Use [CloudConvert](https://cloudconvert.com/png-to-ico) ou
   - Use [ICO Convert](https://icoconvert.com/)
   - O arquivo deve ter múltiplos tamanhos embutidos (16x16, 32x32, 48x48, 256x256)

3. **Para Linux (.png)**:
   - Use o `icon.png` da pasta `assets/` (já está no formato correto)
   - Certifique-se de que tenha pelo menos 512x512 pixels

### Opção 2: Usando ImageMagick (se instalado)

```bash
# Copiar o ícone base
cp ../assets/icon.png icon.png

# Para Windows (criar ICO com múltiplos tamanhos)
convert icon.png -resize 16x16 icon_16.png
convert icon.png -resize 32x32 icon_32.png
convert icon.png -resize 48x48 icon_48.png
convert icon.png -resize 256x256 icon_256.png
convert icon_16.png icon_32.png icon_48.png icon_256.png icon.ico

# Para Linux (já está pronto se for PNG de alta resolução)
cp icon.png icon.png
```

### Opção 3: Usando electron-icon-maker (npm)

```bash
npm install -g electron-icon-maker
electron-icon-maker --input=../assets/icon.png --output=.
```

## Estrutura Esperada

```
build/
├── icon.icns    # macOS
├── icon.ico     # Windows
└── icon.png     # Linux (512x512 ou maior)
```

## Nota

Por enquanto, o electron-builder usará o ícone padrão do Electron se os arquivos não existirem. Para uma experiência completa, gere os ícones nos formatos corretos.

