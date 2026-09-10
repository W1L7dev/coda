create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  session_date date not null,
  start_time time not null,
  duration_minutes integer not null default 30 check (duration_minutes > 0 and duration_minutes <= 480),
  end_time time,
  session_type text not null default 'practice' check (session_type in ('practice', 'lesson')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.practice_sessions enable row level security;
create policy "Users can view their practice sessions" on public.practice_sessions for select using (auth.uid() = user_id);
create policy "Users can add their practice sessions" on public.practice_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update their practice sessions" on public.practice_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their practice sessions" on public.practice_sessions for delete using (auth.uid() = user_id);