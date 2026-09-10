alter table public.repertoire
  add column if not exists catalog text,
  add column if not exists era text;
