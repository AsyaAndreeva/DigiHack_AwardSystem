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
                        Welcome, <span className="text-brand-500">{juryName}</span>
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
                <div className="glass rounded-3xl p-6 flex flex-col">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-500 shadow-[0_0_15px_rgba(196,255,0,0.15)]">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Your Progress</h2>
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

                <div className="glass rounded-3xl p-6 flex flex-col justify-center border-slate-700/30">
                    <div className="flex items-center space-x-3 mb-1">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF9D00]/20 flex items-center justify-center text-[#FF9D00] shadow-[0_0_15px_rgba(255,157,0,0.15)]">
                            <Users className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Teams</h2>
                    </div>
                    <p className="text-4xl font-display font-bold text-white mt-2">
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
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl transition-all ${isEvaluated ? "bg-slate-800 text-slate-500" : "bg-brand-500/20 text-brand-500 group-hover:bg-brand-500 group-hover:text-[#0A1128]"
                                    }`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-xl ${isEvaluated ? "text-slate-400" : "text-white"}`}>
                                        {team.name}
                                    </h3>
                                    <p className={`text-sm ${isEvaluated ? "text-slate-600" : "text-slate-400"}`}>
                                        {isEvaluated ? "Evaluation Submitted" : "Pending Evaluation"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                {isEvaluated ? (
                                    <CheckCircle2 className="w-8 h-8 text-[#FF5733] opacity-80" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#C4FF00] group-hover:text-[#0A1128] transition-colors text-slate-400 shadow-sm">
                                        <ChevronRight className="w-6 h-6" />
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
