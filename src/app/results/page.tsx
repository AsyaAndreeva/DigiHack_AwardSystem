"use client";

import { useState, useEffect } from "react";
import { Trophy, RefreshCw, AlertCircle, MessageSquare } from "lucide-react";

type JuryBreakdown = {
    jury_name: string;
    total_score: number;
    comments?: string;
};

type LeaderboardRow = {
    team_id: string;
    team_name: string;
    evaluations_count: number;
    combined_score: number;
    jury_breakdown: JuryBreakdown[];
};

export default function ResultsPage() {
    const [data, setData] = useState<LeaderboardRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchResults = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/results", { cache: "no-store" });
            if (!res.ok) {
                throw new Error("Failed to fetch results.");
            }
            const json = await res.json();
            if (json.error) throw new Error(json.error);

            setData(json.data || []);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
    }, []);

    return (
        <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-[var(--border)] gap-4">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-3xl bg-[#C4FF00] flex items-center justify-center shadow-[0_0_20px_rgba(196,255,0,0.3)]">
                        <Trophy className="text-[#0A1128] w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white mb-1">
                            Live Results
                        </h1>
                        <p className="text-slate-400 text-sm">Real-time hackathon leaderboard</p>
                    </div>
                </div>
                <button
                    onClick={fetchResults}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-[#C4FF00] px-4 py-2 rounded-full transition-colors shrink-0 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    <span className="text-sm font-medium">Refresh</span>
                </button>
            </header>

            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-red-500 font-medium">Error loading leaderboard</h3>
                        <p className="text-red-400/80 text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {loading && !data.length ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 rounded-full border-t-2 border-[#C4FF00] animate-spin"></div>
                </div>
            ) : data.length === 0 && !error ? (
                <div className="glass p-12 rounded-3xl text-center">
                    <Trophy className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h2 className="text-xl font-medium text-white mb-2">No Evaluations Yet</h2>
                    <p className="text-slate-400">Scores will appear here once juries begin submitting.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map((row, index) => (
                        <div
                            key={row.team_id}
                            className="glass p-6 rounded-2xl flex flex-col relative overflow-hidden group"
                        >
                            {/* Rank Highlight Background for Top 3 */}
                            {index === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>}
                            {index === 1 && <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>}
                            {index === 2 && <div className="absolute top-0 left-0 w-1 h-full bg-amber-700"></div>}

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center space-x-5">
                                    <div className={`
                                        w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold font-display
                                        ${index === 0 ? "bg-yellow-400/20 text-yellow-400 ring-1 ring-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]" : ""}
                                        ${index === 1 ? "bg-slate-300/20 text-slate-300 ring-1 ring-slate-300/50" : ""}
                                        ${index === 2 ? "bg-amber-700/20 text-amber-500 ring-1 ring-amber-700/50" : ""}
                                        ${index > 2 ? "bg-slate-800 text-slate-500" : ""}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-[#C4FF00] transition-colors">
                                            {row.team_name}
                                        </h3>
                                        <p className="text-sm text-slate-400 flex items-center mt-1">
                                            <span className="bg-[#C4FF00]/20 text-[#C4FF00] px-2 py-0.5 rounded text-xs mr-2 border border-[#C4FF00]/20 font-bold">
                                                {row.evaluations_count} Juries
                                            </span>
                                            evaluated this team
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-8 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                    <div className="flex flex-col text-right">
                                        <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Total Score</span>
                                        <div className="text-3xl font-display font-bold text-white flex items-baseline">
                                            {row.combined_score}
                                            <span className="text-sm text-slate-500 font-normal ml-1">pts</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Jury Comments Section (Only show if there are comments) */}
                            {row.jury_breakdown.some(j => j.comments && j.comments.trim() !== '') && (
                                <div className="mt-6 pt-6 border-t border-slate-700/50">
                                    <h4 className="text-sm font-semibold text-slate-300 flex items-center mb-4">
                                        <MessageSquare className="w-4 h-4 mr-2 text-[#C4FF00]" />
                                        Jury Feedback
                                    </h4>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {row.jury_breakdown.filter(j => j.comments && j.comments.trim() !== '').map((jury, jIdx) => (
                                            <div key={jIdx} className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-[#FF9D00] bg-[#FF9D00]/10 px-2 py-1 rounded border border-[#FF9D00]/20">{jury.jury_name}</span>
                                                    <span className="text-xs text-slate-500 font-bold">Scored: <span className="text-white">{jury.total_score}</span></span>
                                                </div>
                                                <p className="text-sm text-slate-300 italic whitespace-pre-wrap leading-relaxed">
                                                    "{jury.comments}"
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
