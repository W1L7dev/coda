"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { faDesktop, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/client";
import translations from "./translations.json";

type Theme = "light" | "system" | "dark";
type Language = "en" | "fr";

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const cycleTheme = () => setTheme((current) => current === "system" ? "dark" : current === "dark" ? "light" : "system");
  const themeIcon = theme === "dark" ? faMoon : theme === "light" ? faSun : faDesktop;

  return <button className="theme-toggle" onClick={cycleTheme} aria-label={`Switch theme, currently ${theme}`} title={`Theme: ${theme}`}>
    <FontAwesomeIcon className="theme-symbol" icon={themeIcon} aria-hidden="true" />
  </button>;
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const copy = translations[language];
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/dashboard");
    });
  }, [router]);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Coda home">coda<span className="wordmark-dot">.</span></a>
        <nav className="desktop-nav" aria-label={language === "fr" ? "Navigation principale" : "Main navigation"}>
          <a href="#about">{copy.nav[0]}</a><a href="#features">{copy.nav[1]}</a>
          <span className="language-switcher"><button className={language === "fr" ? "active-language" : ""} onClick={() => setLanguage("fr")}>FR</button><span>/</span><button className={language === "en" ? "active-language" : ""} onClick={() => setLanguage("en")}>EN</button></span>
        </nav>
        <div className="header-actions"><ThemeToggle /><a className="text-link" href="/login">{copy.login}</a><a className="button button-small button-dark" href="/signup">{copy.getStarted} <span aria-hidden="true">↗</span></a></div>
      </header>

      <main id="top">
        <section className="hero section-wrap"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> {copy.eyebrow}</p><h1>{copy.heroTitle[0]}<em>{copy.heroTitle[1]}</em></h1><p className="hero-intro">{copy.heroIntro}</p><div className="hero-actions"><a className="button button-accent" href="/signup">{copy.findRhythm} <span aria-hidden="true">↗</span></a><a className="quiet-link" href="#about">{copy.discover} <span aria-hidden="true">↓</span></a></div></div></section>
        <section className="about section-wrap" id="about"><p className="section-label">{copy.aboutLabel} <span>01 / 03</span></p><div className="about-grid"><h2>{copy.aboutTitle[0]}<em>{copy.aboutTitle[1]}</em>{copy.aboutTitle[2]}</h2><div className="about-copy"><p>{copy.aboutCopy}</p></div></div></section>
        <section className="features section-wrap" id="features"><div className="features-heading"><p className="section-label">{copy.featuresLabel} <span>02 / 03</span></p><h2>{copy.featuresTitle[0]}<em>{copy.featuresTitle[1]}</em></h2></div><div className="feature-list">{copy.features.map(([number, title, description]) => <article className="feature-item" key={number}><span className="feature-number">{number}</span><h3>{title}</h3><p>{description}</p><span className="feature-arrow" aria-hidden="true">↗</span></article>)}</div></section>
        <section className="cta section-wrap" id="get-started"><div className="cta-inner"><p className="eyebrow"><span className="eyebrow-line" /> {copy.ctaEyebrow}</p><h2>{copy.ctaTitle[0]}<em>{copy.ctaTitle[1]}</em>{copy.ctaTitle[2]}</h2><p>{copy.ctaCopy}</p><a className="button button-light" href="/signup">{copy.getStarted} <span aria-hidden="true">↗</span></a></div><div className="cta-mark" aria-hidden="true">coda<span>.</span></div></section>
      </main>

      <footer className="site-footer" id="journal"><div className="footer-top"><a className="wordmark" href="#top">coda<span className="wordmark-dot">.</span></a><p>{copy.footerCopy}</p></div><div className="footer-bottom"><span>© 2026 William Miclette</span><div><a href="#about">{copy.nav[0]}</a><a href="#features">{copy.nav[1]}</a><a href="mailto:hello@coda.music">{copy.contact}</a></div><span>{copy.madeFor}</span></div></footer>
    </div>
  );
}
