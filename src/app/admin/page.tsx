"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Shield, Users, BookOpen, Plus, Trash2, Loader2,
    LogOut, ChevronDown, ChevronUp, ArrowLeft, Check, Edit2, X
} from "lucide-react";

const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "digihack2026";

type Team = { id: string; name: string };
type JuryMember = { id: string; name: string };
type Criterion = {
    id: number;
    category: string;
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
    const [newCrit, setNewCrit] = useState({ category: "", criterion: "", max_score: "3", scoring_guide: "" });
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

    // Rubric edit
    const [editId, setEditId] = useState<number | null>(null);
    const [editData, setEditData] = useState({ category: "", criterion: "", max_score: "3", scoring_guide: "" });

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
        if (d.success) { setTeams(p => [...p, d.team]); setNewTeamName(""); showFeedback("Отборът е добавен!", true); }
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
        if (d.success) { setJury(p => [...p, d.member]); setNewJuryName(""); showFeedback("Членът на журито е добавен!", true); }
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
            setNewCrit({ category: "", criterion: "", max_score: "3", scoring_guide: "" });
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
        setEditData({ category: c.category, criterion: c.criterion, max_score: String(c.max_score), scoring_guide: c.scoring_guide });
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
            <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
                <button onClick={() => router.push("/")} className="self-start flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Назад
                </button>
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <div className="inline-flex w-16 h-16 rounded-3xl bg-slate-700 items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-slate-300" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-white mb-1">Администратор</h1>
                        <p className="text-slate-400 text-sm">Въведете паролата за достъп</p>
                    </div>
                    <div className="glass p-6 rounded-3xl space-y-4">
                        <div>
                            <input
                                type="password"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleLogin()}
                                placeholder="Парола..."
                                className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                            />
                            {codeError && <p className="text-red-400 text-sm mt-2 ml-1">{codeError}</p>}
                        </div>
                        <button
                            onClick={handleLogin}
                            className="w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all active:scale-95"
                        >
                            Вход
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { key: "teams" as const, label: "Отбори", icon: Users, count: teams.length },
        { key: "jury" as const, label: "Жури", icon: Shield, count: jury.length },
        { key: "rubric" as const, label: "Рубрика", icon: BookOpen, count: criteria.length },
    ];

    return (
        <div className="animate-in fade-in duration-500 max-w-3xl mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/")} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-white">Администратор</h1>
                        <p className="text-slate-400 text-xs">Управление на DigiHack 2.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={clearEvaluations}
                        className="flex items-center gap-1.5 text-red-400 hover:text-white text-sm px-3 py-2 rounded-full hover:bg-red-500/20 transition-colors"
                        title="Изтрий всички резултати"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Изтрий резултати</span>
                    </button>
                    <button onClick={() => setAuthed(false)} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-full hover:bg-slate-800 transition-colors">
                        <LogOut className="w-4 h-4" /> Изход
                    </button>
                </div>
            </div>

            {/* Feedback toast */}
            {feedback && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-all ${feedback.ok ? "bg-[#C4FF00] text-[#0A1128]" : "bg-red-500 text-white"}`}>
                    {feedback.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {feedback.msg}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-slate-900/50 p-1.5 rounded-2xl">
                {tabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${activeTab === t.key ? "bg-[#C4FF00] text-[#0A1128]" : "text-slate-400 hover:text-white"}`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t.label}</span>
                            <span className="text-xs opacity-70">({t.count})</span>
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
                        <div className="space-y-4">
                            <div className="glass p-5 rounded-3xl">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[#C4FF00]" /> Добави Отбор</h3>
                                <div className="flex gap-3">
                                    <input
                                        value={newTeamName}
                                        onChange={e => setNewTeamName(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && addTeam()}
                                        placeholder="Име на отбора..."
                                        className="flex-1 p-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C4FF00] transition-all text-sm"
                                    />
                                    <button onClick={addTeam} disabled={saving || !newTeamName.trim()} className="px-5 py-3 bg-[#C4FF00] hover:bg-[#a1d600] text-[#0A1128] rounded-full font-bold text-sm disabled:opacity-50 transition-all flex items-center gap-1.5">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Добави
                                    </button>
                                </div>
                            </div>
                            {teams.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">Все още няма добавени отбори.</p>
                            ) : (
                                <div className="space-y-2">
                                    {teams.map(t => (
                                        <div key={t.id} className="glass p-4 rounded-2xl flex items-center justify-between">
                                            <span className="text-white font-medium">{t.name}</span>
                                            <button onClick={() => deleteTeam(t.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* JURY TAB */}
                    {activeTab === "jury" && (
                        <div className="space-y-4">
                            <div className="glass p-5 rounded-3xl">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[#C4FF00]" /> Добави Член на Журито</h3>
                                <div className="flex gap-3">
                                    <input
                                        value={newJuryName}
                                        onChange={e => setNewJuryName(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && addJury()}
                                        placeholder="Пълно ime..."
                                        className="flex-1 p-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C4FF00] transition-all text-sm"
                                    />
                                    <button onClick={addJury} disabled={saving || !newJuryName.trim()} className="px-5 py-3 bg-[#C4FF00] hover:bg-[#a1d600] text-[#0A1128] rounded-full font-bold text-sm disabled:opacity-50 transition-all flex items-center gap-1.5">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Добави
                                    </button>
                                </div>
                            </div>
                            {jury.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">Все още няма добавени членове на журито.</p>
                            ) : (
                                <div className="space-y-2">
                                    {jury.map(m => (
                                        <div key={m.id} className="glass p-4 rounded-2xl flex items-center justify-between">
                                            <span className="text-white font-medium">{m.name}</span>
                                            <button onClick={() => deleteJury(m.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* RUBRIC TAB */}
                    {activeTab === "rubric" && (
                        <div className="space-y-5">
                            {/* Add new criterion */}
                            <div className="glass p-5 rounded-3xl space-y-3">
                                <h3 className="font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-[#C4FF00]" /> Добави Критерий</h3>
                                <input value={newCrit.category} onChange={e => setNewCrit(p => ({ ...p, category: e.target.value }))} placeholder="Категория (напр. 1. Иновация...)" className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C4FF00] text-sm transition-all" />
                                <input value={newCrit.criterion} onChange={e => setNewCrit(p => ({ ...p, criterion: e.target.value }))} placeholder="Критерий (напр. Дефиниране и Значимост)" className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C4FF00] text-sm transition-all" />
                                <div className="flex gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400">Макс. точки</label>
                                        <input type="number" min="1" max="10" value={newCrit.max_score} onChange={e => setNewCrit(p => ({ ...p, max_score: e.target.value }))} className="w-24 p-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#C4FF00] text-sm transition-all text-center" />
                                    </div>
                                </div>
                                <textarea value={newCrit.scoring_guide} onChange={e => setNewCrit(p => ({ ...p, scoring_guide: e.target.value }))} placeholder="Ръководство за точкуване (3 т. ... 2 т. ... 1 т. ... 0 т. ...)" rows={4} className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C4FF00] text-sm transition-all resize-none" />
                                <button onClick={addCriterion} disabled={saving || !newCrit.category.trim() || !newCrit.criterion.trim()} className="w-full py-3 bg-[#C4FF00] hover:bg-[#a1d600] text-[#0A1128] rounded-full font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Добави Критерий
                                </button>
                            </div>

                            {/* Grouped list */}
                            {Object.entries(grouped).map(([cat, crits]) => (
                                <div key={cat} className="glass p-5 rounded-3xl">
                                    <h4 className="font-bold text-[#C4FF00] text-sm mb-4">{cat}</h4>
                                    <div className="space-y-3">
                                        {crits.map(c => (
                                            <div key={c.id} className="bg-slate-900/40 rounded-2xl p-4 border border-slate-700/30">
                                                {editId === c.id ? (
                                                    <div className="space-y-2">
                                                        <input value={editData.category} onChange={e => setEditData(p => ({ ...p, category: e.target.value }))} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#C4FF00]" />
                                                        <input value={editData.criterion} onChange={e => setEditData(p => ({ ...p, criterion: e.target.value }))} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#C4FF00]" />
                                                        <input type="number" value={editData.max_score} onChange={e => setEditData(p => ({ ...p, max_score: e.target.value }))} className="w-24 p-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#C4FF00]" />
                                                        <textarea value={editData.scoring_guide} onChange={e => setEditData(p => ({ ...p, scoring_guide: e.target.value }))} rows={4} className="w-full p-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#C4FF00] resize-none" />
                                                        <div className="flex gap-2">
                                                            <button onClick={saveEdit} disabled={saving} className="flex-1 py-2 bg-[#C4FF00] hover:bg-[#a1d600] text-[#0A1128] rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-1">
                                                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Запази
                                                            </button>
                                                            <button onClick={() => setEditId(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-all">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <span className="font-medium text-white text-sm">{c.criterion}</span>
                                                                <span className="text-xs bg-[#C4FF00]/10 text-[#C4FF00] border border-[#C4FF00]/20 px-2 py-0.5 rounded-full font-bold">до {c.max_score} т.</span>
                                                            </div>
                                                            {c.scoring_guide && (
                                                                <p className="text-xs text-slate-500 line-clamp-2">{c.scoring_guide.split('\n')[0]}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <button onClick={() => startEdit(c)} className="p-2 text-slate-500 hover:text-[#C4FF00] hover:bg-[#C4FF00]/10 rounded-xl transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                                            <button onClick={() => deleteCriterion(c.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
        </div>
    );
}
