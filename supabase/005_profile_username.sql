alter table public.profiles
  add column if not exists username text;

update public.profiles profiles
set username = lower(regexp_replace(split_part(users.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'))
from auth.users users
where profiles.id = users.id
  and profiles.username is null
  and users.email is not null;

create unique index if not exists profiles_username_idx
  on public.profiles (username)
  where username is not null;

drop policy if exists "Profiles are publicly viewable" on public.profiles;
create policy "Profiles are publicly viewable"
  on public.profiles for select
  using (true);