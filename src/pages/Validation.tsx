import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, Trophy, ArrowLeft } from 'lucide-react';

const MOCK_QUESTIONS = [
  {
    id: '1',
    question: 'What is the primary purpose of a Reentrancy Guard in Solidity?',
    options: [
      'To prevent multiple calls to the same function within a single transaction',
      'To increase gas efficiency of loops',
      'To encrypt sensitive data on-chain',
      'To manage ownership of the contract'
    ],
    correct: 0
  },
  {
    id: '2',
    question: 'Which tool is commonly used for testing and deploying smart contracts?',
    options: [
      'Postman',
      'Hardhat',
      'Docker',
      'Kubernetes'
    ],
    correct: 1
  }
];

export default function Validation() {
  const [step, setStep] = useState<'select' | 'test' | 'result'>('select');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  const startTest = (skill: string) => {
    setSelectedSkill(skill);
    setStep('test');
    setCurrentQuestionIdx(0);
    setAnswers([]);
  };

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers, optionIdx];
    setAnswers(newAnswers);

    if (currentQuestionIdx < MOCK_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Calculate score
      const correctCount = newAnswers.reduce((acc, ans, idx) => {
        return acc + (ans === MOCK_QUESTIONS[idx].correct ? 1 : 0);
      }, 0);
      setScore(Math.round((correctCount / MOCK_QUESTIONS.length) * 100));
      setStep('result');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div 
            key="select"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <header>
              <h1 className="text-3xl font-bold text-white">Skill Validation</h1>
              <p className="text-zinc-500 mt-1">Select a skill to start the validation process and earn your badge.</p>
            </header>

            <div className="grid sm:grid-cols-2 gap-4">
              {['Solidity', 'React', 'TypeScript', 'Rust'].map((skill) => (
                <button
                  key={skill}
                  onClick={() => startTest(skill)}
                  className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl flex items-center justify-between hover:border-emerald-500/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center font-bold text-emerald-500">
                      {skill[0]}
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-bold">{skill}</h3>
                      <span className="text-zinc-500 text-sm">20 Questions • 15 Mins</span>
                    </div>
                  </div>
                  <ChevronRight className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'test' && (
          <motion.div 
            key="test"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 md:p-12"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-emerald-500 font-bold tracking-widest uppercase text-xs">Validation: {selectedSkill}</span>
              <span className="text-zinc-500 text-sm">Question {currentQuestionIdx + 1} of {MOCK_QUESTIONS.length}</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-8 leading-tight">
              {MOCK_QUESTIONS[currentQuestionIdx].question}
            </h2>

            <div className="space-y-4">
              {MOCK_QUESTIONS[currentQuestionIdx].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className="w-full text-left bg-zinc-900 border border-zinc-800 p-5 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-zinc-300 hover:text-white"
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-zinc-950 border border-zinc-900 rounded-3xl p-12"
          >
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Trophy className="text-emerald-500" size={48} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Validation Complete!</h2>
            <p className="text-zinc-500 mb-8">You've successfully completed the {selectedSkill} validation test.</p>
            
            <div className="text-6xl font-black text-emerald-500 mb-2">{score}%</div>
            <div className="text-zinc-400 font-medium mb-12">Final Score</div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto">
              <button 
                onClick={() => setStep('select')}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Back to Skills
              </button>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-xl transition-all">
                Claim On-Chain Badge
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
