"use client";

import { useEffect, useState } from "react";
import AppSidebar from "../app-sidebar";

type Theme = "light" | "system" | "dark";
type Language = "en" | "fr";

export default function CommunityPage() {
  const [language, setLanguage] = useState<Language>(() => typeof window !== "undefined" && window.localStorage.getItem("coda-language") === "fr" ? "fr" : "en");
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => { document.documentElement.lang = language; document.documentElement.dataset.theme = theme; }, [language, theme]);
  return <main className="dashboard-page construction-page"><AppSidebar active="community" language={language} setLanguage={(next) => { localStorage.setItem("coda-language", next); setLanguage(next); }} theme={theme} setTheme={setTheme} /><section className="construction-content"><p className="eyebrow"><span className="eyebrow-line" /> Coda</p><h1>{language === "fr" ? "Communauté" : "Community"}</h1><div className="construction-mark">✦</div><h2>{language === "fr" ? "Page en construction" : "Page under construction"}</h2><p>{language === "fr" ? "Nous préparons un espace pour rencontrer d’autres musicien·nes." : "We’re preparing a place to meet other musicians."}</p></section></main>;
}
