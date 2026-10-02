create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  subject text not null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.inbox_messages enable row level security;
create policy "Users can view their own inbox messages" on public.inbox_messages for select using (auth.uid() = user_id);
create policy "Users can create their own inbox messages" on public.inbox_messages for insert with check (auth.uid() = user_id);
create policy "Users can update their own inbox messages" on public.inbox_messages for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own inbox messages" on public.inbox_messages for delete using (auth.uid() = user_id);

insert into public.inbox_messages (user_id, sender_name, subject, content)
select id, 'Coda developers', 'Coda 1.0 is here', 'This new version adds a structured journal, all-day practice scheduling with estimated duration, a community feed, secondary colors, a rebuilt dashboard, and updated help.'
from auth.users
where not exists (
  select 1 from public.inbox_messages
  where inbox_messages.user_id = auth.users.id
    and inbox_messages.subject = 'Coda 1.0 is here'
);
