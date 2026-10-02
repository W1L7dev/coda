"use client";

import { faArrowRight, faBookOpen, faCalendarDays, faCircleQuestion, faMusic, faUser, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useApp } from "@/lib/app-context";
import AppSidebar from "../app-sidebar";

const sections = [
  [faCalendarDays, "Weekly schedule", "Plan practice or lesson sessions, mark all-day practice, and estimate the time you want to give it.", "/calendar"],
  [faMusic, "Repertoire", "Add pieces with their composer and era, then sort, filter, edit, or remove them from your collection.", "/repertoire"],
  [faBookOpen, "Journal", "Record what you worked on, link a piece from your repertoire, add notes, and rate the quality of a session.", "/journal"],
  [faUsers, "Community", "Share a short practice note with other musicians, read the feed, and leave a little encouragement.", "/community"],
  [faUser, "Profile and settings", "Update your profile, picture, language, theme, and accent colors from Settings.", "/settings"],
  [faCircleQuestion, "Still need help?", "Send a note to will.miclette@gmail.com and tell us what would make your practice easier.", "mailto:hello@coda.music"],
] as const;

export default function HelpPage() {
  const { language } = useApp();
  return (
    <main className="dashboard-page help-page">
      <AppSidebar active="help" />
      <section className="help-content">
        <header className="help-heading">
          <p className="eyebrow"><span className="eyebrow-line" /> Coda</p>
          <h1>{language === "fr" ? "Aide" : "Help"}</h1>
          <p>{language === "fr" ? "Un guide simple pour avancer dans votre espace." : "A simple guide to moving through your space."}</p>
        </header>
        <section className="help-list">
          {sections.map(([icon, title, description, href]) => (
            <a className="help-item" href={href} key={title}>
              <FontAwesomeIcon icon={icon} />
              <div><h2>{title}</h2><p>{description}</p></div>
              <FontAwesomeIcon className="help-arrow" icon={faArrowRight} />
            </a>
          ))}
        </section>
      </section>
    </main>
  );
}