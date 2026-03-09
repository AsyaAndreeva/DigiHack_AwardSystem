"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, Loader2, ArrowRight, KeyRound } from "lucide-react";

export default function TeamLogin() {
    const [passcode, setPasscode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const existing = localStorage.getItem("teamId");
        if (existing) router.push("/team-dashboard");
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passcode.trim()) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "team", passcode: passcode.trim() }),
            });
            const d = await res.json();
            if (!res.ok || !d.success) {
                setError(d.error || "Грешна парола.");
                return;
            }
            localStorage.setItem("teamId", d.id);
            localStorage.setItem("teamName", d.name);
            router.push("/team-dashboard");
        } catch {
            setError("Неочаквана грешка. Опитайте отново.");
        } finally {
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
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">Хакер</h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Портал за отбори</p>
                    </div>
                </div>
            </header>

            <main className="flex flex-col items-center justify-center pt-20 px-4">
            <div className="mb-12 flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-16 h-16 rounded-none bg-[#FF9D00] flex items-center justify-center shadow-[0_0_30px_rgba(255,157,0,0.3)] mb-2">
                    <Users className="text-[#0A1128] w-8 h-8" />
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-black text-center tracking-tight text-white uppercase">
                    <span className="text-[#FF9D00]">Хакер</span> Портал
                </h1>
                <p className="text-slate-500 text-center max-w-sm text-sm font-sans font-medium uppercase tracking-widest opacity-80">
                    Влезте в своя профил
                </p>
            </div>

            <div className="w-full max-w-sm p-8 rounded-none glass border-l-4 border-[#FF9D00] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-2 uppercase tracking-widest font-sans">
                            <KeyRound className="w-4 h-4 text-[#FF9D00]" /> Парола на отбора
                        </label>
                        <input
                            type="text"
                            value={passcode}
                            onChange={e => setPasscode(e.target.value.toUpperCase())}
                            placeholder="B7RX4K"
                            maxLength={8}
                            className="w-full p-5 bg-black/40 border border-white/10 rounded-none text-white placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF9D00] focus:border-transparent transition-all tracking-[0.4em] text-center font-mono text-2xl uppercase"
                            required
                        />
                        {error && <p className="text-red-500 text-xs font-bold uppercase tracking-wider ml-1 mt-2">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={!passcode.trim() || loading}
                        className="w-full flex items-center justify-center gap-2 py-4 px-8 bg-[#FF9D00] hover:bg-[#E68D00] disabled:opacity-50 disabled:cursor-not-allowed text-[#0A1128] rounded-full font-bold transition-all shadow-[0_0_20px_rgba(255,157,0,0.2)] active:scale-[0.98] group"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <><span>Вход в таблото на отбора</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>
                </form>
            </div>
            </main>
        </div>
    );
}
