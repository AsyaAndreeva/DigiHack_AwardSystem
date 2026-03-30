"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Shield, Users, BookOpen, Plus, Trash2, Loader2,
    LogOut, ArrowLeft, Check, Edit2, X, Copy, RefreshCw, Settings, Calendar, FileText, GraduationCap
} from "lucide-react";

const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "2026";

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
    const [mentors, setMentors] = useState<JuryMember[]>([]);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"teams" | "jury" | "mentors" | "rubric" | "theme" | "settings">("teams");
    const [deadline, setDeadline] = useState("");
    const [themeColor, setThemeColor] = useState("#DAEA5F");
    const [themeTitle, setThemeTitle] = useState("");
    const [themeDescription, setThemeDescription] = useState("");
    const [themeLinks, setThemeLinks] = useState<{title: string, url: string}[]>([]);

    // Add forms
    const [newTeamName, setNewTeamName] = useState("");
    const [newJuryName, setNewJuryName] = useState("");
    const [newMentorName, setNewMentorName] = useState("");
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

    // Name inline edit
    const [editNameId, setEditNameId] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState("");
    const [savingName, setSavingName] = useState(false);

    const startEditName = (id: string, current: string) => {
        setEditNameId(id);
        setEditNameValue(current);
    };

    const adminHeaders = (extra?: Record<string, string>) => ({
        'Content-Type': 'application/json',
        'x-admin-code': code,
        ...extra,
    });

    const updateName = async (type: "teams" | "jury" | "mentors", id: string, name: string) => {
        if (!name.trim()) return;
        setSavingName(true);
        const res = await fetch(`/api/admin/${type}`, {
            method: "PATCH",
            headers: adminHeaders(),
            body: JSON.stringify({ id, name }),
        });
        const d = await res.json();
        setSavingName(false);
        if (d.success) {
            if (type === "teams") setTeams(p => p.map(t => t.id === id ? { ...t, name: d.mentor?.name || d.team?.name || d.name } : t));
            else if (type === "jury") setJury(p => p.map(mj => mj.id === id ? { ...mj, name: d.member?.name || d.name } : mj));
            else if (type === "mentors") setMentors(p => p.map(m => m.id === id ? { ...m, name: d.mentor?.name || d.name } : m));
            setEditNameId(null);
            showFeedback(`Името е обновено!`, true);
        } else showFeedback(d.error || "Грешка", false);
    };

    const updatePasscode = async (type: "teams" | "jury" | "mentors", id: string, passcode?: string) => {
        setSavingPasscode(true);
        const res = await fetch(`/api/admin/${type}`, {
            method: "PATCH",
            headers: adminHeaders(),
            body: JSON.stringify({ id, passcode: passcode ?? "" }),
        });
        const d = await res.json();
        setSavingPasscode(false);
        if (d.success) {
            const newCode: string = d.passcode || d.mentor?.passcode || d.member?.passcode || d.team?.passcode;
            if (type === "teams") setTeams(p => p.map(t => t.id === id ? { ...t, passcode: newCode } : t));
            else if (type === "jury") setJury(p => p.map(m => m.id === id ? { ...m, passcode: newCode } : m));
            else if (type === "mentors") setMentors(p => p.map(m => m.id === id ? { ...m, passcode: newCode } : m));
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
            const [t, j, m, r, s] = await Promise.all([
                fetch("/api/teams").then(x => x.json()),
                fetch("/api/jury").then(x => x.json()),
                fetch("/api/admin/mentors", { headers: adminHeaders() }).then(x => x.json()),
                fetch("/api/rubric").then(x => x.json()),
                fetch("/api/settings").then(x => x.json()),
            ]);
            setTeams(t.teams || []);
            setJury(j.members || []);
            setMentors(m.mentors || []);
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
        const res = await fetch("/api/admin/teams", { method: "POST", headers: adminHeaders(), body: JSON.stringify({ name: newTeamName }) });
        const d = await res.json();
        setSaving(false);
        if (d.success) { setTeams(p => [...p, d.team]); setNewTeamName(""); showFeedback(`Отборът е добавен! Парола: ${d.team.passcode}`, true); }
        else showFeedback(d.error || "Грешка", false);
    };

    const deleteTeam = async (id: string) => {
        const res = await fetch("/api/admin/teams", { method: "DELETE", headers: adminHeaders(), body: JSON.stringify({ id }) });
        const d = await res.json();
        if (d.success) { setTeams(p => p.filter(t => t.id !== id)); showFeedback("Отборът е изтрит.", true); }
        else showFeedback(d.error || "Грешка", false);
    };

    // Jury
    const addJury = async () => {
        if (!newJuryName.trim()) return;
        setSaving(true);
        const res = await fetch("/api/admin/jury", { method: "POST", headers: adminHeaders(), body: JSON.stringify({ name: newJuryName }) });
        const d = await res.json();
        setSaving(false);
        if (d.success) { setJury(p => [...p, d.member]); setNewJuryName(""); showFeedback(`Журистът е добавен! Парола: ${d.member.passcode}`, true); }
        else showFeedback(d.error || "Грешка", false);
    };

    const deleteJury = async (id: string) => {
        const res = await fetch("/api/admin/jury", { method: "DELETE", headers: adminHeaders(), body: JSON.stringify({ id }) });
        const d = await res.json();
        if (d.success) { setJury(p => p.filter(m => m.id !== id)); showFeedback("Членът е премахнат.", true); }
        else showFeedback(d.error || "Грешка", false);
    };

    // Mentors
    const addMentor = async () => {
        if (!newMentorName.trim()) return;
        setSaving(true);
        const res = await fetch("/api/admin/mentors", { method: "POST", headers: adminHeaders(), body: JSON.stringify({ name: newMentorName }) });
        const d = await res.json();
        setSaving(false);
        if (d.success) { setMentors(p => [...p, d.mentor]); setNewMentorName(""); showFeedback(`Менторът е добавен! Парола: ${d.mentor.passcode}`, true); }
        else showFeedback(d.error || "Грешка", false);
    };

    const deleteMentor = async (id: string) => {
        if (!window.confirm("Сигурни ли сте? Това ще изтрие и всички коментари от него!")) return;
        const res = await fetch("/api/admin/mentors", { method: "DELETE", headers: adminHeaders(), body: JSON.stringify({ id }) });
        const d = await res.json();
        if (d.success) { setMentors(p => p.filter(m => m.id !== id)); showFeedback("Менторът е премахнат.", true); }
        else showFeedback(d.error || "Грешка", false);
    };

    // Clear all evaluations
    const clearEvaluations = async () => {
        if (!window.confirm("Сигурни ли сте? Това ще изтрие ВСИЧКИ резултати от оценяването!")) return;
        const res = await fetch("/api/admin/evaluations", { method: "DELETE", headers: adminHeaders() });
        const d = await res.json();
        if (d.success) showFeedback("Всички резултати са изтрити.", true);
        else showFeedback(d.error || "Грешка", false);
    };

    // Rubric operations
    const addCriterion = async () => {
        if (!newCrit.category.trim() || !newCrit.criterion.trim()) return;
        setSaving(true);
        const payload = { ...newCrit, max_score: parseInt(newCrit.max_score), order_idx: criteria.length };
        const res = await fetch("/api/admin/rubric", { method: "POST", headers: adminHeaders(), body: JSON.stringify(payload) });
        const d = await res.json();
        setSaving(false);
        if (d.success) { await loadData(); setNewCrit({ category: "", description: "", criterion: "", max_score: "3", scoring_guide: "" }); showFeedback("Категорията е създадена!", true); }
        else showFeedback(d.error || "Грешка", false);
    };

    const addInlineCriterion = async (category: string) => {
        if (!inlineAddData.criterion.trim()) return;
        setSaving(true);
        const payload = { category, criterion: inlineAddData.criterion, description: inlineAddData.description, max_score: parseInt(inlineAddData.max_score), scoring_guide: "", order_idx: criteria.length };
        const res = await fetch("/api/admin/rubric", { method: "POST", headers: adminHeaders(), body: JSON.stringify(payload) });
        const d = await res.json();
        setSaving(false);
        if (d.success) { await loadData(); setInlineAddCategory(null); setInlineAddData({ criterion: "", description: "", max_score: "3" }); showFeedback("Под-критерият е добавен!", true); }
        else showFeedback(d.error || "Грешка", false);
    };

    const saveEdit = async () => {
        if (!editId) return;
        setSaving(true);
        const payload = { id: editId, ...editData, max_score: parseInt(editData.max_score) };
        const res = await fetch("/api/admin/rubric", { method: "PUT", headers: adminHeaders(), body: JSON.stringify(payload) });
        const d = await res.json();
        setSaving(false);
        if (d.success) { await loadData(); setEditId(null); showFeedback("Критерият е обновен!", true); }
        else showFeedback(d.error || "Грешка", false);
    };

    const deleteCriterion = async (id: number) => {
        const res = await fetch("/api/admin/rubric", { method: "DELETE", headers: adminHeaders(), body: JSON.stringify({ id }) });
        const d = await res.json();
        if (d.success) { setCriteria(p => p.filter(c => c.id !== id)); showFeedback("Критерият е изтрит.", true); }
        else showFeedback(d.error || "Грешка", false);
    };

    const startEdit = (c: Criterion) => {
        setEditId(c.id);
        setEditData({ category: c.category, description: c.description || "", criterion: c.criterion, max_score: String(c.max_score), scoring_guide: c.scoring_guide });
    };

    const grouped = criteria.reduce((acc, c) => {
        if (!acc[c.category]) acc[c.category] = [];
        acc[c.category].push(c);
        return acc;
    }, {} as Record<string, Criterion[]>);

    // Settings
    const saveSettings = async () => {
        setSaving(true);
        const res = await fetch("/api/admin/settings", { 
            method: "POST", headers: adminHeaders(), 
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
        { key: "mentors" as const, label: "Ментори", icon: GraduationCap, count: mentors.length },
        { key: "rubric" as const, label: "Рубрика", icon: BookOpen, count: criteria.length },
        { key: "theme" as const, label: "Тема", icon: FileText },
        { key: "settings" as const, label: "Настройки", icon: Settings },
    ];

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
                </header>
                <main className="flex flex-col items-center justify-center pt-24 px-4">
                    <div className="w-full max-w-sm">
                        <div className="glass p-8 rounded-md border-l-4 border-slate-700 space-y-6">
                            <input
                                type="password"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleLogin()}
                                placeholder="Парола..."
                                className="w-full p-5 bg-black/40 border border-white/10 rounded-md text-white text-center font-mono text-xl focus:ring-2 focus:ring-slate-500 outline-none"
                            />
                            {codeError && <p className="text-red-500 text-xs font-black uppercase tracking-widest">{codeError}</p>}
                            <button onClick={handleLogin} className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all">Вход</button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 min-h-screen">
            <header className="flex items-center justify-between px-8 py-6 bg-bg-main/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[50]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-slate-800 flex items-center justify-center shadow-xl">
                        <Shield className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none mb-1">Администратор</h1>
                        <p className="text-[10px] text-slate-500 font-sans font-black uppercase tracking-[0.2em] opacity-60">Конзола за управление</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button onClick={loadData} disabled={loading} className="flex items-center gap-2 py-3 px-6 rounded-full bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 hover:bg-brand-yellow hover:text-brand-dark transition-all uppercase font-black text-[10px] tracking-widest">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Опресни
                    </button>
                    <button onClick={() => { setAuthed(false); router.push('/'); }} className="flex items-center gap-2 py-3 px-6 rounded-full bg-white/5 text-slate-400 border border-white/10 hover:bg-slate-800 transition-all uppercase font-black text-[10px] tracking-widest">
                        <LogOut className="w-4 h-4" /> Изход
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto py-12 px-4">
                {feedback && (
                    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all ${feedback.ok ? "bg-brand-yellow text-brand-dark" : "bg-red-500 text-white"}`}>
                        {feedback.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} {feedback.msg}
                    </div>
                )}

                <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-md border border-white/5 overflow-x-auto no-scrollbar">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.key ? "bg-brand-yellow text-brand-dark shadow-lg scale-[1.02]" : "text-slate-500 hover:text-white"}`}>
                            <t.icon className="w-4 h-4" /> {t.label} {t.count !== undefined && <span className="opacity-50">({t.count})</span>}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand-yellow" /></div>
                ) : (
                    <>
                        {/* TEAMS */}
                        {activeTab === "teams" && (
                            <div className="space-y-6">
                                <div className="glass p-8 rounded-md border-l-4 border-brand-yellow shadow-xl">
                                    <h3 className="text-xs font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4 text-brand-yellow" /> Добави Отбор</h3>
                                    <div className="flex gap-4">
                                        <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} onKeyDown={e => e.key === "Enter" && addTeam()} placeholder="Име на отбора..." className="flex-1 p-4 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-brand-yellow outline-none text-sm" />
                                        <button onClick={addTeam} disabled={saving || !newTeamName.trim()} className="px-8 bg-brand-yellow text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest transition-all">Добави</button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {teams.map(t => (
                                        <div key={t.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-md flex items-center justify-between hover:bg-white/[0.05] transition-all">
                                            <div className="flex items-center gap-3">
                                                {editNameId === t.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input autoFocus value={editNameValue} onChange={e => setEditNameValue(e.target.value)} onKeyDown={e => e.key === "Enter" && updateName("teams", t.id, editNameValue)} className="bg-slate-900 border border-brand-yellow/30 p-1.5 rounded text-sm text-white focus:ring-1 focus:ring-brand-yellow outline-none" />
                                                        <button onClick={() => updateName("teams", t.id, editNameValue)} className="p-1.5 bg-brand-yellow rounded text-brand-dark"><Check className="w-3 h-3" /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold text-sm uppercase">{t.name}</span>
                                                        <button onClick={() => startEditName(t.id, t.name)} className="text-slate-600 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {t.passcode && (
                                                    <button onClick={() => copyPasscode(t.id, t.passcode!)} className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md text-xs font-mono text-brand-yellow flex items-center gap-2 transition-colors">
                                                        {copiedId === t.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                        {t.passcode}
                                                    </button>
                                                )}
                                                <button onClick={() => deleteTeam(t.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* JURY */}
                        {activeTab === "jury" && (
                            <div className="space-y-6">
                                <div className="glass p-8 rounded-md border-l-4 border-brand-yellow shadow-xl">
                                    <h3 className="text-xs font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4 text-brand-yellow" /> Добави Жури</h3>
                                    <div className="flex gap-4">
                                        <input value={newJuryName} onChange={e => setNewJuryName(e.target.value)} onKeyDown={e => e.key === "Enter" && addJury()} placeholder="Име..." className="flex-1 p-4 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-brand-yellow outline-none text-sm" />
                                        <button onClick={addJury} disabled={saving || !newJuryName.trim()} className="px-8 bg-brand-yellow text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest transition-all">Добави</button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {jury.map(m => (
                                        <div key={m.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-md flex items-center justify-between hover:bg-white/[0.05] transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-bold text-sm uppercase">{m.name}</span>
                                                    <button onClick={() => startEditName(m.id, m.name)} className="text-slate-600 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {m.passcode && (
                                                    <button onClick={() => copyPasscode(m.id, m.passcode!)} className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md text-xs font-mono text-brand-yellow flex items-center gap-2 transition-colors">
                                                        {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                        {m.passcode}
                                                    </button>
                                                )}
                                                <button onClick={() => deleteJury(m.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MENTORS (WHITE THEME) */}
                        {activeTab === "mentors" && (
                            <div className="space-y-6">
                                <div className="glass p-8 rounded-md border-l-4 border-white shadow-xl">
                                    <h3 className="text-xs font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4 text-white" /> Добави Ментор</h3>
                                    <div className="flex gap-4">
                                        <input value={newMentorName} onChange={e => setNewMentorName(e.target.value)} onKeyDown={e => e.key === "Enter" && addMentor()} placeholder="Име ментор..." className="flex-1 p-4 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-white outline-none text-sm" />
                                        <button onClick={addMentor} disabled={saving || !newMentorName.trim()} className="px-8 bg-white text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest transition-all">Добави</button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {mentors.map(m => (
                                        <div key={m.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-md flex items-center justify-between hover:bg-white/[0.05] transition-all">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-bold text-sm uppercase">{m.name}</span>
                                                    <button onClick={() => startEditName(m.id, m.name)} className="text-slate-600 hover:text-white transition-all"><Edit2 className="w-3 h-3" /></button>
                                                </div>
                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Експерт / Ментор</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {m.passcode && (
                                                    <button onClick={() => copyPasscode(m.id, m.passcode!)} className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md text-xs font-mono text-white flex items-center gap-2 border border-white/5 transition-all">
                                                        {copiedId === m.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                                                        {m.passcode}
                                                    </button>
                                                )}
                                                <button onClick={() => deleteMentor(m.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* RUBRIC */}
                        {activeTab === "rubric" && (
                            <div className="space-y-8">
                                <div className="glass p-8 rounded-md border-l-4 border-brand-yellow shadow-xl space-y-4">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4 text-brand-yellow" /> Нова Категория</h3>
                                    <input value={newCrit.category} onChange={e => setNewCrit(p => ({ ...p, category: e.target.value }))} placeholder="Име на категорията..." className="w-full p-4 bg-black/50 border border-white/10 rounded-md text-white text-sm outline-none" />
                                    <input value={newCrit.criterion} onChange={e => setNewCrit(p => ({ ...p, criterion: e.target.value }))} placeholder="Първи критерий..." className="w-full p-4 bg-black/50 border border-white/10 rounded-md text-white text-sm outline-none" />
                                    <button onClick={addCriterion} className="w-full py-4 bg-brand-yellow text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest">Запази Категория</button>
                                </div>
                                {Object.entries(grouped).map(([cat, crits]) => (
                                    <div key={cat} className="glass p-6 rounded-md border border-white/5">
                                        <h4 className="text-lg font-black text-white uppercase mb-4 py-2 border-b border-white/5">{cat}</h4>
                                        <div className="space-y-2">
                                            {crits.map(c => (
                                                <div key={c.id} className="flex items-center justify-between bg-white/[0.01] p-3 rounded-md group">
                                                    <span className="text-sm text-slate-400">{c.criterion} <span className="text-[10px] opacity-40 ml-2">({c.max_score}т.)</span></span>
                                                    <button onClick={() => deleteCriterion(c.id)} className="text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                            <button onClick={() => setInlineAddCategory(cat)} className="w-full py-2 border border-dashed border-white/5 text-[9px] text-slate-600 hover:text-white uppercase font-black tracking-widest mt-2">+ Добави под-критерий</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* THEME */}
                        {activeTab === "theme" && (
                            <div className="space-y-6">
                                <div className="glass p-8 rounded-md border-l-4 border-brand-yellow shadow-xl space-y-6">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><FileText className="w-4 h-4 text-brand-yellow" /> Тема и Ресурси</h3>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Заглавие</label>
                                        <input value={themeTitle} onChange={e => setThemeTitle(e.target.value)} className="w-full p-4 bg-black/50 border border-white/10 rounded-md text-white font-black" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Описание / Задание</label>
                                        <textarea value={themeDescription} onChange={e => setThemeDescription(e.target.value)} rows={10} className="w-full p-4 bg-black/50 border border-white/10 rounded-md text-white text-sm" />
                                    </div>
                                    <button onClick={saveSettings} className="w-full py-4 bg-brand-yellow text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">Запази Промените</button>
                                </div>
                            </div>
                        )}

                        {/* SETTINGS */}
                        {activeTab === "settings" && (
                            <div className="space-y-6">
                                <div className="glass p-8 rounded-md border-l-4 border-brand-yellow shadow-xl space-y-8">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><Settings className="w-4 h-4 text-brand-yellow" /> Настройки</h3>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Краен срок за предаване</label>
                                        <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-4 bg-black/50 border border-white/10 rounded-md text-white" />
                                    </div>
                                    <div className="pt-10 border-t border-white/5 space-y-4">
                                        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Опасна Зона</h4>
                                        <button onClick={clearEvaluations} className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-md text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                            <Trash2 className="w-4 h-4" /> Изтрий всички оценки на журито
                                        </button>
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
