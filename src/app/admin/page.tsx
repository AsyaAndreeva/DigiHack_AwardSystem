"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

    // Session recovery
    useEffect(() => {
        const savedCode = sessionStorage.getItem("admin_code");
        if (savedCode === ADMIN_CODE) {
            setCode(savedCode);
            setAuthed(true);
        }
    }, []);

    // Add forms
    const [newTeamName, setNewTeamName] = useState("");
    const [newJuryName, setNewJuryName] = useState("");
    const [newMentorName, setNewMentorName] = useState("");
    const [newCrit, setNewCrit] = useState({ category: "", description: "", criterion: "", max_score: "3", scoring_guide: "" });
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Editing states
    const [editPasscodeId, setEditPasscodeId] = useState<string | null>(null);
    const [editPasscodeValue, setEditPasscodeValue] = useState("");
    const [savingPasscode, setSavingPasscode] = useState(false);

    const [editNameId, setEditNameId] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState("");
    const [savingName, setSavingName] = useState(false);

    const adminHeaders = useCallback((extra?: Record<string, string>) => ({
        'Content-Type': 'application/json',
        'x-admin-code': code,
        ...extra,
    }), [code]);

    const showFeedback = useCallback((msg: string, ok: boolean) => {
        setFeedback({ msg, ok });
        setTimeout(() => setFeedback(null), 3000);
    }, []);

    const loadData = useCallback(async () => {
        if (!code) return;
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
        } catch (e) {
            console.error("Load failed", e);
        } finally {
            setLoading(false);
        }
    }, [code, adminHeaders]);

    useEffect(() => {
        if (authed) loadData();
    }, [authed, loadData]);

    const handleLogin = () => {
        if (code === ADMIN_CODE) { 
            setAuthed(true); 
            setCodeError(""); 
            sessionStorage.setItem("admin_code", code);
        }
        else setCodeError("Грешна парола. Опитайте отново.");
    };

    const handleLogout = () => {
        setAuthed(false);
        setCode("");
        sessionStorage.removeItem("admin_code");
        router.push("/");
    };

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

    const copyPasscode = (id: string, passcode: string) => {
        navigator.clipboard.writeText(passcode).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
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

    const clearEvaluations = async () => {
        if (!window.confirm("Сигурни ли сте? Това ще изтрие ВСИЧКИ резултати от оценяването!")) return;
        const res = await fetch("/api/admin/evaluations", { method: "DELETE", headers: adminHeaders() });
        const d = await res.json();
        if (d.success) showFeedback("Всички резултати са изтрити.", true);
        else showFeedback(d.error || "Грешка", false);
    };

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

    const tabs = useMemo(() => [
        { key: "teams" as const, label: "Отбори", icon: Users, count: teams.length },
        { key: "jury" as const, label: "Жури", icon: Shield, count: jury.length },
        { key: "mentors" as const, label: "Ментори", icon: GraduationCap, count: mentors.length },
        { key: "rubric" as const, label: "Рубрика", icon: BookOpen, count: criteria.length },
        { key: "theme" as const, label: "Тема", icon: FileText },
        { key: "settings" as const, label: "Настройки", icon: Settings },
    ], [teams.length, jury.length, mentors.length, criteria.length]);

    if (!authed) {
        return (
            <div className="animate-in fade-in duration-500 min-h-screen bg-bg-main flex flex-col">
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
                <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
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
                            {codeError && <p className="text-red-500 text-xs font-black uppercase tracking-widest text-center">{codeError}</p>}
                            <button onClick={handleLogin} className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all">Вход</button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 min-h-screen bg-bg-main">
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
                    <button onClick={loadData} disabled={loading} className="flex items-center gap-2 py-3 px-6 rounded-full bg-slate-800 text-slate-400 border border-white/10 hover:bg-white hover:text-brand-dark transition-all uppercase font-black text-[10px] tracking-widest whitespace-nowrap">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Опресни
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 py-3 px-6 rounded-full bg-white/5 text-slate-400 border border-white/10 hover:bg-slate-800 transition-all uppercase font-black text-[10px] tracking-widest whitespace-nowrap">
                        <LogOut className="w-4 h-4" /> Изход
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto py-12 px-4">
                {feedback && (
                    <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-md text-xs font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 transition-all animate-in slide-in-from-bottom-5 ${feedback.ok ? "bg-white text-brand-dark" : "bg-red-500 text-white"}`}>
                        {feedback.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} {feedback.msg}
                    </div>
                )}

                <div className="flex gap-2 mb-10 bg-black/40 p-1.5 rounded-md border border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-md text-[10px] font-black uppercase tracking-[0.2em] transition-all min-w-[120px] ${activeTab === t.key ? "bg-white text-brand-dark shadow-xl scale-[1.02]" : "text-slate-500 hover:text-white"}`}>
                            <t.icon className="w-4 h-4" /> {t.label} {t.count !== undefined && <span className="opacity-50">({t.count})</span>}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-white" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Зареждане на данни...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* TEAMS */}
                        {activeTab === "teams" && (
                            <div className="space-y-6">
                                <div className="glass p-10 rounded-md border-l-4 border-white shadow-xl">
                                    <h3 className="text-xs font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4" /> Добави Отбор</h3>
                                    <div className="flex gap-4">
                                        <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} onKeyDown={e => e.key === "Enter" && addTeam()} placeholder="Име на отбора..." className="flex-1 p-5 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-white outline-none text-sm font-sans" />
                                        <button onClick={addTeam} disabled={saving || !newTeamName.trim()} className="px-10 bg-white text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl">Добави</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {teams.map(t => (
                                        <div key={t.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-md flex items-center justify-between hover:bg-white/[0.05] transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-brand-dark transition-all">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                {editNameId === t.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input autoFocus value={editNameValue} onChange={e => setEditNameValue(e.target.value)} onKeyDown={e => e.key === "Enter" && updateName("teams", t.id, editNameValue)} className="bg-slate-900 border border-white/30 p-2 rounded text-sm text-white focus:ring-1 focus:ring-white outline-none font-sans" />
                                                        <button onClick={() => updateName("teams", t.id, editNameValue)} className="p-2 bg-white rounded text-brand-dark hover:bg-slate-200 transition-all"><Check className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-bold text-sm uppercase tracking-tight">{t.name}</span>
                                                            <button onClick={() => { setEditNameId(t.id); setEditNameValue(t.name); }} className="text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Edit2 className="w-3 h-3" /></button>
                                                        </div>
                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 opacity-60">ID: {t.id.slice(-4)}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {t.passcode && (
                                                    <button onClick={() => copyPasscode(t.id, t.passcode!)} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-md text-xs font-mono text-white flex items-center gap-3 border border-white/5 transition-all">
                                                        {copiedId === t.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-slate-500" />}
                                                        {t.passcode}
                                                    </button>
                                                )}
{/* <button onClick={() => deleteTeam(t.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button> */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MENTORS (THE ONE THEY HAD ISSUES WITH) */}
                        {activeTab === "mentors" && (
                            <div className="space-y-6">
                                <div className="glass p-10 rounded-md border-l-4 border-white shadow-xl">
                                    <h3 className="text-xs font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4" /> Добави Ментор</h3>
                                    <div className="flex gap-4">
                                        <input value={newMentorName} onChange={e => setNewMentorName(e.target.value)} onKeyDown={e => e.key === "Enter" && addMentor()} placeholder="Име ментор..." className="flex-1 p-5 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-white outline-none text-sm font-sans" />
                                        <button onClick={addMentor} disabled={saving || !newMentorName.trim()} className="px-10 bg-white text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl">Добави</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {mentors.map(m => (
                                        <div key={m.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-md flex items-center justify-between hover:bg-white/[0.05] transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-brand-dark transition-all">
                                                    <GraduationCap className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold text-sm uppercase tracking-tight">{m.name}</span>
                                                        <button onClick={() => { setEditNameId(m.id); setEditNameValue(m.name); }} className="text-slate-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Edit2 className="w-3 h-3" /></button>
                                                    </div>
                                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Eксперт</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {m.passcode && (
                                                    <button onClick={() => copyPasscode(m.id, m.passcode!)} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-md text-xs font-mono text-white flex items-center gap-3 border border-white/5 transition-all">
                                                        {copiedId === m.id ? <Check className="w-3 h-3  text-green-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                                                        {m.passcode}
                                                    </button>
                                                )}
{/* <button onClick={() => deleteMentor(m.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button> */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* JURY */}
                        {activeTab === "jury" && (
                            <div className="space-y-6">
                                <div className="glass p-10 rounded-md border-l-4 border-white shadow-xl">
                                    <h3 className="text-xs font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4" /> Добави Жури</h3>
                                    <div className="flex gap-4">
                                        <input value={newJuryName} onChange={e => setNewJuryName(e.target.value)} onKeyDown={e => e.key === "Enter" && addJury()} placeholder="Име на журито..." className="flex-1 p-5 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-white outline-none text-sm font-sans" />
                                        <button onClick={addJury} disabled={saving || !newJuryName.trim()} className="px-10 bg-white text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl">Добави</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {jury.map(j => (
                                        <div key={j.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-md flex items-center justify-between hover:bg-white/[0.05] transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-brand-dark transition-all">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold text-sm uppercase tracking-tight">{j.name}</span>
                                                        <button onClick={() => { setEditNameId(j.id); setEditNameValue(j.name); }} className="text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Edit2 className="w-3 h-3" /></button>
                                                    </div>
                                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 opacity-60">{j.evaluations_count || 0} оценки</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {j.passcode && (
                                                    <button onClick={() => copyPasscode(j.id, j.passcode!)} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-md text-xs font-mono text-white flex items-center gap-3 border border-white/5 transition-all">
                                                        {copiedId === j.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-slate-500" />}
                                                        {j.passcode}
                                                    </button>
                                                )}
                                                {/* <button onClick={() => deleteJury(j.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button> */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* RUBRIC / QUESTIONS */}
                        {activeTab === "rubric" && (
                            <div className="space-y-6">
                                <div className="glass p-10 rounded-md border-l-4 border-white shadow-xl">
                                    <h3 className="text-xs font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Plus className="w-4 h-4" /> Добави Критерий</h3>
                                    <div className="grid gap-4 sm:grid-cols-2 mb-6">
                                        <input value={newCrit.category} onChange={e => setNewCrit({...newCrit, category: e.target.value})} placeholder="Категория..." className="p-5 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-white outline-none text-sm font-sans" />
                                        <input value={newCrit.criterion} onChange={e => setNewCrit({...newCrit, criterion: e.target.value})} placeholder="Критерий..." className="p-5 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-white outline-none text-sm font-sans" />
                                        <input value={newCrit.max_score} onChange={e => setNewCrit({...newCrit, max_score: e.target.value})} placeholder="Макс. точки..." type="number" className="p-5 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-white outline-none text-sm font-sans" />
                                    </div>
                                    <button onClick={addCriterion} disabled={saving || !newCrit.category.trim()} className="w-full py-4 bg-white text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl">Запази критерий</button>
                                </div>
                                <div className="space-y-4">
                                    {criteria.map((c, idx) => (
                                        <div key={c.id || idx} className="bg-white/[0.02] border border-white/5 p-6 rounded-md hover:bg-white/[0.05] transition-all">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-brand-orange font-black text-[10px] uppercase tracking-[0.2em]">{c.category}</span>
                                                    <h4 className="text-white font-bold text-sm mt-1">{c.criterion}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Максимално: {c.max_score}т.</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* THEME */}
                        {activeTab === "theme" && (
                            <div className="space-y-6">
                                <div className="glass p-10 rounded-md border-l-4 border-white shadow-xl space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Заглавие на събитието</label>
                                        <input value={themeTitle} onChange={e => setThemeTitle(e.target.value)} placeholder="Дигитален маратон..." className="w-full p-5 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-white outline-none text-sm font-sans" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Описание / Правила</label>
                                        <textarea value={themeDescription} onChange={e => setThemeDescription(e.target.value)} rows={4} placeholder="Описание..." className="w-full p-5 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-white outline-none text-sm font-sans" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Бранд Цвят (HEX)</label>
                                        <div className="flex gap-4">
                                            <input value={themeColor} onChange={e => setThemeColor(e.target.value)} className="flex-1 p-5 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-white outline-none text-sm font-mono" />
                                            <div className="w-16 h-16 rounded-md border border-white/10" style={{ backgroundColor: themeColor }} />
                                        </div>
                                    </div>
                                    <button onClick={saveSettings} disabled={saving} className="w-full py-5 bg-white text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-95 shadow-xl">Запази Темата</button>
                                </div>
                            </div>
                        )}

                        {/* SETTINGS */}
                        {activeTab === "settings" && (
                            <div className="space-y-6">
                                <div className="glass p-10 rounded-md border-l-4 border-white shadow-xl space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Краен срок за оценяване</label>
                                        <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-5 bg-black/50 border border-white/10 rounded-md text-white focus:ring-1 focus:ring-white outline-none text-sm font-sans" />
                                    </div>
                                    <button onClick={saveSettings} disabled={saving} className="w-full py-5 bg-white text-brand-dark rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-95 shadow-xl">Обнови Настройките</button>
                                </div>
                                <div className="bg-red-500/10 border border-dashed border-red-500/20 p-10 rounded-md">
                                    <h4 className="text-red-500 text-xs font-black uppercase tracking-widest mb-4">Опасна Зона</h4>
                                    <p className="text-slate-500 text-xs mb-6 uppercase tracking-widest leading-relaxed">Внимание! Тези действия са необратими и засягат всички резултати.</p>
                                    {/* <button onClick={clearEvaluations} className="px-8 py-3 bg-red-500/20 text-red-500 border border-red-500/40 rounded-full hover:bg-red-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest">Изчисти всички оценки</button> */}
                                    <span className="text-red-500/50 text-[9px] font-black uppercase tracking-widest">Бутонът е деактивиран по заявка на администратора.</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
