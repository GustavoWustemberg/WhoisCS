// @ts-ignore
import whois from 'whois-json';

export interface WhoisResult {
    expiryDate: string | null;
    technicalContact: {
        techId: string | null;
        email: string | null;
    } | null;
}

export async function checkWhois(domain: string): Promise<WhoisResult> {
    const timeoutMs = 10000;

    try {
        const dataResponse = Promise.race([
            whois(domain),
            new Promise<any>((_, reject) =>
                setTimeout(() => reject(new Error('Whois Timeout')), timeoutMs)
            )
        ]);

        const data = await dataResponse;

        if (!data) return { expiryDate: null, technicalContact: null };

        // Different TLDs have different field names for expiration date
        const expiryDate = data.expiryDate || data.expires || data.paidUntil || data.registryExpiryDate || data.registrarRegistrationExpirationDate || null;

        return {
            expiryDate,
            technicalContact: {
                techId: data.techC || null,
                email: data.eMail || null
            }
        };
    } catch (err) {
        console.error(`Whois Error for ${domain}:`, err);
        return { expiryDate: null, technicalContact: null };
    }
}
