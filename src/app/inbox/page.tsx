"use client";

import { useEffect, useState } from "react";
import { faArrowLeft, faCodeBranch, faInbox, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/app-context";
import AppSidebar from "../app-sidebar";

type Message = { id: string; sender_name: string; subject: string; content: string; created_at: string; read_at: string | null };
const updateSubject = "Coda 1.0 is here";

export default function InboxPage() {
  const { language } = useApp();
  const fr = language === "fr";
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const updateContent = fr
        ? "Cette nouvelle version ajoute un journal structuré avec date, pièce, travail, notes et qualité de pratique, un planning avec séances toute la journée et durée estimée, une communauté pour partager vos notes, des couleurs secondaires, un tableau de bord remanié et une aide actualisée."
        : "This new version adds a structured journal with dates, pieces, work items, notes, and practice quality, an all-day schedule with estimated duration, a community feed for sharing practice notes, secondary colors, a rebuilt dashboard, and updated help.";
      const { data: existing } = await supabase.from("inbox_messages").select("id, sender_name, subject, content, created_at, read_at").eq("user_id", user.id).eq("subject", updateSubject).maybeSingle();
      if (!existing) await supabase.from("inbox_messages").insert({ user_id: user.id, sender_name: "Coda developers", subject: updateSubject, content: updateContent });
      const { data, error: loadError } = await supabase.from("inbox_messages").select("id, sender_name, subject, content, created_at, read_at").eq("user_id", user.id).order("created_at", { ascending: false });
      if (loadError) setError(fr ? "Impossible de charger la boîte de réception." : "We could not load your inbox.");
      else { setMessages((data as Message[]) ?? []); setSelected((data?.[0] as Message) ?? null); }
      setLoading(false);
    };
    load();
  }, [fr, router]);

  const remove = async (id: string) => { await createClient().from("inbox_messages").delete().eq("id", id); setMessages((current) => current.filter((message) => message.id !== id)); if (selected?.id === id) setSelected(null); };
  if (loading) return <main className="dashboard-page" />;
  return <main className="dashboard-page inbox-page"><AppSidebar active="inbox" /><section className="inbox-content"><header className="inbox-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Coda</p><h1>{fr ? "Boîte de réception" : "Inbox"}</h1><p>{fr ? "Les nouvelles de votre espace musical." : "Notes from your musical space."}</p></div><a className="inbox-github-link" href="https://github.com/W1L7dev/coda" target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faCodeBranch} /> GitHub</a></header><div className="inbox-layout"><nav className="inbox-list" aria-label={fr ? "Messages" : "Messages"}>{messages.length ? messages.map((message) => <button className={selected?.id === message.id ? "selected" : ""} type="button" onClick={() => setSelected(message)} key={message.id}><strong>{message.sender_name}</strong><span>{message.subject}</span><time>{new Intl.DateTimeFormat(fr ? "fr-FR" : "en-US", { month: "short", day: "numeric" }).format(new Date(message.created_at))}</time></button>) : <p>{fr ? "Aucun message." : "No messages."}</p>}</nav><article className="inbox-message">{selected ? <><div className="inbox-message-top"><button type="button" onClick={() => setSelected(null)} aria-label={fr ? "Retour" : "Back"}><FontAwesomeIcon icon={faArrowLeft} /></button><button type="button" onClick={() => remove(selected.id)} aria-label={fr ? "Supprimer" : "Delete"}><FontAwesomeIcon icon={faTrash} /></button></div><span className="summary-kicker">{selected.sender_name}</span><h2>{selected.subject}</h2><time>{new Intl.DateTimeFormat(fr ? "fr-FR" : "en-US", { dateStyle: "long" }).format(new Date(selected.created_at))}</time><p>{selected.content}</p></> : <div className="inbox-empty"><FontAwesomeIcon icon={faInbox} /><p>{fr ? "Sélectionnez un message." : "Select a message."}</p></div>}</article></div>{error && <p className="auth-error" role="alert">{error}</p>}</section></main>;
}
