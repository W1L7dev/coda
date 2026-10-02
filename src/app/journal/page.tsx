"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { faChevronDown, faChevronRight, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/app-context";
import type { Piece } from "@/lib/types";
import AppSidebar from "../app-sidebar";

type WorkItem = { text: string; status: "worked" | "next" };
type JournalEntry = { id: string; entry_date: string; title: string; piece_id: string | null; piece_title: string | null; composer: string | null; work_items: WorkItem[]; notes: string | null; rating: number | null; created_at: string };

const emptyWorkItem = (): WorkItem => ({ text: "", status: "worked" });

export default function JournalPage() {
  const { language } = useApp();
  const isFrench = language === "fr";
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [pieceId, setPieceId] = useState("");
  const [workItems, setWorkItems] = useState<WorkItem[]>([emptyWorkItem()]);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [openDays, setOpenDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const [{ data: journalData, error: journalError }, { data: repertoireData }] = await Promise.all([
        supabase.from("journal_entries").select("id, entry_date, title, piece_id, piece_title, composer, work_items, notes, rating, created_at").eq("user_id", user.id).order("entry_date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("repertoire").select("id, title, composer, status").eq("user_id", user.id).order("title"),
      ]);
      if (journalError) setError(isFrench ? `Impossible de charger le journal : ${journalError.message}` : `Could not load journal: ${journalError.message}`);
      setEntries((journalData as JournalEntry[]) ?? []);
      setPieces((repertoireData as Piece[]) ?? []);
      setLoading(false);
    };
    load();
  }, [isFrench, router]);

  const selectedPiece = pieces.find((piece) => piece.id === pieceId);
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, JournalEntry[]>();
    entries.forEach((entry) => groups.set(entry.entry_date, [...(groups.get(entry.entry_date) ?? []), entry]));
    return [...groups.entries()];
  }, [entries]);

  const updateWorkItem = (index: number, key: keyof WorkItem, value: string) => setWorkItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } as WorkItem : item));
  const addWorkItem = () => setWorkItems((current) => [...current, emptyWorkItem()]);
  const removeWorkItem = (index: number) => setWorkItems((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index));

  const saveEntry = async (event: FormEvent) => {
    event.preventDefault();
    const cleanedItems = workItems.filter((item) => item.text.trim()).map((item) => ({ ...item, text: item.text.trim() }));
    if (!title.trim()) {
      setError(isFrench ? "Ajoutez un titre à votre entrée." : "Add a title to your entry.");
      return;
    }
    if (!cleanedItems.length) {
      setError(isFrench ? "Ajoutez au moins un point de travail." : "Add at least one work item.");
      return;
    }
    setSaving(true); setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const legacyContent = [
      selectedPiece ? `${selectedPiece.title}${selectedPiece.composer ? ` — ${selectedPiece.composer}` : ""}` : "",
      ...cleanedItems.map((item) => `${item.status === "next" ? "To work on" : "Worked"}: ${item.text}`),
      notes.trim(),
    ].filter(Boolean).join("\n");
    const entryId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const entry = { id: entryId, entry_date: entryDate, title: title.trim(), piece_id: selectedPiece?.id ?? null, piece_title: selectedPiece?.title ?? null, composer: selectedPiece?.composer ?? null, work_items: cleanedItems, notes: notes.trim() || null, rating: rating || null, created_at: createdAt } satisfies JournalEntry;
    const { error: saveError } = await supabase.from("journal_entries").insert({ id: entryId, user_id: user.id, entry_date: entryDate, title: title.trim(), content: legacyContent, piece_id: selectedPiece?.id ?? null, piece_title: selectedPiece?.title ?? null, composer: selectedPiece?.composer ?? null, work_items: cleanedItems, notes: notes.trim() || null, rating: rating || null, created_at: createdAt, updated_at: createdAt });
    if (saveError) {
      setError(isFrench ? `Impossible d'enregistrer : ${saveError.message}` : `Could not save entry: ${saveError.message}`);
    }
    else { setEntries((current) => [entry, ...current].sort((a, b) => b.entry_date.localeCompare(a.entry_date))); setTitle(""); setPieceId(""); setWorkItems([emptyWorkItem()]); setNotes(""); setRating(0); }
    setSaving(false);
  };

  const removeEntry = async (id: string) => {
    const { error: deleteError } = await createClient().from("journal_entries").delete().eq("id", id);
    if (deleteError) setError(isFrench ? "Impossible de supprimer cette entrée." : "We could not delete this entry.");
    else setEntries((current) => current.filter((entry) => entry.id !== id));
  };
  const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(isFrench ? "fr-FR" : "en-US", options ?? { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00`));

  if (loading) return <main className="dashboard-page" />;
  return (
    <main className="dashboard-page journal-page">
      <AppSidebar active="journal" />
      <section className="journal-content">
        <header className="journal-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Coda</p><h1>{isFrench ? "Journal" : "Journal"}</h1><p>{isFrench ? "Un espace pour observer votre pratique." : "A space to notice your practice."}</p></div></header>
        <div className="journal-layout">
          <aside className="journal-history">
            <div className="journal-history-heading"><span className="summary-kicker">{isFrench ? "Historique" : "History"}</span><strong>{entries.length}</strong></div>
            {groupedEntries.length ? groupedEntries.map(([date, dayEntries]) => { const isOpen = openDays.includes(date); return <div className="journal-day" key={date}><button className="journal-day-toggle" type="button" onClick={() => setOpenDays((current) => isOpen ? current.filter((item) => item !== date) : [...current, date])}><FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} /><span>{formatDate(date, { weekday: "long", month: "short", day: "numeric" })}</span><b>{dayEntries.length}</b></button>{isOpen && <div className="journal-day-entries">{dayEntries.map((entry) => <div className="journal-history-entry" key={entry.id}><strong>{entry.title}</strong><small>{entry.piece_title ?? (isFrench ? "Pratique générale" : "General practice")}</small></div>)}</div>}</div>; }) : <p className="journal-history-empty">{isFrench ? "Aucune entrée" : "No entries yet"}</p>}
          </aside>
          <form className="journal-composer" onSubmit={saveEntry}>
            <div className="journal-form-header"><span className="summary-kicker">{isFrench ? "Nouvelle entrée" : "New entry"}</span><label><span>{isFrench ? "Date" : "Date"}</span><input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} /></label></div>
            <label className="journal-field"><span>{isFrench ? "Entrée" : "Entry"}</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={isFrench ? "Titre de votre séance" : "Title for this session"} required /></label>
            <label className="journal-field"><span>{isFrench ? "Pièce" : "Piece"}</span><select value={pieceId} onChange={(event) => setPieceId(event.target.value)}><option value="">{isFrench ? "Choisir dans le répertoire" : "Choose from repertoire"}</option>{pieces.map((piece) => <option value={piece.id} key={piece.id}>{piece.title}{piece.composer ? ` — ${piece.composer}` : ""}</option>)}</select></label>
            <fieldset className="journal-work-field"><legend>{isFrench ? "Travail" : "Work"}</legend>{workItems.map((item, index) => <div className="journal-work-row" key={index}><span>•</span><input value={item.text} onChange={(event) => updateWorkItem(index, "text", event.target.value)} placeholder={isFrench ? "Ce qui a été travaillé..." : "What was worked on..."} /><select value={item.status} onChange={(event) => updateWorkItem(index, "status", event.target.value)} aria-label={isFrench ? "Statut du travail" : "Work status"}><option value="worked">{isFrench ? "Travaillé" : "Worked"}</option><option value="next">{isFrench ? "À travailler" : "To work on"}</option></select><button type="button" onClick={() => removeWorkItem(index)} aria-label={isFrench ? "Supprimer" : "Remove"}>×</button></div>)}<button className="journal-add-work" type="button" onClick={addWorkItem}>+ {isFrench ? "Ajouter un point" : "Add bullet"}</button></fieldset>
            <label className="journal-field"><span>{isFrench ? "Notes" : "Notes"}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={isFrench ? "Une observation supplémentaire..." : "An additional observation..."} /></label>
            <fieldset className="journal-rating"><legend>{isFrench ? "Qualité de la pratique" : "Practice quality"}</legend><div>{[1, 2, 3, 4, 5].map((star) => <button type="button" className={rating >= star ? "selected" : ""} onClick={() => setRating(star)} key={star} aria-label={`${star} ${isFrench ? "étoiles" : "stars"}`}>★</button>)}</div></fieldset>
            <button className="button button-accent journal-save" type="submit" disabled={saving}>{saving ? (isFrench ? "Enregistrement..." : "Saving...") : (isFrench ? "Enregistrer l'entrée" : "Save entry")} <span aria-hidden="true">↗</span></button>
          </form>
          <section className="journal-entries" aria-live="polite"><div className="journal-list-heading"><span className="summary-kicker">{isFrench ? "Entrées du journal" : "Journal entries"}</span></div>{entries.length ? entries.slice(0, 4).map((entry) => <article className="journal-entry" key={entry.id}><div className="journal-entry-meta"><time dateTime={entry.entry_date}>{formatDate(entry.entry_date)}</time>{entry.rating && <span className="journal-entry-rating">{"★".repeat(entry.rating)}</span>}<button type="button" onClick={() => removeEntry(entry.id)} aria-label={isFrench ? `Supprimer ${entry.title}` : `Delete ${entry.title}`}><FontAwesomeIcon icon={faTrash} /></button></div><h2>{entry.title}</h2>{entry.piece_title && <p className="journal-piece">{entry.piece_title}{entry.composer ? ` — ${entry.composer}` : ""}</p>}<ul>{(entry.work_items ?? []).map((item, index) => <li className={item.status} key={index}>{item.text}</li>)}</ul>{entry.notes && <p className="journal-notes">{entry.notes}</p>}</article>) : <div className="journal-empty"><p>{isFrench ? "Votre journal commence ici." : "Your journal starts here."}</p><span>{isFrench ? "Commencez par noter ce que vous avez travaillé." : "Start by noting what you worked on."}</span></div>}</section>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
