'use client';

import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, ShieldCheck, Globe, AlertTriangle } from 'lucide-react';

export default function DNSAnalyzer() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3333/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        let errorDetail = 'Falha na requisição';
        try {
          const errJson = await response.json();
          errorDetail = errJson.message || errJson.error || errorDetail;
        } catch (e) {
          errorDetail = await response.text();
        }
        throw new Error(`Erro da API (${response.status}): ${errorDetail}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      // Se for um erro de fetch (ex: CORS ou API fora do ar), a mensagem costuma ser "Failed to fetch"
      if (err.message === 'Failed to fetch') {
        setError("Erro de conexão (CORS ou API offline). Verifique se a API está rodando em http://localhost:3333.");
      } else {
        setError(err.message || "Erro ao consultar o domínio.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight drop-shadow-sm">
            Analisador de Domínios
          </h1>
        </header>

        {/* Barra de Busca */}
        <form onSubmit={handleAnalyze} className="relative mb-10 max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Digite o domínio (ex: google.com)"
            className="w-full p-4 pl-14 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg focus:ring-4 focus:ring-blue-500/30 outline-none text-lg transition-all"
            value={domain}
            onChange={(e) => setDomain(e.target.value.toLowerCase())}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={24} />
          <button
            type="submit"
            disabled={loading || !domain.trim()}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-6 rounded-xl font-medium hover:bg-blue-700 transition-all disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? 'Analisando...' : 'Analisar'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="flex bg-red-50 dark:bg-red-900/30 p-4 rounded-xl border-l-4 border-red-500 text-red-700 dark:text-red-400 mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4">
            <XCircle className="mr-3 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md mb-2"></div>
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">

            {/* Card: Status de Apontamento */}
            <StatusCard
              title="Apontamento DNS"
              status={result.isOurServer ? 'success' : 'error'}
              icon={<Globe size={24} />}
              description={result.isOurServer ? "Apontado corretamente para nossos servidores" : "Apontado para um servidor externo"}
            >
              <div className="mt-4 text-sm space-y-2 text-gray-700 dark:text-gray-300">
                <p><strong className="text-gray-900 dark:text-gray-100">IP Principal (A):</strong> {result.ipA}</p>
                <p><strong className="text-gray-900 dark:text-gray-100">IP WWW:</strong> {result.ipWWW}</p>
                <p><strong className="text-gray-900 dark:text-gray-100">IPv6 Principal:</strong> {result.hasIpv6Main ? <span className="text-orange-600 dark:text-orange-400 font-semibold">Detectado</span> : 'Não detectado'}</p>
                <p><strong className="text-gray-900 dark:text-gray-100">IPv6 WWW:</strong> {result.hasIpv6WWW ? <span className="text-orange-600 dark:text-orange-400 font-semibold">Detectado</span> : 'Não detectado'}</p>
                
                {result.ns && result.ns.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Servidores de Nome (NS):</p>
                    <ul className="list-disc list-inside space-y-1 text-sm opacity-80 mb-3">
                      {result.ns.map((ns: string, idx: number) => (
                        <li key={idx}>{ns}</li>
                      ))}
                    </ul>

                    {/* Cloudflare Access Status */}
                    {(() => {
                      const ourCloudflareNS = [
                        'craig.ns.cloudflare.com',
                        'jacqueline.ns.cloudflare.com',
                        'matias.ns.cloudflare.com',
                        'annalise.ns.cloudflare.com'
                      ];
                      const hasAccess = result.ns.some((ns: string) => 
                        ourCloudflareNS.includes(ns.toLowerCase())
                      );
                      
                      return (
                        <div className={`mt-2 p-2 rounded-lg border text-xs font-bold flex items-center gap-2 ${
                          hasAccess 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-700 dark:text-rose-400'
                        }`}>
                          {hasAccess ? (
                            <>
                              <CheckCircle size={16} />
                              <span>Temos acesso</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={16} />
                              <span>Sem acesso</span>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {result.ipA && result.ipWWW && result.ipA !== result.ipWWW && (
                <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-3 rounded-r flex items-start text-orange-800 dark:text-orange-400 text-sm">
                  <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                  <p>Atenção: Os IPs principal e WWW divergem. O site pode apresentar instabilidade dependendo de qual domínio o usuário acessar.</p>
                </div>
              )}

              {result.migrationMessage && (
                <div className="mt-4 bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500 p-3 rounded-r flex items-start text-red-800 dark:text-red-300 text-sm font-bold">
                  <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                  <p>{result.migrationMessage}</p>
                </div>
              )}

              {result.isOldServer && (
                <div className="mt-4 bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500 p-3 rounded-r flex items-start text-red-800 dark:text-red-300 text-sm font-bold">
                  <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                  <p>O domínio ainda está apontado para o IP antigo. É necessário realizar a migração para o novo servidor para restabelecer o serviço.</p>
                </div>
              )}

              {result.hasIpv6Main || result.hasIpv6WWW ? (
                <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-3 rounded-r flex items-start text-orange-800 dark:text-orange-400 text-sm">
                  <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                  <p>Atenção: Apontamento IPv6 (AAAA) detectado. Nossos servidores não suportam IPv6, o que pode impedir a ativação do certificado de segurança (SSL). Recomenda-se remover os apontamentos AAAA.</p>
                </div>
              ) : null}

              {result.dnsHistory?.wasOurCustomer && (
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r flex flex-col gap-2 text-blue-800 dark:text-blue-300 text-sm">
                  <div className="flex items-start">
                    <Clock size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                    <p className="font-bold">Histórico identificado:</p>
                  </div>
                  <p>Este domínio já esteve apontado para nossos servidores no passado.</p>
                  <p className="text-xs opacity-80 italic">Última data vista em nossos IPs: <strong className="not-italic text-sm">{safeFormatDate(result.dnsHistory.lastSeenDate)}</strong></p>
                </div>
              )}
            </StatusCard>

            {/* Card: Contato Técnico (Only if Registro.br NS) */}
            {result.isRegistroBrNS && result.technicalContact && (
              <StatusCard
                title="Contato Técnico"
                status="info"
                icon={<ShieldCheck size={24} />}
                description="Informação extraída para domínios Registro.br"
              >
                <div className="mt-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Contato (ID):</p>
                    <p className="text-lg text-gray-800 dark:text-white">
                      {result.technicalContact.techId || 'Não informado'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">E-mail:</p>
                    <p className="text-lg text-gray-800 dark:text-white break-all">
                      {result.technicalContact.email || 'Não informado'}
                    </p>
                  </div>

                  {/* Access Status Indicator */}
                  <div className={`mt-4 p-3 rounded-xl border flex items-center gap-2 font-bold ${
                    result.technicalContact.techId === 'ROCMA135' 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-700 dark:text-rose-400'
                  }`}>
                    {result.technicalContact.techId === 'ROCMA135' ? (
                      <>
                        <CheckCircle size={20} />
                        <span>Temos acesso</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={20} />
                        <span>Sem acesso</span>
                      </>
                    )}
                  </div>
                </div>
              </StatusCard>
            )}

            {/* Card: SSL */}
            <StatusCard
              title="Certificado SSL"
              status={result.sslStatus === 'Ativo' ? 'success' : 'error'}
              icon={<ShieldCheck size={24} />}
              description={`Status: ${result.sslStatus}`}
            >
              <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                Expira em: <strong className="text-gray-900 dark:text-gray-100">{safeFormatDate(result.sslExpiry)}</strong>
              </p>
              {result.sslIssuer && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Emissor: {result.sslIssuer}
                </p>
              )}
            </StatusCard>

            {/* Card: Expiração do Domínio */}
            {result.domainExpiry && (
              <StatusCard
                title="Expiração do Domínio"
                status="info"
                icon={<Clock size={24} />}
                description="Data registrada no WHOIS"
              >
                <p className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">
                  {safeFormatDate(result.domainExpiry)}
                </p>
                {isDateExpired(result.domainExpiry) && (
                  <div className="mt-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded-r flex items-start text-red-800 dark:text-red-400 text-sm">
                    <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                    <p>Atenção: O domínio <strong className="font-bold">{result.domain}</strong> atingiu a data de expiração. Para reativá-lo, é necessário acessar sua plataforma de gestão e efetuar o pagamento da renovação.</p>
                  </div>
                )}
              </StatusCard>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// Helper para formatar diversos formatos de data para data local
function safeFormatDate(dateStr: string) {
  if (!dateStr) return 'N/A';
  
  // Trata formato YYYYMMDD (WHOIS legado)
  if (/^\d{8}$/.test(dateStr)) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return new Date(`${year}-${month}-${day}T12:00:00Z`).toLocaleDateString('pt-BR');
  }

  // Trata formato DD-MM-YYYY (padrão atual da API)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    return new Date(`${year}-${month}-${day}T12:00:00Z`).toLocaleDateString('pt-BR');
  }

  // Fallback para ISO ou outros formatos reconhecidos pelo navegador
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('pt-BR');
}

// Helper para verificar se uma data já passou
function isDateExpired(dateStr: string) {
  if (!dateStr) return false;
  let expiryDate: Date;

  if (/^\d{8}$/.test(dateStr)) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    expiryDate = new Date(year, month, day, 23, 59, 59);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-').map(Number);
    expiryDate = new Date(year, month - 1, day, 23, 59, 59);
  } else {
    expiryDate = new Date(dateStr);
  }

  return !isNaN(expiryDate.getTime()) && expiryDate < new Date();
}

// Subcomponente de Card para organização
function StatusCard({ title, status, icon, description, children }: any) {
  const statusColors: any = {
    success: 'border-l-emerald-500 text-emerald-700 dark:text-emerald-400',
    error: 'border-l-rose-500 text-rose-700 dark:text-rose-400',
    info: 'border-l-sky-500 text-sky-700 dark:text-sky-400',
  };

  const statusBgColors: any = {
    success: 'bg-white dark:bg-gray-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10',
    error: 'bg-white dark:bg-gray-800 hover:bg-rose-50/50 dark:hover:bg-rose-900/10',
    info: 'bg-white dark:bg-gray-800 hover:bg-sky-50/50 dark:hover:bg-sky-900/10',
  };

  return (
    <div className={`${statusBgColors[status]} p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border-l-4 ${statusColors[status]}`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {status === 'success' && <CheckCircle size={20} className="ml-auto text-emerald-500 drop-shadow-sm" />}
        {status === 'error' && <XCircle size={20} className="ml-auto text-rose-500 drop-shadow-sm" />}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{description}</p>
      {children}
    </div>
  );
}
