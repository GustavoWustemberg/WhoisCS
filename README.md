# WhoisCS

WhoisCS é um analisador de domínios robusto que permite verificar rapidamente apontamentos DNS, status de certificados SSL e informações de expiração via WHOIS. O projeto foi desenvolvido com uma arquitetura separada entre Frontend e Backend para garantir escalabilidade e organização.

## 🚀 Funcionalidades

- **Análise de DNS**: Verifica o IP principal (A) e o IP do subdomínio `www`.
- **Detecção de IPv6**: Alerta sobre a presença de registros AAAA que podem causar problemas com SSL em certos ambientes.
- **Status SSL**: Verifica se o certificado SSL está ativo, o emissor e a data de expiração.
- **WHOIS**: Consulta a data de expiração do domínio e alerta se estiver expirado.
- **Cache Inteligente**: O backend utiliza cache para otimizar consultas repetidas e reduzir a latência.
- **Interface Moderna**: UI responsiva com suporte a Dark Mode e indicadores visuais claros (estilo semáforo).

## 🛠️ Tecnologias

### [BackEnd](./BackEnd)
- **Node.js** com **Express**
- **TypeScript** para tipagem estática
- **node-cache** para gerenciamento de cache em memória
- **whois-json** para extração de dados de domínio
- **node-forge** para análise de certificados SSL

### [FrontEnd](./FrontEnd)
- **Next.js** (App Router)
- **React** 19
- **Tailwind CSS** para estilização
- **Lucide React** para ícones

## 📦 Como Executar

### Pré-requisitos
- Node.js (v18+)
- npm ou yarn

### 1. Backend
Navegue até a pasta do backend e instale as dependências:
```bash
cd BackEnd
npm install
```
Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
O servidor estará rodando em `http://localhost:3333`.

### 2. Frontend
Navegue até a pasta do frontend e instale as dependências:
```bash
cd FrontEnd
npm install
```
Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse a aplicação em `http://localhost:3000`.

## 🔌 API

O backend expõe um endpoint principal:

### `POST /analyze`
Analisa um domínio fornecido.

**Corpo da Requisição:**
```json
{
  "domain": "exemplo.com"
}
```

**Exemplo de Resposta:**
```json
{
  "domain": "exemplo.com",
  "ipA": "149.18.102.233",
  "ipWWW": "149.18.102.233",
  "isOurServer": true,
  "hasIpv6Main": false,
  "hasIpv6WWW": false,
  "sslStatus": "Ativo",
  "sslExpiry": "15-06-2026",
  "sslIssuer": "Let's Encrypt",
  "domainExpiry": "20-01-2027",
  "fromCache": false
}
```

## 📄 Licença

Este projeto está sob a licença ISC.
