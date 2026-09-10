create table if not exists public.repertoire (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  composer text,
  status text not null default 'want_to_learn' check (status in ('want_to_learn', 'learning', 'polished')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.repertoire enable row level security;

create policy "Users can view their repertoire" on public.repertoire for select using (auth.uid() = user_id);
create policy "Users can add to their repertoire" on public.repertoire for insert with check (auth.uid() = user_id);
create policy "Users can update their repertoire" on public.repertoire for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete from their repertoire" on public.repertoire for delete using (auth.uid() = user_id);