"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, Loader2, ArrowRight, KeyRound, Lock } from "lucide-react";

export default function TeamLogin() {
    const [passcode, setPasscode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [lockoutSeconds, setLockoutSeconds] = useState(0);
    const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const router = useRouter();

    useEffect(() => {
        const existing = localStorage.getItem("teamId");
        if (existing) router.push("/team-dashboard");
        return () => { if (lockoutTimer.current) clearInterval(lockoutTimer.current); };
    }, [router]);

    const startLockoutCountdown = (seconds: number) => {
        setLockoutSeconds(seconds);
        if (lockoutTimer.current) clearInterval(lockoutTimer.current);
        lockoutTimer.current = setInterval(() => {
            setLockoutSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(lockoutTimer.current!);
                    setError("");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passcode.trim() || lockoutSeconds > 0) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "team", passcode: passcode.trim() }),
            });
            const d = await res.json();

            if (res.status === 429) {
                const retryAfter = parseInt(res.headers.get("Retry-After") || "60", 10);
                startLockoutCountdown(retryAfter);
                setError(d.error || "Твърде много опити.");
                setLoading(false);
                return;
            }

            if (!res.ok || !d.success) {
                setError(d.error || "Грешна парола.");
                setLoading(false);
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

    const isLocked = lockoutSeconds > 0;

    return (
        <div className="animate-in fade-in duration-500 min-h-screen">
            <header className="flex items-center justify-between px-8 py-6 bg-bg-main/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-brand-dark transition-all group"
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
                <div className={`w-16 h-16 rounded-md flex items-center justify-center shadow-[0_0_30px_rgba(243,155,45,0.3)] mb-2 transition-colors ${isLocked ? 'bg-red-500/20' : 'bg-brand-orange'}`}>
                    {isLocked ? <Lock className="text-red-400 w-8 h-8" /> : <Users className="text-brand-dark w-8 h-8" />}
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-black text-center tracking-tight text-white uppercase">
                    <span className="text-brand-orange">Хакер</span> Портал
                </h1>
                <p className="text-slate-500 text-center max-w-sm text-sm font-sans font-medium uppercase tracking-widest opacity-80">
                    Влезте в своя профил
                </p>
            </div>

            <div className={`w-full max-w-sm p-8 rounded-md glass border-l-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 transition-colors ${isLocked ? 'border-red-500/50' : 'border-brand-orange'}`}>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-2 uppercase tracking-widest font-sans">
                            <KeyRound className="w-4 h-4 text-brand-orange" /> Парола на отбора
                        </label>
                        <input
                            type="text"
                            value={passcode}
                            onChange={e => setPasscode(e.target.value.toUpperCase())}
                            placeholder="B7RX4K"
                            maxLength={8}
                            disabled={isLocked}
                            className="w-full p-5 bg-black/40 border border-white/10 rounded-md text-white placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F39B2D] focus:border-transparent transition-all tracking-[0.4em] text-center font-mono text-2xl uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                            required
                        />
                        {error && (
                            <p className={`text-xs font-bold uppercase tracking-wider ml-1 mt-2 ${isLocked ? 'text-orange-400' : 'text-red-500'}`}>
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!passcode.trim() || loading || isLocked}
                        className="w-full flex items-center justify-center gap-2 py-4 px-8 bg-brand-orange hover:bg-[#E68D00] disabled:opacity-50 disabled:cursor-not-allowed text-brand-dark rounded-full font-bold transition-all shadow-[0_0_20px_rgba(243,155,45,0.2)] active:scale-[0.98] group"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isLocked ? (
                            <div className="flex items-center gap-2 font-mono text-sm">
                                <Lock className="w-4 h-4" />
                                <span>Заключено за {lockoutSeconds}с</span>
                            </div>
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
