"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { faArrowLeft, faDesktop, faEye, faEyeSlash, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/client";
import translations from "./translations.json";

type Theme = "light" | "system" | "dark";
type Language = "en" | "fr";
type AuthMode = "login" | "signup";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("coda-language");
    return saved === "fr" ? "fr" : "en";
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
  const copy = translations[language].auth;
  const isLogin = mode === "login";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
  }, [theme, language]);

  const cycleTheme = () => setTheme((current) => current === "system" ? "dark" : current === "dark" ? "light" : "system");
  const themeIcon = theme === "dark" ? faMoon : theme === "light" ? faSun : faDesktop;
  const passwordChecks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z\d]/.test(password),
  ];
  const passwordMismatch = !isLogin && confirmPassword.length > 0 && password !== confirmPassword;
  const validationMessage = passwordMismatch ? copy.passwordMismatch : error;
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!isLogin && !passwordPattern.test(password)) {
      setError(copy.passwordWeak);
      setSubmitted(false);
      return;
    }

    if (!isLogin && password !== formData.get("confirmPassword")) {
      setError(copy.passwordMismatch);
      setSubmitted(false);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      localStorage.setItem("coda-remember-me", String(rememberMe));
      const supabase = createClient();
      const email = String(formData.get("email") ?? "");

      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = user
          ? await supabase.from("profiles").select("instrument").eq("id", user.id).maybeSingle()
          : { data: null };
        router.push(profile?.instrument ? "/dashboard" : "/onboarding");
        return;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: String(formData.get("name") ?? "") } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          router.push(`/check-email?email=${encodeURIComponent(email)}`);
          return;
        }
      }

      router.push("/onboarding");
    } catch (supabaseError) {
      setError(supabaseError instanceof Error ? supabaseError.message : copy.authError);
      setSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-topbar">
        <Link className="wordmark" href="/" aria-label="Coda home">coda<span className="wordmark-dot">.</span></Link>
        <div className="auth-tools">
          <button className="theme-toggle" onClick={cycleTheme} aria-label={`Switch theme, currently ${theme}`} title={`Theme: ${theme}`}><FontAwesomeIcon className="theme-symbol" icon={themeIcon} aria-hidden="true" /></button>
          <span className="language-switcher"><button className={language === "fr" ? "active-language" : ""} onClick={() => { localStorage.setItem("coda-language", "fr"); setLanguage("fr"); }}>FR</button><span>/</span><button className={language === "en" ? "active-language" : ""} onClick={() => { localStorage.setItem("coda-language", "en"); setLanguage("en"); }}>EN</button></span>
        </div>
      </div>
      <section className="auth-layout">
        <div className="auth-intro"><p className="eyebrow"><span className="eyebrow-line" /> Coda</p><h1>{isLogin ? copy.loginTitle : copy.signupTitle}</h1><p>{isLogin ? copy.loginIntro : copy.signupIntro}</p></div>
        <div className="auth-panel">
          <Link className="auth-back" href="/"><FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" /> Back home</Link>
          <h2>{isLogin ? copy.loginAction : copy.signupAction}</h2>
          {submitted ? <div className="auth-success" role="status">{copy.success}</div> : <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && <label><span>{copy.name}</span><input name="name" type="text" autoComplete="name" required /></label>}
            <label><span>{copy.email}</span><input name="email" type="email" autoComplete="email" required /></label>
            <label><span>{copy.password}</span><span className="password-field"><input className={showPassword ? "password-visible" : ""} name="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} autoComplete={isLogin ? "current-password" : "new-password"} minLength={8} pattern={isLogin ? undefined : "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}"} required /><button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} aria-hidden="true" /></button></span>{!isLogin && <p className="password-checks">{copy.passwordChecks.map((check, index) => <span className={passwordChecks[index] ? "met" : "unmet"} key={check}><span aria-hidden="true">{passwordChecks[index] ? "✓" : "×"}</span>{check}</span>)}</p>}</label>
            {!isLogin && <label><span>{copy.confirmPassword}</span><span className="password-field"><input className={showConfirmPassword ? "password-visible" : ""} name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }} autoComplete="new-password" minLength={8} required /><button className="password-toggle" type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}><FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} aria-hidden="true" /></button></span></label>}
            <p className={`auth-error ${validationMessage ? "" : "is-hidden"}`} role="alert" aria-hidden={!validationMessage}>{validationMessage || "\u00a0"}</p>
            <label className="remember-me"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /><span>{copy.rememberMe}</span></label>
            <button className="button button-accent auth-submit" type="submit" disabled={isLoading}>{isLoading ? copy.loading : isLogin ? copy.loginAction : copy.signupAction}<span aria-hidden="true">↗</span></button>
          </form>}
          <p className="auth-switch">{isLogin ? copy.noAccount : copy.hasAccount} <Link href={isLogin ? "/signup" : "/login"}>{isLogin ? copy.signupLink : copy.loginLink}</Link></p>
        </div>
      </section>
    </main>
  );
}
