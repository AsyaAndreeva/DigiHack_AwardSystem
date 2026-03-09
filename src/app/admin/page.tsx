"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Shield, Users, BookOpen, Plus, Trash2, Loader2,
    LogOut, ArrowLeft, Check, Edit2, X, Copy, RefreshCw
} from "lucide-react";

const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "digihack2026";

type Team = { id: string; name: string; passcode?: string };
type JuryMember = { id: string; name: string; passcode?: string };
type Criterion = {
    id: number;
    category: string;
    description?: string;
    criterion: string;
    max_score: number;
    scoring_guide: string;
    order_idx: number;
};

export default function AdminPage() {
    const router = useRouter();
    const [authed, setAuthed] = useState(false);
    const [code, setCode] = useState("");
    const [codeError, setCodeError] = useState("");

    // Data
    const [teams, setTeams] = useState<Team[]>([]);
    const [jury, setJury] = useState<JuryMember[]>([]);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"teams" | "jury" | "rubric">("teams");

    // Add forms
    const [newTeamName, setNewTeamName] = useState("");
    const [newJuryName, setNewJuryName] = useState("");
    const [newCrit, setNewCrit] = useState({ category: "", description: "", criterion: "", max_score: "3", scoring_guide: "" });
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Passcode inline edit
    const [editPasscodeId, setEditPasscodeId] = useState<string | null>(null);
    const [editPasscodeValue, setEditPasscodeValue] = useState("");
    const [savingPasscode, setSavingPasscode] = useState(false);

    const startEditPasscode = (id: string, current: string) => {
        setEditPasscodeId(id);
        setEditPasscodeValue(current);
    };

    const updatePasscode = async (type: "teams" | "jury", id: string, passcode?: string) => {
        setSavingPasscode(true);
        const res = await fetch(`/api/admin/${type}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, passcode: passcode ?? "" }),
        });
        const d = await res.json();
        setSavingPasscode(false);
        if (d.success) {
            const newCode: string = d.passcode;
            if (type === "teams") setTeams(p => p.map(t => t.id === id ? { ...t, passcode: newCode } : t));
            else setJury(p => p.map(m => m.id === id ? { ...m, passcode: newCode } : m));
            setEditPasscodeId(null);
            showFeedback(`Паролата е сменена: ${newCode}`, true);
        } else showFeedback(d.error || "Грешка", false);
    };

    const copyPasscode = (id: string, code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    // Rubric edit
    const [editId, setEditId] = useState<number | null>(null);
    const [editData, setEditData] = useState({ category: "", description: "", criterion: "", max_score: "3", scoring_guide: "" });

    const showFeedback = (msg: string, ok: boolean) => {
        setFeedback({ msg, ok });
        setTimeout(() => setFeedback(null), 3000);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [t, j, r] = await Promise.all([
                fetch("/api/teams").then(x => x.json()),
                fetch("/api/jury").then(x => x.json()),
                fetch("/api/rubric").then(x => x.json()),
            ]);
            setTeams(t.teams || []);
            setJury(j.members || []);
            setCriteria(r.criteria || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authed) loadData();
    }, [authed, loadData]);

    const handleLogin = () => {
        if (code === ADMIN_CODE) { setAuthed(true); setCodeError(""); }
        else setCodeError("Грешна парола. Опитайте отново.");
    };

    // Teams
    const addTeam = async () => {
        if (!newTeamName.trim()) return;
        setSaving(true);
        const res = await fetch("/api/admin/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTeamName }) });
        const d = await res.json();
        setSaving(false);
        if (d.success) { setTeams(p => [...p, d.team]); setNewTeamName(""); showFeedback(`Отборът е добавен! Парола: ${d.team.passcode}`, true); }
        else showFeedback(d.error || "Грешка", false);
    };

    const deleteTeam = async (id: string) => {
        const res = await fetch("/api/admin/teams", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        const d = await res.json();
        if (d.success) { setTeams(p => p.filter(t => t.id !== id)); showFeedback("Отборът е изтрит.", true); }
        else showFeedback(d.error || "Грешка", false);
    };

    // Jury
    const addJury = async () => {
        if (!newJuryName.trim()) return;
        setSaving(true);
        const res = await fetch("/api/admin/jury", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newJuryName }) });
        const d = await res.json();
        setSaving(false);
        if (d.success) { setJury(p => [...p, d.member]); setNewJuryName(""); showFeedback(`Журистът е добавен! Парола: ${d.member.passcode}`, true); }
        else showFeedback(d.error || "Грешка", false);
    };

    const deleteJury = async (id: string) => {
        const res = await fetch("/api/admin/jury", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        const d = await res.json();
        if (d.success) { setJury(p => p.filter(m => m.id !== id)); showFeedback("Членът е премахнат.", true); }
        else showFeedback(d.error || "Грешка", false);
    };

    // Clear all evaluations
    const clearEvaluations = async () => {
        if (!window.confirm("Сигурни ли сте? Това ще изтрие ВСИЧКИ резултати от оценяването!")) return;
        const res = await fetch("/api/admin/evaluations", { method: "DELETE" });
        const d = await res.json();
        if (d.success) showFeedback("Всички резултати са изтрити.", true);
        else showFeedback(d.error || "Грешка", false);
    };

    // Rubric
    const addCriterion = async () => {
        if (!newCrit.category.trim() || !newCrit.criterion.trim()) return;
        setSaving(true);
        const payload = { ...newCrit, max_score: parseInt(newCrit.max_score), order_idx: criteria.length };
        const res = await fetch("/api/admin/rubric", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const d = await res.json();
        setSaving(false);
        if (d.success) {
            await loadData();
            // Preserve category and description for easier bulk entry
            setNewCrit(p => ({ ...p, criterion: "", scoring_guide: "" }));
            showFeedback("Критерият е добавен!", true);
        } else showFeedback(d.error || "Грешка", false);
    };

    const saveEdit = async () => {
        if (!editId) return;
        setSaving(true);
        const payload = { id: editId, ...editData, max_score: parseInt(editData.max_score) };
        const res = await fetch("/api/admin/rubric", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const d = await res.json();
        setSaving(false);
        if (d.success) { await loadData(); setEditId(null); showFeedback("Критерият е обновен!", true); }
        else showFeedback(d.error || "Грешка", false);
    };

    const deleteCriterion = async (id: number) => {
        const res = await fetch("/api/admin/rubric", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        const d = await res.json();
        if (d.success) { setCriteria(p => p.filter(c => c.id !== id)); showFeedback("Критерият е изтрит.", true); }
        else showFeedback(d.error || "Грешка", false);
    };

    const startEdit = (c: Criterion) => {
        setEditId(c.id);
        setEditData({ category: c.category, description: c.description || "", criterion: c.criterion, max_score: String(c.max_score), scoring_guide: c.scoring_guide });
    };

    // Group criteria by category for display
    const grouped = criteria.reduce((acc, c) => {
        if (!acc[c.category]) acc[c.category] = [];
        acc[c.category].push(c);
        return acc;
    }, {} as Record<string, Criterion[]>);

    // Auth screen
    if (!authed) {
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
                        <div className="w-12 h-12 rounded-none bg-slate-800 flex items-center justify-center shadow-xl">
                            <Shield className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">Администратор</h1>
                            <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Вход в конзолата</p>
                        </div>
                    </div>
                </header>

                <main className="flex flex-col items-center justify-center pt-24 px-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-12">
                        <div className="inline-flex w-16 h-16 rounded-none bg-slate-800 items-center justify-center mb-6 shadow-xl">
                            <Shield className="w-8 h-8 text-slate-400" />
                        </div>
                        <h1 className="text-4xl font-display font-black text-white mb-2 uppercase tracking-tight">Администратор</h1>
                        <p className="text-slate-500 text-sm font-sans font-medium uppercase tracking-widest opacity-80">Вход в конзолата</p>
                    </div>
                    <div className="glass p-8 rounded-none border-l-4 border-slate-700 space-y-6">
                        <div className="space-y-3">
                            <input
                                type="password"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleLogin()}
                                placeholder="Парола..."
                                className="w-full p-5 bg-white/5 border border-white/10 rounded-none text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all text-center tracking-[0.3em] font-mono text-xl"
                            />
                            {codeError && <p className="text-red-500 text-xs font-black uppercase tracking-widest mt-2">{codeError}</p>}
                        </div>
                        <button
                            onClick={handleLogin}
                            className="w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all active:scale-95"
                        >
                            Вход
                        </button>
                    </div>
                </div>
                </main>
            </div>
        );
    }

    const tabs = [
        { key: "teams" as const, label: "Отбори", icon: Users, count: teams.length },
        { key: "jury" as const, label: "Жури", icon: Shield, count: jury.length },
        { key: "rubric" as const, label: "Рубрика", icon: BookOpen, count: criteria.length },
    ];

    return (
        <div className="animate-in fade-in duration-500 min-h-screen">
            {/* Standardized Header */}
            <header className="flex items-center justify-between px-8 py-6 bg-[#0A1128]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/')}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-[#0A1128] transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="w-12 h-12 rounded-none bg-slate-800 flex items-center justify-center shadow-xl font-bold text-white">
                        <Shield className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">Администратор</h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Конзола за управление</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={clearEvaluations}
                        className="flex items-center gap-2 py-3 px-6 rounded-full font-display font-black text-[10px] uppercase tracking-widest transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                        title="Изтрий всички резултати"
                    >
                        <Trash2 className="w-4 h-4" />
                        Изтрий резултати
                    </button>
                    <button
                        onClick={() => setAuthed(false)}
                        className="flex items-center gap-2 py-3 px-6 rounded-full font-display font-black text-[10px] uppercase tracking-widest transition-all bg-white/5 text-slate-400 border border-white/10 hover:bg-slate-800"
                    >
                        <LogOut className="w-4 h-4" />
                        Изход
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto py-12 px-4">

            {/* Feedback toast */}
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-all ${feedback.ok ? "bg-[#C4FF00] text-[#0A1128]" : "bg-red-500 text-white"}`}>
                    {feedback.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {feedback.msg}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-none border border-white/5">
                {tabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-none text-xs font-black uppercase tracking-widest transition-all ${activeTab === t.key ? "bg-[#C4FF00] text-[#0A1128]" : "text-slate-500 hover:text-white"}`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t.label}</span>
                            <span className="text-[10px] opacity-50">({t.count})</span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#C4FF00]" /></div>
            ) : (
                <>
                    {/* TEAMS TAB */}
                    {activeTab === "teams" && (
                        <div className="space-y-6">
                            <div className="glass p-8 rounded-none border-l-4 border-[#C4FF00] shadow-xl">
                                <h3 className="text-xs font-black text-white mb-6 flex items-center gap-2 uppercase tracking-[0.2em] font-sans">
                                    <Plus className="w-4 h-4 text-[#C4FF00]" /> Добави Отбор
                                </h3>
                                <div className="flex gap-4">
                                    <input
                                        value={newTeamName}
                                        onChange={e => setNewTeamName(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && addTeam()}
                                        placeholder="Име на отбора..."
                                        className="flex-1 p-4 bg-black/40 border border-white/10 rounded-none text-white placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C4FF00] transition-all text-sm font-sans"
                                    />
                                    <button onClick={addTeam} disabled={saving || !newTeamName.trim()} className="px-8 py-3 bg-[#C4FF00] hover:bg-white text-[#0A1128] rounded-full font-black text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg active:scale-95">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Добави
                                    </button>
                                </div>
                            </div>
                            {teams.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">Все още няма добавени отбори.</p>
                            ) : (
                                <div className="space-y-3">
                                    {teams.map(t => (
                                        <div key={t.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-none flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-all group">
                                            <span className="text-white font-black uppercase tracking-tight font-sans text-sm">{t.name}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {editPasscodeId === t.id ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            autoFocus
                                                            value={editPasscodeValue}
                                                            onChange={e => setEditPasscodeValue(e.target.value.toUpperCase())}
                                                            onKeyDown={e => { if (e.key === "Enter") updatePasscode("teams", t.id, editPasscodeValue); if (e.key === "Escape") setEditPasscodeId(null); }}
                                                            placeholder="нова парола..."
                                                            maxLength={12}
                                                            className="w-28 p-1.5 bg-slate-900 border border-[#C4FF00]/40 rounded-none text-xs font-mono text-[#C4FF00] text-center focus:outline-none focus:ring-1 focus:ring-[#C4FF00]"
                                                        />
                                                         <button onClick={() => updatePasscode("teams", t.id, editPasscodeValue)} disabled={savingPasscode} className="p-1.5 bg-[#C4FF00] hover:bg-[#a1d600] text-[#0A1128] rounded-none transition-colors" title="Запази">
                                                            {savingPasscode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                        </button>
                                                         <button onClick={() => updatePasscode("teams", t.id, "")} disabled={savingPasscode} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-none transition-colors" title="Генерирай нова">
                                                            <RefreshCw className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => setEditPasscodeId(null)} className="p-1.5 text-slate-400 hover:text-white rounded-none transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    t.passcode && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => copyPasscode(t.id, t.passcode!)}
                                                                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-none text-xs font-mono text-[#C4FF00] transition-colors"
                                                                title="Копирай паролата"
                                                            >
                                                                {copiedId === t.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                                {t.passcode}
                                                            </button>
                                                             <button onClick={() => startEditPasscode(t.id, t.passcode!)} className="p-1.5 text-slate-500 hover:text-[#C4FF00] hover:bg-[#C4FF00]/10 rounded-none transition-colors" title="Промени паролата">
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                                 <button onClick={() => deleteTeam(t.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-none transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* JURY TAB */}
                    {activeTab === "jury" && (
                        <div className="space-y-6">
                            <div className="glass p-8 rounded-none border-l-4 border-[#C4FF00] shadow-xl">
                                <h3 className="text-xs font-black text-white mb-6 flex items-center gap-2 uppercase tracking-[0.2em] font-sans">
                                    <Plus className="w-4 h-4 text-[#C4FF00]" /> Добави Член на Журито
                                </h3>
                                <div className="flex gap-4">
                                    <input
                                        value={newJuryName}
                                        onChange={e => setNewJuryName(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && addJury()}
                                        placeholder="Пълно име..."
                                        className="flex-1 p-4 bg-black/40 border border-white/10 rounded-none text-white placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C4FF00] transition-all text-sm font-sans"
                                    />
                                    <button onClick={addJury} disabled={saving || !newJuryName.trim()} className="px-8 py-3 bg-[#C4FF00] hover:bg-white text-[#0A1128] rounded-full font-black text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg active:scale-95">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Добави
                                    </button>
                                </div>
                            </div>
                            {jury.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">Все още няма добавени членове на журито.</p>
                            ) : (
                                <div className="space-y-3">
                                    {jury.map(m => (
                                        <div key={m.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-none flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-all group">
                                            <span className="text-white font-black uppercase tracking-tight font-sans text-sm">{m.name}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {editPasscodeId === m.id ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            autoFocus
                                                            value={editPasscodeValue}
                                                            onChange={e => setEditPasscodeValue(e.target.value.toUpperCase())}
                                                            onKeyDown={e => { if (e.key === "Enter") updatePasscode("jury", m.id, editPasscodeValue); if (e.key === "Escape") setEditPasscodeId(null); }}
                                                            placeholder="нова парола..."
                                                            maxLength={12}
                                                            className="w-28 p-1.5 bg-slate-900 border border-[#C4FF00]/40 rounded-xl text-xs font-mono text-[#C4FF00] text-center focus:outline-none focus:ring-1 focus:ring-[#C4FF00]"
                                                        />
                                                        <button onClick={() => updatePasscode("jury", m.id, editPasscodeValue)} disabled={savingPasscode} className="p-1.5 bg-[#C4FF00] hover:bg-[#a1d600] text-[#0A1128] rounded-lg transition-colors" title="Запази">
                                                            {savingPasscode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                        </button>
                                                         <button onClick={() => updatePasscode("jury", m.id, "")} disabled={savingPasscode} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-none transition-colors" title="Генерирай нова">
                                                            <RefreshCw className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => setEditPasscodeId(null)} className="p-1.5 text-slate-400 hover:text-white rounded-none transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    m.passcode && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => copyPasscode(m.id, m.passcode!)}
                                                                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-none text-xs font-mono text-[#C4FF00] transition-colors"
                                                                title="Копирай паролата"
                                                            >
                                                                {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                                {m.passcode}
                                                            </button>
                                                             <button onClick={() => startEditPasscode(m.id, m.passcode!)} className="p-1.5 text-slate-500 hover:text-[#C4FF00] hover:bg-[#C4FF00]/10 rounded-none transition-colors" title="Промени паролата">
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                                 <button onClick={() => deleteJury(m.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-none transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* RUBRIC TAB */}
                    {activeTab === "rubric" && (
                        <div className="space-y-8">
                             {/* Add new criterion */}
                             <div className="glass p-10 rounded-none border-l-4 border-[#C4FF00] space-y-6 shadow-2xl">
                                 <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-[0.2em] font-sans">
                                     <Plus className="w-4 h-4 text-[#C4FF00]" /> Добави Критерий
                                 </h3>
                                 <input value={newCrit.category} onChange={e => setNewCrit(p => ({ ...p, category: e.target.value }))} placeholder="Категория (напр. 1. Иновация...)" className="w-full p-4 bg-white/5 border border-white/10 rounded-none text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#C4FF00] text-sm transition-all font-sans" />
                                 <textarea value={newCrit.description} onChange={e => setNewCrit(p => ({ ...p, description: e.target.value }))} placeholder="Описание на категорията (по избор)" rows={2} className="w-full p-4 bg-white/5 border border-white/10 rounded-none text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#C4FF00] text-sm transition-all resize-none font-sans" />
                                 <input value={newCrit.criterion} onChange={e => setNewCrit(p => ({ ...p, criterion: e.target.value }))} placeholder="Критерий (напр. Дефиниране и Значимост)" className="w-full p-4 bg-white/5 border border-white/10 rounded-none text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#C4FF00] text-sm transition-all font-sans" />
                                 
                                 <div className="flex flex-col gap-4">
                                     <div className="space-y-2 flex-col flex">
                                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Макс. точки</label>
                                         <input type="number" min="1" max="10" value={newCrit.max_score} onChange={e => setNewCrit(p => ({ ...p, max_score: e.target.value }))} className="w-24 p-4 bg-white/5 border border-white/10 rounded-none text-white focus:outline-none focus:ring-1 focus:ring-[#C4FF00] text-sm transition-all text-center font-mono" />
                                     </div>

                                     <div className="space-y-4 pt-4 border-t border-white/5">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-4">Описания за всяка точка (както журито ги вижда)</label>
                                         {Array.from({ length: parseInt(newCrit.max_score || "0") + 1 }).map((_, i) => (
                                             <div key={i} className="flex gap-4 items-start">
                                                 <div className="w-10 h-10 rounded-none bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white font-display font-black">{i}</div>
                                                 <input 
                                                     value={newCrit.scoring_guide.split('\n')[i] || ""} 
                                                     onChange={e => {
                                                         const lines = newCrit.scoring_guide.split('\n');
                                                         while (lines.length <= i) lines.push("");
                                                         lines[i] = e.target.value;
                                                         setNewCrit(p => ({ ...p, scoring_guide: lines.join('\n') }));
                                                     }}
                                                     placeholder={`Описание за ${i} точки...`}
                                                     className="flex-1 p-3 bg-white/5 border border-white/10 rounded-none text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#C4FF00] text-sm transition-all font-sans"
                                                 />
                                             </div>
                                         ))}
                                     </div>
                                 </div>

                                 <button onClick={addCriterion} disabled={saving || !newCrit.category.trim() || !newCrit.criterion.trim()} className="w-full py-4 bg-[#C4FF00] hover:bg-white text-[#0A1128] rounded-full font-black text-xs uppercase tracking-[0.2em] disabled:opacity-30 transition-all flex items-center justify-center gap-3 shadow-lg">
                                     {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Добави Критерий
                                 </button>
                             </div>

                            {/* Grouped list */}
                             {Object.entries(grouped).map(([cat, crits]) => (
                                <div key={cat} className="glass p-5 rounded-none">
                                    <h4 className="font-bold text-[#C4FF00] text-sm mb-4">{cat}</h4>
                                    <div className="space-y-3">
                                         {crits.map(c => (
                                             <div key={c.id} className="bg-slate-900/40 rounded-none p-4 border border-slate-700/30">
                                                {editId === c.id ? (
                                                    <div className="space-y-2">
                                                        <input value={editData.category} onChange={e => setEditData(p => ({ ...p, category: e.target.value }))} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-none text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#C4FF00]" />
                                                        <textarea value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} placeholder="Описание на категорията (по избор)" rows={2} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-none text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#C4FF00] resize-none" />
                                                        <input value={editData.criterion} onChange={e => setEditData(p => ({ ...p, criterion: e.target.value }))} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-none text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#C4FF00]" />
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-4">
                                                                <label className="text-[10px] font-black text-slate-500 uppercase">Макс. точки</label>
                                                                 <input type="number" value={editData.max_score} onChange={e => setEditData(p => ({ ...p, max_score: e.target.value }))} className="w-20 p-2 bg-slate-800 border border-slate-600 rounded-none text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#C4FF00]" />
                                                            </div>
                                                            <div className="space-y-2 mt-2">
                                                                {Array.from({ length: parseInt(editData.max_score || "0") + 1 }).map((_, i) => (
                                                                    <div key={i} className="flex gap-2 items-center">
                                                                        <div className="w-8 h-8 rounded-none bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white text-[10px] font-black">{i}</div>
                                                                        <input 
                                                                            value={editData.scoring_guide.split('\n')[i] || ""} 
                                                                            onChange={e => {
                                                                                const lines = editData.scoring_guide.split('\n');
                                                                                while (lines.length <= i) lines.push("");
                                                                                lines[i] = e.target.value;
                                                                                setEditData(p => ({ ...p, scoring_guide: lines.join('\n') }));
                                                                            }}
                                                                            placeholder={`Описание за ${i} точки...`}
                                                                             className="flex-1 p-2 bg-slate-800 border border-slate-600 rounded-none text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#C4FF00]"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 mt-4">
                                                             <button onClick={saveEdit} disabled={saving} className="flex-1 py-2 bg-[#C4FF00] hover:bg-[#a1d600] text-[#0A1128] rounded-full font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-1">
                                                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Запази
                                                            </button>
                                                             <button onClick={() => setEditId(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full text-sm transition-all">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <span className="font-medium text-white text-sm">{c.criterion}</span>
                                                                 <span className="text-xs bg-[#C4FF00]/10 text-[#C4FF00] border border-[#C4FF00]/20 px-2 py-0.5 rounded-none font-bold hidden sm:inline">до {c.max_score} т.</span>
                                                            </div>
                                                            {c.scoring_guide && (
                                                                <p className="text-xs text-slate-500 line-clamp-2">{c.scoring_guide.split('\n')[0]}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <button onClick={() => startEdit(c)} className="p-2 text-slate-500 hover:text-[#C4FF00] hover:bg-[#C4FF00]/10 rounded-none transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                                            <button onClick={() => deleteCriterion(c.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-none transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {criteria.length === 0 && <p className="text-center text-slate-500 py-8">Все още няма критерии в рубриката.</p>}
                        </div>
                    )}
                </>
            )}
            </main>
        </div>
    );
}
