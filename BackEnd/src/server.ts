import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
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

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

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

        const isOurServer = NOSSOS_IPS.includes(dnsData.ipMain);
        const isOldServer = NOSSOS_IPS_ANTIGOS.includes(dnsData.ipMain);

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

        const result = {
            domain,
            ipA: dnsData.ipMain,
            ipWWW: dnsData.ipWWW,
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
            technicalContact: isRegistroBrNS ? whoisData.technicalContact : null
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
