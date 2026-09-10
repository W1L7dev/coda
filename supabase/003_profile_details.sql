alter table public.profiles
  add column if not exists pronouns text,
  add column if not exists bio varchar(100);
