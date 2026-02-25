"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
    ArrowLeft, Loader2, Send, CheckCircle2,
    FileText, FileVideo, ExternalLink, AlertCircle
} from "lucide-react";

type TeamProfile = {
    description?: string;
    project_url?: string;
    presentation_url?: string;
};

type Criterion = {
    id: number;
    category: string;
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

    const handleScoreChange = (criterionId: number, value: number) => {
        setScores(prev => ({ ...prev, [String(criterionId)]: value }));
    };

    const handleSubmit = async () => {
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

            // Mark as evaluated in localStorage
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
        <div className="animate-in fade-in duration-500 max-w-3xl mx-auto pb-32">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Назад
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white">{teamName}</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Оценявате като <span className="text-[#C4FF00] font-bold">{juryName}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Текущ резултат</p>
                    <p className="text-2xl font-display font-bold text-white">
                        {totalScore}
                        <span className="text-sm text-slate-500 font-normal ml-1">/ {maxPossibleScore}</span>
                    </p>
                </div>
            </div>

            {/* Team Profile Card */}
            {teamProfile && (teamProfile.description || teamProfile.project_url || teamProfile.presentation_url) && (
                <div className="mb-8 glass p-6 rounded-3xl border-l-4 border-l-[#C4FF00] shadow-xl">
                    <h2 className="text-lg font-bold text-white mb-3">Профил на проекта</h2>
                    {teamProfile.description && (
                        <p className="text-slate-300 text-sm leading-relaxed mb-4">{teamProfile.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                        {teamProfile.project_url && (
                            <a
                                href={teamProfile.project_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-[#C4FF00]/10 hover:bg-[#C4FF00]/20 text-[#C4FF00] px-4 py-2 rounded-full text-sm font-bold transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Преглед на проекта</span>
                                <ExternalLink className="w-3 h-3 opacity-50" />
                            </a>
                        )}
                        {teamProfile.presentation_url && (
                            <a
                                href={teamProfile.presentation_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-[#FF9D00]/10 hover:bg-[#FF9D00]/20 text-[#FF9D00] px-4 py-2 rounded-full text-sm font-bold transition-colors"
                            >
                                <FileVideo className="w-4 h-4" />
                                <span>Презентация</span>
                                <ExternalLink className="w-3 h-3 opacity-50" />
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-2xl flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Rubric Criteria */}
            {criteria.length === 0 ? (
                <div className="glass p-10 rounded-3xl text-center">
                    <p className="text-slate-400">Все още няма добавени критерии за оценяване. Моля, добавете ги от администраторския панел.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([category, crits]) => (
                        <div key={category} className="glass rounded-3xl overflow-hidden">
                            {/* Category header */}
                            <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-700/50">
                                <h3 className="font-display font-bold text-[#C4FF00] text-sm uppercase tracking-wider">{category}</h3>
                            </div>
                            <div className="p-4 space-y-4">
                                {crits.map(c => {
                                    const selected = scores[String(c.id)];
                                    const scoreOptions = Array.from({ length: c.max_score + 1 }, (_, i) => i);
                                    // Parse scoring guide lines
                                    const guideLines = c.scoring_guide
                                        ? c.scoring_guide.split('\n').filter(Boolean)
                                        : [];

                                    return (
                                        <div key={c.id} id={`criterion-${c.id}`} className="bg-slate-900/30 rounded-2xl p-5 border border-slate-700/30">
                                            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                                                <h4 className="font-bold text-white">{c.criterion}</h4>
                                                <span className="text-xs font-bold bg-[#C4FF00]/10 text-[#C4FF00] border border-[#C4FF00]/20 px-2 py-1 rounded-full">
                                                    до {c.max_score} т.
                                                </span>
                                            </div>

                                            {/* Score buttons */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                                                {scoreOptions.map(score => {
                                                    const isSelected = selected === score;
                                                    const guide = guideLines.find(l => l.startsWith(`${score} т.`) || l.startsWith(`${score} т `));
                                                    return (
                                                        <button
                                                            key={score}
                                                            onClick={() => handleScoreChange(c.id, score)}
                                                            className={`relative text-left p-3 rounded-2xl border transition-all duration-200 ${isSelected
                                                                ? "bg-[#C4FF00]/10 border-[#C4FF00] text-white shadow-[0_0_12px_rgba(196,255,0,0.15)] scale-[1.02]"
                                                                : "bg-slate-900/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600 hover:text-slate-200"
                                                                }`}
                                                        >
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C4FF00]" />
                                                                </div>
                                                            )}
                                                            <div className="text-2xl font-display font-bold mb-0.5">{score}</div>
                                                            <div className="text-xs opacity-70 leading-tight line-clamp-2">
                                                                {guide ? guide.replace(/^\d+ т[. ]*/, '') : `${score} точки`}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Comments */}
            <div className="mt-6 glass p-6 rounded-3xl">
                <h3 className="font-bold text-white mb-3">Общи коментари за отбора</h3>
                <textarea
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    placeholder="Опционални коментари за журито — силни страни, слабости, насоки за подобрение..."
                    rows={4}
                    className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C4FF00] focus:border-transparent transition-all resize-none text-sm"
                />
            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A1128]/95 backdrop-blur-md border-t border-slate-800 z-40">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div className="text-sm text-slate-400">
                        <span className="text-white font-bold text-lg">{totalScore}</span>
                        <span className="mx-1">/</span>
                        <span>{maxPossibleScore} точки</span>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`flex items-center gap-2 py-3.5 px-7 rounded-full font-bold transition-all ${isSubmitting
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-[#C4FF00] hover:bg-[#a1d600] text-[#0A1128] shadow-[0_0_20px_rgba(196,255,0,0.2)] active:scale-95"
                            }`}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Изпращане...</>
                        ) : (
                            <><Send className="w-5 h-5" /> Изпрати оценката</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
