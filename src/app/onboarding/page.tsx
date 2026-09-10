"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { faDesktop, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/client";
import translations from "../translations.json";

type Theme = "light" | "system" | "dark";
type Language = "en" | "fr";

const accentPalette = [
  ["purple", "#8b3dce"], ["blue", "#3478db"], ["teal", "#159a91"], ["cyan", "#19b9d1"], ["green", "#3b9b61"],
  ["yellow", "#d6a927"], ["lime", "#89ad2d"], ["orange", "#d87532"], ["red", "#c94a54"], ["pink", "#d84b91"],
] as const;
const instrumentGroups = [
  ["keyboard", [["piano"], ["organ"], ["harpsichord"], ["pianoforte"]]],
  ["strings", [["violin"], ["viola"], ["cello"], ["doubleBass"], ["harp"], ["lute"], ["mandolin"], ["guitar"]]],
  ["brass", [["trumpet"], ["trombone"], ["frenchHorn"], ["tuba"], ["euphonium"]]],
  ["woodwinds", [["flute"], ["piccolo"], ["clarinet"], ["oboe"], ["englishHorn"], ["bassoon"], ["contrabassoon"]]],
  ["percussion", [["percussion"], ["timpani"]]],
  ["other", [["voice"]]],
] as const;
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function OnboardingPage() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem("coda-language") === "fr" ? "fr" : "en";
  });
  const [theme, setTheme] = useState<Theme>("system");
  const [accent, setAccent] = useState("#8b3dce");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const copy = translations[language].auth.onboarding;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--accent", accent);
  }, [language, theme, accent]);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase.from("profiles").select("accent_color, theme, practice_days").eq("id", user.id).maybeSingle();
      if (data) {
        setAccent(data.accent_color ?? "#8b3dce");
        setTheme((data.theme as Theme) ?? "system");
        setSelectedDays(data.practice_days ?? []);
      }
      setIsLoading(false);
    };

    loadProfile().catch(() => {
      setError(copy.saveError);
      setIsLoading(false);
    });
  }, [copy.saveError, router]);

  const toggleDay = (day: string) => setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { error: saveError } = await supabase.from("profiles").upsert({
        id: user.id,
        accent_color: accent,
        theme,
        instrument: formData.get("instrument"),
        practice_hours: Number(formData.get("practiceHours")),
        target_practice_hours: Number(formData.get("targetHours")),
        favorite_composers: formData.get("influences"),
        experience_level: formData.get("level"),
        primary_goal: formData.get("goal"),
        practice_days: selectedDays,
        updated_at: new Date().toISOString(),
      });
      if (saveError) throw saveError;
      setSaved(true);
    } catch {
      setError(copy.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <main className="auth-page"><div className="auth-topbar"><Link className="wordmark" href="/">coda<span className="wordmark-dot">.</span></Link></div></main>;

  return (
    <main className="auth-page onboarding-page">
      <section className="onboarding-layout"><div className="onboarding-intro"><p className="eyebrow"><span className="eyebrow-line" /> {copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.intro}</p><div className="accent-preview" style={{ backgroundColor: accent }}><span>Coda.</span><small>{accent}</small></div></div>
        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="onboarding-section"><p className="onboarding-label">{copy.accent}</p><div className="accent-palette">{accentPalette.map(([key, color]) => <button className={accent.toLowerCase() === color ? "selected" : ""} type="button" key={key} onClick={() => setAccent(color)} aria-label={copy.palette[key]} title={copy.palette[key]} style={{ backgroundColor: color }} />)}<label className={`accent-custom ${!accentPalette.some(([, color]) => color === accent.toLowerCase()) ? "selected" : ""}`} title={copy.palette.custom}><input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} aria-label={copy.palette.custom} /><span>+</span></label></div><div className="accent-value">{accent}</div></div>
          <div className="onboarding-section"><p className="onboarding-label">{copy.theme}</p><div className="theme-options">{(["light", "system", "dark"] as Theme[]).map((option) => <button className={theme === option ? "selected" : ""} type="button" key={option} onClick={() => setTheme(option)}>{option === "light" ? <FontAwesomeIcon icon={faSun} /> : option === "dark" ? <FontAwesomeIcon icon={faMoon} /> : <FontAwesomeIcon icon={faDesktop} />} {copy[option]}</button>)}</div></div>
          <label className="onboarding-field"><span>{copy.instrument}</span><select name="instrument" required defaultValue=""><option value="" disabled>{copy.instrumentPlaceholder}</option>{instrumentGroups.map(([family, familyInstruments]) => <optgroup label={copy.instrumentFamilies[family]} key={family}>{familyInstruments.map(([key]) => <option key={key} value={key}>{copy.instruments[key]}</option>)}</optgroup>)}</select></label>
          <div className="hours-grid"><label className="onboarding-field"><span>{copy.practiceHours}</span><input name="practiceHours" type="number" min="0" max="168" step="0.5" placeholder="0" required /></label><label className="onboarding-field"><span>{copy.targetHours}</span><input name="targetHours" type="number" min="0" max="168" step="0.5" placeholder="0" required /></label></div>
          <label className="onboarding-field"><span>{copy.influences}</span><input name="influences" type="text" placeholder={copy.influencesPlaceholder} required /></label>
          <label className="onboarding-field"><span>{copy.level}</span><select name="level" required defaultValue=""><option value="" disabled>{copy.levelPlaceholder}</option><option value="beginner">{copy.beginner}</option><option value="intermediate">{copy.intermediate}</option><option value="advanced">{copy.advanced}</option><option value="professional">{copy.professional}</option></select></label>
          <label className="onboarding-field"><span>{copy.goal}</span><select name="goal" required defaultValue=""><option value="" disabled>{copy.goalPlaceholder}</option><option value="consistency">{copy.consistency}</option><option value="repertoire">{copy.repertoire}</option><option value="performance">{copy.performance}</option><option value="creative">{copy.creative}</option></select></label>
          <div className="onboarding-section"><p className="onboarding-label">{copy.days}</p><div className="day-options">{days.map((day) => <button className={selectedDays.includes(day) ? "selected" : ""} type="button" key={day} onClick={() => toggleDay(day)}>{day.slice(0, 3)}</button>)}</div></div>
          {error && <p className="auth-error" role="alert">{error}</p>}{saved && <p className="auth-success" role="status">{copy.saved}</p>}
          <button className="button button-accent onboarding-submit" type={saved ? "button" : "submit"} onClick={saved ? () => router.push("/dashboard") : undefined} disabled={isSaving}>{isSaving ? copy.saving : saved ? copy.openDashboard : copy.save}<span aria-hidden="true">↗</span></button>
        </form>
      </section>
    </main>
  );
}
