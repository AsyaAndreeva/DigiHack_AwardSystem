"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, Loader2, ArrowRight, KeyRound } from "lucide-react";

export default function Jelly() {
    const [passcode, setPasscode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleEnter = async () => {
        if (!passcode.trim()) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "jury", passcode: passcode.trim() }),
            });
            const d = await res.json();
            if (!res.ok || !d.success) {
                setError(d.error || "Грешна парола.");
                setLoading(false);
                return;
            }
            localStorage.setItem("juryId", d.id);
            localStorage.setItem("juryName", d.name);
            router.push("/dashboard");
        } catch (err) {
            setError("Грешка при свързване.");
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 min-h-screen">
            <header className="flex items-center justify-between px-8 py-6 bg-[#0A1128]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/')}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-[#0A1128] transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">Жури</h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Вход в системата</p>
                    </div>
                </div>
            </header>

            <main className="flex flex-col items-center justify-center pt-20 px-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-12">
                        <div className="inline-flex w-16 h-16 rounded-none bg-[#C4FF00] items-center justify-center shadow-[0_0_30px_rgba(196,255,0,0.25)] mb-6">
                            <Shield className="w-8 h-8 text-[#0A1128]" />
                        </div>
                        <h1 className="text-4xl font-display font-black text-white mb-2 uppercase tracking-tight">Вход за Жури</h1>
                        <p className="text-slate-500 text-sm font-sans font-medium uppercase tracking-widest opacity-80 decoration-[#C4FF00]/30">Код за достъп</p>
                    </div>

                    <div className="glass p-8 rounded-none border-l-4 border-[#C4FF00] space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-2 uppercase tracking-widest font-sans">
                                <KeyRound className="w-4 h-4 text-[#C4FF00]" /> Парола за жури
                            </label>
                            <input
                                type="text"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleEnter(); }}
                                placeholder="A3K9MX"
                                maxLength={8}
                                className="w-full p-5 bg-black/40 border border-white/10 rounded-none text-white placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C4FF00] focus:border-transparent transition-all tracking-[0.4em] text-center font-mono text-2xl uppercase"
                            />
                            {error && <p className="text-red-500 text-xs font-bold uppercase tracking-wider ml-1 mt-2">{error}</p>}
                        </div>

                        <button
                            onClick={handleEnter}
                            disabled={!passcode.trim() || loading}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#C4FF00] hover:bg-[#a1d600] disabled:opacity-40 disabled:cursor-not-allowed text-[#0A1128] rounded-full font-bold transition-all shadow-[0_0_20px_rgba(196,255,0,0.2)] active:scale-95"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span>Влезте в таблото</span>
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
