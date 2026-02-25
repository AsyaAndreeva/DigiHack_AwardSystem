"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { TEAMS } from "../../../constants/teams";
import { RUBRIC } from "../../../constants/rubric";
import { ArrowLeft, Loader2, Send, CheckCircle2, FileText, FileVideo, ExternalLink } from "lucide-react";
import Link from "next/navigation";

type TeamProfile = {
    description?: string;
    project_url?: string;
    presentation_url?: string;
};

export default function EvaluateTeam({ params }: { params: Promise<{ teamId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();

    const [juryName, setJuryName] = useState<string | null>(null);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [comments, setComments] = useState("");
    const [teamProfile, setTeamProfile] = useState<TeamProfile | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const team = TEAMS.find((t) => t.id === resolvedParams.teamId);

    useEffect(() => {
        setIsMounted(true);
        const storedName = localStorage.getItem("juryName");
        if (!storedName) {
            router.push("/");
            return;
        }
        setJuryName(storedName);

        // Fetch the team profile if it exists
        const loadProfile = async () => {
            try {
                const res = await fetch(`/api/team-profile?team_id=${resolvedParams.teamId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile) setTeamProfile(data.profile);
                }
            } catch (err) {
                console.error("Could not load team profile", err);
            }
        };

        loadProfile();
    }, [router, resolvedParams.teamId]);

    if (!isMounted || !juryName || !team) return null;

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    // Calculate total max possible score from rubric
    const maxPossibleScore = RUBRIC.reduce((categorySum, category) =>
        categorySum + category.criteria.reduce((critSum, crit) => critSum + crit.maxScore, 0)
        , 0);

    const handleScoreChange = (criterionId: string, value: number) => {
        setScores((prev) => ({ ...prev, [criterionId]: value }));
    };

    const handleSubmit = async () => {
        // Basic validation: ensure all criteria have a score
        const allCriteriaIds = RUBRIC.flatMap(c => c.criteria.map(crit => crit.id));
        const missingScores = allCriteriaIds.filter(id => scores[id] === undefined);

        if (missingScores.length > 0) {
            setError("Please complete all evaluation criteria before submitting.");

            // Attempt to scroll to the first missing one
            const element = document.getElementById(`criterion-${missingScores[0]}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-red-500', 'rounded-xl', 'animate-pulse');
                setTimeout(() => element.classList.remove('ring-2', 'ring-red-500', 'rounded-xl', 'animate-pulse'), 2000);
            }
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const payload = {
                juryName,
                teamName: team.name,
                scores,
                totalScore,
                comments, // Added comments to payload
            };

            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Submission failed");
            }

            // Mark team as evaluated in localStorage
            const storedEvaluations = localStorage.getItem("evaluatedTeams");
            const evaluatedTeams = storedEvaluations ? JSON.parse(storedEvaluations) : {};
            evaluatedTeams[team.id] = true;
            localStorage.setItem("evaluatedTeams", JSON.stringify(evaluatedTeams));

            // Redirect back to dashboard
            router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred while submitting. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pb-24 animate-in fade-in duration-500">
            <header className="sticky top-0 z-50 pt-2 pb-4 mb-8 bg-background/80 backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-display font-bold text-white">{team.name}</h1>
                    <p className="text-xs text-brand-400 font-medium tracking-wide uppercase">Evaluation</p>
                </div>
                <div className="w-10"></div> {/* Spacer for centering */}
            </header>

            {/* Team Profile Overview Card */}
            {teamProfile && (
                <div className="mb-10 glass p-6 rounded-2xl border-l-4 border-l-brand-500 shadow-xl w-full">
                    <h2 className="text-xl font-display font-bold text-white mb-3">Project Overview</h2>

                    {teamProfile.description && (
                        <div className="mb-5">
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {teamProfile.description}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                        {teamProfile.project_url && (
                            <a
                                href={teamProfile.project_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-brand-300 hover:text-brand-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span>View Project</span>
                                <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                            </a>
                        )}

                        {teamProfile.presentation_url && (
                            <a
                                href={teamProfile.presentation_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                            >
                                <FileVideo className="w-4 h-4" />
                                <span>Pitch Deck</span>
                                <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                            </a>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                    {error}
                </div>
            )}

            <div className="space-y-12">
                {RUBRIC.map((category) => (
                    <div key={category.id} className="space-y-6">
                        <div className="flex items-center space-x-4 border-b border-brand-500/20 pb-2">
                            <h2 className="text-2xl font-display font-bold text-gradient">{category.title}</h2>
                            <span className="bg-brand-500/20 text-brand-300 text-xs px-2 py-1 rounded flex-shrink-0">
                                Max {category.maxScore} pts
                            </span>
                        </div>

                        <div className="space-y-8">
                            {category.criteria.map((criterion) => (
                                <div
                                    id={`criterion-${criterion.id}`}
                                    key={criterion.id}
                                    className="glass p-5 md:p-6 rounded-2xl transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4 gap-4">
                                        <h3 className="font-semibold text-white text-lg">{criterion.title}</h3>
                                        <div className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm shrink-0 font-medium">
                                            Score: <span className={scores[criterion.id] !== undefined ? "text-brand-400" : ""}>
                                                {scores[criterion.id] !== undefined ? scores[criterion.id] : "-"}
                                            </span> / {criterion.maxScore}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {criterion.scores.map((scoreDef) => {
                                            const isSelected = scores[criterion.id] === scoreDef.value;
                                            return (
                                                <button
                                                    key={`${criterion.id}-${scoreDef.value}`}
                                                    onClick={() => handleScoreChange(criterion.id, scoreDef.value)}
                                                    className={`
                            relative text-left p-4 rounded-xl border transition-all duration-200
                            ${isSelected
                                                            ? "bg-brand-600/20 border-brand-500 text-white shadow-[0_0_15px_rgba(101,123,242,0.15)] transform scale-[1.02]"
                                                            : "bg-slate-900/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600 hover:text-slate-200"
                                                        }
                          `}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2">
                                                            <CheckCircle2 className="w-4 h-4 text-brand-400" />
                                                        </div>
                                                    )}
                                                    <div className="text-2xl font-display font-bold mb-1 opacity-90">
                                                        {scoreDef.value}
                                                    </div>
                                                    <div className={`text-sm ${isSelected ? "text-slate-200" : "text-slate-500"}`}>
                                                        {scoreDef.label}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Jury Comments */}
            <div className="mt-12 mb-8 glass p-6 rounded-2xl w-full">
                <h2 className="text-xl font-display font-bold text-white mb-3">Overall Jury Comments (Optional)</h2>
                <p className="text-slate-400 text-sm mb-4">
                    Leave constructive feedback for the team or notes for final deliberations.
                </p>
                <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="I loved how they solved..."
                    rows={4}
                    className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                />
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-[var(--border)] z-40 transform translate-y-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="container mx-auto max-w-3xl flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Score</span>
                        <div className="text-2xl font-display font-bold text-white flex items-baseline">
                            {totalScore} <span className="text-sm text-slate-500 font-normal ml-1">/ {maxPossibleScore}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`
              flex-1 max-w-sm flex items-center justify-center space-x-2 py-3 px-6 rounded-xl font-medium transition-all
              ${isSubmitting
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 active:scale-95"
                            }
            `}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <>
                                <span>Submit Evaluation</span>
                                <Send className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
