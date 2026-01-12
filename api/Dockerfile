# Dockerfile otimizado para Railway/Render
# Assume que a pasta client/ já está buildada e commitada

# Stage 1: Build da API
FROM node:20-alpine AS builder
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Instala todas as dependências (incluindo dev para build)
RUN npm ci --include=dev

# Copia código fonte
COPY src ./src

# Build da aplicação
RUN npm run build

# Stage 2: Imagem de produção
FROM node:20-alpine
WORKDIR /app

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

# Copia arquivos buildados da API
COPY --from=builder /app/dist ./dist

# Copia frontend buildado (já deve estar no repositório)
COPY client ./client

# Cria diretório para banco de dados SQLite
# No Railway, monte um volume persistente em /app/data
RUN mkdir -p /app/data

# Expõe a porta (Railway/Render definem PORT automaticamente)
EXPOSE 3000

# Define variáveis de ambiente padrão
ENV NODE_ENV=production

# Railway/Render definem PORT automaticamente, mas definimos um fallback
ENV PORT=3000

# Comando para iniciar a aplicação
CMD ["node", "dist/main.js"]
