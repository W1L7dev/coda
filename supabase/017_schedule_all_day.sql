alter table public.practice_sessions
  add column if not exists throughout_day boolean not null default false,
  add column if not exists estimated_minutes integer;

alter table public.practice_sessions
  add constraint practice_sessions_estimated_minutes_check
  check (estimated_minutes is null or (estimated_minutes > 0 and estimated_minutes <= 1440));