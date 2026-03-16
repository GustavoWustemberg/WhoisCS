export function normalizeDomain(input: string): string {
    try {
        // If it has a protocol, use URL parser
        if (input.startsWith("http://") || input.startsWith("https://")) {
            const url = new URL(input);
            return url.hostname;
        }

        // Otherwise, strip trailing slashes or paths
        const domainPart = input.split('/')[0];
        return domainPart.trim().toLowerCase();
    } catch (error) {
        // Fallback if URL parsing fails
        const cleaned = input.replace(/^https?:\/\//, '').split('/')[0];
        return cleaned.trim().toLowerCase();
    }
}

export function formatDate(dateString: string | null): string | null {
    if (!dateString) return null;

    try {
        // Trata o formato YYYYMMDD comum em domínios .br
        const trimmed = dateString.trim();
        if (/^\d{8}$/.test(trimmed)) {
            const year = trimmed.substring(0, 4);
            const month = trimmed.substring(4, 6);
            const day = trimmed.substring(6, 8);
            return `${day}-${month}-${year}`;
        }

        const date = new Date(trimmed);
        if (isNaN(date.getTime())) return dateString; // Retorna original se falhar

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    } catch {
        return dateString;
    }
}
