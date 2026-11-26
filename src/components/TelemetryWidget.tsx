import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Download, Upload, Eye, Trash2, X, Users } from 'lucide-react';
import {
  lerEventosTelemetria,
  salvarEventosTelemetria,
  registrarEventoTelemetria,
  limparTelemetriaLocal,
  gerarPayloadTelemetria,
  getSessionId,
} from '../utils/telemetry';

export const TelemetryWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [eventosCount, setEventosCount] = useState(0);
  const [scrollMax, setScrollMax] = useState(0);
  const [formsCount, setFormsCount] = useState(0);
  const [ageBreakdown, setAgeBreakdown] = useState<Record<string, number>>({});
  const [jsonPreview, setJsonPreview] = useState('');
  const [showJson, setShowJson] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollMaxRef = useRef(0);
  const inicioRef = useRef(Date.now());
  const activeSectionRef = useRef<{ name: string | null; start: number | null }>({
    name: null,
    start: null,
  });

  const refreshStats = () => {
    const arr = lerEventosTelemetria();
    setEventosCount(arr.length);
    const submits = arr.filter((e) => e.tipo === 'form_submit');
    setFormsCount(submits.length);

    const ages: Record<string, number> = {};
    submits.forEach((s) => {
      const faixa = s.dados?.faixa_etaria || 'Não informada';
      ages[faixa] = (ages[faixa] || 0) + 1;
    });
    setAgeBreakdown(ages);
  };

  useEffect(() => {
    refreshStats();
    registrarEventoTelemetria('page_view', { titulo: document.title });

    const onUpdated = () => refreshStats();
    window.addEventListener('dualdev:telemetry-updated', onUpdated);

    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.round((window.scrollY / h) * 100) : 0;
      if (p > scrollMaxRef.current) {
        scrollMaxRef.current = p;
        setScrollMax(p);
        if (p > 0 && p % 25 === 0) {
          registrarEventoTelemetria('scroll', { profundidade: p });
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest('#dbgBox') || target.closest('#dbgFab')) return;
      const cta = target.closest('[data-track]');
      if (cta) {
        registrarEventoTelemetria('cta_click', {
          track: cta.getAttribute('data-track'),
          texto: (cta.textContent || '').trim().slice(0, 40),
          x: e.clientX,
          y: e.clientY,
        });
      }
      registrarEventoTelemetria('click', {
        x: e.clientX,
        y: e.clientY,
        scrollY: window.scrollY,
      });
    };
    document.addEventListener('click', onClick);

    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            const secName = en.target.getAttribute('data-section');
            if (!secName) return;
            if (en.isIntersecting) {
              if (activeSectionRef.current.name && activeSectionRef.current.start) {
                registrarEventoTelemetria('time_on_section', {
                  secao: activeSectionRef.current.name,
                  duracao_s: Math.round((Date.now() - activeSectionRef.current.start) / 1000),
                });
              }
              activeSectionRef.current = { name: secName, start: Date.now() };
            } else if (activeSectionRef.current.name === secName && activeSectionRef.current.start) {
              registrarEventoTelemetria('time_on_section', {
                secao: secName,
                duracao_s: Math.round((Date.now() - activeSectionRef.current.start) / 1000),
              });
              activeSectionRef.current = { name: null, start: null };
            }
          });
        },
        { threshold: 0.4 }
      );

      document.querySelectorAll('[data-section]').forEach((el) => observer?.observe(el));
    }

    const onBeforeUnload = () => {
      registrarEventoTelemetria('exit', {
        duracao_total_s: Math.round((Date.now() - inicioRef.current) / 1000),
        scroll_max: scrollMaxRef.current,
      });
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('dualdev:telemetry-updated', onUpdated);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
      window.removeEventListener('beforeunload', onBeforeUnload);
      observer?.disconnect();
    };
  }, []);

  const showTemporaryStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleVerJson = () => {
    const payload = gerarPayloadTelemetria();
    setJsonPreview(JSON.stringify(payload, null, 2));
    setShowJson(true);
  };

  const handleExportJson = () => {
    const payload = gerarPayloadTelemetria();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetria-dualdev-${getSessionId()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showTemporaryStatus('JSON exportado com sucesso!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.eventos)
            ? parsed.eventos
            : null;
        if (!incoming) {
          showTemporaryStatus('Arquivo JSON inválido.');
          return;
        }
        const atual = lerEventosTelemetria();
        salvarEventosTelemetria(atual.concat(incoming));
        refreshStats();
        showTemporaryStatus(`${incoming.length} evento(s) importado(s)!`);
      } catch {
        showTemporaryStatus('Erro ao ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    limparTelemetriaLocal();
    setJsonPreview('');
    setShowJson(false);
    setConfirmClear(false);
    refreshStats();
    showTemporaryStatus('Telemetria local limpa.');
  };

  return (
    <>
      <button
        id="dbgFab"
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          refreshStats();
        }}
        aria-label="Abrir Telemetria Local e JSON"
        title="Telemetria Local & JSON"
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ffbe82] to-[#6fb7db] text-slate-950 shadow-lg hover:scale-105 transition-transform cursor-pointer border border-white/20"
      >
        {isOpen ? <X className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div
          id="dbgBox"
          role="dialog"
          aria-label="Telemetria Local"
          className="fixed bottom-20 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-[#6fb7db]/40 bg-[#0e1626]/95 backdrop-blur-md p-4 text-xs text-slate-200 shadow-2xl space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <BarChart3 className="h-4 w-4 text-[#ffbe82]" />
              <span>Telemetria Local (localStorage)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between py-1 border-b border-dashed border-slate-800">
              <span className="text-slate-400">Eventos salvos</span>
              <strong className="font-mono text-[#9FD6F2]">{eventosCount}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-800">
              <span className="text-slate-400">Scroll máx.</span>
              <strong className="font-mono text-[#ffbe82]">{scrollMax}%</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-800">
              <span className="text-slate-400">Credenciais / Formulários</span>
              <strong className="font-mono text-[#86efac]">{formsCount}</strong>
            </div>

            {Object.keys(ageBreakdown).length > 0 && (
              <div className="pt-1">
                <div className="flex items-center gap-1 text-slate-300 font-semibold mb-1">
                  <Users className="h-3 w-3 text-[#6fb7db]" />
                  <span>Faixas Etárias Registradas:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(ageBreakdown).map(([faixa, qtd]) => (
                    <span
                      key={faixa}
                      className="px-2 py-0.5 rounded bg-[#141f30] border border-slate-700 text-[10px] font-mono text-slate-200"
                    >
                      {faixa}: <strong className="text-[#ffbe82]">{qtd}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {statusMsg && (
            <div className="rounded-md bg-emerald-950/50 border border-emerald-700/60 px-2.5 py-1.5 text-[11px] text-[#86efac] font-medium">
              {statusMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-[#ffbe82] to-[#6fb7db] text-slate-950 font-bold py-1.5 px-2 text-[11px] hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>Exportar JSON</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 rounded-md bg-[#141f30] border border-slate-700 text-slate-200 font-semibold py-1.5 px-2 text-[11px] hover:border-[#6fb7db] transition-colors cursor-pointer"
            >
              <Upload className="h-3 w-3 text-[#6fb7db]" />
              <span>Importar JSON</span>
            </button>
            <button
              type="button"
              onClick={handleVerJson}
              className="flex items-center justify-center gap-1.5 rounded-md bg-[#141f30] border border-slate-700 text-slate-200 font-semibold py-1.5 px-2 text-[11px] hover:border-[#ffbe82] transition-colors cursor-pointer"
            >
              <Eye className="h-3 w-3 text-[#ffbe82]" />
              <span>Ver JSON</span>
            </button>
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="flex items-center justify-center gap-1.5 rounded-md bg-[#141f30] border border-slate-700 text-rose-300 font-semibold py-1.5 px-2 text-[11px] hover:border-rose-500/60 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>Limpar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center gap-1 rounded-md bg-rose-500/20 border border-rose-500 text-rose-200 font-bold py-1.5 px-2 text-[11px] cursor-pointer"
              >
                <span>Confirmar?</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />

          {showJson && (
            <textarea
              readOnly
              value={jsonPreview}
              placeholder="Clique em Ver JSON..."
              className="w-full h-28 rounded-md bg-[#060a12] border border-slate-800 p-2 font-mono text-[10px] text-[#9FD6F2] focus:outline-none resize-none"
            />
          )}
        </div>
      )}
    </>
  );
};
