"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, Loader2, Link as LinkIcon, FileText, CheckCircle2, ArrowLeft, Activity } from "lucide-react";

export default function TeamDashboard() {
    const [teamId, setTeamId] = useState<string | null>(null);
    const [teamName, setTeamName] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Removed themeResources

    // Form State
    const [description, setDescription] = useState("");
    const [projectUrl, setProjectUrl] = useState("");
    const [presentationUrl, setPresentationUrl] = useState("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [links, setLinks] = useState<{title: string, url: string}[]>([]);

    // UI State
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Countdown Timer State
    const [timeLeft, setTimeLeft] = useState<string>("");

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

        // Theme has moved to the main hub
    }, [router]);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date('2026-03-29T13:30:00+03:00').getTime() - new Date().getTime();
            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                
                setTimeLeft(`${days}д ${hours}ч ${minutes}м ${seconds}с`);
            } else {
                setTimeLeft("Времето изтече");
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, []);

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
                    setImageUrl(data.profile.image_url || null);
                    if (data.profile.links && Array.isArray(data.profile.links)) {
                        setLinks(data.profile.links);
                    }
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
        router.push("/");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsSaving(true);

        try {
            let finalImageUrl = imageUrl;

            if (imageFile) {
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', imageFile);
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!uploadRes.ok) throw new Error("Грешка при качване на снимката.");
                
                const uploadData = await uploadRes.json();
                finalImageUrl = uploadData.url;
                setImageUrl(finalImageUrl);
                setIsUploading(false);
            }

            const res = await fetch("/api/team-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    team_id: teamId,
                    description,
                    project_url: projectUrl,
                    presentation_url: presentationUrl,
                    image_url: finalImageUrl,
                    links,
                }),
            });

            if (!res.ok) throw new Error("Failed to save profile");

            setSuccessMsg("Профилът е запазен успешно! Журито вече може да разгледа проекта ви.");
            setTimeout(() => setSuccessMsg(null), 5000);
        } catch (err: any) {
            setErrorMsg(err.message || "An error occurred");
            setIsUploading(false);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isMounted || !teamId) return null;

    return (
        <div className="animate-in fade-in duration-500 min-h-screen">
            {/* Standardized Header */}
            <header className="flex items-center justify-between px-8 py-6 bg-bg-main/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">
                            <span className="text-brand-orange">{teamName}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Профил на отбора</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end mr-4">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1 opacity-60">Оставащо време</span>
                        <div className="text-brand-orange font-mono text-xl font-bold tracking-widest bg-black/40 px-3 py-1 rounded-md border border-brand-orange/20">
                            {timeLeft}
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 py-3 px-6 rounded-md font-display font-black text-[10px] uppercase tracking-widest transition-all bg-white/5 text-slate-400 border border-white/10 hover:bg-red-500 hover:text-white hover:border-red-500"
                    >
                        <LogOut className="w-4 h-4" />
                        Изход
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto py-12 px-4">

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 rounded-full border-t-2 border-brand-orange animate-spin"></div>
                </div>
            ) : (
                <>
                    <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMsg && (
                        <div className="p-5 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-xs font-black uppercase tracking-widest">
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-5 bg-brand-orange/10 border border-brand-orange/50 rounded-md text-brand-orange text-xs font-black uppercase tracking-widest flex items-center shadow-[0_0_20px_rgba(243, 155, 45,0.1)]">
                            <CheckCircle2 className="w-5 h-5 mr-3" />
                            {successMsg}
                        </div>
                    )}

                    <div className="glass p-8 md:p-12 rounded-md border-l-4 border-brand-orange space-y-10 shadow-2xl">
                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-400 ml-1 block flex items-center gap-2 uppercase tracking-widest font-sans">
                                <FileText className="w-4 h-4 text-brand-orange" />
                                Описание на идеята (Elevator Pitch)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="В един параграф опишете вашето решение..."
                                rows={6}
                                className="w-full p-6 bg-black/40 border border-white/10 rounded-md text-white placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F39B2D] focus:border-transparent transition-all font-sans text-lg"
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-400 ml-1 block flex items-center gap-2 uppercase tracking-widest font-sans">
                                <FileText className="w-4 h-4 text-brand-orange" />
                                Основна снимка на проекта
                            </label>
                            {imageUrl && (
                                <div className="mb-4">
                                    <img 
                                        src={imageUrl.includes('blob.vercel-storage.com') ? `/api/blob?url=${encodeURIComponent(imageUrl)}` : imageUrl} 
                                        alt="Project image" 
                                        className="max-h-48 rounded-md border border-white/10 shadow-lg" 
                                    />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setImageFile(e.target.files[0]);
                                    }
                                }}
                                className="w-full text-white file:mr-6 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-brand-orange file:text-brand-dark hover:file:bg-[#E68D00] transition-all cursor-pointer"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-400 ml-1 block flex items-center gap-2 uppercase tracking-widest font-sans">
                                <LinkIcon className="w-4 h-4 text-brand-orange" />
                                URL на проекта (GitHub, Figma, Vercel, Сайт)
                            </label>
                            <input
                                type="url"
                                value={projectUrl}
                                onChange={(e) => setProjectUrl(e.target.value)}
                                placeholder="https://github.com/..."
                                className="w-full p-5 bg-black/40 border border-white/10 rounded-md text-white placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F39B2D] focus:border-transparent transition-all font-sans"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-400 ml-1 block flex items-center gap-2 uppercase tracking-widest font-sans">
                                <LinkIcon className="w-4 h-4 text-brand-orange" />
                                URL на презентацията (Google Slides, Canva)
                            </label>
                            <input
                                type="url"
                                value={presentationUrl}
                                onChange={(e) => setPresentationUrl(e.target.value)}
                                placeholder="https://docs.google.com/presentation/..."
                                className="w-full p-5 bg-black/40 border border-white/10 rounded-md text-white placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F39B2D] focus:border-transparent transition-all font-sans"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-400 ml-1 block flex items-center gap-2 uppercase tracking-widest font-sans">
                                <LinkIcon className="w-4 h-4 text-brand-orange" />
                                Допълнителни линкове
                            </label>
                            {links.map((link, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="Заглавие"
                                        value={link.title}
                                        onChange={(e) => {
                                            const newLinks = [...links];
                                            newLinks[idx].title = e.target.value;
                                            setLinks(newLinks);
                                        }}
                                        className="w-1/3 p-4 bg-black/40 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#F39B2D] transition-all font-sans"
                                    />
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={link.url}
                                        onChange={(e) => {
                                            const newLinks = [...links];
                                            newLinks[idx].url = e.target.value;
                                            setLinks(newLinks);
                                        }}
                                        className="flex-1 p-4 bg-black/40 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#F39B2D] transition-all font-sans"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                                        className="p-4 text-red-500 hover:bg-red-500/10 rounded-md transition-colors shrink-0 border border-white/5"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setLinks([...links, { title: "", url: "" }])}
                                className="text-xs font-black uppercase tracking-widest text-brand-orange hover:text-white transition-colors"
                            >
                                + Добави линк
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full flex items-center justify-center space-x-2 py-4 px-8 bg-brand-orange hover:bg-[#E68D00] disabled:opacity-50 text-brand-dark rounded-full font-bold transition-all duration-300 shadow-[0_0_20px_rgba(243, 155, 45,0.2)] hover:shadow-[0_0_30px_rgba(243, 155, 45,0.4)] active:scale-95 group"
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
                </>
            )}
            </main>
        </div>
    );
}
