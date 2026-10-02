"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { faCalendarPlus, faClock, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/app-context";
import type { Session, Theme } from "@/lib/types";
import AppSidebar from "../app-sidebar";

type SessionDraft = { type: "practice" | "lesson"; day: string; start: string; end: string; throughoutDay: boolean; estimatedHours: string; estimatedMinutes: string };

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
  const { language, theme, setTheme } = useApp();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionType, setSessionType] = useState<"practice" | "lesson">("practice");
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [throughoutDay, setThroughoutDay] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState("1");
  const [estimatedMinutes, setEstimatedMinutes] = useState("0");
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SessionDraft>({ type: "practice", day: "Monday", start: "18:00", end: "19:00", throughoutDay: false, estimatedHours: "1", estimatedMinutes: "0" });
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("theme").eq("id", user.id).maybeSingle();
      const { data } = await supabase.from("practice_sessions").select("id, title, session_date, start_time, end_time, throughout_day, estimated_minutes, session_type, notes").eq("user_id", user.id).order("session_date", { ascending: true }).order("start_time", { ascending: true });
      setTheme((profile?.theme as Theme) ?? "system");
      setSessions((data as Session[]) ?? []);
      setLoading(false);
    };
    load();
  }, [router, setTheme]);

  const addSession = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const sessionDate = getNextWeekday(day, weekStart);
    const estimatedDurationMinutes = Math.max(1, Number(estimatedHours || 0) * 60 + Number(estimatedMinutes || 0));
    const { data, error } = await supabase.from("practice_sessions").insert({
      user_id: user.id,
      title: sessionType === "lesson" ? "Lesson" : "Practice session",
      session_date: sessionDate,
      start_time: startTime,
      end_time: throughoutDay ? null : endTime,
      throughout_day: throughoutDay,
      estimated_minutes: throughoutDay ? estimatedDurationMinutes : null,
      session_type: sessionType,
    }).select("id, title, session_date, start_time, end_time, throughout_day, estimated_minutes, session_type, notes").single();
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
  const beginEdit = (session: Session) => {
    const date = new Date(`${session.session_date}T00:00:00`);
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    setEditingId(session.id);
    setDraft({ type: session.session_type, day: weekdays[dayIndex], start: session.start_time.slice(0, 5), end: (session.end_time ?? session.start_time).slice(0, 5), throughoutDay: Boolean(session.throughout_day), estimatedHours: Math.floor((session.estimated_minutes ?? 60) / 60).toString(), estimatedMinutes: ((session.estimated_minutes ?? 60) % 60).toString() });
    window.setTimeout(() => document.querySelector(".calendar-edit-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  };
  const saveEdit = async (id: string) => {
    setSaving(true);
    const sessionDate = getNextWeekday(draft.day, weekStart);
    const updates = {
      title: draft.type === "lesson" ? "Lesson" : "Practice session",
      session_date: sessionDate,
      start_time: draft.start,
      end_time: draft.end,
      throughout_day: draft.throughoutDay,
      estimated_minutes: draft.throughoutDay ? Math.max(1, Number(draft.estimatedHours || 0) * 60 + Number(draft.estimatedMinutes || 0)) : null,
      session_type: draft.type,
    };
    const { error } = await createClient().from("practice_sessions").update(updates).eq("id", id);
    if (!error) {
      setSessions((current) => current.map((session) => session.id === id ? { ...session, ...updates } : session).sort((left, right) => `${left.session_date}${left.start_time}`.localeCompare(`${right.session_date}${right.start_time}`)));
      setEditingId(null);
    }
    setSaving(false);
  };

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const dateKey = (date: Date) => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  const visibleSessions = sessions.filter((session) => session.session_date >= dateKey(weekDays[0]) && session.session_date <= dateKey(weekDays[6]));
  const practiceMinutes = visibleSessions.filter((session) => session.session_type === "practice").reduce((total, session) => {
    if (session.throughout_day) return total + (session.estimated_minutes ?? 0);
    const [startHours, startMinutes] = session.start_time.split(":").map(Number);
    const [endHours, endMinutes] = (session.end_time ?? session.start_time).split(":").map(Number);
    return total + Math.max(0, (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes));
  }, 0);
  const practiceHours = practiceMinutes / 60;
  const formatDate = (value: string) => new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", { weekday: "long" }).format(new Date(`${value}T00:00:00`));

  if (loading) return <main className="dashboard-page" />;
  return (
    <main className="dashboard-page calendar-page">
      <AppSidebar active="calendar" />
      <section className="calendar-content">
        <header className="calendar-heading">
          <p className="eyebrow"><span className="eyebrow-line" /> Coda</p>
          <h1>{language === "fr" ? "Planning hebdomadaire" : "Weekly schedule"}</h1>
          <p>{language === "fr" ? "Réservez du temps pour votre pratique." : "Make room for your practice."}</p>
        </header>
        <form className="calendar-add" onSubmit={addSession}>
          <div>
            <label htmlFor="session-type">{language === "fr" ? "Type" : "Type"}</label>
            <select id="session-type" value={sessionType} onChange={(event) => setSessionType(event.target.value as "practice" | "lesson")}>
              <option value="practice">{language === "fr" ? "Pratique" : "Practice"}</option>
              <option value="lesson">{language === "fr" ? "Leçon" : "Lesson"}</option>
            </select>
          </div>
          <div>
            <label htmlFor="session-day">{language === "fr" ? "Jour" : "Day"}</label>
            <select id="session-day" value={day} onChange={(event) => setDay(event.target.value)}>
              {weekdays.map((weekday) => <option value={weekday} key={weekday}>{weekday}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="session-start">{language === "fr" ? "Heure de début" : "Start time"}</label>
            <input id="session-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required={!throughoutDay} disabled={throughoutDay} />
          </div>
          <div>
            <label htmlFor="session-end">{language === "fr" ? "Heure de fin" : "End time"}</label>
            <input id="session-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required={!throughoutDay} disabled={throughoutDay} />
          </div>
          <div className="calendar-all-day-row">
            <label className="calendar-all-day"><input type="checkbox" checked={throughoutDay} onChange={(event) => setThroughoutDay(event.target.checked)} /><span>{language === "fr" ? "Toute la journée" : "Throughout the day"}</span></label>
            {throughoutDay && <div className="calendar-estimate"><input id="estimated-hours" type="number" min="0" max="24" placeholder="00" value={estimatedHours} onChange={(event) => setEstimatedHours(event.target.value)} aria-label={language === "fr" ? "Heures estimées" : "Estimated hours"} /><span>h</span><input id="estimated-minutes" type="number" min="0" max="59" placeholder="00" value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(event.target.value)} aria-label={language === "fr" ? "Minutes estimées" : "Estimated minutes"} /><span>min</span></div>}
          </div>
          <button className="button button-accent calendar-submit" disabled={saving} type="submit">
            <FontAwesomeIcon icon={faCalendarPlus} /> {saving ? (language === "fr" ? "Enregistrement..." : "Saving...") : (language === "fr" ? "Planifier la séance" : "Schedule session")}
          </button>
        </form>
        <section className="week-preview" aria-label={language === "fr" ? "Planning hebdomadaire" : "Weekly practice schedule"}>
          {weekDays.map((date) => {
            const key = dateKey(date);
            const daySessions = visibleSessions.filter((session) => session.session_date === key);
            return (
              <div className="week-day" key={key}>
                <header>
                  <strong>{new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", { weekday: "long" }).format(date)}</strong>
                </header>
                <div className="week-day-blocks">
                  {daySessions.length ? daySessions.map((session) => (
                    <article className={`schedule-block ${session.session_type}`} key={session.id}>
                      <button type="button" onClick={() => beginEdit(session)} aria-label={`${language === "fr" ? "Modifier" : "Edit"} ${session.title}`} title={language === "fr" ? "Modifier" : "Edit"}>
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <strong>{session.throughout_day ? (language === "fr" ? "Toute la journée" : "All day") : session.start_time.slice(0, 5)}</strong>
                      <span>{session.session_type === "lesson" ? (language === "fr" ? "Leçon" : "Lesson") : (language === "fr" ? "Pratique" : "Practice")}</span>
                      <small>{session.throughout_day ? `${Math.floor((session.estimated_minutes ?? 0) / 60)}h ${(session.estimated_minutes ?? 0) % 60}m` : (session.end_time ?? "").slice(0, 5)}</small>
                    </article>
                  )) : <span className="week-day-empty">—</span>}
                </div>
              </div>
            );
          })}
        </section>
        <div className="practice-hours-summary">
          <span>{language === "fr" ? "Pratique cette semaine" : "Practice this week"}</span>
          <strong>{Number.isInteger(practiceHours) ? practiceHours : practiceHours.toFixed(1)}h</strong>
        </div>
        <section className="calendar-list">
          {visibleSessions.length ? visibleSessions.map((session) => (
            <article className={`calendar-session ${session.session_type}`} key={session.id}>
              {editingId === session.id ? (
                <div className="calendar-edit-form">
                  <select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as "practice" | "lesson" }))}>
                    <option value="practice">{language === "fr" ? "Pratique" : "Practice"}</option>
                    <option value="lesson">{language === "fr" ? "Leçon" : "Lesson"}</option>
                  </select>
                  <select value={draft.day} onChange={(event) => setDraft((current) => ({ ...current, day: event.target.value }))}>
                    {weekdays.map((weekday) => <option key={weekday} value={weekday}>{weekday}</option>)}
                  </select>
                  <input type="time" value={draft.start} onChange={(event) => setDraft((current) => ({ ...current, start: event.target.value }))} disabled={draft.throughoutDay} />
                  <input type="time" value={draft.end} onChange={(event) => setDraft((current) => ({ ...current, end: event.target.value }))} disabled={draft.throughoutDay} />
                  <label className="calendar-edit-all-day"><input type="checkbox" checked={draft.throughoutDay} onChange={(event) => setDraft((current) => ({ ...current, throughoutDay: event.target.checked }))} /> {language === "fr" ? "Toute la journée" : "All day"}</label>
                  {draft.throughoutDay && <div className="calendar-edit-estimate"><input type="number" min="0" max="24" placeholder="00" value={draft.estimatedHours} onChange={(event) => setDraft((current) => ({ ...current, estimatedHours: event.target.value }))} aria-label={language === "fr" ? "Heures estimées" : "Estimated hours"} /><span>h</span><input type="number" min="0" max="59" placeholder="00" value={draft.estimatedMinutes} onChange={(event) => setDraft((current) => ({ ...current, estimatedMinutes: event.target.value }))} aria-label={language === "fr" ? "Minutes estimées" : "Estimated minutes"} /><span>min</span></div>}
                  <button className="button button-accent" type="button" onClick={() => saveEdit(session.id)} disabled={saving}>{language === "fr" ? "Enregistrer" : "Save"}</button>
                  <button className="calendar-cancel" type="button" onClick={() => setEditingId(null)}>{language === "fr" ? "Annuler" : "Cancel"}</button>
                </div>
              ) : (
                <>
                  <div className="calendar-session-date">
                    <strong>{formatDate(session.session_date)}</strong>
                    <span><FontAwesomeIcon icon={faClock} /> {session.throughout_day ? (language === "fr" ? "Toute la journée" : "All day") : `${session.start_time.slice(0, 5)} – ${(session.end_time ?? "").slice(0, 5)}`}</span>
                  </div>
                  <div className="calendar-session-info">
                    <h2>{session.session_type === "lesson" ? (language === "fr" ? "Leçon" : "Lesson") : (language === "fr" ? "Séance de pratique" : "Practice session")}</h2>
                  </div>
                  <div className="calendar-session-actions">
                    <button type="button" onClick={() => beginEdit(session)} aria-label={`${language === "fr" ? "Modifier" : "Edit"} ${session.title}`} title={language === "fr" ? "Modifier" : "Edit"}><FontAwesomeIcon icon={faPen} /></button>
                    <button type="button" onClick={() => removeSession(session.id)} aria-label={`${language === "fr" ? "Supprimer" : "Remove"} ${session.title}`} title={language === "fr" ? "Supprimer" : "Remove"}><FontAwesomeIcon icon={faTrash} /></button>
                  </div>
                </>
              )}
            </article>
          )) : (
            <div className="calendar-empty">
              <FontAwesomeIcon icon={faCalendarPlus} />
              <p>{language === "fr" ? "Aucune séance cette semaine." : "No sessions scheduled this week."}</p>
              <span>{language === "fr" ? "Choisissez un jour et une heure pour planifier votre prochaine séance." : "Choose a day and time to plan your next session."}</span>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}