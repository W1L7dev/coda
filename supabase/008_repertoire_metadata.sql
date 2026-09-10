alter table public.repertoire
  add column if not exists musicbrainz_id text,
  add column if not exists duration_ms integer,
  add column if not exists release_year integer,
  add column if not exists source_url text;
