import tls from 'tls';

export interface SSLResult {
    valid: boolean;
    expiry: string | null;
    issuer: string | null;
}

export async function checkSSL(domain: string): Promise<SSLResult> {
    const timeoutMs = 5000;

    return new Promise((resolve) => {
        let handled = false;

        const timeoutId = setTimeout(() => {
            if (!handled) {
                handled = true;
                resolve({ valid: false, expiry: null, issuer: null });
            }
        }, timeoutMs);

        try {
            const options = { servername: domain, rejectUnauthorized: false };
            const socket = tls.connect(443, domain, options, () => {
                if (handled) {
                    socket.end();
                    return;
                }
                handled = true;
                clearTimeout(timeoutId);

                const cert = socket.getPeerCertificate();
                socket.end();

                const issuerCN = cert.issuer?.CN;
                const validTo = cert.valid_to;
                
                let isExpired = false;
                if (validTo) {
                    const expiryDate = new Date(validTo);
                    isExpired = expiryDate < new Date();
                }

                const authError = (socket as any).authorizationError;
                const isValid = socket.authorized && !isExpired && !authError;

                resolve({
                    valid: isValid,
                    expiry: validTo || null,
                    issuer: Array.isArray(issuerCN) ? issuerCN[0] : (issuerCN || null)
                });
            });

            socket.on('error', () => {
                if (!handled) {
                    handled = true;
                    clearTimeout(timeoutId);
                    resolve({ valid: false, expiry: null, issuer: null });
                }
            });
        } catch (err) {
            if (!handled) {
                handled = true;
                clearTimeout(timeoutId);
                resolve({ valid: false, expiry: null, issuer: null });
            }
        }
    });
}
