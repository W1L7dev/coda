"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { faArrowRight, faCalendarDays, faClock, faMusic, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/app-context";
import type { Profile, Session, Piece, Theme } from "@/lib/types";
import AppSidebar from "../app-sidebar";

const mondayOf = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - (result.getDay() === 0 ? 6 : result.getDay() - 1));
  return result;
};
const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
const minutesBetween = (start: string, end: string | null) => {
  if (!end) return 0;
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);
  return Math.max(0, endHours * 60 + endMinutes - (startHours * 60 + startMinutes));
};

export default function DashboardPage() {
  const { language, theme, setTheme } = useApp();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [repertoire, setRepertoire] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const [{ data: profileData }, { data: sessionData }, { data: repertoireData }] = await Promise.all([
        supabase.from("profiles").select("full_name, accent_color, theme, instrument, experience_level, favorite_composers, practice_hours, primary_goal, practice_days").eq("id", user.id).maybeSingle(),
        supabase.from("practice_sessions").select("id, title, session_date, start_time, end_time, throughout_day, estimated_minutes, session_type").eq("user_id", user.id).order("session_date", { ascending: true }).order("start_time", { ascending: true }),
        supabase.from("repertoire").select("id, title, composer, status").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (profileData) {
        setProfile(profileData as Profile);
        setTheme((profileData.theme as Theme) ?? "system");
        document.documentElement.style.setProperty("--accent", profileData.accent_color ?? "#8b3dce");
        const { data: colorData } = await supabase.from("profiles").select("secondary_color").eq("id", user.id).maybeSingle();
        document.documentElement.style.setProperty("--secondary", colorData?.secondary_color ?? "#159a91");
      }
      setSessions((sessionData as Session[]) ?? []);
      setRepertoire((repertoireData as Piece[]) ?? []);
      setLoading(false);
    };
    load();
  }, [router, setTheme]);

  if (loading) return <main className="dashboard-page" />;
  const now = new Date();
  const hour = now.getHours();
  const greeting = language === "fr"
    ? hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir"
    : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : hour < 22 ? "Good evening" : "Good night";
  const firstName = profile?.full_name?.trim().split(" ")[0] ?? "musician";
  const weekStart = mondayOf(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const weekSessions = sessions.filter(
    (session) => session.session_date >= localDateKey(weekStart) && session.session_date < localDateKey(weekEnd)
  );
  const practiceHours = weekSessions
    .filter((session) => session.session_type === "practice")
    .reduce((total, session) => total + (session.throughout_day ? session.estimated_minutes ?? 0 : minutesBetween(session.start_time, session.end_time)), 0) / 60;
  const upcoming = sessions.filter((session) => session.session_date >= localDateKey(now)).slice(0, 3);
  const learningCount = repertoire.filter((item) => item.status === "learning").length;
  const polishedCount = repertoire.filter((item) => item.status === "polished").length;
  const formatDay = (date: string) =>
    new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", { weekday: "short" }).format(new Date(`${date}T00:00:00`));

  return (
    <main className="dashboard-page summary-page">
      <AppSidebar active="dashboard" />
      <section className="dashboard-content">
        <header className="dashboard-hero">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> Coda</p>
            <h1>{greeting}, {firstName}.</h1>
            <p>{language === "fr" ? "Voici la forme de votre semaine musicale." : "Here is the shape of your musical week."}</p>
          </div>
          <div className="dashboard-hero-actions">
            <Link className="dashboard-date" href="/calendar"><FontAwesomeIcon icon={faCalendarDays} /> {new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", { month: "long", day: "numeric" }).format(now)}</Link>
            <Link className="button button-accent button-small" href="/calendar">{language === "fr" ? "Planifier" : "Schedule"} <span aria-hidden="true">↗</span></Link>
          </div>
        </header>
        <section className="dashboard-overview">
          <article className="dashboard-focus-card">
            <div className="dashboard-card-heading">
              <div><span className="summary-kicker">{language === "fr" ? "Votre rythme" : "Your rhythm"}</span><h2>{language === "fr" ? "Pratique cette semaine" : "Practice this week"}</h2></div>
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div className="dashboard-focus-number"><strong>{Number.isInteger(practiceHours) ? practiceHours : practiceHours.toFixed(1)}</strong><span>hours</span></div>
          </article>
          <div className="dashboard-stat-stack">
            <Link className="dashboard-stat" href="/repertoire">
              <span className="dashboard-stat-icon"><FontAwesomeIcon icon={faMusic} /></span>
              <span><small>{language === "fr" ? "Répertoire" : "Repertoire"}</small><strong>{repertoire.length}</strong><em>{learningCount} {language === "fr" ? "en cours" : "in progress"} · {polishedCount} {language === "fr" ? "maîtrisées" : "polished"}</em></span>
              <FontAwesomeIcon className="dashboard-stat-arrow" icon={faArrowRight} />
            </Link>
            <Link className="dashboard-stat" href="/journal">
              <span className="dashboard-stat-icon secondary"><FontAwesomeIcon icon={faUser} /></span>
              <span><small>{language === "fr" ? "Objectif principal" : "Primary goal"}</small><strong className="dashboard-stat-goal">{profile?.primary_goal || (language === "fr" ? "À définir" : "Not set")}</strong><em>{profile?.instrument || (language === "fr" ? "Ajoutez votre instrument" : "Add your instrument")}</em></span>
              <FontAwesomeIcon className="dashboard-stat-arrow" icon={faArrowRight} />
            </Link>
          </div>
        </section>
        <section className="dashboard-workspace">
          <article className="summary-panel">
            <div className="summary-panel-heading">
              <div>
                <span className="summary-kicker">{language === "fr" ? "À venir" : "Next up"}</span>
                <h2>{language === "fr" ? "Prochaines séances" : "Upcoming sessions"}</h2>
              </div>
              <Link href="/calendar" aria-label={language === "fr" ? "Ouvrir le planning" : "Open weekly schedule"}>
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            {upcoming.length ? (
              <div className="summary-session-list">
                {upcoming.map((session) => (
                  <div className="summary-session" key={session.id}>
                    <div className={`summary-session-type ${session.session_type}`}>
                      <FontAwesomeIcon icon={session.session_type === "lesson" ? faUser : faClock} />
                    </div>
                    <div>
                      <strong>{session.session_type === "lesson" ? (language === "fr" ? "Leçon" : "Lesson") : (language === "fr" ? "Pratique" : "Practice")}</strong>
                      <span>{formatDay(session.session_date)} · {session.throughout_day ? `${language === "fr" ? "Toute la journée" : "All day"} · ${Math.floor((session.estimated_minutes ?? 0) / 60)}h ${(session.estimated_minutes ?? 0) % 60}min` : `${session.start_time.slice(0, 5)}–${(session.end_time ?? "").slice(0, 5)}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="summary-empty">
                {language === "fr" ? "Aucune séance planifiée. Faites de la place pour la prochaine." : "No sessions scheduled yet. Make time for the next one."}
              </p>
            )}
          </article>
          <article className="summary-panel summary-profile-panel">
            <div className="summary-panel-heading">
              <div>
                <span className="summary-kicker">{language === "fr" ? "Votre rythme" : "Your rhythm"}</span>
                <h2>{language === "fr" ? "Profil de pratique" : "Practice profile"}</h2>
              </div>
              <Link href="/settings" aria-label={language === "fr" ? "Modifier le profil de pratique" : "Edit practice profile"}>
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            <div className="rhythm-row">
              <span>{language === "fr" ? "Expérience" : "Experience"}</span>
              <strong>{profile?.instrument && profile.experience_level ? `${profile.instrument} · ${profile.experience_level}` : (language === "fr" ? "Non défini" : "Not set")}</strong>
            </div>
            <div className="rhythm-row">
              <span>{language === "fr" ? "Compositeurs favoris" : "Favorite composers"}</span>
              <div className="dashboard-composer-badges">{profile?.favorite_composers ? profile.favorite_composers.split(",").map((composer) => <span className="composer-badge" key={composer.trim()}>{composer.trim()}</span>) : <strong>{language === "fr" ? "Non défini" : "Not set"}</strong>}</div>
            </div>
          </article>
        </section>
        <Link className="dashboard-edit" href="/settings">
          {language === "fr" ? "Modifier votre profil musical" : "Edit your musical profile"} <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </section>
    </main>
  );
}