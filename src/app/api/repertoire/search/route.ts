import { NextResponse } from "next/server";

const extractCatalog = (title: string) => title.match(/\b(?:BWV|K|KV|Op\.?|S\.?|Hob\.?|D\.?|WoO)\s*\.?\s*\d+[a-zA-Z-]*/i)?.[0] ?? null;
const inferEra = (composer: string) => { const name = composer.toLowerCase(); if (/bach|handel|vivaldi|scarlatti|telemann/.test(name)) return "Baroque"; if (/haydn|mozart|gluck|clementi/.test(name)) return "Classical"; if (/beethoven|schubert|chopin|schumann|liszt|brahms|wagner|verdi|tchaikovsky|dvorak|mahler/.test(name)) return "Romantic"; if (/debussy|ravel|stravinsky|schoenberg|bartok|prokofiev|shostakovich/.test(name)) return "Modern"; return null; };
const openOpusSearch = async (title: string, composer: string) => { const composerResponse = await fetch(`https://api.openopus.org/dyn/composer/list.phtml?${new URLSearchParams({ search: composer })}`, { next: { revalidate: 3600 } }); if (!composerResponse.ok) return []; const composerData = await composerResponse.json() as { composers?: Array<{ id: string; complete_name: string; epoch: string }> }; const match = composerData.composers?.[0]; if (!match) return []; const workResponse = await fetch(`https://api.openopus.org/dyn/work/list.phtml?${new URLSearchParams({ composer: match.id, search: title })}`, { next: { revalidate: 3600 } }); if (!workResponse.ok) return []; const workData = await workResponse.json() as { works?: Array<{ id: string; title: string; genre: string }> }; return (workData.works ?? []).map((work) => ({ id: `openopus:${work.id}`, title: work.title, composer: match.complete_name, catalog: extractCatalog(work.title), era: match.epoch, durationMs: null, year: null, url: `https://openopus.org/work/${work.id}` })); };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const title = params.get("title")?.trim();
  const composer = params.get("composer")?.trim();
  if (!title) return NextResponse.json({ results: [] });

  const query = `recording:"${title.replace(/"/g, "")}"${composer ? ` AND artist:"${composer.replace(/"/g, "")}"` : ""}`;
  const response = await fetch(`https://musicbrainz.org/ws/2/recording/?${new URLSearchParams({ query, fmt: "json", limit: "8", inc: "artist-credits+releases" })}`, { headers: { Accept: "application/json", "User-Agent": "Coda/0.1 (repertoire lookup)" }, next: { revalidate: 3600 } });
  if (!response.ok) return NextResponse.json({ error: "Music search failed." }, { status: 502 });
  const data = await response.json() as { recordings?: Array<{ id: string; title: string; length?: number | null; "artist-credit"?: Array<{ name: string }>; releases?: Array<{ date?: string }> }> };
  const results = (data.recordings ?? []).map((recording) => { const composerName = recording["artist-credit"]?.[0]?.name ?? composer ?? ""; return { id: recording.id, title: recording.title, composer: composerName, catalog: extractCatalog(recording.title), era: inferEra(composerName), durationMs: recording.length ?? null, year: recording.releases?.find((release) => release.date)?.date?.slice(0, 4) ?? null, url: `https://musicbrainz.org/recording/${recording.id}` }; });
  return NextResponse.json({ results: results.length ? results : await openOpusSearch(title, composer ?? "") });
}
