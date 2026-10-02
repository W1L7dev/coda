alter table public.journal_entries
  add column if not exists entry_date date not null default current_date,
  add column if not exists piece_id uuid references public.repertoire(id) on delete set null,
  add column if not exists piece_title text,
  add column if not exists composer text,
  add column if not exists work_items jsonb not null default '[]'::jsonb,
  add column if not exists notes text,
  add column if not exists rating integer check (rating between 1 and 5);
