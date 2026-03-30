"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Users, GraduationCap, LogOut, ArrowRight,
    CheckCircle2, Loader2, Search, Filter
} from "lucide-react";

type Team = {
    id: string;
    name: string;
    hasFeedback: boolean;
};

export default function MentorDashboard() {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [mentorName, setMentorName] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("mentor_session");
        if (!stored) {
            router.push("/mentor");
            return;
        }
        const session = JSON.parse(stored);
        setMentorName(session.name);

        fetch("/api/mentor/feedback", {
            headers: { "x-mentor-passcode": session.passcode }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setTeams(data.teams);
            }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("mentor_session");
        router.push("/");
    };

    const filteredTeams = teams.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 min-h-screen">
            <header className="flex items-center justify-between px-8 py-6 bg-bg-main/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-white flex items-center justify-center shadow-xl">
                        <GraduationCap className="w-6 h-6 text-brand-dark" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">Табло на Ментора</h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Управление на обратна връзка</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs font-black text-white uppercase tracking-widest">{mentorName}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Live Session</span>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 py-3 px-6 rounded-full font-display font-black text-[10px] uppercase tracking-widest transition-all bg-white/5 text-slate-400 border border-white/10 hover:bg-white hover:text-brand-dark">
                        <LogOut className="w-4 h-4" />
                        Изход
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto py-12 px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight mb-2">Списък с отбори</h2>
                        <p className="text-slate-500 text-sm font-sans font-medium">Изберете отбор, за да оставите обратна връзка</p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-md border border-white/5">
                        <div className="px-4 py-2 flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Общо</span>
                            <span className="text-lg font-display font-black text-white leading-none">{teams.length}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="px-4 py-2 flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Оценени</span>
                            <span className="text-lg font-display font-black text-green-400 leading-none">{teams.filter(t => t.hasFeedback).length}</span>
                        </div>
                    </div>
                </div>

                <div className="mb-8 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-white transition-colors" />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Търсене на отбор..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-md py-4 pl-14 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-white transition-all font-sans"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTeams.map((team) => (
                        <button
                            key={team.id}
                            onClick={() => router.push(`/mentor-evaluate/${team.id}`)}
                            className={`glass p-6 rounded-md border-l-4 transition-all duration-500 text-left group flex items-center justify-between gap-4 ${
                                team.hasFeedback 
                                ? "border-green-500/50 bg-green-500/[0.02]" 
                                : "border-white/10 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] bg-white/[0.01]"
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-md flex items-center justify-center shadow-lg transition-colors ${
                                    team.hasFeedback ? "bg-green-500/20 text-green-400" : "bg-white/5 text-slate-500 group-hover:bg-white group-hover:text-brand-dark"
                                }`}>
                                    <Users className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-display font-black text-white uppercase tracking-tight group-hover:text-white transition-colors truncate">
                                        {team.name}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-widest">
                                        {team.hasFeedback ? "Промени коментара" : "Към оценяване"}
                                    </p>
                                </div>
                            </div>
                            
                            {team.hasFeedback ? (
                                <div className="w-10 h-10 rounded-md bg-green-500/10 flex items-center justify-center text-green-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-brand-dark transition-all">
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </button>
                    ))}
                    {filteredTeams.length === 0 && (
                        <div className="col-span-full py-16 text-center glass rounded-md border border-dashed border-white/10">
                            <p className="text-slate-500 font-sans font-medium uppercase tracking-widest">{searchQuery ? "Няма намерени отбори" : "Списъкът е празен"}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
