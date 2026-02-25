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
        <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[80vh] py-8 px-4">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#C4FF00] shadow-[0_0_40px_rgba(196,255,0,0.3)] mb-6">
                    <Trophy className="w-10 h-10 text-[#0A1128]" />
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
                    DigiHack <span className="text-[#C4FF00]">2.0</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-sm mx-auto">
                    Платформа за оценяване на хакатон проекти
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
                            className={`glass p-6 rounded-3xl border ${p.border} ${p.glow} transition-all duration-300 text-left group active:scale-[0.98]`}
                        >
                            <div className="flex items-start justify-between mb-5">
                                <div className={`w-12 h-12 rounded-2xl ${p.iconBg} flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${p.iconColor}`} />
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${p.badgeClass}`}>
                                    {p.badge}
                                </span>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">{p.title}</h2>
                                    <p className="text-sm text-slate-400">{p.subtitle}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
