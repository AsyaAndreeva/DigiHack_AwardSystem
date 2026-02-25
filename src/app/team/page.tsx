"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowRight, ArrowLeft, Loader2, Code } from "lucide-react";

type Team = { id: string; name: string };

export default function TeamLogin() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const existing = localStorage.getItem("teamId");
        if (existing) { router.push("/team-dashboard"); return; }
        fetch("/api/teams")
            .then(r => r.json())
            .then(d => setTeams(d.teams || []))
            .finally(() => setLoading(false));
    }, [router]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeam) return;
        const team = teams.find(t => t.id === selectedTeam);
        if (!team) return;
        localStorage.setItem("teamId", team.id);
        localStorage.setItem("teamName", team.name);
        router.push("/team-dashboard");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
            <button onClick={() => router.push("/")} className="self-start flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Назад
            </button>
            <div className="mb-10 flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-16 h-16 rounded-3xl bg-[#FF9D00] flex items-center justify-center shadow-[0_0_30px_rgba(255,157,0,0.3)]">
                    <Users className="text-[#0A1128] w-8 h-8" />
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-center tracking-tight text-white mb-2">
                    <span className="text-[#FF9D00]">Хакер</span> Портал
                </h1>
                <p className="text-slate-400 text-center max-w-sm text-sm">
                    Изберете вашия отбор, за да подадете проектните линкове и описание за журито.
                </p>
            </div>

            <div className="w-full max-w-sm p-6 rounded-3xl glass animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 ml-1 block">Вашият отбор</label>
                        {loading ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-[#FF9D00]" /></div>
                        ) : teams.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">Все още няма добавени отбори. Свържете се с администратора.</p>
                        ) : (
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Code className="h-5 w-5 text-slate-400" />
                                </div>
                                <select
                                    value={selectedTeam}
                                    onChange={e => setSelectedTeam(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl appearance-none text-white focus:outline-none focus:ring-2 focus:ring-[#FF9D00] focus:border-transparent transition-all cursor-pointer"
                                    required
                                >
                                    <option value="" disabled>Изберете отбор...</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!selectedTeam}
                        className="w-full flex items-center justify-center gap-2 py-4 px-8 bg-[#FF9D00] hover:bg-[#E68D00] disabled:opacity-50 disabled:cursor-not-allowed text-[#0A1128] rounded-full font-bold transition-all shadow-[0_0_20px_rgba(255,157,0,0.2)] hover:shadow-[0_0_30px_rgba(255,157,0,0.4)] active:scale-[0.98] group"
                    >
                        <span>Вход в таблото на отбора</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
}
