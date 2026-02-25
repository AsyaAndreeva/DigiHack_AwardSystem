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

    const completedCount = Object.keys(evaluatedTeams).length;
    const totalCount = teams.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--border)]">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
                        Добре дошли, <span className="text-[#C4FF00]">{juryName}</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Табло за оценяване на DigiHack 2.0</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-full hover:bg-slate-800/50 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">Изход</span>
                </button>
            </header>

            {/* Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="glass rounded-3xl p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#C4FF00]/20 flex items-center justify-center text-[#C4FF00]">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Вашият напредък</h2>
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                        <div className="flex justify-between text-sm mb-2 text-slate-300">
                            <span>{completedCount} оценени</span>
                            <span>{totalCount} общо</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-[#C4FF00] h-3 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-right">{progressPct}% завършено</p>
                    </div>
                </div>

                <div className="glass rounded-3xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF9D00]/20 flex items-center justify-center text-[#FF9D00]">
                            <Users className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Отбори</h2>
                    </div>
                    <p className="text-4xl font-display font-bold text-white mt-2">
                        {completedCount} <span className="text-xl text-slate-500 font-normal">/ {totalCount}</span>
                    </p>
                </div>
            </div>

            {/* Teams List */}
            <h2 className="text-xl font-display font-semibold text-white mb-4">Участващи Отбори</h2>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-[#C4FF00]" /></div>
            ) : teams.length === 0 ? (
                <div className="glass p-10 rounded-3xl text-center">
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
                                className={`group flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all duration-300 ${isEvaluated
                                    ? "bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 opacity-80"
                                    : "glass glass-hover transform hover:-translate-y-1"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl transition-all ${isEvaluated ? "bg-slate-800 text-slate-500" : "bg-[#C4FF00]/20 text-[#C4FF00] group-hover:bg-[#C4FF00] group-hover:text-[#0A1128]"}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-xl ${isEvaluated ? "text-slate-400" : "text-white"}`}>{team.name}</h3>
                                        <p className={`text-sm ${isEvaluated ? "text-slate-600" : "text-slate-400"}`}>
                                            {isEvaluated ? "✓ Оценен" : "Очаква оценяване"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {isEvaluated ? (
                                        <CheckCircle2 className="w-8 h-8 text-[#C4FF00] opacity-80" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#C4FF00] group-hover:text-[#0A1128] transition-colors text-slate-400">
                                            <ChevronRight className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
