alter table public.profiles
  add column if not exists accent_color text not null default '#8b3dce',
  add column if not exists theme text not null default 'system' check (theme in ('light', 'system', 'dark')),
  add column if not exists instrument text,
  add column if not exists practice_hours numeric(4, 1),
  add column if not exists target_practice_hours numeric(4, 1),
  add column if not exists favorite_composers text,
  add column if not exists experience_level text,
  add column if not exists primary_goal text,
  add column if not exists practice_days text[] not null default '{}';
