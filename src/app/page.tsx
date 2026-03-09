"use client";

import { useRouter } from "next/navigation";
import { Trophy, Users, Shield, BarChart3, ArrowRight } from "lucide-react";

const portals = [
    {
        href: "/jury",
        icon: Shield,
        title: "Портал на Журито",
        subtitle: "Вход за членове на журито",
        color: "volt",
        border: "border-[#C4FF00]/30 hover:border-[#C4FF00]",
        iconBg: "bg-[#C4FF00]",
        iconColor: "text-[#0A1128]",
        glow: "hover:shadow-[0_0_30px_rgba(196,255,0,0.15)]",
        badge: "Жури",
        badgeClass: "bg-[#C4FF00]/10 text-[#C4FF00] border-[#C4FF00]/20",
    },
    {
        href: "/team",
        icon: Users,
        title: "Портал на Отборите",
        subtitle: "Вход за участващи отбори",
        color: "orange",
        border: "border-[#FF9D00]/30 hover:border-[#FF9D00]",
        iconBg: "bg-[#FF9D00]",
        iconColor: "text-[#0A1128]",
        glow: "hover:shadow-[0_0_30px_rgba(255,157,0,0.15)]",
        badge: "Отбор",
        badgeClass: "bg-[#FF9D00]/10 text-[#FF9D00] border-[#FF9D00]/20",
    },
    {
        href: "/results",
        icon: BarChart3,
        title: "Резултати На Живо",
        subtitle: "Класация в реално време",
        color: "gold",
        border: "border-yellow-400/30 hover:border-yellow-400",
        iconBg: "bg-yellow-400",
        iconColor: "text-[#0A1128]",
        glow: "hover:shadow-[0_0_30px_rgba(250,204,21,0.15)]",
        badge: "Публично",
        badgeClass: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    },
    {
        href: "/admin",
        icon: Trophy,
        title: "Администратор",
        subtitle: "Управление на системата",
        color: "slate",
        border: "border-slate-600/30 hover:border-slate-500",
        iconBg: "bg-slate-700",
        iconColor: "text-slate-300",
        glow: "hover:shadow-[0_0_30px_rgba(100,116,139,0.15)]",
        badge: "Защитено",
        badgeClass: "bg-slate-700/50 text-slate-400 border-slate-600/30",
    },
];

export default function HubPage() {
    const router = useRouter();

    return (
        <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[80vh] py-8 px-4 max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-none bg-[#C4FF00] shadow-[0_0_40px_rgba(196,255,0,0.3)] mb-8">
                    <Trophy className="w-10 h-10 text-[#0A1128]" />
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-4 tracking-tight">
                    DigiHack <span className="text-[#C4FF00]">2.0</span>
                </h1>
                <p className="text-slate-500 text-lg max-w-sm mx-auto font-sans font-medium uppercase tracking-[0.2em] opacity-80">
                    Платформа за оценяване
                </p>
            </div>

            {/* Portal Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
                {portals.map((p) => {
                    const Icon = p.icon;
                    return (
                        <button
                            key={p.href}
                            onClick={() => router.push(p.href)}
                            className={`glass p-8 rounded-none border-l-4 ${p.border} ${p.glow} transition-all duration-500 text-left group active:scale-[0.98] bg-white/[0.02]`}
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className={`w-14 h-14 rounded-none ${p.iconBg} flex items-center justify-center shadow-lg`}>
                                    <Icon className={`w-7 h-7 ${p.iconColor}`} />
                                </div>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-none border uppercase tracking-widest font-sans ${p.badgeClass}`}>
                                    {p.badge}
                                </span>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <h2 className="text-xl font-display font-black text-white mb-2 uppercase tracking-tight group-hover:text-white transition-colors">{p.title}</h2>
                                    <p className="text-sm text-slate-500 font-sans font-medium group-hover:text-slate-400 transition-colors">{p.subtitle}</p>
                                </div>
                                <div className="w-10 h-10 rounded-none bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-[#0A1128] transition-all">
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
