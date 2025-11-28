import { useState } from 'react';
import { Upload, GitCompare, AlertCircle, Folder, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config';

interface CompareFormProps {
    onResult: (data: any, type: 'single' | 'dir') => void;
}

export const CompareForm: React.FC<CompareFormProps> = ({ onResult }) => {
    const [mode, setMode] = useState<'single' | 'dir'>('single');
    const [queryFile, setQueryFile] = useState<File | null>(null);
    const [targetFile, setTargetFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Advanced Settings (hidden by default)
    const [removeStopwords, setRemoveStopwords] = useState(false);
    const [cosineThreshold, setCosineThreshold] = useState(0.9);
    const [fuzzyThreshold, setFuzzyThreshold] = useState(90);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!queryFile || !targetFile) {
            setError("Please select both files to compare.");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('query', queryFile);
        if (mode === 'single') {
            formData.append('target', targetFile);
        } else {
            formData.append('target_zip', targetFile);
        }
        formData.append('remove_stopwords', String(removeStopwords));
        formData.append('cosine_threshold', String(cosineThreshold));
        formData.append('fuzzy_threshold', String(fuzzyThreshold));

        const endpoint = mode === 'single' ? '/compare' : '/compare_dir';

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();
            onResult(data, mode);
        } catch (err: any) {
            setError(err.message || "An error occurred during comparison.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl mx-auto"
        >
            <div className="glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <GitCompare className="text-purple-400" />
                        Compare Files
                    </h2>

                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                        <button
                            onClick={() => setMode('single')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'single' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            File vs File
                        </button>
                        <button
                            onClick={() => setMode('dir')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'dir' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            File vs Folder
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Main Compare Area - Three Column Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-8">
                        {/* Left File Select */}
                        <div className="flex flex-col items-center order-1">
                            <label className="block text-sm font-medium text-slate-300 mb-4">First File</label>
                            <label className="block w-full h-64 border-2 border-dashed border-slate-600 rounded-2xl hover:border-purple-500 hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden">
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        setQueryFile(e.target.files?.[0] || null);
                                        setError(null);
                                    }} 
                                />
                                <div className="mb-4 group-hover:scale-110 transition-transform">
                                    {queryFile ? (
                                        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Upload className="text-green-400 w-10 h-10" />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <Upload className="text-purple-400 w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-slate-400 text-center px-4 font-medium">
                                    {queryFile ? (
                                        <span className="text-green-400 break-words">{queryFile.name}</span>
                                    ) : (
                                        "Click to select file"
                                    )}
                                </p>
                                <p className="text-xs text-slate-500 mt-2">PDF, DOCX, TXT, etc.</p>
                            </label>
                        </div>

                        {/* Center Compare Button */}
                        <div className="flex flex-col items-center justify-center order-2 md:order-none my-6 md:my-0">
                            <motion.button
                                type="submit"
                                disabled={loading || !queryFile || !targetFile}
                                className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-2xl shadow-purple-500/50 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group ${
                                    loading ? 'cursor-wait' : ''
                                }`}
                                animate={loading ? {
                                    scale: [1, 1.15, 1],
                                } : {}}
                                transition={loading ? {
                                    duration: 0.7,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                } : {}}
                            >
                                {loading ? (
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.3, 1],
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 flex items-center justify-center"
                                    >
                                        <GitCompare className="w-7 h-7 md:w-8 md:h-8 text-white" />
                                    </motion.div>
                                ) : (
                                    <>
                                        <GitCompare className="w-10 h-10 md:w-12 md:h-12 mb-1 group-hover:scale-110 transition-transform" />
                                        <span className="absolute bottom-3 md:bottom-4 text-xs font-semibold">Compare</span>
                                    </>
                                )}
                            </motion.button>
                            {loading && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-sm text-slate-400 mt-4 text-center"
                                >
                                    Analyzing...
                                </motion.p>
                            )}
                        </div>

                        {/* Right File Select */}
                        <div className="flex flex-col items-center order-3">
                            <label className="block text-sm font-medium text-slate-300 mb-4">
                                {mode === 'single' ? 'Second File' : 'Folder (ZIP)'}
                            </label>
                            <label className="block w-full h-64 border-2 border-dashed border-slate-600 rounded-2xl hover:border-pink-500 hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden">
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        setTargetFile(e.target.files?.[0] || null);
                                        setError(null);
                                    }}
                                    accept={mode === 'dir' ? '.zip' : undefined}
                                />
                                <div className="mb-4 group-hover:scale-110 transition-transform">
                                    {targetFile ? (
                                        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                                            {mode === 'dir' ? (
                                                <Folder className="text-green-400 w-10 h-10" />
                                            ) : (
                                                <Upload className="text-green-400 w-10 h-10" />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center">
                                            {mode === 'dir' ? (
                                                <Folder className="text-pink-400 w-10 h-10" />
                                            ) : (
                                                <Upload className="text-pink-400 w-10 h-10" />
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-slate-400 text-center px-4 font-medium">
                                    {targetFile ? (
                                        <span className="text-green-400 break-words">{targetFile.name}</span>
                                    ) : (
                                        mode === 'dir' ? "Click to select ZIP" : "Click to select file"
                                    )}
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    {mode === 'dir' ? 'ZIP file containing files' : 'PDF, DOCX, TXT, etc.'}
                                </p>
                            </label>
                        </div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center gap-3 text-red-200 text-sm"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Advanced Settings (Collapsible) */}
                    <div className="border-t border-slate-700/50 pt-6 mt-6">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between text-slate-400 hover:text-white transition-colors mb-4"
                        >
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                <span className="text-sm font-medium">Advanced Settings</span>
                            </div>
                            {showAdvanced ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>

                        <AnimatePresence>
                            {showAdvanced && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                            <input
                                                type="checkbox"
                                                id="stopwordsCompare"
                                                checked={removeStopwords}
                                                onChange={(e) => setRemoveStopwords(e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-500 bg-slate-800"
                                            />
                                            <label htmlFor="stopwordsCompare" className="text-sm text-slate-300 cursor-pointer select-none">
                                                Remove Stopwords
                                            </label>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <label className="text-sm text-slate-400">Similarity Threshold</label>
                                                <span className="text-xs text-purple-400 font-mono">{cosineThreshold}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="0.99"
                                                step="0.01"
                                                value={cosineThreshold}
                                                onChange={(e) => setCosineThreshold(parseFloat(e.target.value))}
                                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">Higher = more strict matching</p>
                                        </div>

                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <label className="text-sm text-slate-400">Text Similarity</label>
                                                <span className="text-xs text-pink-400 font-mono">{fuzzyThreshold}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="60"
                                                max="100"
                                                step="1"
                                                value={fuzzyThreshold}
                                                onChange={(e) => setFuzzyThreshold(parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">Character-level similarity</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};
