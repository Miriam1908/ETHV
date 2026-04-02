import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, ArrowLeft, ChevronRight, Loader2, Brain,
  CheckCircle2, XCircle, Sparkles, AlertCircle,
  RotateCcw, Award, Code2, MessageSquare, List
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Question {
  type: 'multiple_choice' | 'code_trace' | 'open';
  question: string;
  code?: string | null;
  options?: string[] | null;
}

interface QuestionResult {
  type: string;
  question: string;
  code?: string | null;
  options?: string[];
  yourAnswer: number | string;
  correct?: number;
  isCorrect: boolean;
  openScore?: number;
  feedback?: string;
  explanation: string;
}

type Step = 'select' | 'loading' | 'test' | 'submitting' | 'result';

const DEFAULT_SKILLS = ['Solidity', 'React', 'TypeScript', 'Python', 'Node.js', 'Rust', 'Web3.js', 'GraphQL'];
const LEVEL_OPTIONS = [
  { value: 'junior', label: 'Junior', desc: { en: 'Fundamentals', es: 'Fundamentos' } },
  { value: 'mid',    label: 'Mid',    desc: { en: 'Practical',    es: 'Práctico' } },
  { value: 'senior', label: 'Senior', desc: { en: 'Advanced',     es: 'Avanzado' } },
];

const LANG_OPTIONS = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
];

const T = {
  en: {
    title: 'Skill Validation',
    subtitle_cv: 'Skills from your CV. Choose one to validate with AI-generated questions.',
    subtitle_default: 'Choose a skill, level and language — AI will generate a personalized quiz.',
    selectSkill: 'Select skill',
    selectLevel: 'Select level',
    selectLang: 'Language',
    generateBtn: 'Generate AI Quiz',
    generating: 'Generating your quiz',
    generatingDesc: (s: string, l: string) => `MiniMax AI is crafting ${l} questions for`,
    question: 'Question',
    of: 'of',
    next: 'Next question',
    seeResults: 'See results',
    submitting: 'Evaluating answers...',
    yourAnswer: 'Your answer',
    openPlaceholder: 'Write your answer here...',
    openHint: 'Open question — your answer will be evaluated by AI',
    codeHint: 'Read the code carefully and select the correct output',
    passed: 'Passed — eligible for on-chain certification',
    failed: 'You need 70% to pass. Review and try again.',
    correct: 'correct',
    review: 'Review',
    yourAnswerLabel: 'Your answer:',
    correctLabel: 'Correct:',
    tryAnother: 'Try another',
    claimBadge: 'Claim Badge',
    exit: 'Exit',
  },
  es: {
    title: 'Validación de Habilidades',
    subtitle_cv: 'Skills de tu CV. Elige uno para validar con preguntas generadas por IA.',
    subtitle_default: 'Elige habilidad, nivel e idioma — la IA generará un quiz personalizado.',
    selectSkill: 'Selecciona habilidad',
    selectLevel: 'Nivel',
    selectLang: 'Idioma',
    generateBtn: 'Generar Quiz con IA',
    generating: 'Generando tu quiz',
    generatingDesc: (s: string, l: string) => `MiniMax AI está creando preguntas ${l} para`,
    question: 'Pregunta',
    of: 'de',
    next: 'Siguiente pregunta',
    seeResults: 'Ver resultados',
    submitting: 'Evaluando respuestas...',
    yourAnswer: 'Tu respuesta',
    openPlaceholder: 'Escribe tu respuesta aquí...',
    openHint: 'Pregunta abierta — tu respuesta será evaluada por IA',
    codeHint: 'Lee el código con atención y selecciona la salida correcta',
    passed: 'Aprobado — elegible para certificación on-chain',
    failed: 'Necesitas 70% para aprobar. Revisa y vuelve a intentarlo.',
    correct: 'correctas',
    review: 'Revisión',
    yourAnswerLabel: 'Tu respuesta:',
    correctLabel: 'Correcta:',
    tryAnother: 'Intentar otra',
    claimBadge: 'Reclamar Badge',
    exit: 'Salir',
  }
};

// ── Component ────────────────────────────────────────────────────────────────

export default function Validation() {
  const [step, setStep] = useState<Step>('select');
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('mid');
  const [quizId, setQuizId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mcChosen, setMcChosen] = useState<number | null>(null);
  const [openText, setOpenText] = useState('');
  const [allAnswers, setAllAnswers] = useState<(number | string)[]>([]);
  const [quizResults, setQuizResults] = useState<QuestionResult[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [error, setError] = useState('');
  const [cvSkills, setCvSkills] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const t = T[lang];

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ethv_cv_skills');
      if (stored) setCvSkills(JSON.parse(stored));
    } catch {}
  }, []);

  const skillList = cvSkills.length > 0 ? cvSkills.slice(0, 12) : DEFAULT_SKILLS;
  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? (currentIdx / questions.length) * 100 : 0;

  const startQuiz = async () => {
    if (!selectedSkill) return;
    setStep('loading');
    setError('');
    setAllAnswers([]);
    setCurrentIdx(0);
    setMcChosen(null);
    setOpenText('');
    setQuizResults([]);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${apiBase}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: selectedSkill, level: selectedLevel, lang }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (!data.questions?.length) throw new Error('No questions received');
      setQuizId(data.quizId);
      setQuestions(data.questions);
      setStep('test');
    } catch (e: any) {
      setError(e.message || 'Failed to generate quiz');
      setStep('select');
    }
  };

  const canProceed = () => {
    if (!currentQ) return false;
    if (currentQ.type === 'open') return openText.trim().length > 10;
    return mcChosen !== null;
  };

  const handleNext = async () => {
    if (!canProceed()) return;
    const answer = currentQ.type === 'open' ? openText.trim() : mcChosen!;
    const newAnswers = [...allAnswers, answer];
    setAllAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setMcChosen(null);
      setOpenText('');
    } else {
      // Submit
      setStep('submitting');
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        const res = await fetch(`${apiBase}/submit-quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId, answers: newAnswers }),
        });
        if (!res.ok) throw new Error(`Submit error ${res.status}`);
        const data = await res.json();
        setFinalScore(data.score);
        setPassed(data.passed);
        setQuizResults(data.results);
        setStep('result');
      } catch (e: any) {
        setError(e.message || 'Failed to submit quiz');
        setStep('select');
      }
    }
  };

  const reset = () => {
    setStep('select');
    setSelectedSkill('');
    setQuestions([]);
    setAllAnswers([]);
    setCurrentIdx(0);
    setMcChosen(null);
    setOpenText('');
    setQuizResults([]);
    setError('');
  };

  const typeIcon = (type: string) => {
    if (type === 'code_trace') return <Code2 size={13} className="text-blue-400" />;
    if (type === 'open') return <MessageSquare size={13} className="text-yellow-400" />;
    return <List size={13} className="text-emerald-400" />;
  };

  const typeLabel = (type: string) => {
    if (type === 'code_trace') return lang === 'es' ? 'Código' : 'Code';
    if (type === 'open') return lang === 'es' ? 'Abierta' : 'Open';
    return lang === 'es' ? 'Opción múltiple' : 'Multiple choice';
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <AnimatePresence mode="wait">

        {/* ── SELECT ────────────────────────────────────────── */}
        {step === 'select' && (
          <motion.div key="select"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="space-y-7"
          >
            <header>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="text-emerald-500" size={22} />
                <h1 className="text-2xl font-bold text-white">{t.title}</h1>
              </div>
              <p className="text-zinc-500 text-sm">
                {cvSkills.length > 0 ? t.subtitle_cv : t.subtitle_default}
              </p>
            </header>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Language */}
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">{t.selectLang}</p>
              <div className="flex gap-2">
                {LANG_OPTIONS.map(l => (
                  <button key={l.value} onClick={() => setLang(l.value as 'en' | 'es')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      lang === l.value
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                    }`}>
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">{t.selectSkill}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {skillList.map(skill => (
                  <button key={skill} onClick={() => setSelectedSkill(skill)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                      selectedSkill === skill
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                    }`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">{t.selectLevel}</p>
              <div className="grid grid-cols-3 gap-2">
                {LEVEL_OPTIONS.map(l => (
                  <button key={l.value} onClick={() => setSelectedLevel(l.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedLevel === l.value
                        ? 'bg-emerald-500/10 border-emerald-500'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'
                    }`}>
                    <p className={`font-bold text-sm ${selectedLevel === l.value ? 'text-emerald-400' : 'text-white'}`}>{l.label}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{l.desc[lang]}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startQuiz} disabled={!selectedSkill}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
              <Sparkles size={18} />
              {t.generateBtn}
              {selectedSkill && <span className="opacity-60 font-normal">— {selectedSkill}</span>}
            </button>
          </motion.div>
        )}

        {/* ── LOADING ───────────────────────────────────────── */}
        {step === 'loading' && (
          <motion.div key="loading"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-6 text-center"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Brain className="text-emerald-500" size={36} />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">{t.generating}</p>
              <p className="text-zinc-500 text-sm mt-1">
                {t.generatingDesc(selectedSkill, selectedLevel)}{' '}
                <span className="text-emerald-400">{selectedSkill}</span>
              </p>
            </div>
            <Loader2 className="text-emerald-500 animate-spin" size={20} />
          </motion.div>
        )}

        {/* ── SUBMITTING ─────────────────────────────────────── */}
        {step === 'submitting' && (
          <motion.div key="submitting"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-6 text-center"
          >
            <Loader2 className="text-emerald-500 animate-spin" size={40} />
            <p className="text-white font-bold">{t.submitting}</p>
          </motion.div>
        )}

        {/* ── TEST ──────────────────────────────────────────── */}
        {step === 'test' && currentQ && (
          <motion.div key="test"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button onClick={reset} className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 text-sm">
                <ArrowLeft size={16} /> {t.exit}
              </button>
              <span className="text-zinc-400 text-sm font-medium">{selectedSkill} · {selectedLevel} · {lang.toUpperCase()}</span>
              <span className="text-zinc-500 text-sm">{currentIdx + 1} / {questions.length}</span>
            </div>

            {/* Progress */}
            <div className="w-full bg-zinc-900 rounded-full h-1.5">
              <motion.div className="h-1.5 rounded-full bg-emerald-500"
                animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>

            {/* Question card */}
            <AnimatePresence mode="wait">
              <motion.div key={currentIdx}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-5"
              >
                {/* Type badge */}
                <div className="flex items-center gap-1.5">
                  {typeIcon(currentQ.type)}
                  <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{typeLabel(currentQ.type)}</span>
                </div>

                <p className="text-white font-semibold text-lg leading-snug">{currentQ.question}</p>

                {/* Code block */}
                {currentQ.code && (
                  <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-emerald-300 font-mono overflow-x-auto leading-relaxed">
                    {currentQ.code}
                  </pre>
                )}

                {/* Hint */}
                {currentQ.type === 'open' && (
                  <p className="text-yellow-500/70 text-xs flex items-center gap-1">
                    <MessageSquare size={12} /> {t.openHint}
                  </p>
                )}
                {currentQ.type === 'code_trace' && (
                  <p className="text-blue-400/70 text-xs flex items-center gap-1">
                    <Code2 size={12} /> {t.codeHint}
                  </p>
                )}

                {/* Multiple choice options */}
                {(currentQ.type === 'multiple_choice' || currentQ.type === 'code_trace') && currentQ.options && (
                  <div className="space-y-2">
                    {currentQ.options.map((opt, idx) => (
                      <motion.button key={idx}
                        onClick={() => setMcChosen(idx)}
                        whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
                        className={`w-full text-left border rounded-xl px-4 py-3.5 transition-all flex items-center gap-3 ${
                          mcChosen === idx
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                        }`}>
                        <span className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                          mcChosen === idx ? 'border-emerald-400' : 'border-zinc-600'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 text-sm leading-snug">{opt}</span>
                        {mcChosen === idx && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Open answer */}
                {currentQ.type === 'open' && (
                  <textarea
                    ref={textareaRef}
                    value={openText}
                    onChange={e => setOpenText(e.target.value)}
                    placeholder={t.openPlaceholder}
                    rows={5}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors placeholder-zinc-600"
                  />
                )}

                {/* Next button */}
                <motion.button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  whileHover={canProceed() ? { scale: 1.01 } : {}}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {currentIdx < questions.length - 1
                    ? <>{t.next} <ChevronRight size={18} /></>
                    : <>{t.seeResults} <Trophy size={18} /></>}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── RESULT ────────────────────────────────────────── */}
        {step === 'result' && (
          <motion.div key="result"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Score */}
            <div className={`rounded-2xl border p-8 text-center ${passed ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-zinc-950 border-zinc-900'}`}>
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ background: passed ? 'rgba(16,185,129,0.1)' : 'rgba(113,113,122,0.1)' }}>
                {passed ? <Trophy className="text-emerald-500" size={40} /> : <RotateCcw className="text-zinc-400" size={36} />}
              </div>
              <p className="text-zinc-400 text-sm mb-1">{selectedSkill} · {selectedLevel} · {lang.toUpperCase()}</p>
              <div className={`text-7xl font-black mb-1 ${passed ? 'text-emerald-400' : 'text-zinc-400'}`}>{finalScore}%</div>
              <p className="text-zinc-400 text-sm">
                {quizResults.filter(r => r.isCorrect).length} / {quizResults.length} {t.correct}
              </p>
              <p className={`font-semibold mt-2 ${passed ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {passed ? t.passed : t.failed}
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              <p className="text-zinc-500 text-xs uppercase tracking-widest">{t.review}</p>
              {quizResults.map((r, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-xl border p-4 text-sm ${r.isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {r.isCorrect
                        ? <CheckCircle2 size={16} className="text-emerald-400" />
                        : <XCircle size={16} className="text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        {typeIcon(r.type)}
                        <span className="text-xs text-zinc-600">{typeLabel(r.type)}</span>
                        {r.type === 'open' && r.openScore !== undefined && (
                          <span className={`text-xs font-bold ml-1 ${r.openScore >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {r.openScore}/100
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-300 leading-snug">{r.question}</p>

                      {r.type === 'open' ? (
                        <>
                          <p className="text-zinc-500 text-xs">
                            <span className="text-zinc-400">{t.yourAnswerLabel}</span>{' '}
                            <span className="italic">{String(r.yourAnswer).slice(0, 120)}{String(r.yourAnswer).length > 120 ? '…' : ''}</span>
                          </p>
                          {r.feedback && (
                            <p className="text-zinc-500 text-xs italic">AI: {r.feedback}</p>
                          )}
                        </>
                      ) : !r.isCorrect && r.options ? (
                        <p className="text-zinc-500 text-xs">
                          {t.yourAnswerLabel} <span className="text-red-400">{r.options[r.yourAnswer as number]}</span>
                          {' · '}{t.correctLabel} <span className="text-emerald-400">{r.options[r.correct!]}</span>
                        </p>
                      ) : null}

                      <p className="text-zinc-600 text-xs italic">{r.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={reset}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <RotateCcw size={16} /> {t.tryAnother}
              </button>
              <button disabled={!passed}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <Award size={16} /> {t.claimBadge}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
