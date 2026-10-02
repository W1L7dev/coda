create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled entry',
  content text not null,
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;

create policy "Users can view their own journal entries"
  on public.journal_entries for select using (auth.uid() = user_id);
create policy "Users can create their own journal entries"
  on public.journal_entries for insert with check (auth.uid() = user_id);
create policy "Users can update their own journal entries"
  on public.journal_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own journal entries"
  on public.journal_entries for delete using (auth.uid() = user_id);