"use client";

import { createContext, startTransition, useContext, useEffect, useState, type ReactNode } from "react";
import type { Language, Theme } from "./types";

type AppContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    if (localStorage.getItem("coda-language") === "fr") startTransition(() => setLanguage("fr"));
    const savedTheme = localStorage.getItem("coda-theme") as Theme | null;
    if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
      startTransition(() => setTheme(savedTheme));
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--accent", localStorage.getItem("coda-accent") ?? "#8b3dce");
    document.documentElement.style.setProperty("--secondary", localStorage.getItem("coda-secondary") ?? "#159a91");
  }, [language, theme]);

  const changeLanguage = (next: Language) => {
    localStorage.setItem("coda-language", next);
    setLanguage(next);
  };

  const changeTheme = (next: Theme) => {
    localStorage.setItem("coda-theme", next);
    setTheme(next);
  };

  return (
    <AppContext.Provider value={{ language, setLanguage: changeLanguage, theme, setTheme: changeTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}