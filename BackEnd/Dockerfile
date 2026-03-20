# Dockerfile para o Backend

FROM node:20-slim AS builder

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json tsconfig.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build do projeto (TypeScript -> JavaScript)
RUN npm run build

# Garantir que a pasta archives esteja no local esperado pelo servidor (dist/archives)
RUN mkdir -p dist/archives && cp src/archives/*.json dist/archives/ 2>/dev/null || true

# Estágio de produção
FROM node:20-slim

WORKDIR /app

# Copiar apenas o necessário do builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3333

EXPOSE 3333

# Comando para iniciar o servidor
CMD ["node", "dist/server.js"]
