"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { faArrowRight, faClock, faMusic, faPen, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/client";
import AppSidebar from "../app-sidebar";

type Theme = "light" | "system" | "dark";
type Language = "en" | "fr";
type Profile = { full_name: string | null; accent_color: string; theme: Theme; instrument: string | null; experience_level: string | null; favorite_composers: string | null; practice_hours: number | null; target_practice_hours: number | null; primary_goal: string | null; practice_days: string[] | null };
type Session = { id: string; title: string; session_date: string; start_time: string; end_time: string | null; session_type: "practice" | "lesson" };
type RepertoireItem = { id: string; title: string; composer: string | null; status: "want_to_learn" | "learning" | "polished" };

const mondayOf = (date: Date) => { const result = new Date(date); result.setHours(0, 0, 0, 0); result.setDate(result.getDate() - (result.getDay() === 0 ? 6 : result.getDay() - 1)); return result; };
const localDateKey = (date: Date) => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
const minutesBetween = (start: string, end: string | null) => { if (!end) return 0; const [startHours, startMinutes] = start.split(":").map(Number); const [endHours, endMinutes] = end.split(":").map(Number); return Math.max(0, endHours * 60 + endMinutes - (startHours * 60 + startMinutes)); };

export default function DashboardPage() {
  const [language, setLanguage] = useState<Language>(() => typeof window !== "undefined" && window.localStorage.getItem("coda-language") === "fr" ? "fr" : "en");
  const [theme, setTheme] = useState<Theme>("system");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [repertoire, setRepertoire] = useState<RepertoireItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { document.documentElement.lang = language; document.documentElement.dataset.theme = theme; }, [language, theme]);
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const [{ data: profileData }, { data: sessionData }, { data: repertoireData }] = await Promise.all([
        supabase.from("profiles").select("full_name, accent_color, theme, instrument, experience_level, favorite_composers, practice_hours, target_practice_hours, primary_goal, practice_days").eq("id", user.id).maybeSingle(),
        supabase.from("practice_sessions").select("id, title, session_date, start_time, end_time, session_type").eq("user_id", user.id).order("session_date", { ascending: true }).order("start_time", { ascending: true }),
        supabase.from("repertoire").select("id, title, composer, status").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (profileData) { setProfile(profileData as Profile); setTheme((profileData.theme as Theme) ?? "system"); document.documentElement.style.setProperty("--accent", profileData.accent_color ?? "#8b3dce"); }
      setSessions((sessionData as Session[]) ?? []);
      setRepertoire((repertoireData as RepertoireItem[]) ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <main className="dashboard-page" />;
  const now = new Date();
  const hour = now.getHours();
  const greeting = language === "fr" ? hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : hour < 22 ? "Good evening" : "Good night";
  const firstName = profile?.full_name?.trim().split(" ")[0] ?? "musician";
  const weekStart = mondayOf(now);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
  const weekSessions = sessions.filter((session) => session.session_date >= localDateKey(weekStart) && session.session_date < localDateKey(weekEnd));
  const practiceHours = weekSessions.filter((session) => session.session_type === "practice").reduce((total, session) => total + minutesBetween(session.start_time, session.end_time), 0) / 60;
  const targetHours = profile?.target_practice_hours ?? 0;
  const progress = targetHours ? Math.min(100, (practiceHours / targetHours) * 100) : 0;
  const upcoming = sessions.filter((session) => session.session_date >= localDateKey(now)).slice(0, 3);
  const learningCount = repertoire.filter((item) => item.status === "learning").length;
  const polishedCount = repertoire.filter((item) => item.status === "polished").length;
  const formatDay = (date: string) => new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", { weekday: "short" }).format(new Date(`${date}T00:00:00`));

  return <main className="dashboard-page summary-page"><AppSidebar active="dashboard" language={language} setLanguage={(next) => { localStorage.setItem("coda-language", next); setLanguage(next); }} theme={theme} setTheme={setTheme} /><section className="dashboard-content"><header className="summary-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Coda</p><h1>{greeting}, {firstName}.</h1><p>Here is the shape of your musical week.</p></div><Link className="summary-profile-link" href="/settings"><FontAwesomeIcon icon={faUser} /> Profile settings</Link></header><section className="summary-grid"><article className="summary-card summary-practice"><div className="summary-card-top"><span>Practice this week</span><FontAwesomeIcon icon={faClock} /></div><strong>{Number.isInteger(practiceHours) ? practiceHours : practiceHours.toFixed(1)}<small>h</small></strong><p>{targetHours ? `${Number.isInteger(targetHours) ? targetHours : targetHours.toFixed(1)}h weekly target` : "Set a weekly target in Settings"}</p><div className="summary-progress"><span style={{ width: `${progress}%`, backgroundColor: profile?.accent_color }} /></div></article><article className="summary-card"><div className="summary-card-top"><span>Repertoire</span><FontAwesomeIcon icon={faMusic} /></div><strong>{repertoire.length}</strong><p>{learningCount} in progress · {polishedCount} polished</p><Link className="summary-card-link" href="/repertoire">Open repertoire <FontAwesomeIcon icon={faArrowRight} /></Link></article><article className="summary-card"><div className="summary-card-top"><span>Primary goal</span><FontAwesomeIcon icon={faPen} /></div><strong className="summary-goal">{profile?.primary_goal || "Choose a direction"}</strong><p>{profile?.instrument || "Add your instrument"}</p><Link className="summary-card-link" href="/settings">Update profile <FontAwesomeIcon icon={faArrowRight} /></Link></article></section><section className="summary-lower"><article className="summary-panel"><div className="summary-panel-heading"><div><span className="summary-kicker">Next up</span><h2>Upcoming sessions</h2></div><Link href="/calendar" aria-label="Open weekly schedule"><FontAwesomeIcon icon={faArrowRight} /></Link></div>{upcoming.length ? <div className="summary-session-list">{upcoming.map((session) => <div className="summary-session" key={session.id}><div className={`summary-session-type ${session.session_type}`}><FontAwesomeIcon icon={session.session_type === "lesson" ? faUser : faClock} /></div><div><strong>{session.session_type === "lesson" ? "Lesson" : "Practice"}</strong><span>{formatDay(session.session_date)} · {session.start_time.slice(0, 5)}–{(session.end_time ?? "").slice(0, 5)}</span></div></div>)}</div> : <p className="summary-empty">No sessions scheduled yet. Make time for the next one.</p>}</article><article className="summary-panel summary-profile-panel"><div className="summary-panel-heading"><div><span className="summary-kicker">Your rhythm</span><h2>Practice profile</h2></div><Link href="/settings" aria-label="Edit practice profile"><FontAwesomeIcon icon={faArrowRight} /></Link></div><div className="rhythm-row"><span>Preferred days</span><strong>{profile?.practice_days?.length ? profile.practice_days.join(" · ") : "Not set"}</strong></div><div className="rhythm-row"><span>Experience</span><strong>{profile?.instrument && profile.experience_level ? `${profile.instrument} · ${profile.experience_level}` : "Not set"}</strong></div><div className="rhythm-row"><span>Favorite composers</span><strong>{profile?.favorite_composers || "Not set"}</strong></div></article></section><Link className="dashboard-edit" href="/settings">Edit your musical profile <FontAwesomeIcon icon={faArrowRight} /></Link></section></main>;
}
