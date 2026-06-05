# Dockerfile da API (sem frontend embutido)

FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json tsconfig.build.json ./
COPY nest-cli.json ./

RUN npm ci --include=dev

COPY src ./src

RUN npm run build

FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --production && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "start:prod"]
