"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TEAMS } from "../../constants/teams";
import { Users, ArrowRight, Code } from "lucide-react";

export default function TeamLogin() {
    const [selectedTeam, setSelectedTeam] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        const existing = localStorage.getItem("teamId");
        if (existing) {
            router.push("/team-dashboard");
        }
    }, [router]);

    if (!isMounted) return null;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeam) return;

        // Save team identity
        localStorage.setItem("teamId", selectedTeam);
        const teamName = TEAMS.find(t => t.id === selectedTeam)?.name || selectedTeam;
        localStorage.setItem("teamName", teamName);

        router.push("/team-dashboard");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="mb-10 flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                    <Users className="text-white w-8 h-8" />
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-center tracking-tight">
                    <span className="text-gradient">Hacker</span> Portal
                </h1>
                <p className="text-slate-400 text-center max-w-sm">
                    Select your team to submit your project URL, presentation link, and description for the jury.
                </p>
            </div>

            <div className="w-full max-w-md p-8 rounded-3xl glass animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300 ml-1 block">
                            Team Identity
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Code className="h-5 w-5 text-slate-400" />
                            </div>
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="w-full pl-11 pr-10 py-4 bg-slate-900/50 border border-slate-700 rounded-xl appearance-none text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                required
                            >
                                <option value="" disabled className="bg-slate-900 text-slate-500">
                                    Select your team...
                                </option>
                                {TEAMS.map((team) => (
                                    <option key={team.id} value={team.id} className="bg-slate-900 text-white">
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!selectedTeam}
                        className="w-full flex items-center justify-center space-x-2 py-4 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-brand-500/25 group"
                    >
                        <span>Enter Team Dashboard</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
}
