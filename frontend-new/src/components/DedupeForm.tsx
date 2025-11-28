import { useState } from 'react';
import { Upload, FileText, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config';

interface DedupeFormProps {
    onResult: (data: any) => void;
}

export const DedupeForm: React.FC<DedupeFormProps> = ({ onResult }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Settings
    const [textColumn, setTextColumn] = useState('');
    const [removeStopwords, setRemoveStopwords] = useState(false);
    const [cosineThreshold, setCosineThreshold] = useState(0.9);
    const [fuzzyThreshold, setFuzzyThreshold] = useState(90);
    const [model, setModel] = useState('BAAI/bge-small-en-v1.5');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        if (textColumn) formData.append('text_column', textColumn);
        formData.append('remove_stopwords', String(removeStopwords));
        formData.append('model', model);
        formData.append('cosine_threshold', String(cosineThreshold));
        formData.append('fuzzy_threshold', String(fuzzyThreshold));

        try {
            const response = await fetch(`${API_URL}/process`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();
            onResult(data);
        } catch (err: any) {
            setError(err.message || "An error occurred during processing.");
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
            <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Upload className="text-indigo-400" />
                    Upload Dataset
                </h2>

                {/* File Upload Area */}
                <div className="mb-8">
                    <label className="block w-full h-32 border-2 border-dashed border-slate-600 rounded-xl hover:border-indigo-500 hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col items-center justify-center group">
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".csv,.json,.txt,.zip,.xlsx,.pdf,.docx" />
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            {file ? <CheckCircle className="text-green-400" /> : <FileText className="text-indigo-400" />}
                        </div>
                        <p className="text-slate-400 font-medium group-hover:text-white transition-colors">
                            {file ? file.name : "Drop your file here or click to browse"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">CSV, JSON, TXT, PDF, DOCX, ZIP</p>
                    </label>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-400 mb-1 block">Text Column (Optional)</label>
                            <input
                                type="text"
                                value={textColumn}
                                onChange={(e) => setTextColumn(e.target.value)}
                                placeholder="e.g., 'content' or 'text'"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg border border-slate-800">
                            <input
                                type="checkbox"
                                id="stopwords"
                                checked={removeStopwords}
                                onChange={(e) => setRemoveStopwords(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                            />
                            <label htmlFor="stopwords" className="text-sm text-slate-300 cursor-pointer select-none">Remove Stopwords</label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm text-slate-400">Cosine Threshold</label>
                                <span className="text-xs text-indigo-400 font-mono">{cosineThreshold}</span>
                            </div>
                            <input
                                type="range"
                                min="0.5" max="0.99" step="0.01"
                                value={cosineThreshold}
                                onChange={(e) => setCosineThreshold(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm text-slate-400">Fuzzy Threshold</label>
                                <span className="text-xs text-purple-400 font-mono">{fuzzyThreshold}</span>
                            </div>
                            <input
                                type="range"
                                min="60" max="100" step="1"
                                value={fuzzyThreshold}
                                onChange={(e) => setFuzzyThreshold(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Advanced Settings Toggle (Visual only for now, model is fixed/hidden or advanced) */}
                <div className="mb-6">
                    <label className="text-sm text-slate-400 mb-1 block">Embedding Model</label>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
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
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5 fill-current" />
                            Start Deduplication
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
};
