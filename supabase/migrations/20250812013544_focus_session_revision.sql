-- 0002_focus_sessions_revision.sql
-- 목적:
-- 1) 세션은 시작 시점에 종료 예정 시각(scheduled_end_at)이 반드시 있어야 함 (NULL 금지)
-- 2) 세션 ↔ 태스크 다대다 관계(session_tasks) 도입
-- 3) 기존 텍스트 컬럼 정리, 중복 인덱스/트리거 정리
-- 4) RLS: session_tasks에 소유자 기반 정책 추가

begin;

-- 1) focus_sessions: ended_at -> closed_at, scheduled_end_at 추가 (NOT NULL)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='focus_sessions' and column_name='ended_at'
  ) then
    execute 'alter table public.focus_sessions rename column ended_at to closed_at';
  end if;
end $$;

alter table public.focus_sessions
  add column if not exists scheduled_end_at timestamptz not null
    default (now() + interval '50 minutes');

-- 2) 시간 무결성 제약 갱신
alter table public.focus_sessions
  drop constraint if exists chk_fs_time_ordering;

alter table public.focus_sessions
  add constraint chk_fs_time_ordering
  check (
    scheduled_end_at > started_at
    and (closed_at is null or closed_at >= started_at)
  );

-- 3) “동시에 한 세션만” (닫히지 않은 세션 1개) 보장
drop index if exists uq_fs_one_active_per_owner;
create unique index uq_fs_one_open_per_owner
  on public.focus_sessions(owner_id)
  where closed_at is null;

-- 4) 과한 텍스트 컬럼 제거 (회고는 별 테이블로 관리 예정)
alter table public.focus_sessions
  drop column if exists intensity_note,
  drop column if exists progress_note;

-- 5) focus_sessions.task_id 의존 제거 준비: 백필용 다대다 테이블 생성
create table if not exists public.session_tasks (
  session_id   uuid not null references public.focus_sessions(id) on delete cascade,
  task_id      uuid not null references public.tasks(id)          on delete cascade,
  order_index  int null,
  seconds_spent int not null default 0 check (seconds_spent >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint pk_session_tasks primary key (session_id, task_id),
  constraint uq_session_tasks_order unique (session_id, order_index)
);

-- updated_at 트리거
drop trigger if exists trg_session_tasks_updated on public.session_tasks;
create trigger trg_session_tasks_updated
  before update on public.session_tasks
  for each row execute function public.set_updated_at();

-- 6) 기존 focus_sessions.task_id → session_tasks 로 백필
insert into public.session_tasks (session_id, task_id, order_index)
select fs.id, fs.task_id, 1
from public.focus_sessions fs
where fs.task_id is not null
on conflict do nothing;

-- 7) task_id 관련 인덱스/트리거/함수 정리 후 컬럼 드롭
drop index if exists idx_fs_task;

drop trigger if exists trg_fs_project_from_task on public.focus_sessions;
drop function if exists public.set_session_project_from_task();

alter table public.focus_sessions
  drop column if exists task_id;

-- 8) 조회/분석 인덱스 보강
create index if not exists idx_fs_owner_started_at
  on public.focus_sessions(owner_id, started_at desc);

create index if not exists idx_fs_owner_sched_end
  on public.focus_sessions(owner_id, scheduled_end_at desc);

-- 9) RLS: session_tasks에 소유자 기반 정책 추가
alter table public.session_tasks enable row level security;

drop policy if exists st_select_owner on public.session_tasks;
drop policy if exists st_insert_owner on public.session_tasks;
drop policy if exists st_update_owner on public.session_tasks;
drop policy if exists st_delete_owner on public.session_tasks;

create policy st_select_owner
  on public.session_tasks for select
  using (
    exists (
      select 1 from public.focus_sessions fs
      where fs.id = session_id and fs.owner_id = auth.uid()
    )
  );

create policy st_insert_owner
  on public.session_tasks for insert
  with check (
    exists (
      select 1 from public.focus_sessions fs
      where fs.id = session_id and fs.owner_id = auth.uid()
    )
  );

create policy st_update_owner
  on public.session_tasks for update
  using (
    exists (
      select 1 from public.focus_sessions fs
      where fs.id = session_id and fs.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.focus_sessions fs
      where fs.id = session_id and fs.owner_id = auth.uid()
    )
  );

create policy st_delete_owner
  on public.session_tasks for delete
  using (
    exists (
      select 1 from public.focus_sessions fs
      where fs.id = session_id and fs.owner_id = auth.uid()
    )
  );

commit;
