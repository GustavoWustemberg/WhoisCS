declare module 'whois-json' {
    function whois(domain: string, options?: any): Promise<any>;
    export = whois;
}
