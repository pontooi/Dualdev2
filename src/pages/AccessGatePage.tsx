import React, { useState, useRef } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Eye,
  LockOpen,
  Sparkles,
  Terminal,
  Trophy,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useDualDev } from '../context/DualDevContext';
import { LanguageIcon } from '../components/LanguageIcon';
import { tracks } from '../data/tracks';
import { classificarFaixaEtaria, registrarEventoTelemetria } from '../utils/telemetry';

export const AccessGatePage: React.FC = () => {
  const { grantAccess } = useDualDev();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('Informações Gerais');
  const [persona, setPersona] = useState('estudante');
  const [ageInput, setAgeInput] = useState('');
  const [submittedOk, setSubmittedOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const formStartedRef = useRef(false);

  const parsedAge = ageInput.trim() ? parseInt(ageInput, 10) : undefined;
  const computedAgeGroup = classificarFaixaEtaria(parsedAge);

  const handleFormInput = () => {
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      registrarEventoTelemetria('form_start', { origem: 'access_gate' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Por favor, preencha seu nome e um e-mail válido para acessar.');
      return;
    }

    if (parsedAge !== undefined && (isNaN(parsedAge) || parsedAge < 6 || parsedAge > 110)) {
      setErrorMsg('Se informar a idade, digite um valor válido entre 6 e 110.');
      return;
    }

    const faixaEtaria = classificarFaixaEtaria(parsedAge);

    registrarEventoTelemetria('form_submit', {
      nome_mascarado: trimmedName.split(' ')[0] + ' ***',
      email_mascarado:
        trimmedEmail.indexOf('@') > -1
          ? trimmedEmail.slice(0, 2) + '***@' + trimmedEmail.split('@')[1]
          : '***',
      servico: interest,
      persona_hint: persona,
      idade: parsedAge ?? null,
      faixa_etaria: faixaEtaria,
    });

    setSubmittedOk(true);

    setTimeout(() => {
      grantAccess({
        name: trimmedName,
        email: trimmedEmail,
        interest,
        persona,
        age: parsedAge,
        ageGroup: faixaEtaria,
        registeredAt: new Date().toISOString(),
      });
    }, 650);
  };

  return (
    <div className="min-h-screen bg-[#0b101b] text-slate-100 flex flex-col relative overflow-x-hidden">
      <a
        href="#principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-[#ffbe82] text-slate-950 px-4 py-2 rounded-md font-bold text-xs"
      >
        Pular para o conteúdo
      </a>

      {/* Cabeçalho fixo estilo DualDev */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0e1626]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" data-track="logo" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141f35] border border-[#ffbe82]/30 shadow-xs">
              <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 11L5 16L10 21" stroke="#ffbe82" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 9L14 23" stroke="url(#gate-slash)" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M22 11L27 16L22 21" stroke="#6fb7db" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="gate-slash" x1="18" y1="9" x2="14" y2="23" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffbe82" />
                    <stop offset="1" stopColor="#6fb7db" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">
                Dual<span className="text-[#ffbe82]">Dev</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-[#9FD6F2] px-2 py-0.5 rounded-md bg-[#9FD6F2]/10 border border-[#9FD6F2]/25">
                Academy
              </span>
            </div>
          </a>

          <nav aria-label="Menu principal" className="flex items-center gap-2 sm:gap-4">
            <a
              href="#destaques"
              data-track="nav-destaques"
              className="hidden sm:inline-block text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-800/60 transition-colors"
            >
              Destaques
            </a>
            <a
              href="#conteudo"
              data-track="nav-conteudo"
              className="hidden sm:inline-block text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-800/60 transition-colors"
            >
              Como Funciona
            </a>
            <a
              href="#acesso"
              data-track="cta-topo"
              className="aero-btn-primary px-4 py-1.5 text-xs shadow-xs"
            >
              Acessar Site
            </a>
          </nav>
        </div>
      </header>

      <main id="principal" className="flex-1 relative z-10">
        {/* HERO — Apresentação de Alto Impacto (1 único H1) */}
        <section data-section="hero" className="py-12 sm:py-16 border-b border-slate-800/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffbe82]/10 border border-[#ffbe82]/30 text-[#ffbe82] text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Plataforma 100% Gratuita no Navegador</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                Aprenda Programação na Prática Sem Instalar{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbe82] to-[#6fb7db]">
                  Absolutamente Nada.
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                Domine <strong>Java, Python, JavaScript, HTML5 e CSS3</strong> com 100 desafios guiados,
                editor inteligente com auto-tab, terminal em tempo real e visualização web ao vivo — direto no seu PC ou celular.
              </p>

              {/* Chips das 5 linguagens */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {tracks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131d2e] border border-slate-700/80 text-xs text-slate-200 font-medium"
                  >
                    <LanguageIcon trackId={t.id} className="w-3.5 h-3.5" />
                    <span>{t.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#acesso"
                  data-track="cta-hero"
                  className="aero-btn-primary px-6 py-3 text-sm shadow-md"
                >
                  <LockOpen className="h-4 w-4 mr-2" />
                  <span>Liberar Acesso ao Início</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </a>
                <a
                  href="#conteudo"
                  data-track="cta-saiba-mais"
                  className="aero-btn-glass px-5 py-3 text-sm"
                >
                  <span>Como Funciona</span>
                </a>
              </div>
            </div>

            {/* Card de Diferenciais à direita */}
            <aside className="lg:col-span-5 aero-card p-6 sm:p-7 bg-[#0f172a] border border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#ffbe82]" />
                  <span>Por que estudar no DualDev?</span>
                </h2>
                <span className="text-[11px] font-mono text-[#86efac] bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded">
                  100 Aulas
                </span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#86efac] shrink-0 mt-0.5" />
                  <span><strong>Execução imediata:</strong> escreva o código e rode em frações de segundo sem servidores externos.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#86efac] shrink-0 mt-0.5" />
                  <span><strong>Site ao vivo em HTML & CSS:</strong> visualize o layout funcionando em tela Desktop e Mobile em tempo real.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#86efac] shrink-0 mt-0.5" />
                  <span><strong>Verificador automático:</strong> saiba exatamente o que faltou no exercício com dicas claras em português.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#86efac] shrink-0 mt-0.5" />
                  <span><strong>Gamificação real:</strong> acumule XP, suba de nível e desbloqueie conquistas ao evoluir.</span>
                </li>
              </ul>
            </aside>
          </div>
        </section>

        {/* DESTAQUES — 3 Pilares */}
        <section id="destaques" data-section="destaques" className="py-12 bg-[#0e1524]/70 border-b border-slate-800/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white tracking-tight">O que você encontra lá dentro</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Tudo pensado para quem quer sair do zero ou treinar para provas e projetos reais.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <article className="aero-card p-5 bg-[#0f172a] space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#ffbe82]/15 text-[#ffbe82] flex items-center justify-center">
                  <Code2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">5 Trilhas, 100 Exercícios</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  20 aulas práticas por linguagem com teoria curta, código de exemplo, editor com auto-tab e correção automática.
                </p>
              </article>

              <article className="aero-card p-5 bg-[#0f172a] space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#6fb7db]/15 text-[#6fb7db] flex items-center justify-center">
                  <Eye className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Playground + Web Preview</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Laboratório livre para testar qualquer ideia em Python, Java, JS, HTML e CSS com prévia visual instantânea.
                </p>
              </article>

              <article className="aero-card p-5 bg-[#0f172a] space-y-2.5">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/15 text-[#86efac] flex items-center justify-center">
                  <Trophy className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">XP, Níveis & Conquistas</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Acompanhe seu avanço em cada tecnologia, complete missões diárias e desbloqueie insígnias enquanto estuda.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* CONTEÚDO INFORMATIVO — Guia rápido (SEO & Clareza) */}
        <section id="conteudo" data-section="conteudo" className="py-12 border-b border-slate-800/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
            <article className="space-y-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">Como funciona na prática?</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                O DualDev foi criado para eliminar a barreira técnica do primeiro dia de programação. Ao invés de gastar horas instalando pacotes pesados, você abre a página e começa a programar imediatamente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1.5">
                  <h3 className="text-sm font-bold text-[#9FD6F2]">1. Para quem o DualDev é feito?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ideal para estudantes (14 a 35 anos), iniciantes no ensino médio, técnico ou faculdade e professores que querem praticar sem complicação.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1.5">
                  <h3 className="text-sm font-bold text-[#ffbe82]">2. Como acessar o Início agora?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Preencha suas credenciais básicas abaixo para salvar seus dados na Telemetria Local e liberar sua entrada direta no painel inicial.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* FORMULÁRIO DE CREDENCIAIS PARA ACESSAR O SITE */}
        <section id="acesso" data-section="contato" className="py-14 bg-[#0e1524]/80">
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            <div className="aero-card p-6 sm:p-8 bg-[#0f172a] border border-[#6fb7db]/30 shadow-2xl space-y-5">
              <div className="space-y-1.5 text-center">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffbe82] to-[#6fb7db] text-slate-950 mx-auto mb-1">
                  <UserCheck className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-white">Credenciais de Acesso</h2>
                <p className="text-xs text-slate-400">
                  Preencha os campos abaixo para registrar sua entrada na Telemetria Local e acessar o Início.
                </p>
              </div>

              <form onSubmit={handleSubmit} onInput={handleFormInput} className="space-y-3.5">
                <div>
                  <label htmlFor="nome" className="block text-xs font-semibold text-slate-200 mb-1">
                    Nome *
                  </label>
                  <input
                    id="nome"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo ou apelido"
                    className="w-full rounded-lg bg-[#09101a] border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6fb7db] focus:ring-1 focus:ring-[#6fb7db]"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-200 mb-1">
                    E-mail *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="w-full rounded-lg bg-[#09101a] border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6fb7db] focus:ring-1 focus:ring-[#6fb7db]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="interesse" className="block text-xs font-semibold text-slate-200 mb-1">
                      Trilha de Interesse
                    </label>
                    <select
                      id="interesse"
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      className="w-full rounded-lg bg-[#09101a] border border-slate-700 px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#6fb7db]"
                    >
                      <option value="Informações Gerais">Explorar Todas as Trilhas</option>
                      <option value="Python">Python (Lógica e Scripts)</option>
                      <option value="Java">Java (Estrutura e POO)</option>
                      <option value="JavaScript">JavaScript (Web Moderna)</option>
                      <option value="HTML5">HTML5 (Estrutura Web)</option>
                      <option value="CSS3">CSS3 (Design & Layouts)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="persona" className="block text-xs font-semibold text-slate-200 mb-1">
                      Perfil
                    </label>
                    <select
                      id="persona"
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                      className="w-full rounded-lg bg-[#09101a] border border-slate-700 px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#6fb7db]"
                    >
                      <option value="estudante">Estudante (Médio / Técnico)</option>
                      <option value="universitario">Universitário(a)</option>
                      <option value="iniciante">Iniciante / Autodidata</option>
                      <option value="professor">Professor(a) / Monitor(a)</option>
                      <option value="transicao">Transição de Carreira</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="idade" className="block text-xs font-semibold text-slate-200">
                      Idade <span className="text-slate-400 font-normal">(opcional — para faixa etária)</span>
                    </label>
                    {parsedAge !== undefined && !isNaN(parsedAge) && parsedAge > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6fb7db]/15 text-[#9FD6F2] border border-[#6fb7db]/30">
                        Faixa: {computedAgeGroup}
                      </span>
                    )}
                  </div>
                  <input
                    id="idade"
                    type="number"
                    min={6}
                    max={110}
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                    placeholder="Ex: 18 (opcional)"
                    className="w-full rounded-lg bg-[#09101a] border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ffbe82] focus:ring-1 focus:ring-[#ffbe82]"
                  />
                </div>

                {errorMsg && (
                  <div className="rounded-lg bg-rose-950/40 border border-rose-700/60 px-3 py-2 text-xs text-rose-300 font-medium">
                    {errorMsg}
                  </div>
                )}

                {submittedOk && (
                  <div
                    role="status"
                    className="rounded-lg bg-emerald-950/50 border border-emerald-700 px-3 py-2.5 text-xs text-[#86efac] font-semibold text-center flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Credenciais salvas na Telemetria Local! Acessando o Início...</span>
                  </div>
                )}

                <button
                  type="submit"
                  data-track="form-submit"
                  disabled={submittedOk}
                  className="aero-btn-primary w-full py-3 text-sm shadow-md disabled:opacity-70"
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  <span>{submittedOk ? 'Entrando no Início...' : 'Salvar e Acessar o Início →'}</span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-[#070c14] py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4">
          © 2026 DualDev Academy — Academia Interativa de Programação no Navegador
        </div>
      </footer>
    </div>
  );
};
