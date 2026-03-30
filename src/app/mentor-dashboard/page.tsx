"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, CheckCircle2, ChevronRight, Users, GraduationCap, Loader2 } from "lucide-react";

type Team = { id: string; name: string };

export default function MentorDashboard() {
    const [mentorName, setMentorName] = useState<string | null>(null);
    const [commentedTeams, setCommentedTeams] = useState<Record<string, boolean>>({});
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        const storedName = localStorage.getItem("mentorName");
        const storedMentorId = localStorage.getItem("mentorId");
        
        if (!storedName) { router.push("/mentor"); return; }
        setMentorName(storedName);

        Promise.all([
            fetch("/api/teams").then(r => r.json()),
            storedMentorId ? fetch(`/api/mentor/feedback?mentorId=${storedMentorId}`, { cache: "no-store" }).then(r => r.json()) : Promise.resolve({ feedback: [] })
        ]).then(([teamsData, feedbackData]) => {
            const rawTeams = (teamsData.teams || []) as Team[];
            // Same custom order as jury for consistency
            const customOrder = [
                "Екип 10", "Екип 11", "Екип 1", "Екип 4", 
                "Екип 3", "Екип 5", "Екип 9", "Екип 12", 
                "Екип 6", "Екип 7", "Екип 8", "Екип 2"
            ];
            const sortedTeams = [...rawTeams].sort((a, b) => {
                const idxA = customOrder.indexOf(a.name);
                const idxB = customOrder.indexOf(b.name);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.name.localeCompare(b.name, 'bg', { numeric: true });
            });
            setTeams(sortedTeams);
            
            const serverCommented: Record<string, boolean> = {};
            if (feedbackData.feedback) {
                feedbackData.feedback.forEach((f: any) => {
                    serverCommented[f.team_id] = true;
                });
                setCommentedTeams(serverCommented);
            }
        }).finally(() => {
            setLoading(false);
        });
    }, [router]);

    if (!isMounted || !mentorName) return null;

    const handleLogout = () => {
        localStorage.removeItem("mentorName");
        localStorage.removeItem("mentorId");
        router.push("/");
    };

    const completedCount = teams.filter(t => commentedTeams[t.id]).length;
    const totalCount = teams.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="animate-in fade-in duration-500 min-h-screen">
            <header className="flex items-center justify-between px-8 py-6 bg-bg-main/80 backdrop-blur-md border-b border-white/5 relative z-[30]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">
                            Ментор: <span className="text-violet-400">{mentorName}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Табло за менторска обратна връзка</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="glass rounded-md border-l-4 border-violet-500 p-8 flex flex-col shadow-xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-md bg-violet-500/10 flex items-center justify-center text-violet-400 shadow-inner">
                                <GraduationCap className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">Вашият напредък</h2>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3 text-slate-500 font-sans">
                                <span>{completedCount} коментирани</span>
                                <span className="text-violet-400">{totalCount} общо</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-md h-4 overflow-hidden border border-white/5">
                                <div
                                    className="bg-violet-500 h-full rounded-md transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-md border-l-4 border-brand-orange p-8 flex flex-col justify-center shadow-xl">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-14 h-14 rounded-md bg-brand-orange/10 flex items-center justify-center text-brand-orange shadow-inner">
                                <Users className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">Отбори</h2>
                        </div>
                        <p className="text-5xl font-display font-black text-white mt-4 tracking-tighter">
                            {completedCount} <span className="text-2xl text-slate-700 font-normal">/ {totalCount}</span>
                        </p>
                    </div>
                </div>

                <h2 className="text-xl font-display font-semibold text-white mb-4">Участващи Отбори</h2>

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-violet-400" /></div>
                ) : teams.length === 0 ? (
                    <div className="glass p-10 rounded-md text-center">
                        <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400">Няма добавени отбори.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {teams.map((team, index) => {
                            const isCommented = !!commentedTeams[team.id];
                            return (
                                <div
                                    key={team.id}
                                    onClick={() => router.push(`/mentor-evaluate/${team.id}`)}
                                    className={`group flex items-center justify-between p-6 rounded-md cursor-pointer transition-all duration-500 ${isCommented
                                        ? "bg-white/[0.02] border border-white/5 opacity-60 hover:opacity-100"
                                        : "glass border-l-4 border-l-violet-500 transform hover:-translate-y-1 shadow-lg bg-white/[0.04]"
                                        }`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-md flex items-center justify-center font-display font-black text-2xl transition-all shadow-md ${isCommented ? "bg-slate-900 text-slate-700" : "bg-violet-500/10 text-violet-400 group-hover:bg-violet-600 group-hover:text-white"}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h3 className={`font-display font-black text-2xl tracking-tight ${isCommented ? "text-slate-500" : "text-white"}`}>{team.name}</h3>
                                            <p className={`text-xs font-sans font-black uppercase tracking-widest mt-1 ${isCommented ? "text-slate-700" : "text-slate-500"}`}>
                                                {isCommented ? "✓ Дадена обратна връзка" : "Очаква коментар"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        {isCommented ? (
                                            <CheckCircle2 className="w-8 h-8 text-violet-400 opacity-30" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all shadow-inner">
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
