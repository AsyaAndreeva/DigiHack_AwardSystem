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
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
            <button onClick={() => router.push("/")} className="self-start flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Назад
            </button>
            <div className="mb-10 flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-16 h-16 rounded-3xl bg-[#FF9D00] flex items-center justify-center shadow-[0_0_30px_rgba(255,157,0,0.3)]">
                    <Users className="text-[#0A1128] w-8 h-8" />
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-center tracking-tight text-white mb-2">
                    <span className="text-[#FF9D00]">Хакер</span> Портал
                </h1>
                <p className="text-slate-400 text-center max-w-sm text-sm">
                    Въведете паролата, предоставена от администратора на вашия отбор.
                </p>
            </div>

            <div className="w-full max-w-sm p-6 rounded-3xl glass animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 ml-1 flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-[#FF9D00]" /> Парола на отбора
                        </label>
                        <input
                            type="text"
                            value={passcode}
                            onChange={e => setPasscode(e.target.value.toUpperCase())}
                            placeholder="напр. B7RX4K"
                            maxLength={8}
                            className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF9D00] focus:border-transparent transition-all tracking-[0.25em] text-center font-mono text-lg uppercase"
                            required
                        />
                        {error && <p className="text-red-400 text-sm ml-1">{error}</p>}
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
        </div>
    );
}
