"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
    ArrowLeft, Loader2, Send, CheckCircle2,
    FileText, FileVideo, ExternalLink, AlertCircle, X, GraduationCap
} from "lucide-react";

type TeamProfile = {
    project_name?: string;
    description?: string;
    project_url?: string;
    presentation_url?: string;
    image_url?: string;
    links?: { title: string; url: string }[];
};

export default function MentorEvaluateTeam({ params }: { params: Promise<{ teamId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();

    const [mentorName, setMentorName] = useState<string | null>(null);
    const [mentorId, setMentorId] = useState<string | null>(null);
    const [teamName, setTeamName] = useState<string | null>(null);
    const [comment, setComment] = useState("");
    const [teamProfile, setTeamProfile] = useState<TeamProfile | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showProfile, setShowProfile] = useState(true); // Open by default for mentors

    useEffect(() => {
        setIsMounted(true);
        const storedMentorName = localStorage.getItem("mentorName");
        const storedMentorId = localStorage.getItem("mentorId");
        if (!storedMentorName) { router.push("/mentor"); return; }
        setMentorName(storedMentorName);
        setMentorId(storedMentorId);

        const loadAll = async () => {
            try {
                // Load team name
                const teamsRes = await fetch("/api/teams");
                const teamsData = await teamsRes.json();
                const team = (teamsData.teams || []).find((t: { id: string; name: string }) => t.id === resolvedParams.teamId);
                if (!team) { router.push("/mentor-dashboard"); return; }
                setTeamName(team.name);

                // Load team profile
                const profileRes = await fetch(`/api/team-profile?team_id=${resolvedParams.teamId}`);
                if (profileRes.ok) {
                    const pd = await profileRes.json();
                    if (pd.profile) setTeamProfile(pd.profile);
                }

                // Load existing feedback if any
                if (storedMentorId) {
                    const feedbackRes = await fetch(`/api/mentor/feedback?mentorId=${storedMentorId}&teamId=${resolvedParams.teamId}`, { cache: "no-store" });
                    if (feedbackRes.ok) {
                        const fd = await feedbackRes.json();
                        if (fd.feedback) {
                            setComment(fd.feedback.comment || "");
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadAll();
    }, [router, resolvedParams.teamId]);

    const handleSave = async () => {
        if (!mentorId || !resolvedParams.teamId) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/mentor/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mentorId,
                    teamId: resolvedParams.teamId,
                    comment
                }),
            });

            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.error || "Грешка при запазване");
            }
            
            // Pulse the success icon or redirect
            setTimeout(() => {
              setIsSubmitting(false);
            }, 1000);
        } catch (err: any) {
            setError(err.message || "Неочаквана грешка");
            setIsSubmitting(false);
        }
    };

    if (!isMounted) return null;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 min-h-screen bg-[#070b1a]">
            <header className="flex items-center justify-between px-8 py-4 bg-bg-main/80 backdrop-blur-md border-b border-white/5 relative z-[30]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/mentor-dashboard')}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-brand-dark transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">{teamName || 'Зареждане...'}</h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Менторска обратна връзка</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className={`flex xl:hidden items-center gap-2 py-3 px-6 rounded-full font-display font-black text-[10px] uppercase tracking-widest transition-all border ${
                            showProfile 
                            ? "bg-white text-brand-dark border-white" 
                            : "bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500 hover:text-white"
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Проект
                    </button>
                </div>
            </header>

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 flex gap-10 items-start relative">
                
                {/* Profile View (Always on desktop side for mentors) */}
                <aside className="hidden xl:block w-[450px] shrink-0 sticky top-28 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar bg-white/[0.02] border border-white/5 rounded-md p-8">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white">Проект на отбора</h2>
                            <p className="text-violet-400 text-[10px] font-black uppercase tracking-widest mt-1 font-sans">Информация и ресурси</p>
                        </div>
                    </div>

                    {teamProfile ? (
                        <div className="space-y-10">
                            {teamProfile.image_url && (
                                <div className="relative aspect-[4/3] rounded-md overflow-hidden border border-white/10 shadow-2xl group">
                                    <img 
                                        src={teamProfile.image_url.includes('blob.vercel-storage.com') ? `/api/blob?url=${encodeURIComponent(teamProfile.image_url)}` : teamProfile.image_url} 
                                        alt="Project" 
                                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-transparent to-transparent opacity-60" />
                                </div>
                            )}

                            {teamProfile.project_name && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-sans opacity-60">Име</h3>
                                    <p className="text-white text-xl font-bold font-sans tracking-tight">{teamProfile.project_name}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-sans opacity-60">Концепция</h3>
                                <p className="text-slate-300 text-sm leading-relaxed font-sans italic">&ldquo;{teamProfile.description}&rdquo;</p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-sans opacity-60">Линкове</h3>
                                <div className="grid gap-2">
                                    {teamProfile.project_url && (
                                        <a href={teamProfile.project_url} target="_blank" className="flex items-center justify-between p-4 rounded-md bg-white/5 border border-white/10 hover:bg-violet-500 hover:text-white transition-all group">
                                            <div className="flex items-center gap-3">
                                                <ExternalLink className="w-4 h-4" />
                                                <span className="text-sm font-bold font-sans">Демо / Код</span>
                                            </div>
                                        </a>
                                    )}
                                    {teamProfile.presentation_url && (
                                        <a href={teamProfile.presentation_url} target="_blank" className="flex items-center justify-between p-4 rounded-md bg-white/5 border border-white/10 hover:bg-violet-500 hover:text-white transition-all group">
                                            <div className="flex items-center gap-3">
                                                <FileVideo className="w-4 h-4" />
                                                <span className="text-sm font-bold font-sans">Презентация</span>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-800 gap-4">
                            <AlertCircle className="w-12 h-12 opacity-10" />
                            <p className="font-bold uppercase tracking-widest text-[9px] font-sans">Липсва информация за профил</p>
                        </div>
                    )}
                </aside>

                {/* Main: Feedback Area */}
                <main className="flex-1 min-w-0 space-y-10">
                    <div className="flex items-center gap-4 mb-4">
                         <div className="w-14 h-14 rounded-md bg-violet-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">Вашата обратна връзка</h2>
                            <p className="text-slate-500 text-xs font-sans font-medium uppercase tracking-widest opacity-80">Какво бихте посъветвали отбора?</p>
                        </div>
                    </div>

                    <div className="glass rounded-md p-10 border border-white/5 shadow-2xl relative overflow-hidden group min-h-[500px] flex flex-col">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-md blur-[100px]" />
                        
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Напишете своите конструктивни коментари и препоръки..."
                            className="flex-1 w-full bg-black/40 border border-white/10 rounded-md p-8 text-white placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all text-xl font-sans leading-relaxed resize-none relative z-10"
                        />
                        
                        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 border-t border-white/5 mt-8">
                            <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest font-sans flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-white" />
                                Окуражете отбора с конструктивна критика
                            </div>
                            
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting || !comment.trim()}
                                className={`flex items-center gap-3 py-4 px-10 rounded-full font-display font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                                    isSubmitting 
                                    ? "bg-slate-900 text-slate-500 cursor-not-allowed" 
                                    : comment.trim().length > 0
                                        ? "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_30px_rgba(139,92,246,0.2)]" 
                                        : "bg-white/5 text-slate-700 border border-white/5 cursor-not-allowed"
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Запазване...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Запази коментара</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </main>

                {/* Profile Modal for Mobile */}
                {showProfile && (
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[50] flex xl:hidden items-center justify-center p-4 animate-in fade-in"
                        onClick={() => setShowProfile(false)}
                    >
                        <div 
                            className="w-full max-w-lg bg-bg-main border border-white/10 rounded-md max-h-[80vh] overflow-y-auto p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-display font-bold text-white">Проект</h2>
                                <button onClick={() => setShowProfile(false)} className="p-2 hover:text-violet-400"><X /></button>
                            </div>
                            {/* Same content as sidebar, just simplified */}
                            <div className="space-y-8">
                                <p className="text-slate-300 italic">"{teamProfile?.description}"</p>
                                <div className="grid gap-2">
                                    {teamProfile?.project_url && <a href={teamProfile.project_url} className="p-4 bg-white/5 rounded-md text-center font-bold">Демо</a>}
                                    {teamProfile?.presentation_url && <a href={teamProfile.presentation_url} className="p-4 bg-white/5 rounded-md text-center font-bold">Презентация</a>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
