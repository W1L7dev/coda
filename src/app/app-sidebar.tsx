"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { faBars, faCalendarDays, faCircleQuestion, faDesktop, faGear, faGauge, faGlobe, faInbox, faMoon, faMusic, faRightFromBracket, faSun, faUser, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/client";
import translations from "./translations.json";

type Theme = "light" | "system" | "dark";
type Language = "en" | "fr";

export default function AppSidebar({ active, language, setLanguage, theme, setTheme }: { active: "dashboard" | "profile" | "settings" | "repertoire" | "calendar" | "inbox" | "community" | "help"; language: Language; setLanguage: (language: Language) => void; theme: Theme; setTheme: (theme: Theme) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("coda-musician");
  const router = useRouter();
  const copy = translations[language].auth.onboarding;
  const themeIcon = theme === "dark" ? faMoon : theme === "light" ? faSun : faDesktop;
  const navItems = [[faGauge, copy.sidebar.dashboard, "/dashboard"], [faCalendarDays, language === "fr" ? "Planning" : "Schedule", "/calendar"], [faMusic, language === "fr" ? "Répertoire" : "Repertoire", "/repertoire"], [faUsers, language === "fr" ? "Communauté" : "Community", "/community"], [faInbox, language === "fr" ? "Boîte de réception" : "Inbox", "/inbox"], [faCircleQuestion, language === "fr" ? "Aide" : "Help", "/help"]] as const;
  const cycleTheme = () => setTheme(theme === "system" ? "dark" : theme === "dark" ? "light" : "system");
  const changeLanguage = (next: Language) => { localStorage.setItem("coda-language", next); setLanguage(next); };
  const signOut = async () => { await createClient().auth.signOut(); router.push("/"); };

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUsername(user.email?.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "coda-musician");
      const { data } = await createClient().from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    });
  }, []);

  return <aside className={`dashboard-rail ${expanded ? "expanded" : ""}`}>
    <button className="rail-button rail-menu" onClick={() => setExpanded((current) => !current)} aria-label={expanded ? "Close sidebar" : "Open sidebar"} title={expanded ? "Close sidebar" : "Open sidebar"}><FontAwesomeIcon icon={faBars} /></button>
    <nav className="rail-nav">{navItems.map(([icon, label, href]) => <Link className={(active === "dashboard" && href === "/dashboard") || (active === "calendar" && href === "/calendar") || (active === "repertoire" && href === "/repertoire") || (active === "community" && href === "/community") || (active === "inbox" && href === "/inbox") || (active === "help" && href === "/help") ? "active" : ""} href={href} key={label} aria-label={label} title={label}><FontAwesomeIcon icon={icon} /><span>{label}</span></Link>)}</nav>
    <div className="rail-bottom"><Link className={active === "profile" ? "active" : ""} href={`/user/@${username}`} aria-label={copy.sidebar.account} title={copy.sidebar.account}>{avatarUrl ? <img className="sidebar-avatar" src={avatarUrl} alt="" /> : <FontAwesomeIcon icon={faUser} />}<span>{copy.sidebar.account}</span></Link><Link className={active === "settings" ? "active" : ""} href="/settings" aria-label={copy.sidebar.settings} title={copy.sidebar.settings}><FontAwesomeIcon icon={faGear} /><span>{copy.sidebar.settings}</span></Link><button onClick={() => changeLanguage(language === "en" ? "fr" : "en")} aria-label={copy.sidebar.language} title={copy.sidebar.language}><FontAwesomeIcon icon={faGlobe} /><span>{copy.sidebar.language}</span></button><button onClick={cycleTheme} aria-label={copy.sidebar.theme} title={copy.sidebar.theme}><FontAwesomeIcon icon={themeIcon} /><span>{copy.sidebar.theme}</span></button><button onClick={signOut} aria-label={copy.sidebar.signOut} title={copy.sidebar.signOut}><FontAwesomeIcon icon={faRightFromBracket} /><span>{copy.sidebar.signOut}</span></button></div>
  </aside>;
}
