// @ts-ignore
import whois from 'whois-json';

export async function checkWhois(domain: string): Promise<string | null> {
    const timeoutMs = 10000;

    try {
        const dataResponse = Promise.race([
            whois(domain),
            new Promise<any>((_, reject) =>
                setTimeout(() => reject(new Error('Whois Timeout')), timeoutMs)
            )
        ]);

        const data = await dataResponse;

        if (!data) return null;

        // Different TLDs have different field names for expiration date
        return data.expiryDate || data.expires || data.paidUntil || data.registryExpiryDate || data.registrarRegistrationExpirationDate || null;
    } catch (err) {
        console.error(`Whois Error for ${domain}:`, err);
        return null;
    }
}
