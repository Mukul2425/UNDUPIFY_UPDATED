import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DedupeForm } from './components/DedupeForm';
import { CompareForm } from './components/CompareForm';
import { ResultsView } from './components/ResultsView';
import { DiffViewer } from './components/DiffViewer';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState<'dedupe' | 'compare'>('compare');
  const [result, setResult] = useState<any>(null);
  const [resultType, setResultType] = useState<'dedupe' | 'single' | 'dir' | null>(null);

  const handleDedupeResult = (data: any) => {
    setResult(data);
    setResultType('dedupe');
  };

  const handleCompareResult = (data: any, type: 'single' | 'dir') => {
    setResult(data);
    setResultType(type);
  };

  const reset = (tab: 'dedupe' | 'compare') => {
    setActiveTab(tab);
    setResult(null);
    setResultType(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <Navbar activeTab={activeTab} setActiveTab={reset} />

      <main className="relative z-10 container mx-auto px-4 py-8 pb-20">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="forms"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'dedupe' ? (
                <DedupeForm onResult={handleDedupeResult} />
              ) : (
                <CompareForm onResult={handleCompareResult} />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <button
                onClick={() => setResult(null)}
                className="mb-6 text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                ← Back to {activeTab === 'dedupe' ? 'Deduplication' : 'Comparison'}
              </button>

              {resultType === 'single' ? (
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-xl flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-white">Comparison Analysis</h2>
                      <p className="text-slate-400 text-sm">
                        {result.query_filename} vs {result.target_filename}
                      </p>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Cosine</div>
                        <div className="text-2xl font-mono font-bold text-indigo-400">{result.cosine_similarity.toFixed(4)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Levenshtein</div>
                        <div className="text-2xl font-mono font-bold text-purple-400">{result.levenshtein_ratio}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Verdict</div>
                        <div className={`text-2xl font-bold ${result.is_duplicate ? 'text-red-400' : 'text-green-400'}`}>
                          {result.is_duplicate ? 'Duplicate' : 'Unique'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-1 rounded-xl border border-slate-700/50">
                    <DiffViewer oldText={result.query_text} newText={result.target_text} />
                  </div>
                </div>
              ) : (
                <ResultsView data={result} type={resultType === 'dedupe' ? 'dedupe' : 'compare_dir'} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
