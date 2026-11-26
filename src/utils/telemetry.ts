import { TelemetryEvent } from '../types';

export const TELEMETRY_STORAGE_KEY = 'dualdev_telemetria_local';

const SESSION_ID = 'sess_' + Date.now().toString(36);

export function getSessionId(): string {
  return SESSION_ID;
}

export function classificarFaixaEtaria(idade?: number): string {
  if (idade === undefined || idade === null || isNaN(idade) || idade <= 0) {
    return 'Não informada';
  }
  if (idade < 14) return 'Menor de 14 anos';
  if (idade <= 17) return '14 a 17 anos';
  if (idade <= 24) return '18 a 24 anos';
  if (idade <= 35) return '25 a 35 anos';
  return '36+ anos';
}

export function lerEventosTelemetria(): TelemetryEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function salvarEventosTelemetria(eventos: TelemetryEvent[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(eventos));
    window.dispatchEvent(new CustomEvent('dualdev:telemetry-updated'));
  } catch {}
}

export function registrarEventoTelemetria(tipo: string, dados: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;
  const atual = lerEventosTelemetria();
  const novoEvento: TelemetryEvent = {
    sessao: SESSION_ID,
    tipo,
    timestamp: Date.now(),
    url: window.location.href,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    scrollY: window.scrollY,
    dados,
  };
  atual.push(novoEvento);
  salvarEventosTelemetria(atual);
}

export function limparTelemetriaLocal(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TELEMETRY_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('dualdev:telemetry-updated'));
  } catch {}
}

export function extrairSeoDom() {
  if (typeof document === 'undefined') return {};
  const h1s = document.querySelectorAll('h1');
  const imgs = Array.from(document.querySelectorAll('img'));
  const noAlt = imgs.filter((i) => !(i.getAttribute('alt') || '').trim()).length;
  const txt = (document.body.innerText || '').replace(/\s+/g, ' ').trim();

  return {
    title: document.title,
    metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
    htmlLang: document.documentElement.lang || '',
    hasViewport: !!document.querySelector('meta[name="viewport"]'),
    h1Count: h1s.length,
    h2Count: document.querySelectorAll('h2').length,
    h3Count: document.querySelectorAll('h3').length,
    totalImages: imgs.length,
    imagesWithoutAlt: noAlt,
    hasSchemaJsonLd: !!document.querySelector('script[type="application/ld+json"]'),
    ctaCount: document.querySelectorAll('[data-track], button, a.btn').length,
    wordCount: txt ? txt.split(' ').length : 0,
  };
}

export function gerarPayloadTelemetria() {
  const eventos = lerEventosTelemetria();
  const formularios = eventos.filter((e) => e.tipo === 'form_submit');
  const faixasEtarias: Record<string, number> = {};

  formularios.forEach((f) => {
    const faixa = f.dados?.faixa_etaria || 'Não informada';
    faixasEtarias[faixa] = (faixasEtarias[faixa] || 0) + 1;
  });

  return {
    schema: 'DualDev-Site-Telemetry',
    exportedAt: new Date().toISOString(),
    seoMeta: extrairSeoDom(),
    resumoFaixaEtaria: faixasEtarias,
    eventos,
  };
}
