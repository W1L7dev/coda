create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.community_post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.community_posts enable row level security;
alter table public.community_post_likes enable row level security;

create policy "Authenticated users can view community posts" on public.community_posts for select using (auth.uid() is not null);
create policy "Users can create their own community posts" on public.community_posts for insert with check (auth.uid() = user_id);
create policy "Users can delete their own community posts" on public.community_posts for delete using (auth.uid() = user_id);
create policy "Authenticated users can view community likes" on public.community_post_likes for select using (auth.uid() is not null);
create policy "Users can like community posts" on public.community_post_likes for insert with check (auth.uid() = user_id);
create policy "Users can remove their own likes" on public.community_post_likes for delete using (auth.uid() = user_id);
