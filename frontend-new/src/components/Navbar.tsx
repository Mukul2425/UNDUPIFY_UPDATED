import React from 'react';
import { Layers, GitCompare } from 'lucide-react';

interface NavbarProps {
    activeTab: 'dedupe' | 'compare';
    setActiveTab: (tab: 'dedupe' | 'compare') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="w-full p-6 flex justify-between items-center z-10 relative">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Layers className="text-white w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    UNDUPIFY <span className="text-indigo-400 text-sm font-normal ml-1">v2.0</span>
                </h1>
            </div>

            <div className="flex bg-slate-800/50 backdrop-blur-md p-1 rounded-xl border border-white/5">
                <button
                    onClick={() => setActiveTab('dedupe')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'dedupe'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Layers className="w-4 h-4" />
                    Deduplicate
                </button>
                <button
                    onClick={() => setActiveTab('compare')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'compare'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <GitCompare className="w-4 h-4" />
                    Compare
                </button>
            </div>
        </nav>
    );
};
