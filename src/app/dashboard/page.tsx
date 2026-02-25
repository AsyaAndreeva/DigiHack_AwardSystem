"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TEAMS } from "../../constants/teams";
import { LogOut, CheckCircle2, ChevronRight, Users, Activity } from "lucide-react";
import Link from "next/navigation"; // Not used directly here to manage state carefully

export default function Dashboard() {
    const [juryName, setJuryName] = useState<string | null>(null);
    const [evaluatedTeams, setEvaluatedTeams] = useState<Record<string, boolean>>({});
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        const storedName = localStorage.getItem("juryName");
        if (!storedName) {
            router.push("/");
            return;
        }
        setJuryName(storedName);

        // Load evaluated teams
        const storedEvaluations = localStorage.getItem("evaluatedTeams");
        if (storedEvaluations) {
            try {
                setEvaluatedTeams(JSON.parse(storedEvaluations));
            } catch (e) {
                console.error("Failed to parse evaluatedTeams", e);
            }
        }
    }, [router]);

    if (!isMounted || !juryName) return null;

    const handleLogout = () => {
        localStorage.removeItem("juryName");
        router.push("/");
    };

    const handleTeamClick = (teamId: string) => {
        router.push(`/evaluate/${teamId}`);
    };

    const completedCount = Object.keys(evaluatedTeams).length;
    const totalCount = TEAMS.length;
    const progressPercentage = Math.round((completedCount / totalCount) * 100);

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--border)]">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
                        Welcome, <span className="text-brand-400">{juryName}</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Hackathon Evaluation Dashboard</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">Switch Profile</span>
                </button>
            </header>

            {/* Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="glass rounded-2xl p-6 flex flex-col">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-medium text-white">Your Progress</h2>
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                        <div className="flex justify-between text-sm mb-2 text-slate-300">
                            <span>{completedCount} evaluated</span>
                            <span>{totalCount} total</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-brand-500 h-2.5 rounded-full transition-all duration-1000 ease-out relative"
                                style={{ width: `${progressPercentage}%` }}
                            >
                                <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-6 flex flex-col justify-center border-emerald-500/20">
                    <div className="flex items-center space-x-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Users className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-medium text-white">Teams</h2>
                    </div>
                    <p className="text-3xl font-display font-bold text-white mt-2">
                        {completedCount} <span className="text-xl text-slate-500 font-normal">/ {totalCount}</span>
                    </p>
                </div>
            </div>

            {/* Teams List */}
            <h2 className="text-xl font-display font-semibold text-white mb-4 flex items-center">
                Participating Teams
            </h2>

            <div className="space-y-3">
                {TEAMS.map((team, index) => {
                    const isEvaluated = !!evaluatedTeams[team.id];

                    return (
                        <div
                            key={team.id}
                            onClick={() => handleTeamClick(team.id)}
                            className={`group flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all duration-300 ${isEvaluated
                                ? "bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 opacity-80"
                                : "glass glass-hover transform hover:-translate-y-1"
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg ${isEvaluated ? "bg-slate-700/50 text-slate-400" : "bg-brand-500/20 text-brand-400"
                                    }`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className={`font-medium text-lg ${isEvaluated ? "text-slate-300" : "text-white"}`}>
                                        {team.name}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {isEvaluated ? "Evaluation Submitted" : "Pending Evaluation"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                {isEvaluated ? (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors text-slate-400">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
