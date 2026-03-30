"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
    ArrowLeft, Loader2, Send, CheckCircle2,
    FileText, FileVideo, ExternalLink, AlertCircle, X, GraduationCap, Save
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
    const [showProfile, setShowProfile] = useState(true); 

    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("mentor_session");
        if (!stored) { router.push("/mentor"); return; }
        
        const session = JSON.parse(stored);
        setMentorName(session.name);
        setMentorId(session.id);

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
                const feedbackRes = await fetch(`/api/mentor/feedback?mentorId=${session.id}&teamId=${resolvedParams.teamId}`, { cache: "no-store" });
                if (feedbackRes.ok) {
                    const fd = await feedbackRes.json();
                    if (fd.feedback) {
                        setComment(fd.feedback.comment || "");
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
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 min-h-screen bg-bg-main relative overflow-hidden">
            <header className="flex items-center justify-between px-8 py-6 bg-bg-main/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/mentor-dashboard')}
                        className="w-12 h-12 rounded-md bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-brand-dark transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="w-12 h-12 rounded-md bg-white flex items-center justify-center shadow-xl text-brand-dark">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">Обратна връзка</h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Отбор: {teamName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className={`flex xl:hidden items-center gap-2 py-3 px-6 rounded-full font-display font-black text-[10px] uppercase tracking-widest transition-all border ${
                            showProfile 
                            ? "bg-white text-brand-dark border-white" 
                            : "bg-white/5 text-slate-400 border-white/10 hover:bg-white hover:text-brand-dark"
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Проект
                    </button>
                </div>
            </header>

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 flex gap-10 items-start relative">
                
                {/* Profile View (Side side for mentors) */}
                <aside className="hidden xl:block w-[450px] shrink-0 sticky top-28 h-[calc(100vh-140px)] overflow-y-auto bg-white/[0.01] border border-white/5 rounded-md p-8">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Проект на отбора</h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 font-sans">Информация и ресурси</p>
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
                                        <a href={teamProfile.project_url} target="_blank" className="flex items-center justify-between p-4 rounded-md bg-white/5 border border-white/10 hover:bg-white hover:text-brand-dark transition-all group">
                                            <div className="flex items-center gap-3">
                                                <ExternalLink className="w-4 h-4" />
                                                <span className="text-sm font-bold font-sans">Демо / Код</span>
                                            </div>
                                        </a>
                                    )}
                                    {teamProfile.presentation_url && (
                                        <a href={teamProfile.presentation_url} target="_blank" className="flex items-center justify-between p-4 rounded-md bg-white/5 border border-white/10 hover:bg-white hover:text-brand-dark transition-all group">
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
                <main className="flex-1 min-w-0">
                     <div className="glass p-10 rounded-md border-l-4 border-white shadow-2xl relative overflow-hidden group min-h-[500px] flex flex-col">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-md blur-[100px]" />
                        
                        <div className="relative z-10 flex items-center gap-4 mb-8">
                             <div className="w-12 h-12 rounded-md bg-white flex items-center justify-center text-brand-dark shadow-xl">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">Вашата обратна връзка</h2>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Какво бихте посъветвали отбора?</p>
                            </div>
                        </div>

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
                                        ? "bg-white hover:bg-slate-200 text-brand-dark shadow-[0_0_30px_rgba(255,255,255,0.1)]" 
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
                                        <Save className="w-4 h-4" />
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex xl:hidden items-center justify-center p-4 animate-in fade-in"
                        onClick={() => setShowProfile(false)}
                    >
                        <div 
                            className="w-full max-w-lg bg-bg-main border border-white/10 rounded-md max-h-[80vh] overflow-y-auto p-8 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Проект</h2>
                                <button onClick={() => setShowProfile(false)} className="p-2 hover:text-white"><X /></button>
                            </div>
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
