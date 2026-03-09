"use client";

import { useState, useEffect } from "react";
import { Trophy, RefreshCw, AlertCircle, MessageSquare, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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
    const [loading, setLoading] = useState(false); // Initially false, starts loading on auth
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const router = useRouter();

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

    // Remove the initial useEffect that fetched everything
    // useEffect(() => {
    //     fetchResults();
    // }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === "Jury2026!") {
            setIsAuthenticated(true);
            setPasswordInput("");
            fetchResults();
        } else {
            setError("Грешна парола.");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="animate-in fade-in duration-500 min-h-screen">
                <header className="flex items-center justify-between px-8 py-6 bg-[#0A1128]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push('/')}
                            className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-[#0A1128] transition-all group"
                        >
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">Класатори</h1>
                            <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Резултати от DigiHack 2.0</p>
                        </div>
                    </div>
                </header>

                <main className="max-w-sm mx-auto pt-16 px-4">
                <div className="glass p-10 rounded-none border-l-4 border-[#C4FF00] text-center shadow-2xl">
                    <div className="w-20 h-20 rounded-none bg-[#C4FF00] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(196,255,0,0.3)]">
                        <Trophy className="text-[#0A1128] w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-display font-black text-white mb-2 uppercase tracking-tight">Защитени Резултати</h1>
                    <p className="text-slate-500 text-sm mb-8 font-sans font-medium uppercase tracking-widest opacity-80">Въведете парола за достъп</p>
                    
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-none text-red-500 text-xs font-black uppercase tracking-widest text-left">
                                {error}
                            </div>
                        )}
                        <input 
                            type="password" 
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Въведете парола..." 
                            className="w-full bg-black/40 border border-white/10 text-white rounded-none px-5 py-4 focus:outline-none focus:border-[#C4FF00] focus:ring-2 focus:ring-[#C4FF00] transition-all text-center tracking-[0.3em] font-mono text-xl"
                        />
                        <button 
                            type="submit"
                            className="w-full bg-[#C4FF00] hover:bg-[#a1d600] text-[#0A1128] font-black uppercase tracking-widest rounded-full px-6 py-4 transition-all shadow-[0_0_20px_rgba(196,255,0,0.2)] active:scale-95"
                        >
                            Вход в Класацията
                        </button>
                    </form>
                </div>
                </main>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 min-h-screen">
            <header className="flex items-center justify-between px-8 py-6 bg-[#0A1128]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/')}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-[#0A1128] transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">Резултати</h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Класация на Живо</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={fetchResults}
                        disabled={loading}
                        className="flex items-center gap-2 py-3 px-6 rounded-full font-display font-black text-[10px] uppercase tracking-widest transition-all bg-[#C4FF00]/10 text-[#C4FF00] border border-[#C4FF00]/20 hover:bg-[#C4FF00] hover:text-[#0A1128] disabled:opacity-50 shadow-lg"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Обнови
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto py-12 px-4">

            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-red-500 font-medium">Грешка при зареждане на класацията</h3>
                        <p className="text-red-400/80 text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {loading && !data.length ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 rounded-full border-t-2 border-[#C4FF00] animate-spin"></div>
                </div>
            ) : data.length === 0 && !error ? (
                <div className="glass p-16 rounded-none border-l-4 border-slate-700 text-center shadow-xl">
                    <Trophy className="w-20 h-20 text-slate-800 mx-auto mb-6" />
                    <h2 className="text-2xl font-display font-black text-white mb-3 uppercase tracking-tight">Все още няма оценки</h2>
                    <p className="text-slate-500 font-sans font-medium uppercase tracking-widest text-sm opacity-60">Резултатите ще се появят тук скоро</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map((row, index) => (
                        <div
                            key={row.team_id}
                            className="glass p-8 rounded-none border-l-4 border-l-slate-800 flex flex-col relative overflow-hidden group shadow-lg hover:bg-white/[0.05] transition-all"
                        >
                            {/* Rank Highlight Background for Top 3 */}
                            {index === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]"></div>}
                            {index === 0 && <style>{`.group:hover { border-left-color: #fbbf24 !important; }`}</style>}
                            {index === 1 && <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>}
                            {index === 2 && <div className="absolute top-0 left-0 w-1 h-full bg-amber-700"></div>}

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center space-x-8">
                                    <div className={`
                                        w-16 h-16 rounded-none flex items-center justify-center text-3xl font-black font-display shadow-md
                                        ${index === 0 ? "bg-yellow-400/20 text-yellow-400 ring-1 ring-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.2)]" : ""}
                                        ${index === 1 ? "bg-slate-300/20 text-slate-300 ring-1 ring-slate-300/50" : ""}
                                        ${index === 2 ? "bg-amber-700/20 text-amber-500 ring-1 ring-amber-700/50" : ""}
                                        ${index > 2 ? "bg-slate-900 text-slate-700" : ""}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-display font-black text-white group-hover:text-[#C4FF00] transition-colors tracking-tight">
                                            {row.team_name}
                                        </h3>
                                        <p className="text-xs font-sans font-black uppercase tracking-[0.2em] flex items-center mt-2 opacity-60">
                                            <span className="bg-[#C4FF00]/10 text-[#C4FF00] px-3 py-1 rounded-none mr-3 border border-[#C4FF00]/20">
                                                {row.evaluations_count} Журита
                                            </span>
                                            оцениха отбора
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-10 bg-black/40 p-6 rounded-none border border-white/5 shadow-inner">
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] text-slate-600 uppercase font-black tracking-[0.3em] mb-1">TOTAL SCORE</span>
                                        <div className="text-5xl font-display font-black text-white flex items-baseline tracking-tighter">
                                            {row.combined_score}
                                            <span className="text-sm text-slate-700 font-bold ml-2 tracking-widest uppercase">pts</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Jury Comments Section (Only show if there are comments) */}
                            {row.jury_breakdown.some(j => j.comments && j.comments.trim() !== '') && (
                                <div className="mt-10 pt-10 border-t border-white/5">
                                    <h4 className="text-[10px] font-black text-slate-500 flex items-center mb-6 uppercase tracking-[0.3em] font-sans">
                                        <MessageSquare className="w-4 h-4 mr-3 text-[#C4FF00]" />
                                        Обратна връзка от журито
                                    </h4>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {row.jury_breakdown.filter(j => j.comments && j.comments.trim() !== '').map((jury, jIdx) => (
                                            <div key={jIdx} className="bg-black/20 p-6 rounded-none border border-white/5 shadow-md group/comment">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[10px] font-black text-[#FF9D00] bg-[#FF9D00]/5 px-3 py-1 rounded-none border border-[#FF9D00]/20 uppercase tracking-widest font-sans">{jury.jury_name}</span>
                                                    <span className="text-[10px] text-slate-700 font-black uppercase tracking-tighter">SCORE: <span className="text-white ml-1">{jury.total_score}</span></span>
                                                </div>
                                                <p className="text-sm text-slate-400 italic whitespace-pre-wrap leading-relaxed font-sans font-medium">
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
            </main>
        </div>
    );
}
