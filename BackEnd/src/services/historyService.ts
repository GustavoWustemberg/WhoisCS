import axios from 'axios';
const DOMSCAN_API_KEY = process.env.DOMSCAN_API_KEY;
const SECURITY_TRAILS_API_KEY = process.env.SECURITY_TRAILS_API_KEY;

export interface HistoryEvent {
    ip: string;
    firstSeen: string;
    lastSeen: string;
    isOldServer: boolean;
}

export interface HistoryResult {
    wasOurCustomer: boolean;
    lastSeenDate: string | null;
    history: HistoryEvent[];
    provider: string;
}

export async function checkHistory(domain: string, ourIps: string[], oldIps: string[]): Promise<HistoryResult> {
    // Try DomScan first (higher limit)
    try {
        const domScanResult = await checkDomScan(domain, ourIps, oldIps);
        if (domScanResult) return domScanResult;
    } catch (error: any) {
        console.warn('DomScan failed, moving to fallback:', error.message);
    }

    // Fallback or specific for .br if DomScan didn't return a positive match/failed
    try {
        return await checkSecurityTrails(domain, ourIps, oldIps);
    } catch (error: any) {
        console.error('All DNS History providers failed:', error.message);
        return {
            wasOurCustomer: false,
            lastSeenDate: null,
            history: [],
            provider: 'none'
        };
    }
}

async function checkDomScan(domain: string, ourIps: string[], oldIps: string[]) {
    const url = `https://domscan.net/v1/dns/history?domain=${domain}&type=A`;
    const response = await axios.get(url, {
        headers: {
            'X-Api-Key': DOMSCAN_API_KEY,
            'Accept': 'application/json'
        },
        timeout: 5000
    });

    const historyEntries = response.data.history || [];
    const matches: HistoryEvent[] = [];
    const seenIps = new Set<string>();

    for (const entry of historyEntries) {
        for (const change of entry.changes) {
            const ip = change.value;
            const isOurIp = ourIps.includes(ip);
            const isOldIp = oldIps.includes(ip);

            if (isOurIp || isOldIp) {
                const key = `${ip}-${entry.date}`;
                if (!seenIps.has(key)) {
                    matches.push({
                        ip,
                        firstSeen: entry.date,
                        lastSeen: entry.date,
                        isOldServer: isOldIp
                    });
                    seenIps.add(key);
                }
            }
        }
    }

    matches.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    return {
        wasOurCustomer: matches.length > 0,
        lastSeenDate: matches.length > 0 ? matches[0].lastSeen : null,
        history: matches.slice(0, 5),
        provider: 'domscan'
    };
}

async function checkSecurityTrails(domain: string, ourIps: string[], oldIps: string[]) {
    const url = `https://api.securitytrails.com/v1/history/${domain}/dns/a`;
    const response = await axios.get(url, {
        headers: {
            'apikey': SECURITY_TRAILS_API_KEY,
            'accept': 'application/json'
        },
        timeout: 5000
    });

    const records = response.data.records || [];
    const matches: HistoryEvent[] = [];

    for (const record of records) {
        for (const val of record.values) {
            const ip = val.ip;
            const isOurIp = ourIps.includes(ip);
            const isOldIp = oldIps.includes(ip);

            if (isOurIp || isOldIp) {
                matches.push({
                    ip,
                    firstSeen: record.first_seen,
                    lastSeen: record.last_seen,
                    isOldServer: isOldIp
                });
            }
        }
    }

    matches.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    return {
        wasOurCustomer: matches.length > 0,
        lastSeenDate: matches.length > 0 ? matches[0].lastSeen : null,
        history: matches.slice(0, 5),
        provider: 'securitytrails'
    };
}
