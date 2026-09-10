alter table public.practice_sessions
  add column if not exists end_time time,
  add column if not exists session_type text not null default 'practice';

update public.practice_sessions
set end_time = start_time + make_interval(mins => duration_minutes)
where end_time is null;

alter table public.practice_sessions
  drop constraint if exists practice_sessions_session_type_check,
  add constraint practice_sessions_session_type_check check (session_type in ('practice', 'lesson'));