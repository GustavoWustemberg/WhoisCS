# WhoisCS

WhoisCS é um analisador de domínios robusto que permite verificar rapidamente apontamentos DNS, status de certificados SSL, informações de Name Servers (NS) e expiração via WHOIS. O projeto foi desenhado para analistas técnicos que precisam de uma visão clara da infraestrutura de rede de um domínio.

## 🚀 Funcionalidades

- **Análise de DNS**: Verifica o IP principal (A) e o IP do subdomínio `www`.
- **DNS History**: Busca automática de histórico para identificar se o domínio já apontou para nossa infraestrutura no passado (utiliza DomScan/SecurityTrails).
- **Análise de Name Servers (NS)**:
    - Identifica Name Servers do **Registro.br** e **Cloudflare**.
    - Exibe status de acesso baseado no ID do Contato Técnico ou NS específicos.
- **Alertas de Migração**: Identifica se o domínio está apontado para servidores antigos (legacy) e recomenda a migração.
- **Status SSL**: Verifica se o certificado SSL está ativo, o emissor e a data de expiração com validação de expiração em tempo real.
- **WHOIS**: Consulta a data de expiração do domínio e exibe o ID do contato técnico para domínios `.br`.
- **Cache Inteligente**: O backend utiliza cache (1 hora) para otimizar consultas repetidas.
- **Interface Moderna**: UI responsiva com indicadores visuais de "acesso garantido" e alertas de segurança.

## 🛠️ Tecnologias

### [BackEnd](./BackEnd)
- **Node.js** com **Express**
- **TypeScript** para tipagem estática
- **node-cache** para gerenciamento de cache
- **whois-json** para dados de domínio
- **node-forge** para análise de certificados SSL
- **dotenv** para gestão de chaves de API

### [FrontEnd](./FrontEnd)
- **Next.js** (App Router)
- **React** 19
- **Tailwind CSS** para estilização
- **Lucide React** para ícones

## 📦 Como Executar

### Pré-requisitos
- Node.js (v18+)
- Chaves de API (opcional para histórico): DomScan ou SecurityTrails

### 1. Backend
Crie um arquivo `.env` na pasta `BackEnd` baseado nas suas chaves:
```env
DOMSCAN_API_KEY=sua_chave_aqui
SECURITY_TRAILS_API_KEY=sua_chave_aqui
```

Instale as dependências e inicie:
```bash
cd BackEnd
npm install
npm run dev
```

### 2. Frontend
```bash
cd FrontEnd
npm install
npm run dev
```

## 🔌 API

O backend expõe um endpoint principal:

### `POST /analyze`
Analisa um domínio fornecido.

**Corpo da Requisição:**
```json
{
  "domain": "exemplo.com.br"
}
```

**Principais Campos da Resposta:**
- `isOurServer`: Booleano para IPs atuais.
- `isOldServer`: Alerta de servidor legado.
- `isRegistroBrNS`: Identifica infraestrutura Registro.br.
- `dnsHistory`: Objeto com dados históricos (útil para reconquista de clientes).
- `technicalContact`: Dados do contato (ID e Email).

## 📄 Licença

Este projeto está sob a licença ISC.
