"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/app-context";
import type { Piece, Theme } from "@/lib/types";
import AppSidebar from "../app-sidebar";

type Status = "want_to_learn" | "learning" | "polished";
type PieceDraft = { title: string; composer: string; catalog: string; era: string };
type SortKey = "title" | "composer" | "era" | "catalog";

const statusLabels: Record<string, Record<Status, string>> = {
  en: { want_to_learn: "Want to learn", learning: "In progress", polished: "Polished" },
  fr: { want_to_learn: "À apprendre", learning: "En cours", polished: "Maîtrisé" },
};

export default function RepertoirePage() {
  const { language, theme, setTheme } = useApp();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [era, setEra] = useState("");
  const [status, setStatus] = useState<Status>("want_to_learn");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PieceDraft>({ title: "", composer: "", catalog: "", era: "" });
  const [sortBy, setSortBy] = useState<SortKey>("title");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [eraFilter, setEraFilter] = useState("all");
  const [composerFilter, setComposerFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const labels = statusLabels[language];

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("theme").eq("id", user.id).maybeSingle();
      const { data } = await supabase.from("repertoire").select("id, title, composer, status, notes, musicbrainz_id, source_url, catalog, era").eq("user_id", user.id).order("created_at", { ascending: false });
      setTheme((profile?.theme as Theme) ?? "system");
      setPieces((data as Piece[]) ?? []);
      setLoading(false);
    };
    load();
  }, [router, setTheme]);

  const addPiece = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data, error } = await supabase.from("repertoire").insert({
      user_id: user.id,
      title: title.trim(),
      composer: composer.trim() || null,
      era: era.trim() || null,
      status,
      musicbrainz_id: null,
      source_url: null,
      catalog: null,
    }).select("id, title, composer, status, notes, musicbrainz_id, source_url, catalog, era").single();
    if (!error && data) {
      setPieces((current) => [data as Piece, ...current]);
      setTitle("");
      setComposer("");
      setEra("");
      setStatus("want_to_learn");
    }
    setSaving(false);
  };
  const beginEdit = (piece: Piece) => {
    setEditingId(piece.id);
    setDraft({ title: piece.title, composer: piece.composer ?? "", catalog: piece.catalog ?? "", era: piece.era ?? "" });
  };
  const updateDraft = (key: keyof PieceDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const saveEdit = async (id: string) => {
    if (!draft.title.trim()) return;
    setSaving(true);
    const updates = {
      title: draft.title.trim(),
      composer: draft.composer.trim() || null,
      catalog: draft.catalog.trim() || null,
      era: draft.era.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await createClient().from("repertoire").update(updates).eq("id", id);
    if (!error) {
      setPieces((current) => current.map((piece) => piece.id === id ? { ...piece, ...updates } : piece));
      setEditingId(null);
    }
    setSaving(false);
  };
  const removePiece = async (id: string) => {
    await createClient().from("repertoire").delete().eq("id", id);
    setPieces((current) => current.filter((piece) => piece.id !== id));
  };
  const eras = [...new Set(pieces.map((piece) => piece.era).filter((era): era is string => Boolean(era)))].sort();
  const visiblePieces = pieces
    .filter((piece) =>
      (statusFilter === "all" || piece.status === statusFilter) &&
      (eraFilter === "all" || piece.era === eraFilter) &&
      (!composerFilter || piece.composer?.toLowerCase().includes(composerFilter.toLowerCase()))
    )
    .sort((left, right) => {
      const value = (piece: Piece) => piece[sortBy] ?? "";
      return value(left).localeCompare(value(right), undefined, { numeric: true, sensitivity: "base" });
    });

  if (loading) return <main className="dashboard-page" />;
  return (
    <main className="dashboard-page repertoire-page">
      <AppSidebar active="repertoire" />
      <section className="repertoire-content">
        <header className="repertoire-heading">
          <p className="eyebrow"><span className="eyebrow-line" /> Coda</p>
          <h1>{language === "fr" ? "Répertoire" : "Repertoire"}</h1>
          <p>{language === "fr" ? "Les œuvres qui donnent forme à votre pratique." : "The pieces shaping your practice."}</p>
        </header>
        <form className="repertoire-add" onSubmit={addPiece}>
          <div>
            <label htmlFor="piece-title">{language === "fr" ? "Titre" : "Piece title"}</label>
            <input id="piece-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={language === "fr" ? "Ajouter une œuvre" : "Add a piece"} required />
          </div>
          <div>
            <label htmlFor="piece-composer">{language === "fr" ? "Compositeur" : "Composer"}</label>
            <input id="piece-composer" value={composer} onChange={(event) => setComposer(event.target.value)} placeholder={language === "fr" ? "Compositeur" : "Composer"} />
          </div>
          <div>
            <label htmlFor="piece-era">{language === "fr" ? "Époque" : "Era"}</label>
            <input id="piece-era" value={era} onChange={(event) => setEra(event.target.value)} placeholder={language === "fr" ? "Époque" : "Era"} />
          </div>
          <div>
            <label htmlFor="piece-status">{language === "fr" ? "État" : "Status"}</label>
            <select id="piece-status" value={status} onChange={(event) => setStatus(event.target.value as Status)}>
              {Object.entries(labels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
            </select>
          </div>
          <button className="button button-accent" disabled={saving} type="submit">
            <FontAwesomeIcon icon={faPlus} /> {language === "fr" ? "Ajouter" : "Add piece"}
          </button>
        </form>
        <section className="repertoire-controls">
          <label>
            {language === "fr" ? "Trier par" : "Sort by"}
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
              <option value="title">{language === "fr" ? "Alphabétique" : "Alphabetical"}</option>
              <option value="composer">{language === "fr" ? "Compositeur" : "Composer"}</option>
              <option value="era">{language === "fr" ? "Époque" : "Era"}</option>
              <option value="catalog">{language === "fr" ? "Catalogue" : "Catalog"}</option>
            </select>
          </label>
          <label>
            {language === "fr" ? "Filtrer par état" : "Filter status"}
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | Status)}>
              <option value="all">{language === "fr" ? "Tous les états" : "All statuses"}</option>
              {Object.entries(labels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
            </select>
          </label>
          <label>
            {language === "fr" ? "Filtrer par époque" : "Filter era"}
            <select value={eraFilter} onChange={(event) => setEraFilter(event.target.value)}>
              <option value="all">{language === "fr" ? "Toutes les époques" : "All eras"}</option>
              {eras.map((era) => <option key={era} value={era}>{era}</option>)}
            </select>
          </label>
          <label>
            {language === "fr" ? "Filtrer par compositeur" : "Filter composer"}
            <input value={composerFilter} onChange={(event) => setComposerFilter(event.target.value)} placeholder={language === "fr" ? "Rechercher un compositeur" : "Search composer"} />
          </label>
        </section>
        <section className="repertoire-list">
          {visiblePieces.length ? visiblePieces.map((piece) => (
            <article className="repertoire-piece" key={piece.id}>
              {editingId === piece.id ? (
                <div className="repertoire-edit-form">
                <input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} aria-label={language === "fr" ? "Titre" : "Piece title"} />
                <input value={draft.composer} onChange={(event) => updateDraft("composer", event.target.value)} aria-label={language === "fr" ? "Compositeur" : "Composer"} />
                <input value={draft.catalog} onChange={(event) => updateDraft("catalog", event.target.value)} aria-label={language === "fr" ? "Catalogue" : "Catalog"} />
                <input value={draft.era} onChange={(event) => updateDraft("era", event.target.value)} aria-label={language === "fr" ? "Époque" : "Era"} />
                <div>
                  <button className="button button-accent" type="button" onClick={() => saveEdit(piece.id)} disabled={saving}>{language === "fr" ? "Enregistrer" : "Save"}</button>
                  <button className="repertoire-cancel" type="button" onClick={() => setEditingId(null)}>{language === "fr" ? "Annuler" : "Cancel"}</button>
                </div>
              </div>
              ) : (
                <>
                  <div>
                    <p className="repertoire-status">{labels[piece.status]}</p>
                    <div className="repertoire-badge">
                      <strong>{piece.title}</strong>
                      <span><b>{language === "fr" ? "Compositeur" : "Composer"}</b>{piece.composer || "—"}</span>
                      <span><b>{language === "fr" ? "Catalogue" : "Catalog"}</b>{piece.catalog || "—"}</span>
                      <span><b>{language === "fr" ? "Époque" : "Era"}</b>{piece.era || "—"}</span>
                    </div>
                    {piece.source_url && <a className="repertoire-source" href={piece.source_url} target="_blank" rel="noreferrer">MusicBrainz details ↗</a>}
                  </div>
                  <div className="repertoire-piece-actions">
                    <button type="button" onClick={() => beginEdit(piece)} aria-label={`${language === "fr" ? "Modifier" : "Edit"} ${piece.title}`} title={language === "fr" ? "Modifier" : "Edit"}><FontAwesomeIcon icon={faPen} /></button>
                    <button type="button" onClick={() => removePiece(piece.id)} aria-label={`${language === "fr" ? "Supprimer" : "Remove"} ${piece.title}`} title={language === "fr" ? "Supprimer" : "Remove"}><FontAwesomeIcon icon={faTrash} /></button>
                  </div>
                </>
              )}
            </article>
          )) : (
            <div className="repertoire-empty">
              <p>{pieces.length ? (language === "fr" ? "Aucune œuvre ne correspond à ces filtres." : "No pieces match these filters.") : (language === "fr" ? "Votre répertoire est vide." : "Your repertoire is empty.")}</p>
              <span>{pieces.length ? (language === "fr" ? "Essayez un autre filtre." : "Try a different filter.") : (language === "fr" ? "Ajoutez une œuvre pour commencer." : "Add a piece to begin.")}</span>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}