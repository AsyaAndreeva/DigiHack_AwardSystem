"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, Loader2, Link as LinkIcon, FileText, CheckCircle2, ArrowLeft } from "lucide-react";

export default function TeamDashboard() {
    const [teamId, setTeamId] = useState<string | null>(null);
    const [teamName, setTeamName] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Form State
    const [description, setDescription] = useState("");
    const [projectUrl, setProjectUrl] = useState("");
    const [presentationUrl, setPresentationUrl] = useState("");

    // UI State
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        const storedTeamId = localStorage.getItem("teamId");
        const storedTeamName = localStorage.getItem("teamName");

        if (!storedTeamId || !storedTeamName) {
            router.push("/team");
            return;
        }

        setTeamId(storedTeamId);
        setTeamName(storedTeamName);

        // Fetch existing profile if any
        fetchProfile(storedTeamId);
    }, [router]);

    const fetchProfile = async (id: string) => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/team-profile?team_id=${id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.profile) {
                    setDescription(data.profile.description || "");
                    setProjectUrl(data.profile.project_url || "");
                    setPresentationUrl(data.profile.presentation_url || "");
                }
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("teamId");
        localStorage.removeItem("teamName");
        router.push("/team");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsSaving(true);

        try {
            const res = await fetch("/api/team-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    team_id: teamId,
                    description,
                    project_url: projectUrl,
                    presentation_url: presentationUrl,
                }),
            });

            if (!res.ok) throw new Error("Failed to save profile");

            setSuccessMsg("Profile saved successfully! The jury can now review your project.");
            setTimeout(() => setSuccessMsg(null), 5000);
        } catch (err: any) {
            setErrorMsg(err.message || "An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isMounted || !teamId) return null;

    return (
        <div className="animate-in fade-in duration-500">
            <header className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--border)]">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
                        <span className="text-[#FF9D00]">{teamName}</span> Портал
                    </h1>
                    <p className="text-slate-400 text-sm">Обновете подаването на проекта си за журито.</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white px-4 py-2 rounded-full hover:bg-slate-800/50 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">Изход</span>
                </button>
            </header>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 rounded-full border-t-2 border-[#FF9D00] animate-spin"></div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMsg && (
                        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 text-sm">
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-4 bg-[#FF9D00]/10 border border-[#FF9D00]/50 rounded-2xl text-[#FF9D00] text-sm flex items-center shadow-[0_0_15px_rgba(255,157,0,0.1)]">
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            {successMsg}
                        </div>
                    )}

                    <div className="glass p-6 md:p-8 rounded-3xl space-y-8">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-300 ml-1 block flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#FF9D00]" />
                                Описание на идеята (Elevator Pitch)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="В един параграф опишете вашето решение, проблема, който решава, и уникалната му стойност..."
                                rows={5}
                                className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF9D00] focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-300 ml-1 block flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-[#FF9D00]" />
                                URL на проекта (GitHub, Figma, Vercel, Сайт)
                            </label>
                            <input
                                type="url"
                                value={projectUrl}
                                onChange={(e) => setProjectUrl(e.target.value)}
                                placeholder="https://github.com/..."
                                className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF9D00] focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-300 ml-1 block flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-[#FF9D00]" />
                                URL на презентацията (Google Slides, Canva)
                            </label>
                            <input
                                type="url"
                                value={presentationUrl}
                                onChange={(e) => setPresentationUrl(e.target.value)}
                                placeholder="https://docs.google.com/presentation/..."
                                className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF9D00] focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full flex items-center justify-center space-x-2 py-4 px-8 bg-[#FF9D00] hover:bg-[#E68D00] disabled:opacity-50 text-[#0A1128] rounded-full font-bold transition-all duration-300 shadow-[0_0_20px_rgba(255,157,0,0.2)] hover:shadow-[0_0_30px_rgba(255,157,0,0.4)] active:scale-95 group"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Запазва се...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Запази подаването на проекта</span>
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
