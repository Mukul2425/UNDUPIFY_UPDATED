import React, { useMemo } from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
    oldText: string;
    newText: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
    const diff = useMemo(() => {
        if (!oldText || !newText) return [];
        return Diff.diffWords(oldText, newText);
    }, [oldText, newText]);

    return (
        <div className="w-full h-full grid grid-cols-2 gap-4 font-mono text-sm overflow-hidden">
            {/* Left Side: Original (Query) */}
            <div className="glass-panel rounded-xl p-4 overflow-auto h-[500px]">
                <h3 className="text-slate-400 mb-2 sticky top-0 bg-slate-900/80 backdrop-blur p-2 border-b border-white/10">Query File</h3>
                <div className="whitespace-pre-wrap break-words text-slate-300">
                    {diff.map((part, index) => {
                        // If it was removed (exists in old, not in new), highlight red
                        // If it was added (exists in new, not in old), don't show in old view?
                        // Standard side-by-side usually shows the full text with highlights.

                        // For side-by-side:
                        // Left pane shows Old text. Highlights REMOVED parts (red).
                        // Right pane shows New text. Highlights ADDED parts (green).
                        // Unchanged parts are shown in both.

                        if (part.removed) {
                            return (
                                <span key={index} className="bg-red-500/30 text-red-200 border-b border-red-500/50">
                                    {part.value}
                                </span>
                            );
                        }
                        if (part.added) {
                            return null; // Don't show added parts in the old text view
                        }
                        return <span key={index}>{part.value}</span>;
                    })}
                </div>
            </div>

            {/* Right Side: Target */}
            <div className="glass-panel rounded-xl p-4 overflow-auto h-[500px]">
                <h3 className="text-slate-400 mb-2 sticky top-0 bg-slate-900/80 backdrop-blur p-2 border-b border-white/10">Target File</h3>
                <div className="whitespace-pre-wrap break-words text-slate-300">
                    {diff.map((part, index) => {
                        if (part.added) {
                            return (
                                <span key={index} className="bg-green-500/30 text-green-200 border-b border-green-500/50">
                                    {part.value}
                                </span>
                            );
                        }
                        if (part.removed) {
                            return null; // Don't show removed parts in the new text view
                        }
                        return <span key={index}>{part.value}</span>;
                    })}
                </div>
            </div>
        </div>
    );
};
