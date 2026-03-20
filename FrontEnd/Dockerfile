# Dockerfile para o Frontend (Next.js)

# Estágio 1: Instalação de dependências
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Estágio 2: Build
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# O Next.js precisa de variáveis de ambiente de build aqui se houver
RUN npm run build

# Estágio 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiar arquivos necessários para rodar
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
