"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Users, Shield, BarChart3, ArrowRight, Play, FileText, Link as LinkIcon } from "lucide-react";

const portals = [
    {
        href: "/jury",
        icon: Shield,
        title: "Портал на Журито",
        subtitle: "Вход за членове на журито",
        color: "light-blue",
        border: "border-brand-light-blue/30 hover:border-brand-light-blue",
        iconBg: "bg-brand-light-blue",
        iconColor: "text-brand-dark",
        glow: "hover:shadow-[0_0_30px_color-mix(in_srgb,var(--color-brand-light-blue)_15%,transparent)]",
        badge: "Жури",
        badgeClass: "bg-brand-light-blue/10 text-brand-light-blue border-brand-light-blue/20",
    },
    {
        href: "/team",
        icon: Users,
        title: "Портал на Отборите",
        subtitle: "Вход за участващи отбори",
        color: "orange",
        border: "border-brand-orange/30 hover:border-brand-orange",
        iconBg: "bg-brand-orange",
        iconColor: "text-brand-dark",
        glow: "hover:shadow-[0_0_30px_rgba(243, 155, 45,0.15)]",
        badge: "Отбор",
        badgeClass: "bg-brand-orange/10 text-brand-orange border-brand-orange/20",
    },
    {
        href: "/results",
        icon: BarChart3,
        title: "Резултати На Живо",
        subtitle: "Класация в реално време",
        color: "gold",
        border: "border-brand-yellow/30 hover:border-brand-yellow",
        iconBg: "bg-brand-yellow",
        iconColor: "text-brand-dark",
        glow: "hover:shadow-[0_0_30px_rgba(218, 234, 95,0.15)]",
        badge: "",
        badgeClass: "bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20",
    },
    {
        href: "/admin",
        icon: Trophy,
        title: "Администратор",
        subtitle: "Управление на системата",
        color: "blue",
        border: "border-brand-blue/30 hover:border-brand-light-blue",
        iconBg: "bg-brand-blue",
        iconColor: "text-brand-light-blue",
        glow: "hover:shadow-[0_0_30px_rgba(27,41,104,0.15)]",
        badge: "",
        badgeClass: "bg-brand-blue/50 text-brand-light-blue border-brand-blue/30",
    },
];

export default function HubPage() {
    const router = useRouter();
    type ThemeData = { title: string; description: string; links: {title: string, url: string}[] };
    const [themeData, setThemeData] = useState<ThemeData | null>(null);

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
            .catch(console.error);
    }, []);

    return (
        <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[80vh] py-8 px-4 max-w-3xl mx-auto relative">            {/* Header */}
            <div className="text-center mb-16 mt-8 sm:mt-0">
                <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-4 tracking-tight">
                    DigiHack <span className="text-brand-pink">2.0</span>
                </h1>
                <p className="text-slate-500 text-lg max-w-sm mx-auto font-sans font-medium uppercase tracking-[0.2em] opacity-80">
                    Платформа за оценяване
                </p>
            </div>
            {/* Theme & Resources Block */}
            <div className="w-full max-w-2xl mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
                <button 
                        onClick={() => router.push('/theme')}
                        className="w-full glass p-6 sm:p-8 rounded-md border-l-4 border-brand-pink/30 hover:border-brand-pink hover:shadow-[0_0_30px_rgba(234, 76, 100,0.15)] transition-all duration-500 text-left group bg-white/[0.02]"
                    >
                        <div className="flex items-center justify-between gap-6">
                            
                            {/* Icon & Texts */}
                            <div className="flex gap-5 items-center flex-1 overflow-hidden">
                                <div className="w-14 h-14 rounded-md bg-brand-pink flex items-center justify-center shadow-lg shrink-0">
                                    <FileText className="w-7 h-7 text-brand-dark" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-xl font-display font-black text-white uppercase tracking-tight group-hover:text-white transition-colors">
                                            Тема на Хакатона
                                        </h2>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest font-sans bg-brand-pink/10 text-brand-pink border-brand-pink/20 hidden sm:inline-block shrink-0 max-w-[180px] truncate">
                                            {themeData?.title || "Зареждане..."}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 font-sans font-medium group-hover:text-slate-400 transition-colors line-clamp-1">
                                        Натиснете тук за задание и полезни ресурси
                                    </p>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-brand-dark transition-all shrink-0">
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                </div>
            {/* Portal Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
                {portals.map((p) => {
                    const Icon = p.icon;
                    return (
                        <button
                            key={p.href}
                            onClick={() => router.push(p.href)}
                            className={`glass p-8 rounded-md border-l-4 ${p.border} ${p.glow} transition-all duration-500 text-left group active:scale-[0.98] bg-white/[0.02]`}
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className={`w-14 h-14 rounded-md ${p.iconBg} flex items-center justify-center shadow-lg`}>
                                    <Icon className={`w-7 h-7 ${p.iconColor}`} />
                                </div>
                                {p.badge && (
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-md border uppercase tracking-widest font-sans ${p.badgeClass}`}>
                                        {p.badge}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <h2 className="text-xl font-display font-black text-white mb-2 uppercase tracking-tight group-hover:text-white transition-colors">{p.title}</h2>
                                    <p className="text-sm text-slate-500 font-sans font-medium group-hover:text-slate-400 transition-colors">{p.subtitle}</p>
                                </div>
                                <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-brand-dark transition-all">
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
