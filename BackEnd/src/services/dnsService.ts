import dns from 'dns';

export interface DNSResult {
    ipMain: string;
    ipWWW: string;
    hasIpv6Main: boolean;
    hasIpv6WWW: boolean;
}

export async function checkDNS(domain: string): Promise<DNSResult> {
    const timeoutMs = 5000;

    const resolveA = (target: string): Promise<string> => {
        return Promise.race([
            dns.promises.resolve4(target).then(ips => ips[0]),
            new Promise<string>((_, reject) =>
                setTimeout(() => reject(new Error('DNS Timeout')), timeoutMs)
            )
        ]);
    };

    const resolveAAAA = (target: string): Promise<boolean> => {
        return Promise.race([
            dns.promises.resolve6(target).then(ips => ips.length > 0),
            new Promise<boolean>((_, reject) =>
                setTimeout(() => reject(new Error('DNS Timeout')), timeoutMs)
            )
        ]);
    };

    try {
        const [ipMain, ipWWW, ipv6Main, ipv6WWW] = await Promise.allSettled([
            resolveA(domain),
            resolveA(`www.${domain}`),
            resolveAAAA(domain),
            resolveAAAA(`www.${domain}`)
        ]);

        return {
            ipMain: ipMain.status === 'fulfilled' ? ipMain.value : 'Não encontrado',
            ipWWW: ipWWW.status === 'fulfilled' ? ipWWW.value : 'Não encontrado',
            hasIpv6Main: ipv6Main.status === 'fulfilled' ? ipv6Main.value : false,
            hasIpv6WWW: ipv6WWW.status === 'fulfilled' ? ipv6WWW.value : false
        };
    } catch (err) {
        return {
            ipMain: 'Não encontrado',
            ipWWW: 'Não encontrado',
            hasIpv6Main: false,
            hasIpv6WWW: false
        };
    }
}
