"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { JURY_MEMBERS } from "../constants/teams";
import { User, ArrowRight, Code } from "lucide-react";

export default function Home() {
    const [selectedJury, setSelectedJury] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    // Prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
        const existing = localStorage.getItem("juryName");
        if (existing) {
            router.push("/dashboard");
        }
    }, [router]);

    if (!isMounted) return null;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJury) return;

        // Find the name mapped to that ID just to keep it clean, or just save ID
        const juryName = JURY_MEMBERS.find(j => j.id === selectedJury)?.name || selectedJury;
        localStorage.setItem("juryName", juryName);
        router.push("/dashboard");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="mb-10 flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
                    <Code className="text-white w-8 h-8" />
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-center tracking-tight">
                    <span className="text-gradient">Hackathon</span> Judging
                </h1>
                <p className="text-slate-400 text-center max-w-sm">
                    Select your jury profile to begin evaluating the participating teams.
                </p>
            </div>

            <div className="w-full max-w-md p-8 rounded-3xl glass animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300 ml-1 block">
                            Jury Identity
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400" />
                            </div>
                            <select
                                value={selectedJury}
                                onChange={(e) => setSelectedJury(e.target.value)}
                                className="w-full pl-11 pr-10 py-4 bg-slate-900/50 border border-slate-700 rounded-xl appearance-none text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                required
                            >
                                <option value="" disabled className="bg-slate-900 text-slate-500">
                                    Select your profile...
                                </option>
                                {JURY_MEMBERS.map((jury) => (
                                    <option key={jury.id} value={jury.id} className="bg-slate-900 text-white">
                                        {jury.name}
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
                        disabled={!selectedJury}
                        className="w-full flex items-center justify-center space-x-2 py-4 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-brand-500/25 group"
                    >
                        <span>Enter Dashboard</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
}
