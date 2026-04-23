import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import blingWav from '../assets/bling.wav';
import closeWav from '../assets/close.wav';
import { 
  Box as BoxIcon, 
  Settings, 
  RotateCcw, 
  Shuffle, 
  Plus, 
  Trash2, 
  X,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

// --- Types ---

interface Question {
  id: string;
  text: string;
}

// --- Constants ---

/** Max number of questions in the pool (initial load + add form cap). All of them are shown in the grid. */
const MAX_QUESTIONS = 15;

const DEFAULT_QUESTIONS: Question[] = [
  { id: '1', text: "What do you enjoy most in your free time?" },
  { id: '2', text: "If you could have any superpower, what would it be?" },
  { id: '3', text: "What is the best professional advice you have ever received?" },
  { id: '4', text: "Would you rather have more time or more money right now?" },
  { id: '5', text: "If you could travel anywhere right now, where would you go?" },
  { id: '6', text: "What's a hobby you've always wanted to try?" },
  { id: '7', text: "What's your go-to comfort food?" },
  { id: '8', text: "What's the last book you read that you loved?" },
  { id: '9', text: "What is one thing people are usually surprised to learn about you?" },
  { id: '10', text: "What's your favorite way to spend a Saturday?" },
  { id: '11', text: "If you could instantly master any new skill, what would it be?" },
  { id: '12', text: "How do you usually recharge — alone or around people?" },
  { id: '13', text: "Are you a morning person or a night owl?" },
  { id: '14', text: "If you could only eat one cuisine for the rest of your life, what would it be?" },
  { id: '15', text: "What's a TV show or movie you can rewatch endlessly?" },
];

const COLORS = [
  'bg-pink-500',
  'bg-cyan-400',
  'bg-yellow-400',
  'bg-purple-500',
  'bg-orange-500',
  'bg-emerald-400',
  'bg-indigo-500',
  'bg-rose-400',
];

// --- Components ---

/** Shuffle array in place (Fisher–Yates) and return it. */
function shuffleColors<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface MysteryBoxProps {
  question: Question;
  index: number;
  isOpened: boolean;
  onOpen: () => void;
  colorClass: string;
}

const MysteryBox: React.FC<MysteryBoxProps> = ({ 
  question, 
  index, 
  isOpened, 
  onOpen,
  colorClass 
}) => {

  return (
    <div className="relative h-48 w-full perspective-1000 group">
      <AnimatePresence mode="wait">
        {!isOpened ? (
          <motion.div
            key="closed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            whileHover={{ 
              rotate: [0, -2, 2, -2, 2, 0],
              transition: { duration: 0.4, repeat: Infinity }
            }}
            onClick={onOpen}
            className={`cursor-pointer w-full h-full ${colorClass} rounded-2xl shadow-xl flex items-center justify-center border-4 border-black/10 relative overflow-hidden`}
          >
            {/* Box Lid Design */}
            <div className="absolute top-0 left-0 w-full h-4 bg-black/10" />
            <div className="absolute bottom-0 left-0 w-full h-4 bg-black/10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full bg-black/10" />
            
            <div className="text-white font-black text-6xl drop-shadow-2xl select-none">
              {index + 1}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="opened"
            initial={{ y: 20, scale: 0.9, opacity: 0 }}
            animate={{ 
              y: -20, 
              scale: 1.05, 
              opacity: 1,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-full h-full bg-white rounded-2xl p-6 flex flex-col items-center justify-center text-center border-4 border-black/5 relative z-10"
          >
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black text-white ${colorClass} shadow-lg`}>
              #{index + 1}
            </div>
            <p className="text-lg font-bold text-slate-800 leading-tight">
              {question.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Box Base (Visual Depth) */}
      {isOpened && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute inset-0 ${colorClass} rounded-2xl opacity-20 -z-10 translate-y-2 scale-95 blur-sm`}
        />
      )}
    </div>
  );
};

export default function App() {
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('unboxing-questions');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_QUESTIONS;
    // Cap stored/default list so the pool never exceeds MAX_QUESTIONS
    return parsed.slice(0, MAX_QUESTIONS);
  });
  const [openedIndices, setOpenedIndices] = useState<Set<number>>(new Set());
  const [fullScreenBoxIndex, setFullScreenBoxIndex] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');

  // Random color per box (stable for the session)
  const boxColors = useMemo(() => {
    const order = shuffleColors([...Array(COLORS.length).keys()]);
    return questions.map((_, i) => COLORS[order[i % order.length]]);
  }, [questions.length]);

  // --- Sound Effects ---
  const playBoxOpenSound = () => {
    const audio = new Audio(blingWav);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  const playShuffleSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    localStorage.setItem('unboxing-questions', JSON.stringify(questions));
  }, [questions]);

  const handleOpenBox = (index: number) => {
    if (openedIndices.has(index)) return;
    playBoxOpenSound();
    setOpenedIndices(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    setFullScreenBoxIndex(index);
  };

  const resetGame = () => {
    playShuffleSound();
    setOpenedIndices(new Set());
  };

  const shuffleQuestions = () => {
    playShuffleSound();
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    resetGame();
  };

  const addQuestion = () => {
    if (!newQuestionText.trim() || questions.length >= MAX_QUESTIONS) return;
    const newQ: Question = {
      id: Date.now().toString(),
      text: newQuestionText,
    };
    setQuestions(prev => [newQ, ...prev]);
    setNewQuestionText('');
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const restoreDefaults = () => {
    setQuestions(DEFAULT_QUESTIONS);
    resetGame();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-sans selection:bg-cyan-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-pink-200">
              <BoxIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase italic">Soul Box Game</h1>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Icebreakers & Fun</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {COLORS.slice(0, 4).map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${c}`} />
              ))}
            </div>
            <p className="text-sm font-bold text-slate-400">
              {openedIndices.size} / {Math.min(questions.length, MAX_QUESTIONS)} Boxes Unboxed
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={shuffleQuestions}
              className="p-2.5 rounded-xl cursor-pointer bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm group"
              title="Shuffle Questions"
            >
              <Shuffle className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" />
            </button>
            <button 
              onClick={resetGame}
              className="p-2.5 rounded-xl cursor-pointer bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm group"
              title="Reset Boxes"
            >
              <RotateCcw className="w-5 h-5 group-active:-rotate-180 transition-transform duration-500" />
            </button>
            <button 
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center cursor-pointer gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <Settings className="w-4 h-4" />
              <span>Editor</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {questions.map((q, idx) => (
            <MysteryBox 
              key={q.id}
              question={q}
              index={idx}
              isOpened={openedIndices.has(idx)}
              onOpen={() => handleOpenBox(idx)}
              colorClass={boxColors[idx]}
            />
          ))}
          
          {questions.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-400">No questions found.</h3>
              <p className="text-slate-400 mt-2">Try adding some in the Editor!</p>
            </div>
          )}
        </div>
      </main>

      {/* Full-screen box reveal */}
      <AnimatePresence>
        {fullScreenBoxIndex !== null && fullScreenBoxIndex < questions.length && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullScreenBoxIndex(null)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-40 flex flex-col items-center justify-center p-8 pointer-events-none"
            >
              <div
                className="pointer-events-auto w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center border-4 border-black/5"
                onClick={e => e.stopPropagation()}
              >
                <div className={`mb-4 px-4 py-1.5 rounded-full text-sm font-black text-white ${boxColors[fullScreenBoxIndex]} shadow-lg`}>
                  #{fullScreenBoxIndex + 1}
                </div>
                <p className="text-2xl font-bold text-slate-800 leading-snug mb-8">
                  {questions[fullScreenBoxIndex].text}
                </p>
                <button
                  onClick={() => {
                    new Audio(closeWav).play().catch(() => {});
                    setFullScreenBoxIndex(null);
                  }}
                  className="flex cursor-pointer items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg"
                >
                  <X className="w-5 h-5" />
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Editor Sidebar */}
      <AnimatePresence>
        {isEditorOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditorOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase italic">Question Editor</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Manage your pool</p>
                </div>
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Add New */}
                <section className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Plus className="w-3 h-3" /> Add New Question
                  </h3>
                  <div className="space-y-3">
                    <textarea 
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder={questions.length >= MAX_QUESTIONS ? `Pool is full (max ${MAX_QUESTIONS})` : "Type your question here..."}
                      disabled={questions.length >= MAX_QUESTIONS}
                      className="w-full h-24 p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-cyan-400 focus:bg-white outline-none transition-all text-sm font-medium resize-none disabled:opacity-50"
                    />
                    <button 
                      onClick={addQuestion}
                      disabled={!newQuestionText.trim() || questions.length >= MAX_QUESTIONS}
                      className="w-full py-3 rounded-2xl cursor-pointer bg-cyan-400 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-cyan-100 hover:bg-cyan-500 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {questions.length >= MAX_QUESTIONS ? `Limit Reached (${MAX_QUESTIONS}/${MAX_QUESTIONS})` : 'Add to Pool'}
                    </button>
                  </div>
                </section>

                {/* List */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <MessageCircle className="w-3 h-3" /> Current Pool ({questions.length})
                    </h3>
                    <button 
                      onClick={restoreDefaults}
                      className="text-[10px] cursor-pointer font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      Reset to Default
                    </button>
                  </div>
                  <div className="space-y-3">
                    {questions.map((q) => (
                      <div key={q.id} className="group p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-4 hover:bg-white hover:shadow-md transition-all">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-700 leading-snug">{q.text}</p>
                        </div>
                        <button 
                          onClick={() => removeQuestion(q.id)}
                          className="p-2 cursor-pointer rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="w-full cursor-pointer py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
                >
                  Done Editing
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
