-- 0001_init_core.sql

begin;

-- 확장: gen_random_uuid()
create extension if not exists "pgcrypto";

-- 공통: updated_at 자동 갱신
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- 태스크 상태 enum (idempotent)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum ('backlog','planned','in_session','blocked','completed');
  end if;
end $$;

-- projects
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_projects_owner on public.projects(owner_id);

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

-- tasks (project_id = NULL => 수집함)
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id   uuid null references public.projects (id) on delete cascade,
  title        text not null,
  description  text,
  status       public.task_status not null default 'backlog',
  planned_for  date,
  blocked_note text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_tasks_owner           on public.tasks(owner_id);
create index if not exists idx_tasks_project         on public.tasks(project_id);
create index if not exists idx_tasks_status_project  on public.tasks(status, project_id);
create index if not exists idx_tasks_inbox_partial   on public.tasks(owner_id) where project_id is null;

drop trigger if exists trg_tasks_updated on public.tasks;
create trigger trg_tasks_updated
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- focus_sessions
create table if not exists public.focus_sessions (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id        uuid null references public.tasks (id) on delete set null,
  project_id     uuid null references public.projects (id) on delete set null,
  started_at     timestamptz not null,
  ended_at       timestamptz,
  intensity_note text,
  progress_note  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint chk_fs_time_ordering check (ended_at is null or ended_at >= started_at)
);

create index if not exists idx_fs_owner   on public.focus_sessions(owner_id);
create index if not exists idx_fs_task    on public.focus_sessions(task_id);
create index if not exists idx_fs_project on public.focus_sessions(project_id);

drop trigger if exists trg_fs_updated on public.focus_sessions;
create trigger trg_fs_updated
  before update on public.focus_sessions
  for each row execute function public.set_updated_at();

-- (옵션) task_id가 있는데 project_id가 비었으면 task.project_id 상속
create or replace function public.set_session_project_from_task()
returns trigger language plpgsql as $$
begin
  if new.task_id is not null and new.project_id is null then
    select t.project_id into new.project_id from public.tasks t where t.id = new.task_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_fs_project_from_task on public.focus_sessions;
create trigger trg_fs_project_from_task
  before insert or update on public.focus_sessions
  for each row execute function public.set_session_project_from_task();

-- =========================
-- RLS (Supabase 권장: 테이블당 소유자 기반)
-- =========================

alter table public.projects       enable row level security;
alter table public.tasks          enable row level security;
alter table public.focus_sessions enable row level security;

-- projects policies
drop policy if exists projects_select_owner on public.projects;
drop policy if exists projects_insert_owner on public.projects;
drop policy if exists projects_update_owner on public.projects;
drop policy if exists projects_delete_owner on public.projects;

create policy projects_select_owner
  on public.projects for select
  using (owner_id = auth.uid());

create policy projects_insert_owner
  on public.projects for insert
  with check (owner_id = auth.uid());

create policy projects_update_owner
  on public.projects for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy projects_delete_owner
  on public.projects for delete
  using (owner_id = auth.uid());

-- tasks policies
drop policy if exists tasks_select_owner on public.tasks;
drop policy if exists tasks_insert_owner on public.tasks;
drop policy if exists tasks_update_owner on public.tasks;
drop policy if exists tasks_delete_owner on public.tasks;

create policy tasks_select_owner
  on public.tasks for select
  using (owner_id = auth.uid());

create policy tasks_insert_owner
  on public.tasks for insert
  with check (owner_id = auth.uid());

create policy tasks_update_owner
  on public.tasks for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy tasks_delete_owner
  on public.tasks for delete
  using (owner_id = auth.uid());

-- focus_sessions policies
drop policy if exists fs_select_owner on public.focus_sessions;
drop policy if exists fs_insert_owner on public.focus_sessions;
drop policy if exists fs_update_owner on public.focus_sessions;
drop policy if exists fs_delete_owner on public.focus_sessions;

create policy fs_select_owner
  on public.focus_sessions for select
  using (owner_id = auth.uid());

create policy fs_insert_owner
  on public.focus_sessions for insert
  with check (owner_id = auth.uid());

create policy fs_update_owner
  on public.focus_sessions for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy fs_delete_owner
  on public.focus_sessions for delete
  using (owner_id = auth.uid());

commit;
