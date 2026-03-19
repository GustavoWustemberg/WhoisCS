import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import { normalizeDomain, formatDate } from './utils/normalize';
import { checkDNS } from './services/dnsService';
import { checkSSL } from './services/sslService';
import { checkWhois } from './services/whoisService';
import { checkHistory } from './services/historyService';

const app = express();
const port = process.env.PORT || 3333;

// Cache setup: TTL of 1 hour (3600 seconds)
const pCache = new NodeCache({ stdTTL: 3600 });

// NOSSOS_IPS configuration (could be moved to env vars later)
const NOSSOS_IPS = ["149.18.102.227", "149.18.102.228", "149.18.102.229", "149.18.102.230", "149.18.102.231", "149.18.102.232", "149.18.102.233", "149.18.102.234", "149.18.102.235", "149.18.102.236", "149.18.102.237", "149.18.102.238"];

const NOSSOS_IPS_ANTIGOS = ["169.57.141.94", "169.57.169.85", "169.57.141.90"];

// Load Migration Data
interface MigrationEntry {
    Dominio: string;
    "IP atualizado M3": string;
}

let migrationData: MigrationEntry[] = [];
try {
    const migrationFilePath = path.join(__dirname, 'archives', 'migracao.json');
    if (fs.existsSync(migrationFilePath)) {
        const rawData = fs.readFileSync(migrationFilePath, 'utf-8');
        migrationData = JSON.parse(rawData);
        console.log(`Loaded ${migrationData.length} migration entries.`);
    } else {
        console.warn('migracao.json not found in src/archives/');
    }
} catch (error) {
    console.error('Error loading migracao.json:', error);
}

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

const analyzeHandler = async (req: express.Request, res: express.Response) => {
    try {
        const rawDomain = (req.body?.domain || req.query?.domain) as string;
        if (!rawDomain) {
            return res.status(400).json({ error: 'Parâmetro "domain" é obrigatório no corpo (JSON) ou na query.' });
        }

        const domain = normalizeDomain(rawDomain);

        // Check cache
        const cachedResult = pCache.get(domain);
        if (cachedResult) {
            return res.json({ ...cachedResult, fromCache: true });
        }

        // Run all checks in parallel
        const [dnsData, sslData, whoisData] = await Promise.all([
            checkDNS(domain),
            checkSSL(domain),
            checkWhois(domain)
        ]);

        const primaryIP = dnsData.ipsMain[0] || 'Não encontrado';
        const isOurServer = NOSSOS_IPS.includes(primaryIP);
        const isOldServer = NOSSOS_IPS_ANTIGOS.includes(primaryIP);

        // DNS History check if not current
        let dnsHistory = null;
        if (!isOurServer && !isOldServer) {
            dnsHistory = await checkHistory(domain, NOSSOS_IPS, NOSSOS_IPS_ANTIGOS);
        }

        // Registro.br NS check: name servers containing 'auto.dns' or 'sec.dns.br'
        const isRegistroBrNS = dnsData.ns.some(ns => 
            ns.toLowerCase().includes('auto.dns') || 
            ns.toLowerCase().includes('sec.dns.br')
        );

        // Validation against migracao.json and multiple IPs
        let migrationMessage = null;
        const migrationEntry = migrationData.find(entry => entry.Dominio.toLowerCase() === domain.toLowerCase());
        const expectedIP = migrationEntry ? migrationEntry["IP atualizado M3"] : null;

        const incorrectIpsMain = dnsData.ipsMain.length > 1 
            ? dnsData.ipsMain.filter(ip => ip !== expectedIP && !NOSSOS_IPS.includes(ip))
            : [];
        const incorrectIpsWWW = dnsData.ipsWWW.length > 1
            ? dnsData.ipsWWW.filter(ip => ip !== expectedIP && !NOSSOS_IPS.includes(ip))
            : [];
            
        const allIncorrectIps = [...new Set([...incorrectIpsMain, ...incorrectIpsWWW])];

        if (allIncorrectIps.length > 0) {
            migrationMessage = `Apontamento incorreto. Por favor, solicite a remoção do IP ${allIncorrectIps.join(' e ')}, mantendo exclusivamente o nosso endereço IP.`;
        } else if (migrationEntry && primaryIP !== expectedIP && primaryIP !== 'Não encontrado') {
            migrationMessage = `IP incorreto. Por favor, altere o IP para ${expectedIP}`;
        }

        const result = {
            domain,
            ipA: dnsData.ipsMain.length > 0 ? dnsData.ipsMain.join(' e ') : 'Não encontrado',
            ipWWW: dnsData.ipsWWW.length > 0 ? dnsData.ipsWWW.join(' e ') : 'Não encontrado',
            isOurServer,
            isOldServer,
            dnsHistory,
            hasIpv6Main: dnsData.hasIpv6Main,
            hasIpv6WWW: dnsData.hasIpv6WWW,
            sslStatus: sslData.valid ? 'Ativo' : 'Inativo/Erro',
            sslExpiry: formatDate(sslData.expiry),
            sslIssuer: sslData.issuer,
            domainExpiry: formatDate(whoisData.expiryDate),
            ns: dnsData.ns,
            isRegistroBrNS,
            technicalContact: isRegistroBrNS ? whoisData.technicalContact : null,
            migrationMessage
        };

        // Store in cache
        pCache.set(domain, result);

        res.json({ ...result, fromCache: false });
    } catch (error) {
        console.error('Error in /analyze endpoint:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

app.get('/', (req, res) => {
    res.json({ status: 'online', service: 'WhoisCS API' });
});

app.get('/analyze', analyzeHandler);
app.post('/analyze', analyzeHandler);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Resolução para o Node.js não fechar imediatamente no Windows usando tsx + node-cache
setInterval(() => { }, 1000 * 60 * 60);
