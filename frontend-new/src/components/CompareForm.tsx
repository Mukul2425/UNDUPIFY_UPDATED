import { useState } from 'react';
import { Upload, GitCompare, Play, AlertCircle, Folder } from 'lucide-react';
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

    // Settings
    const [removeStopwords, setRemoveStopwords] = useState(false);
    const [cosineThreshold, setCosineThreshold] = useState(0.9);
    const [fuzzyThreshold, setFuzzyThreshold] = useState(90);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!queryFile || !targetFile) {
            setError("Please select both files.");
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
            className="w-full max-w-2xl mx-auto"
        >
            <div className="glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <GitCompare className="text-purple-400" />
                        Compare
                    </h2>

                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                        <button
                            onClick={() => setMode('single')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'single' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            File vs File
                        </button>
                        <button
                            onClick={() => setMode('dir')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'dir' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            File vs Dir
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Query File</label>
                            <label className="block w-full h-24 border-2 border-dashed border-slate-600 rounded-xl hover:border-purple-500 hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col items-center justify-center group">
                                <input type="file" className="hidden" onChange={(e) => setQueryFile(e.target.files?.[0] || null)} />
                                <div className="mb-2 group-hover:scale-110 transition-transform">
                                    {queryFile ? <Upload className="text-green-400 w-6 h-6" /> : <Upload className="text-purple-400 w-6 h-6" />}
                                </div>
                                <p className="text-xs text-slate-400 truncate w-full px-2 text-center">
                                    {queryFile ? queryFile.name : "Select Query"}
                                </p>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                {mode === 'single' ? 'Target File' : 'Target ZIP'}
                            </label>
                            <label className="block w-full h-24 border-2 border-dashed border-slate-600 rounded-xl hover:border-purple-500 hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col items-center justify-center group">
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setTargetFile(e.target.files?.[0] || null)}
                                    accept={mode === 'dir' ? '.zip' : undefined}
                                />
                                <div className="mb-2 group-hover:scale-110 transition-transform">
                                    {targetFile ? <Upload className="text-green-400 w-6 h-6" /> : (mode === 'dir' ? <Folder className="text-purple-400 w-6 h-6" /> : <Upload className="text-purple-400 w-6 h-6" />)}
                                </div>
                                <p className="text-xs text-slate-400 truncate w-full px-2 text-center">
                                    {targetFile ? targetFile.name : (mode === 'dir' ? "Select ZIP" : "Select Target")}
                                </p>
                            </label>
                        </div>
                    </div>
                    {/* Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg border border-slate-800">
                                <input
                                    type="checkbox"
                                    id="stopwordsCompare"
                                    checked={removeStopwords}
                                    onChange={(e) => setRemoveStopwords(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-500 bg-slate-800"
                                />
                                <label htmlFor="stopwordsCompare" className="text-sm text-slate-300 cursor-pointer select-none">Remove Stopwords</label>
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-sm text-slate-400">Cosine Threshold</label>
                                    <span className="text-xs text-purple-400 font-mono">{cosineThreshold}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5" max="0.99" step="0.01"
                                    value={cosineThreshold}
                                    onChange={(e) => setCosineThreshold(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-sm text-slate-400">Fuzzy Threshold</label>
                                    <span className="text-xs text-pink-400 font-mono">{fuzzyThreshold}</span>
                                </div>
                                <input
                                    type="range"
                                    min="60" max="100" step="1"
                                    value={fuzzyThreshold}
                                    onChange={(e) => setFuzzyThreshold(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                />
                            </div>
                        </div>
                    </div>

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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Comparing...
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5 fill-current" />
                                Run Comparison
                            </>
                        )}
                    </button>
                </form>
            </div>
        </motion.div>
    );
};
