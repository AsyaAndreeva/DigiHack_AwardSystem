"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Loader2, ArrowLeft } from "lucide-react";

type JuryMember = { id: string; name: string };

export default function JuryLoginPage() {
    const [members, setMembers] = useState<JuryMember[]>([]);
    const [selected, setSelected] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/jury")
            .then(r => r.json())
            .then(d => setMembers(d.members || []))
            .finally(() => setLoading(false));
    }, []);

    const handleEnter = () => {
        const member = members.find(m => m.id === selected);
        if (!member) return;
        localStorage.setItem("juryId", member.id);
        localStorage.setItem("juryName", member.name);
        router.push("/dashboard");
    };

    return (
        <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[80vh] py-8 px-4">
            <button onClick={() => router.push("/")} className="self-start flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Назад към начало
            </button>
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex w-16 h-16 rounded-3xl bg-[#C4FF00] items-center justify-center shadow-[0_0_30px_rgba(196,255,0,0.25)] mb-4">
                        <Shield className="w-8 h-8 text-[#0A1128]" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white mb-1">Вход за Жури</h1>
                    <p className="text-slate-400 text-sm">Изберете вашия профил за да започнете оценяването</p>
                </div>

                <div className="glass p-6 rounded-3xl space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 ml-1">Профил на журито</label>
                        {loading ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-[#C4FF00]" /></div>
                        ) : members.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">Все още няма добавени членове на журито. Моля, свържете се с администратора.</p>
                        ) : (
                            <select
                                value={selected}
                                onChange={e => setSelected(e.target.value)}
                                className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#C4FF00] focus:border-transparent transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Изберете профил...</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        )}
                    </div>

                    <button
                        onClick={handleEnter}
                        disabled={!selected}
                        className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#C4FF00] hover:bg-[#a1d600] disabled:opacity-40 disabled:cursor-not-allowed text-[#0A1128] rounded-full font-bold transition-all shadow-[0_0_20px_rgba(196,255,0,0.2)] active:scale-95"
                    >
                        Влезте в таблото <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
