"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, CheckCircle2, ChevronRight, Users, Activity, Loader2 } from "lucide-react";

type Team = { id: string; name: string };

export default function Dashboard() {
    const [juryName, setJuryName] = useState<string | null>(null);
    const [evaluatedTeams, setEvaluatedTeams] = useState<Record<string, boolean>>({});
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        const storedName = localStorage.getItem("juryName");
        if (!storedName) { router.push("/jury"); return; }
        setJuryName(storedName);

        const stored = localStorage.getItem("evaluatedTeams");
        if (stored) { try { setEvaluatedTeams(JSON.parse(stored)); } catch { } }

        fetch("/api/teams")
            .then(r => r.json())
            .then(d => setTeams(d.teams || []))
            .finally(() => setLoading(false));
    }, [router]);

    if (!isMounted || !juryName) return null;

    const handleLogout = () => {
        localStorage.removeItem("juryName");
        localStorage.removeItem("juryId");
        router.push("/jury");
    };

    const completedCount = teams.filter(t => evaluatedTeams[t.id]).length;
    const totalCount = teams.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="animate-in fade-in duration-500 min-h-screen">
            {/* Standardized Header */}
            <header className="flex items-center justify-between px-8 py-6 bg-[#0A1128]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#C4FF00]/10 flex items-center justify-center text-[#C4FF00]">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">
                            Добре дошли, <span className="text-[#C4FF00]">{juryName}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Табло за оценяване</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 py-3 px-6 rounded-full font-display font-black text-[10px] uppercase tracking-widest transition-all bg-white/5 text-slate-400 border border-white/10 hover:bg-red-500 hover:text-white hover:border-red-500"
                    >
                        <LogOut className="w-4 h-4" />
                        Изход
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto py-12 px-4">

            {/* Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="glass rounded-none border-l-4 border-[#C4FF00] p-8 flex flex-col shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-none bg-[#C4FF00]/10 flex items-center justify-center text-[#C4FF00] shadow-inner">
                            <Activity className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">Вашият напредък</h2>
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3 text-slate-500 font-sans">
                            <span>{completedCount} оценени</span>
                            <span className="text-[#C4FF00]">{totalCount} общо</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-none h-4 overflow-hidden border border-white/5">
                            <div
                                className="bg-[#C4FF00] h-full rounded-none transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(196,255,0,0.3)]"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-tighter text-slate-600 mt-3 text-right font-sans opacity-60">{progressPct}% завършено</p>
                    </div>
                </div>

                <div className="glass rounded-none border-l-4 border-[#FF9D00] p-8 flex flex-col justify-center shadow-xl">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-none bg-[#FF9D00]/10 flex items-center justify-center text-[#FF9D00] shadow-inner">
                            <Users className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">Отбори</h2>
                    </div>
                    <p className="text-5xl font-display font-black text-white mt-4 tracking-tighter">
                        {completedCount} <span className="text-2xl text-slate-700 font-normal">/ {totalCount}</span>
                    </p>
                </div>
            </div>

            {/* Teams List */}
            <h2 className="text-xl font-display font-semibold text-white mb-4">Участващи Отбори</h2>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-[#C4FF00]" /></div>
            ) : teams.length === 0 ? (
                <div className="glass p-10 rounded-none text-center">
                    <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400">Все още няма добавени отбори. Моля, добавете ги от администраторския панел.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {teams.map((team, index) => {
                        const isEvaluated = !!evaluatedTeams[team.id];
                        return (
                            <div
                                key={team.id}
                                onClick={() => router.push(`/evaluate/${team.id}`)}
                                className={`group flex items-center justify-between p-6 rounded-none cursor-pointer transition-all duration-500 ${isEvaluated
                                    ? "bg-white/[0.02] border border-white/5 opacity-60 hover:opacity-100"
                                    : "glass border-l-4 border-l-[#C4FF00] transform hover:-translate-y-1 shadow-lg bg-white/[0.04]"
                                    }`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-none flex items-center justify-center font-display font-black text-2xl transition-all shadow-md ${isEvaluated ? "bg-slate-900 text-slate-700" : "bg-[#C4FF00]/10 text-[#C4FF00] group-hover:bg-[#C4FF00] group-hover:text-[#0A1128]"}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className={`font-display font-black text-2xl tracking-tight ${isEvaluated ? "text-slate-500" : "text-white"}`}>{team.name}</h3>
                                        <p className={`text-xs font-sans font-black uppercase tracking-widest mt-1 ${isEvaluated ? "text-slate-700" : "text-slate-500"}`}>
                                            {isEvaluated ? "✓ Оценен" : "Очаква оценяване"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {isEvaluated ? (
                                        <CheckCircle2 className="w-8 h-8 text-[#C4FF00] opacity-30" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-none bg-white/5 flex items-center justify-center group-hover:bg-[#C4FF00] group-hover:text-[#0A1128] transition-all shadow-inner">
                                            <ChevronRight className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            </main>
        </div>
    );
}
