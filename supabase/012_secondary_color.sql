alter table public.profiles
  add column if not exists secondary_color text not null default '#159a91';