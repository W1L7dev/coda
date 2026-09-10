"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { faCalendarPlus, faClock, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/client";
import AppSidebar from "../app-sidebar";

type Theme = "light" | "system" | "dark";
type Language = "en" | "fr";
type Session = { id: string; title: string; session_date: string; start_time: string; end_time: string | null; session_type: "practice" | "lesson"; notes: string | null };
type SessionDraft = { type: "practice" | "lesson"; day: string; start: string; end: string };

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const getNextWeekday = (day: string, weekStart: Date) => {
  const target = weekdays.indexOf(day);
  const selectedDate = new Date(weekStart);
  selectedDate.setDate(weekStart.getDate() + target);
  return `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, "0")}-${selectedDate.getDate().toString().padStart(2, "0")}`;
};

const getMonday = (date: Date) => {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
  return monday;
};

export default function CalendarPage() {
  const [language, setLanguage] = useState<Language>(() => typeof window !== "undefined" && window.localStorage.getItem("coda-language") === "fr" ? "fr" : "en");
  const [theme, setTheme] = useState<Theme>("system");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionType, setSessionType] = useState<"practice" | "lesson">("practice");
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SessionDraft>({ type: "practice", day: "Monday", start: "18:00", end: "19:00" });
  const router = useRouter();

  useEffect(() => { document.documentElement.lang = language; document.documentElement.dataset.theme = theme; }, [language, theme]);
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("theme").eq("id", user.id).maybeSingle();
      const { data } = await supabase.from("practice_sessions").select("id, title, session_date, start_time, end_time, session_type, notes").eq("user_id", user.id).order("session_date", { ascending: true }).order("start_time", { ascending: true });
      setTheme((profile?.theme as Theme) ?? "system");
      setSessions((data as Session[]) ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  const addSession = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const sessionDate = getNextWeekday(day, weekStart);
    const { data, error } = await supabase.from("practice_sessions").insert({ user_id: user.id, title: sessionType === "lesson" ? "Lesson" : "Practice session", session_date: sessionDate, start_time: startTime, end_time: endTime, session_type: sessionType }).select("id, title, session_date, start_time, end_time, session_type, notes").single();
    if (!error && data) {
      setSessions((current) => [...current, data as Session].sort((left, right) => `${left.session_date}${left.start_time}`.localeCompare(`${right.session_date}${right.start_time}`)));
      setWeekStart(getMonday(new Date(`${sessionDate}T00:00:00`)));
    }
    setSaving(false);
  };

  const removeSession = async (id: string) => {
    await createClient().from("practice_sessions").delete().eq("id", id);
    setSessions((current) => current.filter((session) => session.id !== id));
  };
  const beginEdit = (session: Session) => { const date = new Date(`${session.session_date}T00:00:00`); const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; setEditingId(session.id); setDraft({ type: session.session_type, day: weekdays[dayIndex], start: session.start_time.slice(0, 5), end: (session.end_time ?? session.start_time).slice(0, 5) }); window.setTimeout(() => document.querySelector(".calendar-edit-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0); };
  const saveEdit = async (id: string) => { setSaving(true); const sessionDate = getNextWeekday(draft.day, weekStart); const updates = { title: draft.type === "lesson" ? "Lesson" : "Practice session", session_date: sessionDate, start_time: draft.start, end_time: draft.end, session_type: draft.type }; const { error } = await createClient().from("practice_sessions").update(updates).eq("id", id); if (!error) { setSessions((current) => current.map((session) => session.id === id ? { ...session, ...updates } : session).sort((left, right) => `${left.session_date}${left.start_time}`.localeCompare(`${right.session_date}${right.start_time}`))); setEditingId(null); } setSaving(false); };
  useEffect(() => { if (!editingId) return; const timer = window.setTimeout(() => { document.querySelectorAll<HTMLInputElement>(".calendar-edit-form input").forEach((input, index) => { input.placeholder = ["Start time", "End time"][index] ?? ""; }); }, 0); return () => window.clearTimeout(timer); }, [editingId]);

  const weekDays = Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(weekStart.getDate() + index); return date; });
  const dateKey = (date: Date) => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  const visibleSessions = sessions.filter((session) => session.session_date >= dateKey(weekDays[0]) && session.session_date <= dateKey(weekDays[6]));
  const practiceMinutes = visibleSessions.filter((session) => session.session_type === "practice").reduce((total, session) => { const [startHours, startMinutes] = session.start_time.split(":").map(Number); const [endHours, endMinutes] = (session.end_time ?? session.start_time).split(":").map(Number); return total + Math.max(0, (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)); }, 0);
  const practiceHours = practiceMinutes / 60;
  const formatDate = (value: string) => new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", { weekday: "long" }).format(new Date(`${value}T00:00:00`));

  if (loading) return <main className="dashboard-page" />;
  return <main className="dashboard-page calendar-page">
    <AppSidebar active="calendar" language={language} setLanguage={(next) => { localStorage.setItem("coda-language", next); setLanguage(next); }} theme={theme} setTheme={setTheme} />
    <section className="calendar-content">
      <header className="calendar-heading"><p className="eyebrow"><span className="eyebrow-line" /> Coda</p><h1>{language === "fr" ? "Planning hebdomadaire" : "Weekly schedule"}</h1><p>{language === "fr" ? "Réservez du temps pour votre pratique." : "Make room for your practice."}</p></header>
      <form className="calendar-add" onSubmit={addSession}>
        <div><label htmlFor="session-type">Type</label><select id="session-type" value={sessionType} onChange={(event) => setSessionType(event.target.value as "practice" | "lesson")}><option value="practice">Practice</option><option value="lesson">Lesson</option></select></div>
        <div><label htmlFor="session-day">Day</label><select id="session-day" value={day} onChange={(event) => setDay(event.target.value)}>{weekdays.map((weekday) => <option value={weekday} key={weekday}>{weekday}</option>)}</select></div>
        <div><label htmlFor="session-start">Start time</label><input id="session-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required /></div>
        <div><label htmlFor="session-end">End time</label><input id="session-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required /></div>
        <button className="button button-accent calendar-submit" disabled={saving} type="submit"><FontAwesomeIcon icon={faCalendarPlus} /> {saving ? "Saving..." : "Schedule session"}</button>
      </form>
      <section className="week-preview" aria-label="Weekly practice schedule">{weekDays.map((date) => { const key = dateKey(date); const daySessions = visibleSessions.filter((session) => session.session_date === key); return <div className="week-day" key={key}><header><strong>{new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", { weekday: "long" }).format(date)}</strong></header><div className="week-day-blocks">{daySessions.length ? daySessions.map((session) => <article className={`schedule-block ${session.session_type}`} key={session.id}><button type="button" onClick={() => beginEdit(session)} aria-label={`Edit ${session.title}`} title="Edit"><FontAwesomeIcon icon={faPen} /></button><strong>{session.start_time.slice(0, 5)}</strong><span>{session.session_type === "lesson" ? "Lesson" : "Practice"}</span><small>{(session.end_time ?? "").slice(0, 5)}</small></article>) : <span className="week-day-empty">—</span>}</div></div>; })}</section>
      <div className="practice-hours-summary"><span>Practice this week</span><strong>{Number.isInteger(practiceHours) ? practiceHours : practiceHours.toFixed(1)}h</strong></div>
      <section className="calendar-list">{visibleSessions.length ? visibleSessions.map((session) => <article className="calendar-session" key={session.id}>{editingId === session.id ? <div className="calendar-edit-form"><select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as "practice" | "lesson" }))}><option value="practice">Practice</option><option value="lesson">Lesson</option></select><select value={draft.day} onChange={(event) => setDraft((current) => ({ ...current, day: event.target.value }))}>{weekdays.map((weekday) => <option key={weekday} value={weekday}>{weekday}</option>)}</select><input type="time" value={draft.start} onChange={(event) => setDraft((current) => ({ ...current, start: event.target.value }))} /><input type="time" value={draft.end} onChange={(event) => setDraft((current) => ({ ...current, end: event.target.value }))} /><button className="button button-accent" type="button" onClick={() => saveEdit(session.id)} disabled={saving}>Save</button><button className="calendar-cancel" type="button" onClick={() => setEditingId(null)}>Cancel</button></div> : <><div className="calendar-session-date"><strong>{formatDate(session.session_date)}</strong><span><FontAwesomeIcon icon={faClock} /> {session.start_time.slice(0, 5)} – {(session.end_time ?? "").slice(0, 5)}</span></div><div className="calendar-session-info"><h2>{session.session_type === "lesson" ? "Lesson" : "Practice session"}</h2></div><div className="calendar-session-actions"><button type="button" onClick={() => beginEdit(session)} aria-label={`Edit ${session.title}`} title="Edit"><FontAwesomeIcon icon={faPen} /></button><button type="button" onClick={() => removeSession(session.id)} aria-label={`Remove ${session.title}`} title="Remove"><FontAwesomeIcon icon={faTrash} /></button></div></>}</article>) : <div className="calendar-empty"><FontAwesomeIcon icon={faCalendarPlus} /><p>No sessions scheduled this week.</p><span>Choose a day and time to plan your next session.</span></div>}</section>
    </section>
  </main>;
}
