import React from 'react';
import { Download, FileCheck, Trash2, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_URL } from '../config';

interface ResultsViewProps {
    data: any;
    type: 'dedupe' | 'compare_dir';
}

export const ResultsView: React.FC<ResultsViewProps> = ({ data, type }) => {
    if (type === 'dedupe') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl mx-auto mt-8"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-slate-400 text-sm mb-2">Total Records</span>
                        <span className="text-3xl font-bold text-white">{data.total_records}</span>
                    </div>
                    <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-slate-400 text-sm mb-2">Duplicates Removed</span>
                        <span className="text-3xl font-bold text-red-400">
                            {data.exact_duplicates_removed + data.near_duplicates_removed}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                            ({data.exact_duplicates_removed} exact, {data.near_duplicates_removed} near)
                        </span>
                    </div>
                    <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-slate-400 text-sm mb-2">Reduction</span>
                        <span className="text-3xl font-bold text-green-400">
                            {(data.deduplication_rate * 100).toFixed(1)}%
                        </span>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-2xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Download className="text-indigo-400" />
                        Download Results
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a
                            href={`${API_URL}/download?path=${encodeURIComponent(data.files.cleaned)}`}
                            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-green-500/50 hover:bg-slate-800 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                                    <FileCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-200">Cleaned Dataset</div>
                                    <div className="text-xs text-slate-500">Final deduplicated file</div>
                                </div>
                            </div>
                            <Download className="w-4 h-4 text-slate-500 group-hover:text-white" />
                        </a>

                        <a
                            href={`${API_URL}/download?path=${encodeURIComponent(data.files.near_dups)}`}
                            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-red-500/50 hover:bg-slate-800 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-200">Near Duplicates</div>
                                    <div className="text-xs text-slate-500">Removed fuzzy matches</div>
                                </div>
                            </div>
                            <Download className="w-4 h-4 text-slate-500 group-hover:text-white" />
                        </a>

                        <a
                            href={`${API_URL}/download?path=${encodeURIComponent(data.files.exact_dups)}`}
                            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-orange-500/50 hover:bg-slate-800 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-200">Exact Duplicates</div>
                                    <div className="text-xs text-slate-500">Removed exact matches</div>
                                </div>
                            </div>
                            <Download className="w-4 h-4 text-slate-500 group-hover:text-white" />
                        </a>

                        <a
                            href={`${API_URL}/download?path=${encodeURIComponent(data.files.report)}`}
                            target="_blank"
                            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-200">Full Report</div>
                                    <div className="text-xs text-slate-500">JSON analysis report</div>
                                </div>
                            </div>
                            <Download className="w-4 h-4 text-slate-500 group-hover:text-white" />
                        </a>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (type === 'compare_dir') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl mx-auto mt-8 glass-panel p-6 rounded-2xl"
            >
                <h3 className="text-xl font-bold mb-4">Comparison Results</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 border-b border-slate-700">
                                <th className="p-3 font-medium">File</th>
                                <th className="p-3 font-medium text-right">Cosine</th>
                                <th className="p-3 font-medium text-right">Levenshtein</th>
                                <th className="p-3 font-medium text-center">Duplicate?</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {data.matches.map((match: any, i: number) => (
                                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-3 text-slate-200">{match.filename}</td>
                                    <td className="p-3 text-right font-mono text-indigo-400">{match.cosine_similarity.toFixed(4)}</td>
                                    <td className="p-3 text-right font-mono text-purple-400">{match.levenshtein_ratio}</td>
                                    <td className="p-3 text-center">
                                        {match.is_duplicate ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                No
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        );
    }

    return null;
};
