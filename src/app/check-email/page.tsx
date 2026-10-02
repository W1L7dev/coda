"use client";

import Link from "next/link";
import { faArrowLeft, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useApp } from "@/lib/app-context";
import translations from "../translations.json";

export default function CheckEmailPage() {
  const { language, setLanguage } = useApp();
  const copy = translations[language].auth;

  return (
    <main className="auth-page confirmation-page">
      <div className="auth-topbar">
        <Link className="wordmark" href="/" aria-label="Coda home">coda<span className="wordmark-dot">.</span></Link>
        <span className="language-switcher">
          <button className={language === "fr" ? "active-language" : ""} onClick={() => setLanguage("fr")}>FR</button>
          <span>/</span>
          <button className={language === "en" ? "active-language" : ""} onClick={() => setLanguage("en")}>EN</button>
        </span>
      </div>
      <section className="confirmation-card">
        <div className="confirmation-icon"><FontAwesomeIcon icon={faEnvelope} /></div>
        <p className="eyebrow"><span className="eyebrow-line" /> Coda</p>
        <h1>{copy.emailConfirmationTitle}</h1>
        <p>{copy.emailConfirmationIntro}</p>
        <Link className="auth-back" href="/login"><FontAwesomeIcon icon={faArrowLeft} /> {copy.backToLogin}</Link>
      </section>
    </main>
  );
}