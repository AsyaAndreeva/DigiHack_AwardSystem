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
                <Loader2 className="w-8 h-8 animate-spin text-brand-light-blue" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 min-h-screen bg-[#070b1a]">
            {/* Top Focused Header */}
            <header className="flex items-center justify-between px-8 py-4 bg-bg-main/80 backdrop-blur-md border-b border-white/5 relative z-[30]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-brand-dark transition-all group"
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
                        <span className="text-2xl font-display font-black text-brand-light-blue">{Object.keys(scores).length * 10}</span>
                        <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest font-sans">точки</span>
                      </div>
                    </div>
                    
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className={`flex items-center gap-2 py-3 px-6 rounded-full font-display font-black text-[10px] uppercase tracking-widest transition-all border ${
                            showProfile 
                            ? "bg-white text-brand-dark border-white" 
                            : "bg-brand-orange/10 text-brand-orange border-brand-orange/20 hover:bg-brand-orange hover:text-brand-dark"
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
                                className={`group flex items-center justify-between p-4 rounded-md text-left text-xs font-bold transition-all border shadow-sm ${
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
                                    <div className="w-4 h-4 rounded-md border border-white/10 shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </aside>

                {/* Center: Evaluation Feed */}
                <main className="flex-1 min-w-0 space-y-16">
                    {error && (
                        <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-md flex items-center gap-4 text-red-400 text-sm animate-in slide-in-from-top-4">
                            <AlertCircle className="w-6 h-6 shrink-0" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {/* Loading State */}
                    {criteria.length === 0 ? (
                        <div className="glass p-20 rounded-md text-center border-dashed border-2 border-white/5">
                            <Loader2 className="w-10 h-10 animate-spin text-brand-light-blue mx-auto mb-4" />
                            <p className="text-slate-500 font-medium font-sans">Конфигуриране на сесията...</p>
                        </div>
                    ) : (
                        <>
                        {/* Generic Rubric Advice */}
                        <div className="glass rounded-md p-6 md:p-8 border border-white/5 border-l-4 border-l-brand-light-blue shadow-lg mb-8 bg-white/[0.02]">
                            <h3 className="text-white font-display font-bold text-lg mb-4 flex items-center gap-2 tracking-tight">
                                <FileText className="w-5 h-5 text-brand-light-blue" />
                                Съвети как да използвате тези критерии (Скала от 0 до 10)
                            </h3>
                            <ul className="space-y-4 font-sans text-sm text-slate-300">
                                <li><strong className="text-white">10 точки (Изключително ниво / "Wow" ефект):</strong> Перфектно изпълнение. Проектът надхвърля очакванията, готов е за професионална среда и демонстрира изключително внимание към детайла.</li>
                                <li><strong className="text-white">8-9 точки (Много добро / Отлично изпълнение):</strong> Солидна, завършена и качествена работа. Отборът е покрил всички изисквания на критерия, като може да има само много дребни, незначителни пропуски.</li>
                                <li><strong className="text-white">6-7 точки (Добро изпълнение, но с пропуски):</strong> Положена е добра основа и логиката е правилна, но липсват детайли, завършеност или изпипване в някои аспекти. Има видим потенциал, който се нуждае от доработка.</li>
                                <li><strong className="text-white">3-5 точки (Базово / Посредствено изпълнение):</strong> Категорията е засегната само повърхностно. Налице са сериозни логически, технически, визуални или бизнес пропуски, които пречат на цялостното възприемане на продукта.</li>
                                <li><strong className="text-white">1-2 точки (Слаба разработка):</strong> Едва загатнато или некачествено изпълнение, което изобщо не отговаря на стандартите на хакатона.</li>
                                <li><strong className="text-white">0 точки:</strong> Напълно липсващ елемент в проекта или презентацията.</li>
                            </ul>
                        </div>
                        
                        {Object.entries(grouped).map(([category, crits]) => (
                            <section key={category} id={`category-${category}`} className="space-y-8 scroll-mt-32">
                                <div className="flex flex-col gap-3 pl-2 border-l-2 border-brand-light-blue/30">
                                    <h2 className="text-3xl font-display font-bold text-white tracking-tight uppercase">{category}</h2>
                                    {crits[0]?.scoring_guide && (
                                        <div className="mt-2 font-sans italic text-slate-400 text-sm max-w-2xl leading-relaxed opacity-80" dangerouslySetInnerHTML={{ __html: crits[0].scoring_guide }} />
                                    )}
                                </div>

                                <div className="grid gap-8">
                                    {crits.map(c => {
                                        const selected = scores[String(c.id)];
                                        const scoreOptions = Array.from({ length: c.max_score + 1 }, (_, i) => i);
                                        const guideLines = c.scoring_guide ? c.scoring_guide.split('\n').filter(Boolean) : [];

                                        return (
                                            <div key={c.id} id={`criterion-${c.id}`} className="glass rounded-md p-8 md:p-10 border border-white/5 hover:border-white/10 transition-all relative overflow-hidden group shadow-xl bg-white/[0.01]">
                                                {/* Background Accent */}
                                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-light-blue/5 rounded-md blur-[80px] group-hover:bg-brand-light-blue/10 transition-colors" />
                                                
                                                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                                                    <div className="max-w-2xl">
                                                        <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-3 tracking-tight">{c.criterion}</h3>
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <div className="px-2.5 py-1 rounded-md bg-brand-light-blue/10 text-brand-light-blue text-[10px] uppercase font-black tracking-widest border border-brand-light-blue/20">
                                                                до {c.max_score} точки
                                                            </div>
                                                            {selected !== undefined && (
                                                                <div className="text-[10px] text-brand-light-blue font-bold uppercase flex items-center gap-1 font-sans">
                                                                    <CheckCircle2 className="w-3 h-3" /> Оценено
                                                                </div>
                                                            )}
                                                        </div>
                                                        {c.description && (
                                                            <div className="text-slate-300 text-sm font-sans leading-relaxed opacity-90 mb-2" dangerouslySetInnerHTML={{ __html: c.description }} />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 sm:gap-3 relative z-10 w-full mt-2">
                                                    {scoreOptions.map(score => {
                                                        const isSelected = selected === score;

                                                        return (
                                                            <button
                                                                key={score}
                                                                onClick={() => handleScoreChange(c.id, score)}
                                                                className={`group/score relative flex-1 min-w-[3rem] sm:min-w-[4rem] flex-col items-center justify-center py-4 rounded-md border transition-all duration-300 shadow-sm ${
                                                                    isSelected
                                                                    ? "bg-brand-light-blue border-brand-light-blue text-brand-dark shadow-2xl scale-105 z-10 font-bold"
                                                                    : "bg-white/[0.03] border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:scale-105"
                                                                }`}
                                                            >
                                                                 <span className={`text-xl sm:text-2xl font-display font-black leading-none ${isSelected ? 'text-brand-dark' : 'text-white'}`}>
                                                                    {score}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                        </>
                    )}
                    {/* Final Comments Area */}
                     <section className="pt-12 pb-32">
                        <div className="glass rounded-md p-10 border border-white/5 shadow-2xl">
                           <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-md bg-white/5 flex items-center justify-center text-brand-light-blue">
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
                                className="w-full p-8 bg-black/40 border border-white/10 rounded-md text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-light-blue focus:border-transparent transition-all resize-none text-xl font-sans"
                            />
                        </div>
                    </section>
                </main>

                {/* Right: Team Reference Hub */}
                <div 
                    className={`fixed top-0 right-0 h-full bg-bg-main border-l border-white/5 z-[60] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_0_100px_rgba(0,0,0,0.8)] ${
                        showProfile ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
                    } w-full max-w-lg`}
                >
                    <div className="h-full flex flex-col p-10 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-3xl font-display font-bold text-white">Проект</h2>
                                <p className="text-brand-light-blue text-xs font-black uppercase tracking-widest mt-1 font-sans">Информация • Ресурси</p>
                            </div>
                            <button 
                                onClick={() => setShowProfile(false)}
                                className="p-4 bg-white/5 hover:bg-brand-light-blue hover:text-brand-dark rounded-md text-slate-400 transition-all active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {teamProfile ? (
                            <div className="space-y-12">
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

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-sans">Концепция</h3>
                                    <p className="text-white text-lg leading-relaxed font-sans">{teamProfile.description}</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-sans">Ресурси</h3>
                                    <div className="grid gap-3">
                                        {teamProfile.project_url && (
                                            <a href={teamProfile.project_url} target="_blank" className="flex items-center justify-between p-6 rounded-md bg-white/[0.02] border border-white/5 hover:border-brand-light-blue transition-all group shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-md bg-brand-light-blue/10 flex items-center justify-center text-brand-light-blue">
                                                        <ExternalLink className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-white block font-sans">Живо демо / Код</span>
                                                        <span className="text-[10px] text-slate-500 uppercase font-bold font-sans">Project Link</span>
                                                    </div>
                                                </div>
                                                <ArrowLeft className="w-5 h-5 text-slate-800 rotate-180 group-hover:text-brand-light-blue transition-colors" />
                                            </a>
                                        )}
                                         {teamProfile.presentation_url && (
                                            <a href={teamProfile.presentation_url} target="_blank" className="flex items-center justify-between p-6 rounded-md bg-white/[0.02] border border-white/5 hover:border-brand-orange transition-all group shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-md bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                                                        <FileVideo className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-white block font-sans">Презентация</span>
                                                        <span className="text-[10px] text-slate-500 uppercase font-bold font-sans">Slides / Video</span>
                                                    </div>
                                                </div>
                                                <ArrowLeft className="w-5 h-5 text-slate-800 rotate-180 group-hover:text-brand-orange transition-colors" />
                                            </a>
                                        )}
                                        {teamProfile.links?.map((link, i) => (
                                            <a key={i} href={link.url} target="_blank" className="flex items-center justify-between p-6 rounded-md bg-white/[0.01] border border-white/5 hover:border-white/20 transition-all group text-sm italic font-sans">
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
            <div className="fixed bottom-0 left-0 right-0 py-2 px-6 bg-bg-main/95 backdrop-blur-xl border-t border-white/5 z-[49] shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] leading-none mb-1 font-sans opacity-60">ЗАВЪРШЕНИ КРИТЕРИИ</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-display font-black text-white">{Object.keys(scores).length}</span>
                            <span className="text-slate-800 font-black text-sm">/</span>
                            <span className="text-slate-600 font-black text-sm">{criteria.length}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleFinish}
                        disabled={isSubmitting}
                        className={`group relative flex items-center gap-2 py-2 px-6 rounded-full font-display font-black text-[10px] uppercase tracking-[0.1em] transition-all overflow-hidden ${
                            isSubmitting
                            ? "bg-slate-900 text-slate-600 cursor-not-allowed"
                            : "bg-brand-light-blue hover:bg-white text-brand-dark shadow-[0_10px_20px_color-mix(in_srgb,var(--color-brand-light-blue)_15%,transparent)] hover:shadow-brand-light-blue/10 active:scale-95 translate-y-0 hover:-translate-y-px"
                        }`}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> <span className="uppercase tracking-widest text-[8px]">Запазване...</span></>
                        ) : (
                            <><CheckCircle2 className="w-4 h-4" /> <span className="uppercase tracking-widest">Готово</span></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
