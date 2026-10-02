"use client";

import { FormEvent, startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { faDesktop, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/app-context";
import type { Theme } from "@/lib/types";
import AppSidebar from "../app-sidebar";
import translations from "../translations.json";

const accents = ["#8b3dce", "#3478db", "#159a91", "#19b9d1", "#3b9b61", "#d6a927", "#89ad2d", "#d87532", "#c94a54", "#d84b91"];
const secondaryColors = ["#159a91", "#3478db", "#d87532", "#c94a54", "#3b9b61", "#d6a927", "#19b9d1", "#7b61ff"];
const instrumentOptions = ["piano", "organ", "harpsichord", "pianoforte", "violin", "viola", "cello", "doubleBass", "harp", "lute", "mandolin", "guitar", "trumpet", "trombone", "frenchHorn", "tuba", "euphonium", "flute", "piccolo", "clarinet", "oboe", "englishHorn", "bassoon", "contrabassoon", "percussion", "timpani", "voice"];
type SettingsCopy = {
  profile: string; displayName: string; pronouns: string; bio: string; instrument: string; picture: string;
  level: string; goal: string; influences: string; display: string; language: string; theme: string; accent: string; secondary: string;
  account: string; freeze: string; freezeDescription: string; delete: string; deleteDescription: string;
  posts: string; privacy: string;
  save: string; saved: string; error: string; signOut: string; chooseLevel: string; chooseGoal: string;
  composerPlaceholder: string; levels: Record<string, string>; goals: Record<string, string>; instruments: Record<string, string>;
};

export default function SettingsPage() {
  const { language, setLanguage, theme, setTheme } = useApp();
  const [accent, setAccent] = useState("#8b3dce");
  const [secondary, setSecondary] = useState("#159a91");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState({ displayName: "", pronouns: "", bio: "", instrument: "", level: "", goal: "" });
  const [composers, setComposers] = useState<string[]>([]);
  const [composerInput, setComposerInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const onboarding = translations[language].auth.onboarding;
  const copy: SettingsCopy = language === "fr" ? {
    profile: "Profil", displayName: "Nom affiché", pronouns: "Pronoms", bio: "Bio", instrument: "Instrument",
    picture: "Photo de profil", level: "Niveau actuel", goal: "Objectif principal", influences: "Compositeurs favoris",
    display: "Affichage", language: "Langue", theme: "Thème", accent: "Couleur d'accent", secondary: "Couleur secondaire", account: "Compte",
    freeze: "Geler mon compte", freezeDescription: "Masquer temporairement votre espace et vos activités.",
    delete: "Supprimer mon compte", deleteDescription: "Cette action est définitive et nécessite une confirmation.",
    posts: "Mes publications", privacy: "Confidentialité",
    save: "Enregistrer les changements", saved: "Modifications enregistrées.",
    error: "Impossible d'enregistrer les changements.", signOut: "Se déconnecter",
    chooseLevel: "Choisissez votre niveau", chooseGoal: "Choisissez votre objectif",
    composerPlaceholder: "Écrivez un nom puis appuyez sur Entrée",
    levels: { beginner: "Débutant·e", intermediate: "Intermédiaire", advanced: "Avancé·e", professional: "Professionnel·le" },
    goals: { consistency: "Construire une pratique régulière", repertoire: "Apprendre un nouveau répertoire", performance: "Préparer une performance", creative: "Explorer sa créativité" },
    instruments: onboarding.instruments,
  } : {
    profile: "Profile", displayName: "Display name", pronouns: "Pronouns", bio: "Bio", instrument: "Instrument",
    picture: "Profile picture", level: "Current level", goal: "Primary goal", influences: "Favorite composers",
    display: "Display", language: "Language", theme: "Theme", accent: "Accent color", secondary: "Secondary color", account: "Account",
    freeze: "Freeze my account", freezeDescription: "Temporarily hide your space and activity.",
    delete: "Delete my account", deleteDescription: "This action is permanent and requires confirmation.",
    posts: "My posts", privacy: "Privacy",
    save: "Save changes", saved: "Changes saved.",
    error: "We could not save your changes.", signOut: "Sign out",
    chooseLevel: "Choose your level", chooseGoal: "Choose your goal",
    composerPlaceholder: "Type a name and press Enter",
    levels: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", professional: "Professional" },
    goals: { consistency: "Build a consistent practice", repertoire: "Learn new repertoire", performance: "Prepare for a performance", creative: "Explore creatively" },
    instruments: onboarding.instruments,
  };
  const secondaryColorError = language === "fr"
    ? "La couleur secondaire nécessite la migration Supabase 012_secondary_color.sql."
    : "Secondary color needs the Supabase migration 012_secondary_color.sql.";

  useEffect(() => {
    const storedSecondary = localStorage.getItem("coda-secondary");
    if (storedSecondary) startTransition(() => setSecondary(storedSecondary));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--secondary", secondary);
    localStorage.setItem("coda-accent", accent);
    localStorage.setItem("coda-secondary", secondary);
    document.documentElement.style.setProperty("--profile-initial", avatarUrl ? "\"\"" : JSON.stringify((form.displayName.trim()[0] ?? "U").toUpperCase()));
    document.documentElement.style.setProperty("--avatar-image", avatarUrl ? `url(${avatarUrl})` : "none");
  }, [accent, secondary, form.displayName, avatarUrl]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("full_name, pronouns, bio, accent_color, theme, instrument, experience_level, primary_goal, favorite_composers").eq("id", user.id).maybeSingle();
      if (data) {
        setAccent(data.accent_color ?? "#8b3dce");
        setTheme((data.theme as Theme) ?? "system");
        setComposers(data.favorite_composers ? data.favorite_composers.split(",").map((item: string) => item.trim()).filter(Boolean) : []);
        setForm({
          displayName: data.full_name ?? "",
          pronouns: data.pronouns ?? "",
          bio: data.bio ?? "",
          instrument: data.instrument ?? "",
          level: data.experience_level ?? "",
          goal: data.primary_goal ?? "",
        });
      }
      const { data: colorData } = await supabase.from("profiles").select("secondary_color").eq("id", user.id).maybeSingle();
      if (colorData?.secondary_color) setSecondary(colorData.secondary_color);
      setLoading(false);
    };
    load();
  }, [router, setTheme]);

  useEffect(() => {
    if (!userId) return;
    createClient().from("profiles").select("avatar_url").eq("id", userId).maybeSingle().then(({ data }) => {
      const url = data?.avatar_url ?? "";
      setAvatarUrl(url);
      document.documentElement.style.setProperty("--avatar-display", "flex");
      document.documentElement.style.setProperty("--avatar-url", url ? `url(${url})` : "none");
    });
  }, [userId]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const uploadAvatar = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setError("");
    setAvatarUrl(previewUrl);
    document.documentElement.style.setProperty("--avatar-display", "block");
    document.documentElement.style.setProperty("--avatar-url", `url(${previewUrl})`);
    const supabase = createClient();
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setError(copy.error);
      setAvatarUrl("");
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: saveError } = await supabase.from("profiles").update({ avatar_url: data.publicUrl, updated_at: new Date().toISOString() }).eq("id", userId);
    URL.revokeObjectURL(previewUrl);
    if (saveError) {
      setError(copy.error);
      setAvatarUrl("");
      return;
    }
    setAvatarUrl(data.publicUrl);
    document.documentElement.style.setProperty("--avatar-url", `url(${data.publicUrl})`);
  };

  const resetAvatar = async () => {
    setError("");
    setAvatarUrl("");
    document.documentElement.style.setProperty("--avatar-display", "flex");
    document.documentElement.style.setProperty("--avatar-url", "none");
    const { error: resetError } = await createClient().from("profiles").update({ avatar_url: null, updated_at: new Date().toISOString() }).eq("id", userId);
    if (resetError) setError(copy.error);
  };

  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>(".settings-fields input[type=file]");
    if (!input) return;
    const handleChange = () => {
      const file = input.files?.[0];
      if (file) uploadAvatar(file);
    };
    input.addEventListener("change", handleChange);
    const field = input.parentElement?.parentElement;
    if (!field || field.querySelector(".avatar-reset")) return () => input.removeEventListener("change", handleChange);
    const resetButton = document.createElement("button");
    resetButton.className = "avatar-reset";
    resetButton.type = "button";
    resetButton.textContent = language === "fr" ? "Réinitialiser" : "Reset";
    resetButton.addEventListener("click", resetAvatar);
    field.append(resetButton);
    return () => {
      input.removeEventListener("change", handleChange);
      resetButton.removeEventListener("click", resetAvatar);
      resetButton.remove();
    };
  });

  const addComposer = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const value = composerInput.trim();
      if (value && !composers.includes(value)) setComposers((current) => [...current, value]);
      setComposerInput("");
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const profileUpdate = {
      id: userId,
      full_name: form.displayName,
      pronouns: form.pronouns,
      bio: form.bio.slice(0, 100),
      avatar_url: avatarUrl || null,
      accent_color: accent,
      secondary_color: secondary,
      theme,
      instrument: form.instrument,
      experience_level: form.level,
      primary_goal: form.goal,
      favorite_composers: composers.join(", "),
      updated_at: new Date().toISOString(),
    };
    const supabase = createClient();
    const { error: saveError } = await supabase.from("profiles").upsert(profileUpdate);
    if (saveError && saveError.message.toLowerCase().includes("secondary_color")) {
      const {
        id, full_name, pronouns, bio, avatar_url, accent_color, theme, instrument,
        experience_level, primary_goal, favorite_composers, updated_at,
      } = profileUpdate;
      const legacyProfileUpdate = {
        id, full_name, pronouns, bio, avatar_url, accent_color, theme, instrument,
        experience_level, primary_goal, favorite_composers, updated_at,
      };
      const { error: legacySaveError } = await supabase.from("profiles").upsert(legacyProfileUpdate);
      if (legacySaveError) setError(copy.error);
      else setError(secondaryColorError);
    } else if (saveError) setError(copy.error);
    else setMessage(copy.saved);
    setSaving(false);
  };
  const signOut = async () => {
    await createClient().auth.signOut();
    router.push("/");
  };

  if (loading) return <main className="dashboard-page" />;
  return (
    <main className="dashboard-page settings-page">
      <AppSidebar active="settings" />
      <section className="settings-content">
        <header className="settings-heading">
          <p className="eyebrow"><span className="eyebrow-line" /> Coda</p>
          <h1>{language === "fr" ? "Réglages" : "Settings"}</h1>
          <p>{language === "fr" ? "Façonnez votre espace pour qu'il vous ressemble." : "Shape your space around the way you work."}</p>
        </header>
        <form onSubmit={save} className="settings-form">
          <section className="settings-section">
            <div>
              <h2>{copy.profile}</h2>
              <p>{language === "fr" ? "Les détails que votre communauté voit." : "The details your community sees."}</p>
            </div>
            <div className="settings-fields">
              <label><span>{copy.displayName}</span><input value={form.displayName} onChange={(e) => update("displayName", e.target.value)} /></label>
              <label><span>{copy.pronouns}</span><input value={form.pronouns} onChange={(e) => update("pronouns", e.target.value)} /></label>
              <label><span>{copy.instrument}</span><select value={form.instrument} onChange={(e) => update("instrument", e.target.value)}><option value="">{language === "fr" ? "Choisir" : "Choose"}</option>{instrumentOptions.map((key) => <option value={key} key={key}>{copy.instruments[key]}</option>)}</select></label>
              <label><span>{copy.picture}</span><input type="file" accept="image/*" /></label>
              <label><span>{copy.level}</span><select value={form.level} onChange={(e) => update("level", e.target.value)}><option value="">{copy.chooseLevel}</option>{Object.entries(copy.levels).map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select></label>
              <label><span>{copy.goal}</span><select value={form.goal} onChange={(e) => update("goal", e.target.value)}><option value="">{copy.chooseGoal}</option>{Object.entries(copy.goals).map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select></label>
              <label className="settings-wide"><span>{copy.bio} <small>{form.bio.length}/100</small></span><textarea maxLength={100} value={form.bio} onChange={(e) => update("bio", e.target.value)} /></label>
              <div className="settings-wide">
                <span className="settings-label">{copy.influences}</span>
                <div className="composer-input">
                  <div className="composer-badges">{composers.map((composer) => <span className="composer-badge" key={composer}>{composer}<button type="button" onClick={() => setComposers((current) => current.filter((item) => item !== composer))} aria-label={`${language === "fr" ? "Retirer" : "Remove"} ${composer}`}>×</button></span>)}</div>
                  <input value={composerInput} onChange={(e) => setComposerInput(e.target.value)} onKeyDown={addComposer} placeholder={copy.composerPlaceholder} />
                </div>
              </div>
            </div>
          </section>
          <section className="settings-section">
            <div>
              <h2>{copy.display}</h2>
              <p>{language === "fr" ? "Préférences visuelles et langue." : "Visual and language preferences."}</p>
            </div>
            <div className="settings-fields">
              <div>
                <span className="settings-label">{copy.language}</span>
                <div className="settings-pills">
                  <button type="button" className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")}>EN</button>
                  <button type="button" className={language === "fr" ? "selected" : ""} onClick={() => setLanguage("fr")}>FR</button>
                </div>
              </div>
              <div>
                <span className="settings-label">{copy.theme}</span>
                <div className="settings-pills">
                  {(["light", "system", "dark"] as Theme[]).map((item) => (
                    <button type="button" className={theme === item ? "selected" : ""} onClick={() => setTheme(item)} key={item}>
                      <FontAwesomeIcon icon={item === "light" ? faSun : item === "dark" ? faMoon : faDesktop} /> {onboarding[item]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="settings-label">{copy.accent}</span>
                <div className="settings-palette">
                  {accents.map((color) => <button type="button" className={accent === color ? "selected" : ""} style={{ backgroundColor: color }} onClick={() => setAccent(color)} key={color} aria-label={color} />)}
                  <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} aria-label="Custom accent" />
                </div>
              </div>
              <div>
                <span className="settings-label">{copy.secondary}</span>
                <div className="settings-palette">
                  {secondaryColors.map((color) => <button type="button" className={secondary === color ? "selected" : ""} style={{ backgroundColor: color }} onClick={() => setSecondary(color)} key={color} aria-label={color} />)}
                  <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} aria-label="Custom secondary color" />
                </div>
              </div>
            </div>
          </section>
          <section className="settings-section account-section">
            <div>
              <h2>{copy.account}</h2>
              <p>{language === "fr" ? "Contrôlez vos données et votre présence." : "Control your data and presence."}</p>
            </div>
            <div className="settings-account-actions">
              <button type="button" onClick={signOut}>{copy.signOut}</button>
              <button type="button">{copy.posts}</button>
              <button type="button">{copy.privacy}</button>
              <button className="danger" type="button" onClick={() => window.confirm(copy.deleteDescription)}>{copy.delete}</button>
              <button className="danger" type="button" onClick={() => window.confirm(copy.freezeDescription)}>{copy.freeze}</button>
            </div>
          </section>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button button-accent settings-save" disabled={saving}>{saving ? (language === "fr" ? "Enregistrement..." : "Saving...") : copy.save}<span aria-hidden="true">↗</span></button>
          {message && <p className="settings-saved" role="status">{message}</p>}
        </form>
      </section>
    </main>
  );
}