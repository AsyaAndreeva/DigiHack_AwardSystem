"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, Loader2, ArrowRight, KeyRound } from "lucide-react";

export default function JuryLoginPage() {
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
                return;
            }
            localStorage.setItem("juryId", d.id);
            localStorage.setItem("juryName", d.name);
            router.push("/dashboard");
        } catch {
            setError("Неочаквана грешка. Опитайте отново.");
        } finally {
            setLoading(false);
        }
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
                    <p className="text-slate-400 text-sm">Въведете паролата, предоставена от администратора</p>
                </div>

                <div className="glass p-6 rounded-3xl space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 ml-1 flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-[#C4FF00]" /> Парола за жури
                        </label>
                        <input
                            type="text"
                            value={passcode}
                            onChange={e => setPasscode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === "Enter" && handleEnter()}
                            placeholder="напр. A3K9MX"
                            maxLength={8}
                            className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C4FF00] focus:border-transparent transition-all tracking-[0.25em] text-center font-mono text-lg uppercase"
                        />
                        {error && <p className="text-red-400 text-sm ml-1">{error}</p>}
                    </div>

                    <button
                        onClick={handleEnter}
                        disabled={!passcode.trim() || loading}
                        className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#C4FF00] hover:bg-[#a1d600] disabled:opacity-40 disabled:cursor-not-allowed text-[#0A1128] rounded-full font-bold transition-all shadow-[0_0_20px_rgba(196,255,0,0.2)] active:scale-95"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Влезте в таблото</span><ArrowRight className="w-5 h-5" /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}
