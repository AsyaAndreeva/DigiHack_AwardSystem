"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Link as LinkIcon, Loader2 } from "lucide-react";

type ThemeData = { title: string; description: string; links: {title: string, url: string}[] };

export default function ThemePage() {
    const router = useRouter();
    const [themeData, setThemeData] = useState<ThemeData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data.success && data.theme_resources) {
                    try {
                        setThemeData(JSON.parse(data.theme_resources));
                    } catch {
                        setThemeData({ title: "Тема на Хакатона", description: data.theme_resources, links: [] });
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-pink animate-spin" />
            </div>
        );
    }

    if (!themeData) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center">
                <p className="text-slate-400 mb-6 font-display uppercase tracking-widest">Няма публикувана тема.</p>
                <button onClick={() => router.push('/')} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-md transition-all uppercase text-xs font-black tracking-widest">
                    Назад
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-500">
            <button 
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 text-sm font-black uppercase tracking-widest group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Назад към портала
            </button>

            <div className="glass rounded-md border-l-4 border-brand-pink p-8 md:p-12 shadow-2xl relative overflow-hidden bg-white/[0.02]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#EA4C64]/0 via-[#EA4C64]/50 to-[#EA4C64]/0 opacity-50"></div>
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-md bg-brand-pink/10 flex items-center justify-center shrink-0 border border-brand-pink/20">
                        <FileText className="w-8 h-8 text-brand-pink" />
                    </div>
                    <div>
                        <span className="text-brand-pink text-xs font-black uppercase tracking-widest bg-brand-pink/10 px-3 py-1 rounded-full mb-2 inline-block border border-brand-pink/20">
                            {themeData.title || "Официално Задание"}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight">
                            Тема на Хакатона
                        </h1>
                    </div>
                </div>

                <div className="prose prose-invert prose-lg max-w-none text-slate-300 font-sans whitespace-pre-wrap leading-relaxed mb-12">
                    {themeData.description}
                </div>

                {themeData.links && themeData.links.length > 0 && (
                    <div className="border-t border-white/10 pt-8 mt-8">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <LinkIcon className="w-5 h-5" /> Контекст и Полезни Линкове
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {themeData.links.map((link, idx) => link.url && (
                                <a 
                                    key={idx} 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-4 p-5 bg-black/40 hover:bg-white/5 border border-white/5 hover:border-brand-pink/50 rounded-md transition-all group shadow-lg"
                                >
                                    <div className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center shrink-0 group-hover:bg-brand-pink transition-colors border border-brand-pink/20">
                                        <LinkIcon className="w-5 h-5 text-brand-pink group-hover:text-brand-dark" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-300 group-hover:text-white uppercase tracking-widest line-clamp-2">
                                        {link.title || link.url}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
