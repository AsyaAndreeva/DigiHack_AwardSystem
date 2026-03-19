"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Shield, Users, BookOpen, Plus, Trash2, Loader2,
    LogOut, ArrowLeft, Check, Edit2, X, Copy, RefreshCw, Settings, Calendar, FileText
} from "lucide-react";

const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "digihack2026";

type Team = { 
    id: string; 
    name: string; 
    passcode?: string;
    description?: string;
    project_url?: string;
    presentation_url?: string;
    image_url?: string;
    links?: { title: string; url: string }[];
};
type JuryMember = { 
    id: string; 
    name: string; 
    passcode?: string;
    evaluations_count?: number;
};
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
    const [activeTab, setActiveTab] = useState<"teams" | "jury" | "rubric" | "theme" | "settings">("teams");
    const [deadline, setDeadline] = useState("");
    const [themeColor, setThemeColor] = useState("#DAEA5F");
    const [themeTitle, setThemeTitle] = useState("");
    const [themeDescription, setThemeDescription] = useState("");
    const [themeLinks, setThemeLinks] = useState<{title: string, url: string}[]>([]);

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

    // Inline add sub-criterion
    const [inlineAddCategory, setInlineAddCategory] = useState<string | null>(null);
    const [inlineAddData, setInlineAddData] = useState({ criterion: "", description: "", max_score: "3" });

    const showFeedback = (msg: string, ok: boolean) => {
        setFeedback({ msg, ok });
        setTimeout(() => setFeedback(null), 3000);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [t, j, r, s] = await Promise.all([
                fetch("/api/teams").then(x => x.json()),
                fetch("/api/jury").then(x => x.json()),
                fetch("/api/rubric").then(x => x.json()),
                fetch("/api/settings").then(x => x.json()),
            ]);
            setTeams(t.teams || []);
            setJury(j.members || []);
            setCriteria(r.criteria || []);
            if (s.success && s.deadline) {
                const dateObj = new Date(s.deadline);
                const tzOffset = dateObj.getTimezoneOffset() * 60000;
                setDeadline((new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16));
            }
            if (s.success && s.theme_color) setThemeColor(s.theme_color);
            if (s.success && s.theme_resources) {
                try {
                    const parsed = JSON.parse(s.theme_resources);
                    setThemeTitle(parsed.title || "");
                    setThemeDescription(parsed.description || "");
                    setThemeLinks(parsed.links || []);
                } catch {
                    setThemeDescription(s.theme_resources);
                }
            }
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
            // Preserve category and scoring_guide for easier bulk entry, but since we have inline add, just reset it
            setNewCrit({ category: "", description: "", criterion: "", max_score: "3", scoring_guide: "" });
            showFeedback("Категорията е създадена!", true);
        } else showFeedback(d.error || "Грешка", false);
    };

    const addInlineCriterion = async (category: string) => {
        if (!inlineAddData.criterion.trim()) return;
        setSaving(true);
        const payload = { category, criterion: inlineAddData.criterion, description: inlineAddData.description, max_score: parseInt(inlineAddData.max_score), scoring_guide: "", order_idx: criteria.length };
        const res = await fetch("/api/admin/rubric", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const d = await res.json();
        setSaving(false);
        if (d.success) {
            await loadData();
            setInlineAddCategory(null);
            setInlineAddData({ criterion: "", description: "", max_score: "3" });
            showFeedback("Под-критерият е добавен!", true);
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
                <header className="flex items-center justify-between px-8 py-6 bg-bg-main/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-md bg-slate-800 flex items-center justify-center shadow-xl">
                            <Shield className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">Администратор</h1>
                            <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Вход в конзолата</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.push('/')} className="flex items-center gap-2 py-3 px-6 rounded-full font-display font-black text-[10px] uppercase tracking-widest transition-all bg-white/5 text-slate-400 border border-white/10 hover:bg-slate-800">
                            <LogOut className="w-4 h-4" />
                            Отказ
                        </button>
                    </div>
                </header>

                <main className="flex flex-col items-center justify-center pt-24 px-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-12">
                        <div className="inline-flex w-16 h-16 rounded-md bg-slate-800 items-center justify-center mb-6 shadow-xl">
                            <Shield className="w-8 h-8 text-slate-400" />
                        </div>
                        <h1 className="text-4xl font-display font-black text-white mb-2 uppercase tracking-tight">Администратор</h1>
                        <p className="text-slate-500 text-sm font-sans font-medium uppercase tracking-widest opacity-80">Вход в конзолата</p>
                    </div>
                    <div className="glass p-8 rounded-md border-l-4 border-slate-700 space-y-6">
                        <div className="space-y-3">
                            <input
                                type="password"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleLogin()}
                                placeholder="Парола..."
                                className="w-full p-5 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all text-center tracking-[0.3em] font-mono text-xl"
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

    // Settings logic
    const saveSettings = async () => {
        setSaving(true);
        const res = await fetch("/api/admin/settings", { 
            method: "POST", headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ 
                deadline: new Date(deadline).toISOString(), 
                themeColor, 
                themeResources: JSON.stringify({ title: themeTitle, description: themeDescription, links: themeLinks })
            }) 
        });
        const d = await res.json();
        setSaving(false);
        if (d.success) showFeedback("Настройките са обновени!", true);
        else showFeedback(d.error || "Грешка", false);
    };

    const formatDateString = (localIsoString: string) => {
        if (!localIsoString) return "";
        const [datePart, timePart] = localIsoString.split('T');
        if (!datePart || !timePart) return localIsoString;
        const [y, m, d] = datePart.split('-');
        return `${d}/${m}/${y} ${timePart}`;
    };

    const tabs = [
        { key: "teams" as const, label: "Отбори", icon: Users, count: teams.length },
        { key: "jury" as const, label: "Жури", icon: Shield, count: jury.length },
        { key: "rubric" as const, label: "Рубрика", icon: BookOpen, count: criteria.length },
        { key: "theme" as const, label: "Тема", icon: FileText },
        { key: "settings" as const, label: "Настройки", icon: Settings },
    ];

    return (
        <div className="animate-in fade-in duration-500 min-h-screen">
            {/* Standardized Header */}
            <header className="flex items-center justify-between px-8 py-6 bg-bg-main/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-slate-800 flex items-center justify-center shadow-xl font-bold text-white">
                        <Shield className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">Администратор</h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Конзола за управление</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => {
                            setAuthed(false);
                            router.push('/');
                        }}
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
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-all ${feedback.ok ? "bg-brand-yellow text-brand-dark" : "bg-red-500 text-white"}`}>
                    {feedback.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {feedback.msg}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-md border border-white/5">
                {tabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-xs font-black uppercase tracking-widest transition-all ${activeTab === t.key ? "bg-brand-yellow text-brand-dark" : "text-slate-500 hover:text-white"}`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t.label}</span>
                            <span className="text-[10px] opacity-50">({t.count})</span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>
            ) : (
                <>
                    {/* TEAMS TAB */}
                    {activeTab === "teams" && (
                        <div className="space-y-6">
                            <div className="glass p-8 rounded-md border-l-4 border-brand-yellow shadow-xl">
                                <h3 className="text-xs font-black text-white mb-6 flex items-center gap-2 uppercase tracking-[0.2em] font-sans">
                                    <Plus className="w-4 h-4 text-brand-yellow" /> Добави Отбор
                                </h3>
                                <div className="flex gap-4">
                                    <input
                                        value={newTeamName}
                                        onChange={e => setNewTeamName(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && addTeam()}
                                        placeholder="Име на отбора..."
                                        className="flex-1 p-4 bg-black/40 border border-white/10 rounded-md text-white placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-yellow transition-all text-sm font-sans"
                                    />
                                    <button onClick={addTeam} disabled={saving || !newTeamName.trim()} className="px-8 py-3 bg-brand-yellow hover:bg-white text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg active:scale-95">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Добави
                                    </button>
                                </div>
                            </div>
                            {teams.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">Все още няма добавени отбори.</p>
                            ) : (
                                <div className="space-y-3">
                                    {teams.map(t => (
                                        <div key={t.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-md flex flex-col gap-4 hover:bg-white/[0.04] transition-all group">
                                            <div className="flex items-center justify-between gap-4">
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
                                                                className="w-28 p-1.5 bg-slate-900 border border-brand-yellow/40 rounded-md text-xs font-mono text-brand-yellow text-center focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                                                            />
                                                             <button onClick={() => updatePasscode("teams", t.id, editPasscodeValue)} disabled={savingPasscode} className="p-1.5 bg-brand-yellow hover:brightness-110 text-brand-dark rounded-md transition-colors" title="Запази">
                                                                {savingPasscode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                            </button>
                                                             <button onClick={() => updatePasscode("teams", t.id, "")} disabled={savingPasscode} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors" title="Генерирай нова">
                                                                <RefreshCw className="w-3 h-3" />
                                                            </button>
                                                            <button onClick={() => setEditPasscodeId(null)} className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        t.passcode && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => copyPasscode(t.id, t.passcode!)}
                                                                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md text-xs font-mono text-brand-yellow transition-colors"
                                                                    title="Копирай паролата"
                                                                >
                                                                    {copiedId === t.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                                    {t.passcode}
                                                                </button>
                                                                 <button onClick={() => startEditPasscode(t.id, t.passcode!)} className="p-1.5 text-slate-500 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded-md transition-colors" title="Промени паролата">
                                                                    <Edit2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                     <button onClick={() => deleteTeam(t.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {(t.description || t.project_url || t.presentation_url) && (
                                                <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                                                    {t.description && <p className="text-sm text-slate-400 font-sans leading-relaxed">{t.description}</p>}
                                                    <div className="flex flex-wrap gap-4 mt-2">
                                                        {t.project_url && <a href={t.project_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-yellow hover:underline font-bold font-sans flex items-center gap-1">🌐 Project Link</a>}
                                                        {t.presentation_url && <a href={t.presentation_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-yellow hover:underline font-bold font-sans flex items-center gap-1">📄 Presentation</a>}
                                                        {t.links?.map((link, i) => (
                                                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-white hover:underline transition-colors font-sans flex items-center gap-1">
                                                                🔗 {link.title || 'Link'}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* JURY TAB */}
                    {activeTab === "jury" && (
                        <div className="space-y-6">
                            <div className="glass p-8 rounded-md border-l-4 border-brand-yellow shadow-xl">
                                <h3 className="text-xs font-black text-white mb-6 flex items-center gap-2 uppercase tracking-[0.2em] font-sans">
                                    <Plus className="w-4 h-4 text-brand-yellow" /> Добави Член на Журито
                                </h3>
                                <div className="flex gap-4">
                                    <input
                                        value={newJuryName}
                                        onChange={e => setNewJuryName(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && addJury()}
                                        placeholder="Пълно име..."
                                        className="flex-1 p-4 bg-black/40 border border-white/10 rounded-md text-white placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-yellow transition-all text-sm font-sans"
                                    />
                                    <button onClick={addJury} disabled={saving || !newJuryName.trim()} className="px-8 py-3 bg-brand-yellow hover:bg-white text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg active:scale-95">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Добави
                                    </button>
                                </div>
                            </div>
                            {jury.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">Все още няма добавени членове на журито.</p>
                            ) : (
                                <div className="space-y-3">
                                    {jury.map(m => (
                                        <div key={m.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-md flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-all group">
                                            <div className="flex flex-col">
                                                <span className="text-white font-black uppercase tracking-tight font-sans text-sm">{m.name}</span>
                                                <span className="text-xs text-slate-500 font-sans mt-0.5 font-bold">Оценени отбори: {m.evaluations_count || 0}</span>
                                            </div>
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
                                                            className="w-28 p-1.5 bg-slate-900 border border-brand-yellow/40 rounded-xl text-xs font-mono text-brand-yellow text-center focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                                                        />
                                                        <button onClick={() => updatePasscode("jury", m.id, editPasscodeValue)} disabled={savingPasscode} className="p-1.5 bg-brand-yellow hover:brightness-110 text-brand-dark rounded-lg transition-colors" title="Запази">
                                                            {savingPasscode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                        </button>
                                                         <button onClick={() => updatePasscode("jury", m.id, "")} disabled={savingPasscode} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors" title="Генерирай нова">
                                                            <RefreshCw className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={() => setEditPasscodeId(null)} className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    m.passcode && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => copyPasscode(m.id, m.passcode!)}
                                                                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md text-xs font-mono text-brand-yellow transition-colors"
                                                                title="Копирай паролата"
                                                            >
                                                                {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                                {m.passcode}
                                                            </button>
                                                             <button onClick={() => startEditPasscode(m.id, m.passcode!)} className="p-1.5 text-slate-500 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded-md transition-colors" title="Промени паролата">
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                                 <button onClick={() => deleteJury(m.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors">
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
                             <div className="glass p-10 rounded-md border-l-4 border-brand-yellow space-y-6 shadow-2xl">
                                 <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-[0.2em] font-sans">
                                     <Plus className="w-4 h-4 text-brand-yellow" /> Създай Нова Категория
                                 </h3>
                                 <input value={newCrit.category} onChange={e => setNewCrit(p => ({ ...p, category: e.target.value }))} placeholder="Име на категорията (напр. 1. Иновация...)" className="w-full p-4 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-yellow text-sm transition-all font-sans font-bold" />
                                 <textarea value={newCrit.scoring_guide} onChange={e => setNewCrit(p => ({ ...p, scoring_guide: e.target.value }))} placeholder="Основно описание на категорията (курсивен текст под заглавието)" rows={2} className="w-full p-4 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-yellow text-sm transition-all resize-none font-sans" />
                                 <div className="p-6 bg-black/40 border border-white/5 rounded-md space-y-4 mt-6">
                                     <h4 className="text-[10px] font-black text-brand-yellow uppercase tracking-widest ml-1 mb-2">Първи под-критерий</h4>
                                     <input value={newCrit.criterion} onChange={e => setNewCrit(p => ({ ...p, criterion: e.target.value }))} placeholder="Име на критерия (напр. Дефиниране и Значимост)" className="w-full p-4 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-yellow text-sm transition-all font-sans" />
                                     <textarea value={newCrit.description} onChange={e => setNewCrit(p => ({ ...p, description: e.target.value }))} placeholder="Специфично описание за този критерий (поддържа HTML)" rows={3} className="w-full p-4 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-yellow text-sm transition-all resize-none font-sans" />
                                     
                                     <div className="flex flex-col gap-4">
                                         <div className="space-y-2 flex-col flex">
                                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Макс. точки за този критерий</label>
                                             <input type="number" min="1" max="100" value={newCrit.max_score} onChange={e => setNewCrit(p => ({ ...p, max_score: e.target.value }))} className="w-24 p-4 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow text-sm transition-all text-center font-mono" />
                                         </div>
                                     </div>
                                 </div>

                                 <button onClick={addCriterion} disabled={saving || !newCrit.category.trim() || !newCrit.criterion.trim()} className="w-full py-4 bg-brand-yellow hover:bg-white text-brand-dark rounded-full font-black text-xs uppercase tracking-[0.2em] disabled:opacity-30 transition-all flex items-center justify-center gap-3 shadow-lg">
                                     {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Запази Категорията
                                 </button>
                             </div>

                            {/* Grouped list */}
                             {Object.entries(grouped).map(([cat, crits]) => (
                                <div key={cat} className="glass p-6 rounded-md mb-6">
                                    <div className="mb-6 border-b border-white/5 pb-4">
                                        <h4 className="font-display font-bold text-white text-xl uppercase tracking-tight">{cat}</h4>
                                        {crits[0]?.scoring_guide && (
                                            <div className="mt-2 text-slate-400 text-sm italic opacity-80" dangerouslySetInnerHTML={{ __html: crits[0].scoring_guide }} />
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                         {crits.map(c => (
                                             <div key={c.id} className="bg-slate-900/40 rounded-md p-4 border border-slate-700/30">
                                                {editId === c.id ? (
                                                    <div className="space-y-3 pt-2">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Име на категорията</label>
                                                            <input value={editData.category} onChange={e => setEditData(p => ({ ...p, category: e.target.value }))} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-yellow" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Главно описание (курсив)</label>
                                                            <textarea value={editData.scoring_guide} onChange={e => setEditData(p => ({ ...p, scoring_guide: e.target.value }))} rows={2} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-yellow resize-none" />
                                                        </div>
                                                        <div className="p-4 bg-black/20 rounded-md border border-white/5 space-y-3">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-brand-yellow uppercase ml-1">Под-критерий</label>
                                                                <input value={editData.criterion} onChange={e => setEditData(p => ({ ...p, criterion: e.target.value }))} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-yellow" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Специфично описание</label>
                                                                <textarea value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-yellow resize-none" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Макс. точки</label>
                                                                 <input type="number" value={editData.max_score} onChange={e => setEditData(p => ({ ...p, max_score: e.target.value }))} className="w-24 p-3 bg-slate-800 border border-slate-600 rounded-md text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-brand-yellow font-mono" />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 mt-4">
                                                             <button onClick={saveEdit} disabled={saving} className="flex-1 py-3 bg-brand-yellow hover:brightness-110 text-brand-dark rounded-full font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Запази
                                                            </button>
                                                             <button onClick={() => setEditId(null)} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full text-sm transition-all flex items-center justify-center">
                                                                Отказ
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                    <span className="font-medium text-white text-base">{c.criterion}</span>
                                                                     <span className="text-xs bg-brand-light-blue/10 text-brand-light-blue border border-brand-light-blue/20 px-2 py-0.5 rounded-md font-black uppercase tracking-widest hidden sm:inline">до {c.max_score} т.</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1 shrink-0">
                                                                <button onClick={() => startEdit(c)} className="p-2 text-slate-500 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                                <button onClick={() => deleteCriterion(c.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </div>
                                                        {c.description && (
                                                            <div className="text-xs text-slate-400 leading-relaxed bg-black/20 p-3 rounded-md border border-white/5 font-sans" dangerouslySetInnerHTML={{ __html: c.description }} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {inlineAddCategory === cat ? (
                                        <div className="mt-4 p-5 bg-black/40 rounded-md border border-brand-light-blue/30 space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h5 className="text-xs font-black text-brand-light-blue uppercase tracking-widest flex items-center gap-2"><Plus className="w-3 h-3" /> Нов под-критерий</h5>
                                                <button onClick={() => setInlineAddCategory(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                            </div>
                                            <input value={inlineAddData.criterion} onChange={e => setInlineAddData(p => ({ ...p, criterion: e.target.value }))} placeholder="Име на критерия..." className="w-full p-3 bg-white/5 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-light-blue" />
                                            <textarea value={inlineAddData.description} onChange={e => setInlineAddData(p => ({ ...p, description: e.target.value }))} placeholder="Описание (HTML)..." rows={2} className="w-full p-3 bg-white/5 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-light-blue resize-none" />
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Макс. точки:</label>
                                                    <input type="number" min="1" max="100" value={inlineAddData.max_score} onChange={e => setInlineAddData(p => ({ ...p, max_score: e.target.value }))} className="w-16 p-2 bg-white/5 border border-white/10 rounded-md text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-brand-light-blue" />
                                                </div>
                                                <button onClick={() => addInlineCriterion(cat)} disabled={saving || !inlineAddData.criterion.trim()} className="ml-auto px-6 py-2 bg-brand-light-blue hover:brightness-110 text-brand-dark rounded-md font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Добави"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setInlineAddCategory(cat); setInlineAddData({ criterion: "", description: "", max_score: "3" }); }} className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-md font-bold text-xs uppercase tracking-widest transition-colors border border-white/5 flex items-center justify-center gap-2 border-dashed">
                                            <Plus className="w-4 h-4" /> Добави Под-критерий
                                        </button>
                                    )}
                                </div>
                            ))}
                            {criteria.length === 0 && <p className="text-center text-slate-500 py-8">Все още няма критерии в рубриката.</p>}
                        </div>
                    )}

                    {/* THEME TAB */}
                    {activeTab === "theme" && (
                        <div className="space-y-6">
                            <div className="glass p-8 rounded-md border-l-4 border-brand-yellow shadow-xl">
                                <h3 className="text-xs font-black text-white mb-6 flex items-center gap-2 uppercase tracking-[0.2em] font-sans">
                                    <FileText className="w-4 h-4 text-brand-yellow" /> Тема на Хакатона и Ресурси
                                </h3>
                                
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 ml-1 block flex items-center gap-2 uppercase tracking-widest font-sans">
                                            Заглавие на Темата
                                        </label>
                                        <input
                                            type="text"
                                            value={themeTitle}
                                            onChange={e => setThemeTitle(e.target.value)}
                                            placeholder="Пр: DigiHack 2026: Бъдещето на AI..."
                                            className="w-full p-4 bg-black/40 border border-white/10 rounded-md text-white font-sans placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-yellow transition-all font-black text-lg"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 ml-1 block flex items-center gap-2 uppercase tracking-widest font-sans">
                                            Описание на Заданието (Контекст / Правила)
                                        </label>
                                        <textarea
                                            value={themeDescription}
                                            onChange={e => setThemeDescription(e.target.value)}
                                            placeholder="Въведете пълно описание, правила, критерии и инструкции..."
                                            className="w-full h-[40vh] min-h-[300px] p-6 bg-black/40 border border-white/10 rounded-md text-white text-sm font-sans placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-yellow transition-all resize-none"
                                        />
                                    </div>

                                    <div className="space-y-4 border-t border-white/5 pt-6">
                                        <label className="text-xs font-black text-slate-400 ml-1 block flex items-center gap-2 uppercase tracking-widest font-sans">
                                            Полезни Ресурси (Линкове)
                                        </label>
                                        {themeLinks.map((link, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-black/40 p-2 rounded-md border border-white/5">
                                                <input
                                                    type="text"
                                                    placeholder="Име (пр. Figma Шаблон)"
                                                    value={link.title}
                                                    onChange={(e) => {
                                                        const n = [...themeLinks];
                                                        n[idx].title = e.target.value;
                                                        setThemeLinks(n);
                                                    }}
                                                    className="flex-1 p-3 bg-transparent border border-white/10 rounded-md text-white text-sm focus:border-brand-yellow transition-all"
                                                />
                                                <input
                                                    type="url"
                                                    placeholder="URL връзка"
                                                    value={link.url}
                                                    onChange={(e) => {
                                                        const n = [...themeLinks];
                                                        n[idx].url = e.target.value;
                                                        setThemeLinks(n);
                                                    }}
                                                    className="flex-[2] p-3 bg-transparent border border-white/10 rounded-md text-white text-sm focus:border-brand-yellow transition-all"
                                                />
                                                <button onClick={() => setThemeLinks(themeLinks.filter((_, i) => i !== idx))} className="p-3 text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => setThemeLinks([...themeLinks, { title: "", url: "" }])} className="text-xs font-black uppercase tracking-widest text-brand-orange hover:text-white transition-colors">
                                            + Добави ресурс
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-end pt-4 mt-6 border-t border-white/5">
                                        <button onClick={saveSettings} disabled={saving} className="px-8 py-3 bg-brand-yellow hover:bg-white text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg active:scale-95 shrink-0 h-14">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Запази Темата
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === "settings" && (
                        <div className="space-y-6">
                            <div className="glass p-8 rounded-md border-l-4 border-brand-yellow shadow-xl">
                                <h3 className="text-xs font-black text-white mb-6 flex items-center gap-2 uppercase tracking-[0.2em] font-sans">
                                    <Settings className="w-4 h-4 text-brand-yellow" /> Системни Настройки
                                </h3>
                                
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 ml-1 block flex items-center gap-2 uppercase tracking-widest font-sans">
                                        Краен срок за предаване на проекти
                                    </label>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1 group">
                                            <div className="w-full flex items-center justify-between p-4 pr-12 bg-black/40 border border-white/10 rounded-md text-white group-focus-within:ring-1 group-focus-within:ring-brand-yellow transition-all text-sm font-sans cursor-pointer relative z-10 h-full min-h-[52px]">
                                                <span>{formatDateString(deadline) || "ДД/ММ/ГГГГ ЧЧ:ММ"}</span>
                                            </div>
                                            <input
                                                type="datetime-local"
                                                value={deadline}
                                                onChange={e => setDeadline(e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                            />
                                            <Calendar className="w-5 h-5 text-brand-yellow absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-30" />
                                        </div>
                                    </div>


                                    <div className="space-y-4 pt-6 mt-6 border-t border-white/5">
                                        <label className="text-xs font-black text-slate-400 ml-1 block flex items-center gap-2 uppercase tracking-widest font-sans">
                                            Основен цвят на системата
                                        </label>
                                        <div className="flex gap-4 items-center">
                                            <div className="relative group w-14 h-14 rounded-md overflow-hidden border border-white/10 ring-1 ring-white/5 shadow-xl shrink-0 cursor-pointer hover:ring-brand-yellow transition-all">
                                                <input
                                                    type="color"
                                                    value={themeColor}
                                                    onChange={e => setThemeColor(e.target.value)}
                                                    className="absolute -inset-4 w-[200%] h-[200%] cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1 max-w-[200px]">
                                                <div className="p-4 bg-black/40 border border-white/10 rounded-md text-white text-sm font-mono tracking-widest uppercase flex items-center justify-between">
                                                    {themeColor}
                                                </div>
                                            </div>
                                            <button onClick={saveSettings} disabled={saving || !themeColor || !deadline} className="px-8 py-3 bg-brand-yellow hover:bg-white text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg active:scale-95 shrink-0 h-14">
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Обнови
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 ml-1">Този цвят автоматично ще се отрази във всички портали от край до край.</p>
                                    </div>

                                    <div className="space-y-4 pt-6 mt-6 border-t border-white/5">
                                        <label className="text-xs font-black text-red-500 ml-1 block flex items-center gap-2 uppercase tracking-widest font-sans">
                                            Опасна Зона
                                        </label>
                                        <button
                                            onClick={clearEvaluations}
                                            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-md font-display font-black text-xs uppercase tracking-widest transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            Изтрий всички резултати
                                        </button>
                                        <p className="text-xs text-slate-500 ml-1">Това действие ще изтрие всички оценки от журито напълно безвъзвратно.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
            </main>
        </div>
    );
}
