"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
    ArrowLeft, Loader2, Send, CheckCircle2,
    FileText, FileVideo, ExternalLink, AlertCircle, X
} from "lucide-react";

type TeamProfile = {
    description?: string;
    project_url?: string;
    presentation_url?: string;
    image_url?: string;
    links?: { title: string; url: string }[];
};

type Criterion = {
    id: number;
    category: string;
    description?: string;
    criterion: string;
    max_score: number;
    scoring_guide: string;
    order_idx: number;
};

export default function EvaluateTeam({ params }: { params: Promise<{ teamId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();

    const [juryName, setJuryName] = useState<string | null>(null);
    const [juryId, setJuryId] = useState<string | null>(null);
    const [teamName, setTeamName] = useState<string | null>(null);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [comments, setComments] = useState("");
    const [teamProfile, setTeamProfile] = useState<TeamProfile | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const storedJuryName = localStorage.getItem("juryName");
        const storedJuryId = localStorage.getItem("juryId");
        if (!storedJuryName) { router.push("/jury"); return; }
        setJuryName(storedJuryName);
        setJuryId(storedJuryId);

        const loadAll = async () => {
            try {
                // Load team name from DB
                const teamsRes = await fetch("/api/teams");
                const teamsData = await teamsRes.json();
                const team = (teamsData.teams || []).find((t: { id: string; name: string }) => t.id === resolvedParams.teamId);
                if (!team) { router.push("/dashboard"); return; }
                setTeamName(team.name);

                // Load rubric criteria
                const rubricRes = await fetch("/api/rubric");
                const rubricData = await rubricRes.json();
                setCriteria(rubricData.criteria || []);

                // Load team profile
                const profileRes = await fetch(`/api/team-profile?team_id=${resolvedParams.teamId}`);
                if (profileRes.ok) {
                    const pd = await profileRes.json();
                    if (pd.profile) setTeamProfile(pd.profile);
                }

                // Load existing evaluation if any
                if (storedJuryId) {
                    const evalRes = await fetch(`/api/submit?juryId=${storedJuryId}&teamId=${resolvedParams.teamId}`);
                    if (evalRes.ok) {
                        const evalData = await evalRes.json();
                        if (evalData.evaluation) {
                            if (evalData.evaluation.scores) {
                                setScores(evalData.evaluation.scores);
                                const isFullyEvaluated = Object.keys(evalData.evaluation.scores).length === rubricData.criteria.length;
                                const evaluated = JSON.parse(localStorage.getItem("evaluatedTeams") || "{}");
                                if (isFullyEvaluated) {
                                    evaluated[resolvedParams.teamId] = true;
                                } else {
                                    delete evaluated[resolvedParams.teamId];
                                }
                                localStorage.setItem("evaluatedTeams", JSON.stringify(evaluated));
                            }
                            if (evalData.evaluation.comments) {
                                setComments(evalData.evaluation.comments);
                            }
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

    // Group criteria by category
    const grouped = useMemo(() => {
        return criteria.reduce((acc, c) => {
            if (!acc[c.category]) acc[c.category] = [];
            acc[c.category].push(c);
            return acc;
        }, {} as Record<string, Criterion[]>);
    }, [criteria]);

    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const maxPossibleScore = criteria.reduce((sum, c) => sum + c.max_score, 0);

    const autoSave = async (newScores: Record<string, number>, newComments: string) => {
        if (!juryId || !juryName || !resolvedParams.teamId) return;
        
        const currentTotalScore = Object.values(newScores).reduce((sum, s) => sum + s, 0);
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    juryId,
                    juryName,
                    teamId: resolvedParams.teamId,
                    teamName,
                    scores: newScores,
                    totalScore: currentTotalScore,
                    comments: newComments,
                }),
            });

            if (!res.ok) {
                const e = await res.json();
                console.error("Auto-save error", e);
            } else {
                const isFullyEvaluated = Object.keys(newScores).length === criteria.length;
                const evaluated = JSON.parse(localStorage.getItem("evaluatedTeams") || "{}");
                if (isFullyEvaluated) {
                    evaluated[resolvedParams.teamId] = true;
                } else {
                    delete evaluated[resolvedParams.teamId];
                }
                localStorage.setItem("evaluatedTeams", JSON.stringify(evaluated));
            }
        } catch (err: any) {
             console.error("Auto-save network error", err);
        } finally {
             setTimeout(() => setIsSubmitting(false), 500);
        }
    };

    const handleScoreChange = (criterionId: number, value: number) => {
        const newScores = { ...scores, [String(criterionId)]: value };
        setScores(newScores);
        autoSave(newScores, comments);
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setComments(val);
    };

    const handleCommentBlur = () => {
        autoSave(scores, comments);
    };

    const handleFinish = async () => {
        const missingIds = criteria.filter(c => scores[String(c.id)] === undefined).map(c => c.id);
        if (missingIds.length > 0) {
            setError(`Моля, попълнете всички критерии преди да изпратите оценката. Липсват: ${missingIds.length} критерия.`);
            const el = document.getElementById(`criterion-${missingIds[0]}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    juryId,
                    juryName,
                    teamId: resolvedParams.teamId,
                    teamName,
                    scores,
                    totalScore,
                    comments,
                }),
            });

            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.error || "Грешка при изпращане");
            }

            const evaluated = JSON.parse(localStorage.getItem("evaluatedTeams") || "{}");
            evaluated[resolvedParams.teamId] = true;
            localStorage.setItem("evaluatedTeams", JSON.stringify(evaluated));

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Неочаквана грешка");
            setIsSubmitting(false);
        }
    };

    if (!isMounted) return null;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#C4FF00]" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 min-h-screen bg-[#070b1a]">
            {/* Top Focused Header */}
            <header className="flex items-center justify-between px-8 py-6 bg-[#0A1128]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-[#0A1128] transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">{teamName || 'Зареждане...'}</h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Оценяване на проект</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest font-sans mb-1 opacity-60">ПРОГРЕС</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-display font-black text-[#C4FF00]">{Object.keys(scores).length * 10}</span>
                        <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest font-sans">точки</span>
                      </div>
                    </div>
                    
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className={`flex items-center gap-2 py-3 px-6 rounded-full font-display font-black text-[10px] uppercase tracking-widest transition-all border ${
                            showProfile 
                            ? "bg-white text-[#0A1128] border-white" 
                            : "bg-[#FF9D00]/10 text-[#FF9D00] border-[#FF9D00]/20 hover:bg-[#FF9D00] hover:text-[#0A1128]"
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Проект
                        <div className={`w-2 h-2 rounded-full ${teamProfile?.description ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(34,197,94,0.5)] ml-1`} />
                    </button>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-10 flex gap-10 items-start relative">
                
                {/* Left: Category Mini-Map (Desktop Only) */}
                <aside className="hidden xl:flex flex-col gap-3 w-72 shrink-0 sticky top-28 h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar pr-2">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-4 ml-2 opacity-50">Критерии</p>
                    {Object.keys(grouped).map((category, idx) => {
                        const catCrits = grouped[category];
                        const isDone = catCrits.every(c => scores[String(c.id)] !== undefined);
                        return (
                            <button
                                key={category}
                                onClick={() => {
                                    const el = document.getElementById(`category-${category}`);
                                    if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' });
                                }}
                                className={`group flex items-center justify-between p-4 rounded-none text-left text-xs font-bold transition-all border shadow-sm ${
                                    isDone 
                                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                                    : "bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10 hover:text-white"
                                }`}
                            >
                                <span className="truncate pr-3 opacity-90 group-hover:opacity-100">
                                    {category.split('.')[1] || category}
                                </span>
                                {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                                ) : (
                                    <div className="w-4 h-4 rounded-none border border-white/10 shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </aside>

                {/* Center: Evaluation Feed */}
                <main className="flex-1 min-w-0 space-y-16">
                    {error && (
                        <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-none flex items-center gap-4 text-red-400 text-sm animate-in slide-in-from-top-4">
                            <AlertCircle className="w-6 h-6 shrink-0" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {criteria.length === 0 ? (
                        <div className="glass p-20 rounded-none text-center border-dashed border-2 border-white/5">
                            <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium font-sans">Конфигуриране на сесията...</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, crits]) => (
                            <section key={category} id={`category-${category}`} className="space-y-8 scroll-mt-32">
                                <div className="flex flex-col gap-3 pl-2 border-l-2 border-brand-500/30">
                                    <h2 className="text-3xl font-display font-bold text-white tracking-tight uppercase">{category}</h2>
                                    {crits[0]?.description && (
                                        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed italic opacity-80 font-sans">{crits[0].description}</p>
                                    )}
                                </div>

                                <div className="grid gap-8">
                                    {crits.map(c => {
                                        const selected = scores[String(c.id)];
                                        const scoreOptions = Array.from({ length: c.max_score + 1 }, (_, i) => i);
                                        const guideLines = c.scoring_guide ? c.scoring_guide.split('\n').filter(Boolean) : [];

                                        return (
                                            <div key={c.id} id={`criterion-${c.id}`} className="glass rounded-none p-8 md:p-10 border border-white/5 hover:border-white/10 transition-all relative overflow-hidden group shadow-xl bg-white/[0.01]">
                                                {/* Background Accent */}
                                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/5 rounded-none blur-[80px] group-hover:bg-brand-500/10 transition-colors" />
                                                
                                                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                                                    <div className="max-w-2xl">
                                                        <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-3 tracking-tight">{c.criterion}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <div className="px-2.5 py-1 rounded-none bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-wider border border-brand-500/20 font-sans">
                                                                до {c.max_score} точки
                                                            </div>
                                                            {selected !== undefined && (
                                                                <div className="text-[10px] text-emerald-500 font-bold uppercase flex items-center gap-1 font-sans">
                                                                    <CheckCircle2 className="w-3 h-3" /> Оценено
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 w-full">
                                                    {scoreOptions.map(score => {
                                                        const isSelected = selected === score;
                                                        const guide = guideLines.find(l => {
                                                            const match = l.match(/^(\d+)[ ]*т/);
                                                            return match && parseInt(match[1]) === score;
                                                        });

                                                        return (
                                                            <button
                                                                key={score}
                                                                onClick={() => handleScoreChange(c.id, score)}
                                                                className={`group/score relative flex flex-col p-6 rounded-none border transition-all duration-300 text-left h-full min-h-[160px] shadow-sm ${
                                                                    isSelected
                                                                    ? "bg-brand-500 border-brand-500 text-[#0A1128] shadow-2xl shadow-brand-500/40 z-10 font-bold"
                                                                    : "bg-white/[0.03] border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/[0.06]"
                                                                }`}
                                                            >
                                                                 <span className={`text-3xl font-display font-black mb-4 ${isSelected ? 'text-[#0A1128]' : 'text-white'}`}>
                                                                    {score}
                                                                </span>
                                                                <p className={`text-xs md:text-sm leading-relaxed overflow-hidden break-words transition-opacity font-medium font-sans ${isSelected ? 'text-[#0A1128] opacity-100' : 'text-slate-200 opacity-100'}`}>
                                                                     {guide ? guide.replace(/^\d+[ ]*т[. ]*-?[ ]*/, '') : `${score} точки`}
                                                                 </p>
                                                                {isSelected && (
                                                                    <div className="absolute top-6 right-6 w-2.5 h-2.5 rounded-none bg-[#0A1128] animate-pulse" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))
                    )}

                    {/* Final Comments Area */}
                     <section className="pt-12 pb-32">
                        <div className="glass rounded-none p-10 border border-white/5 shadow-2xl">
                           <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-none bg-white/5 flex items-center justify-center text-brand-500">
                                    <Send className="w-6 h-6" />
                                </div>
                                <div>
                                     <h3 className="text-2xl font-display font-black text-white">Финални бележки</h3>
                                    <p className="text-slate-500 text-sm font-sans">Вашите коментари са ценни за отборите</p>
                                </div>
                           </div>
                            <textarea
                                value={comments}
                                onChange={handleCommentChange}
                                onBlur={handleCommentBlur}
                                placeholder="Напишете своите конструктивни коментари..."
                                rows={6}
                                className="w-full p-8 bg-black/40 border border-white/10 rounded-none text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none text-xl font-sans"
                            />
                        </div>
                    </section>
                </main>

                {/* Right: Team Reference Hub */}
                <div 
                    className={`fixed top-0 right-0 h-full bg-[#0A1128] border-l border-white/5 z-[60] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_0_100px_rgba(0,0,0,0.8)] ${
                        showProfile ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
                    } w-full max-w-lg`}
                >
                    <div className="h-full flex flex-col p-10 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-3xl font-display font-bold text-white">Проект</h2>
                                <p className="text-brand-500 text-xs font-black uppercase tracking-widest mt-1 font-sans">Информация • Ресурси</p>
                            </div>
                            <button 
                                onClick={() => setShowProfile(false)}
                                className="p-4 bg-white/5 hover:bg-brand-500 hover:text-[#0A1128] rounded-none text-slate-400 transition-all active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {teamProfile ? (
                            <div className="space-y-12">
                                {teamProfile.image_url && (
                                    <div className="relative aspect-[4/3] rounded-none overflow-hidden border border-white/10 shadow-2xl group">
                                        <img 
                                            src={teamProfile.image_url.includes('blob.vercel-storage.com') ? `/api/blob?url=${encodeURIComponent(teamProfile.image_url)}` : teamProfile.image_url} 
                                            alt="Project" 
                                            className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128] via-transparent to-transparent opacity-60" />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-sans">Концепция</h3>
                                    <p className="text-white text-lg leading-relaxed font-sans">{teamProfile.description}</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-sans">Ресурси</h3>
                                    <div className="grid gap-3">
                                        {teamProfile.project_url && (
                                            <a href={teamProfile.project_url} target="_blank" className="flex items-center justify-between p-6 rounded-none bg-white/[0.02] border border-white/5 hover:border-brand-500 transition-all group shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-none bg-brand-500/10 flex items-center justify-center text-brand-500">
                                                        <ExternalLink className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-white block font-sans">Живо демо / Код</span>
                                                        <span className="text-[10px] text-slate-500 uppercase font-bold font-sans">Project Link</span>
                                                    </div>
                                                </div>
                                                <ArrowLeft className="w-5 h-5 text-slate-800 rotate-180 group-hover:text-brand-500 transition-colors" />
                                            </a>
                                        )}
                                         {teamProfile.presentation_url && (
                                            <a href={teamProfile.presentation_url} target="_blank" className="flex items-center justify-between p-6 rounded-none bg-white/[0.02] border border-white/5 hover:border-[#FF9D00] transition-all group shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-none bg-[#FF9D00]/10 flex items-center justify-center text-[#FF9D00]">
                                                        <FileVideo className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-white block font-sans">Презентация</span>
                                                        <span className="text-[10px] text-slate-500 uppercase font-bold font-sans">Slides / Video</span>
                                                    </div>
                                                </div>
                                                <ArrowLeft className="w-5 h-5 text-slate-800 rotate-180 group-hover:text-[#FF9D00] transition-colors" />
                                            </a>
                                        )}
                                        {teamProfile.links?.map((link, i) => (
                                            <a key={i} href={link.url} target="_blank" className="flex items-center justify-between p-6 rounded-none bg-white/[0.01] border border-white/5 hover:border-white/20 transition-all group text-sm italic font-sans">
                                                <span className="text-slate-500 group-hover:text-white transition-colors truncate pr-4">{link.title}</span>
                                                <ExternalLink className="w-4 h-4 text-slate-800 group-hover:text-white" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-40 text-slate-800 gap-6">
                                <AlertCircle className="w-16 h-16 opacity-10" />
                                <p className="font-bold uppercase tracking-widest text-[10px] font-sans">Липсва информация</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Backdrop for sidebar */}
                {showProfile && (
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[50] animate-in fade-in duration-700"
                        onClick={() => setShowProfile(false)}
                    />
                )}
            </div>

             {/* Sticky Bottom Summary Bar */}
            <div className="fixed bottom-0 left-0 right-0 py-6 px-12 bg-[#0A1128]/95 backdrop-blur-3xl border-t border-white/5 z-[49] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] leading-none mb-2 font-sans opacity-60">ЗАВЪРШЕНИ КРИТЕРИИ</span>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-display font-black text-white">{Object.keys(scores).length}</span>
                            <span className="text-slate-800 font-black text-xl">/</span>
                            <span className="text-slate-600 font-black text-xl">{criteria.length}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleFinish}
                        disabled={isSubmitting}
                        className={`group relative flex items-center gap-4 py-4 px-12 rounded-full font-display font-black text-sm uppercase tracking-[0.2em] transition-all overflow-hidden ${
                            isSubmitting
                            ? "bg-slate-900 text-slate-600 cursor-not-allowed"
                            : "bg-[#C4FF00] hover:bg-white text-[#0A1128] shadow-[0_20px_40px_rgba(196,255,0,0.2)] hover:shadow-[#C4FF00]/10 active:scale-95 translate-y-0 hover:-translate-y-1"
                        }`}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-6 h-6 animate-spin" /> <span className="uppercase tracking-widest text-xs">Запазване...</span></>
                        ) : (
                            <><CheckCircle2 className="w-8 h-8" /> <span className="uppercase tracking-widest">Готово</span></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
