"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { faArrowRight, faCalendarDays, faMessage, faPen, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/client";
import AppSidebar from "../app-sidebar";

type Theme = "light" | "system" | "dark";
type Language = "en" | "fr";
type Profile = { full_name: string | null; pronouns: string | null; bio: string | null; avatar_url: string | null; accent_color: string; theme: Theme; username: string | null; instrument: string | null; experience_level: string | null; primary_goal: string | null; favorite_composers: string | null; practice_hours: number | null; practice_days: string[] | null };

export default function ProfilePage() {
  const [language, setLanguage] = useState<Language>(() => typeof window !== "undefined" && window.localStorage.getItem("coda-language") === "fr" ? "fr" : "en");
  const [theme, setTheme] = useState<Theme>("system");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isSharedProfile = pathname.startsWith("/user/");

  useEffect(() => { document.documentElement.lang = language; document.documentElement.dataset.theme = theme; }, [language, theme]);
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !isSharedProfile) { router.push("/login"); return; }
      setEmail(user?.email ?? "");
      const username = isSharedProfile ? decodeURIComponent(pathname.split("/").pop() ?? "").replace(/^@/, "") : user?.email?.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
      const query = supabase.from("profiles").select("full_name, pronouns, bio, avatar_url, accent_color, theme, username, instrument, experience_level, primary_goal, favorite_composers, practice_hours, practice_days");
      const { data } = await (isSharedProfile ? query.eq("username", username).maybeSingle() : query.eq("id", user?.id).maybeSingle());
      if (data) { setProfile(data as Profile); setTheme((data.theme as Theme) ?? "system"); document.documentElement.style.setProperty("--accent", data.accent_color ?? "#8b3dce"); }
      if (user && username) await supabase.from("profiles").update({ username }).eq("id", user.id);
      setLoading(false);
    };
    load();
  }, [isSharedProfile, pathname, router]);

  if (loading) return <main className="dashboard-page" />;
  const name = profile?.full_name?.trim() || "Your profile";
  const initial = name[0]?.toUpperCase() ?? "U";
  const username = email ? email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() : "coda-musician";
  const handle = `@${username}`;
  const composers = profile?.favorite_composers?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
  const profileUrl = `${window.location.origin}/user/@${username}`;
  const shareProfile = async () => { await navigator.clipboard.writeText(profileUrl); setShared(true); window.setTimeout(() => setShared(false), 1800); };

  return <main className="dashboard-page profile-page">
    <AppSidebar active="profile" language={language} setLanguage={(next) => { localStorage.setItem("coda-language", next); setLanguage(next); }} theme={theme} setTheme={setTheme} />
    <section className="profile-content">
      <header className="profile-topbar"><Link href="/dashboard" aria-label="Back to dashboard"><FontAwesomeIcon icon={faArrowRight} rotation={180} /></Link><div><strong>{name}</strong><span>Profile</span></div></header>
      <div className="profile-cover" style={{ backgroundColor: profile?.accent_color ?? "var(--accent)" }}><div className="profile-actions"><button className="profile-share" type="button" onClick={shareProfile} aria-label={shared ? "Profile link copied" : "Share profile"} title={shared ? "Profile link copied" : "Share profile"}><FontAwesomeIcon icon={faShareNodes} /></button><Link className="profile-edit" href="/settings" aria-label="Edit profile" title="Edit profile"><FontAwesomeIcon icon={faPen} /></Link></div></div>
      <section className="profile-identity">
        <div className="profile-avatar" style={{ backgroundColor: profile?.accent_color ?? "var(--accent)" }}>{profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}</div>
        <div className="profile-details"><h1>{name}</h1><p className="profile-handle">{handle}{profile?.pronouns ? ` . ${profile.pronouns}` : ""}</p>{profile?.bio && <p className="profile-bio">{profile.bio}</p>}<div className="profile-top-details"><div className="profile-goal"><span>Primary goal</span><strong>{profile?.primary_goal || "Set a direction for your practice"}</strong></div><div className="profile-composers"><span>Favorite composers</span><div>{composers.length ? composers.map((composer) => <span className="profile-composer-badge" key={composer}>{composer}</span>) : <strong>Add your influences</strong>}</div></div></div></div>
      </section>
      <nav className="profile-tabs" aria-label="Profile views"><button className="active">Posts</button><button>Replies</button><button>Media</button><button>Likes</button></nav>
      <section className="profile-composer"><div className="profile-composer-avatar" style={{ backgroundColor: profile?.accent_color ?? "var(--accent)" }}>{profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}</div><div><p>What are you practicing today?</p><Link href="/dashboard"><FontAwesomeIcon icon={faCalendarDays} /> Open practice log <FontAwesomeIcon icon={faArrowRight} /></Link></div></section>
      <section className="profile-empty"><FontAwesomeIcon icon={faMessage} /><h2>Nothing posted yet</h2><p>Your practice notes and musical discoveries will appear here.</p></section>
    </section>
  </main>;
}
