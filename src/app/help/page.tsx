"use client";

import { useEffect, useState } from "react";
import { faArrowRight, faCalendarDays, faCircleQuestion, faMusic, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AppSidebar from "../app-sidebar";

type Theme = "light" | "system" | "dark";
type Language = "en" | "fr";

const sections = [
  [faCalendarDays, "Weekly schedule", "Plan practice and lesson sessions by weekday, then edit them from the session rows."],
  [faMusic, "Repertoire", "Add pieces, search for metadata, and keep catalog, year, era, and composer details together."],
  [faUser, "Profile", "Update your display name, bio, profile picture, and public profile from Settings."],
  [faCircleQuestion, "Need more help?", "More guidance and support tools are on the way as Coda grows."],
] as const;

export default function HelpPage() {
  const [language, setLanguage] = useState<Language>(() => typeof window !== "undefined" && window.localStorage.getItem("coda-language") === "fr" ? "fr" : "en");
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => { document.documentElement.lang = language; document.documentElement.dataset.theme = theme; }, [language, theme]);
  return <main className="dashboard-page help-page"><AppSidebar active="help" language={language} setLanguage={(next) => { localStorage.setItem("coda-language", next); setLanguage(next); }} theme={theme} setTheme={setTheme} /><section className="help-content"><header className="help-heading"><p className="eyebrow"><span className="eyebrow-line" /> Coda</p><h1>{language === "fr" ? "Aide" : "Help"}</h1><p>{language === "fr" ? "Un guide simple pour avancer dans votre espace." : "A simple guide to moving through your space."}</p></header><section className="help-list">{sections.map(([icon, title, description]) => <article className="help-item" key={title}><FontAwesomeIcon icon={icon} /><div><h2>{title}</h2><p>{description}</p></div><FontAwesomeIcon className="help-arrow" icon={faArrowRight} /></article>)}</section></section></main>;
}
