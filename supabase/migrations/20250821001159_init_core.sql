begin;

-- updated_at 자동 업데이트를 위한 함수를 생성한다
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- projects 테이블을 생성한다
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- projects 테이블에 대한 인덱스를 생성한다
create index idx_projects_owner_id on public.projects(owner_id);
create index idx_projects_owner_id_active on public.projects(owner_id, active);

-- updated_at 자동 업데이트 트리거를 생성한다
create trigger update_projects_updated_at before update on public.projects
  for each row execute function update_updated_at_column();

-- projects 테이블에 대한 RLS를 활성화한다
alter table public.projects enable row level security;

-- projects 테이블에 대한 RLS 정책을 생성한다
-- SELECT: 사용자는 자신의 프로젝트만 조회할 수 있다
create policy "사용자는 자신의 프로젝트를 조회할 수 있다" on public.projects
  for select using (auth.uid() = owner_id);

-- INSERT: 사용자는 자신을 owner로 하는 프로젝트만 생성할 수 있다
create policy "사용자는 자신의 프로젝트를 생성할 수 있다" on public.projects
  for insert with check (auth.uid() = owner_id);

-- UPDATE: 사용자는 자신의 프로젝트만 수정할 수 있다
create policy "사용자는 자신의 프로젝트를 수정할 수 있다" on public.projects
  for update using (auth.uid() = owner_id);

-- DELETE: 사용자는 자신의 프로젝트만 삭제할 수 있다
create policy "사용자는 자신의 프로젝트를 삭제할 수 있다" on public.projects
  for delete using (auth.uid() = owner_id);

-- end_at이 제공되지 않으면 start_at + 50분으로 설정하는 함수를 생성한다
create or replace function set_default_end_at()
returns trigger as $$
begin
    if new.end_at is null then
        new.end_at = new.start_at + interval '50 minutes';
    end if;
    return new;
end;
$$ language plpgsql;

-- 동시에 여러 활성 세션을 가질 수 없도록 검증하는 함수를 생성한다
create or replace function check_no_overlapping_sessions()
returns trigger as $$
begin
    if exists (
        select 1 from public.focus_sessions
        where owner_id = new.owner_id
        and id != coalesce(new.id, gen_random_uuid())
        and (new.start_at, new.end_at) overlaps (start_at, end_at)
    ) then
        raise exception '이미 해당 시간에 다른 세션이 존재합니다';
    end if;
    return new;
end;
$$ language plpgsql;

-- focus_sessions 테이블을 생성한다
create table if not exists public.focus_sessions (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_end_after_start check (end_at > start_at)
);

-- focus_sessions 테이블에 대한 인덱스를 생성한다
create index idx_focus_sessions_owner_id on public.focus_sessions(owner_id);
create index idx_focus_sessions_start_end on public.focus_sessions(start_at, end_at);

-- 트리거를 생성한다
create trigger set_focus_session_end_at before insert on public.focus_sessions
  for each row execute function set_default_end_at();

create trigger check_focus_session_overlap before insert or update on public.focus_sessions
  for each row execute function check_no_overlapping_sessions();

create trigger update_focus_sessions_updated_at before update on public.focus_sessions
  for each row execute function update_updated_at_column();

-- focus_sessions 테이블에 대한 RLS를 활성화한다
alter table public.focus_sessions enable row level security;

-- focus_sessions 테이블에 대한 RLS 정책을 생성한다
create policy "사용자는 자신의 세션을 조회할 수 있다" on public.focus_sessions
  for select using (auth.uid() = owner_id);

create policy "사용자는 자신의 세션을 생성할 수 있다" on public.focus_sessions
  for insert with check (auth.uid() = owner_id);

create policy "사용자는 자신의 세션을 수정할 수 있다" on public.focus_sessions
  for update using (auth.uid() = owner_id);

create policy "사용자는 자신의 세션을 삭제할 수 있다" on public.focus_sessions
  for delete using (auth.uid() = owner_id);

-- task_status enum을 생성한다
create type task_status as enum ('backlog', 'blocked', 'completed');

-- 태스크가 특정 세션에 속해있는지 확인하는 함수를 생성한다
create or replace function check_task_completed_in_session()
returns trigger as $$
begin
    -- completed_in_session_id가 설정되려면
    if new.completed_in_session_id is not null then
        -- 해당 session_tasks 레코드가 존재해야 함
        if not exists (
            select 1 from public.session_tasks
            where session_id = new.completed_in_session_id
            and task_id = new.id
        ) then
            raise exception '태스크가 해당 세션에 추가되지 않았습니다';
        end if;

        -- status가 completed여야 함
        if new.status != 'completed' then
            raise exception 'completed_in_session_id가 있으면 status는 completed여야 합니다';
        end if;
    end if;

    -- status가 completed면 completed_in_session_id가 있어야 함
    if new.status = 'completed' and new.completed_in_session_id is null then
        raise exception '태스크는 세션 내에서만 완료할 수 있습니다';
    end if;

    -- completed에서 다른 상태로 변경 시 backlog만 허용
    if old.status = 'completed' and new.status != 'completed' and new.status != 'backlog' then
        raise exception '완료된 태스크는 backlog로만 되돌릴 수 있습니다';
    end if;

    -- completed → backlog 전환 시 completed_in_session_id를 NULL로
    if old.status = 'completed' and new.status = 'backlog' then
        new.completed_in_session_id = null;
    end if;

    return new;
end;
$$ language plpgsql;

-- tasks 테이블을 생성한다
create table if not exists public.tasks (
  id                       uuid primary key default gen_random_uuid(),
  owner_id                 uuid not null references auth.users(id) on delete cascade,
  project_id               uuid references public.projects(id) on delete set null,
  title                    text not null,
  description              text,
  status                   task_status not null default 'backlog',
  memo                     text,
  planned_for              date,
  completed_in_session_id  uuid references public.focus_sessions(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- tasks 테이블에 대한 인덱스를 생성한다
create index idx_tasks_owner_id on public.tasks(owner_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_planned_for on public.tasks(planned_for);
create index idx_tasks_project_id on public.tasks(project_id);

-- 오늘 할 일 조회 최적화
create index idx_tasks_today on public.tasks(owner_id, planned_for)
where status = 'backlog';

-- 수집함 조회 최적화
create index idx_tasks_inbox on public.tasks(owner_id, status)
where project_id is null;

-- 트리거를 생성한다
create trigger check_task_completed_constraints before insert or update on public.tasks
  for each row execute function check_task_completed_in_session();

create trigger update_tasks_updated_at before update on public.tasks
  for each row execute function update_updated_at_column();

-- tasks 테이블에 대한 RLS를 활성화한다
alter table public.tasks enable row level security;

-- tasks 테이블에 대한 RLS 정책을 생성한다
create policy "사용자는 자신의 태스크를 조회할 수 있다" on public.tasks
  for select using (auth.uid() = owner_id);

create policy "사용자는 자신의 태스크를 생성할 수 있다" on public.tasks
  for insert with check (auth.uid() = owner_id);

create policy "사용자는 자신의 태스크를 수정할 수 있다" on public.tasks
  for update using (auth.uid() = owner_id);

create policy "사용자는 자신의 태스크를 삭제할 수 있다" on public.tasks
  for delete using (auth.uid() = owner_id);

-- 세션이 종료된 후에는 session_tasks를 수정할 수 없도록 하는 함수를 생성한다
create or replace function check_session_not_ended()
returns trigger as $$
begin
    if exists (
        select 1 from public.focus_sessions
        where id = coalesce(new.session_id, old.session_id)
        and end_at < now()
    ) then
        raise exception '종료된 세션은 수정할 수 없습니다';
    end if;
    return new;
end;
$$ language plpgsql;

-- backlog 상태의 태스크만 세션에 추가할 수 있도록 하는 함수를 생성한다
create or replace function check_task_is_backlog()
returns trigger as $$
begin
    if not exists (
        select 1 from public.tasks
        where id = new.task_id
        and status = 'backlog'
    ) then
        raise exception 'backlog 상태의 태스크만 세션에 추가할 수 있습니다';
    end if;
    return new;
end;
$$ language plpgsql;

-- session_tasks 테이블을 생성한다
create table if not exists public.session_tasks (
  session_id uuid not null references public.focus_sessions(id) on delete cascade,
  task_id    uuid not null references public.tasks(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (session_id, task_id)
);

-- session_tasks 테이블에 대한 인덱스를 생성한다
create index idx_session_tasks_session_id on public.session_tasks(session_id);
create index idx_session_tasks_task_id on public.session_tasks(task_id);

-- 트리거를 생성한다
create trigger check_session_not_ended_on_insert before insert on public.session_tasks
  for each row execute function check_session_not_ended();

create trigger check_session_not_ended_on_update before update on public.session_tasks
  for each row execute function check_session_not_ended();

create trigger check_session_not_ended_on_delete before delete on public.session_tasks
  for each row execute function check_session_not_ended();

create trigger check_task_backlog_on_insert before insert on public.session_tasks
  for each row execute function check_task_is_backlog();

-- session_tasks 테이블에 대한 RLS를 활성화한다
alter table public.session_tasks enable row level security;

-- session_tasks 테이블에 대한 RLS 정책을 생성한다
create policy "사용자는 자신의 세션의 태스크를 조회할 수 있다" on public.session_tasks
  for select using (
    exists (
      select 1 from public.focus_sessions
      where id = session_tasks.session_id
      and owner_id = auth.uid()
    )
  );

create policy "사용자는 자신의 세션에 태스크를 추가할 수 있다" on public.session_tasks
  for insert with check (
    exists (
      select 1 from public.focus_sessions
      where id = session_tasks.session_id
      and owner_id = auth.uid()
    )
  );

create policy "사용자는 자신의 세션의 태스크를 수정할 수 있다" on public.session_tasks
  for update using (
    exists (
      select 1 from public.focus_sessions
      where id = session_tasks.session_id
      and owner_id = auth.uid()
    )
  );

create policy "사용자는 자신의 세션에서 태스크를 제거할 수 있다" on public.session_tasks
  for delete using (
    exists (
      select 1 from public.focus_sessions
      where id = session_tasks.session_id
      and owner_id = auth.uid()
    )
  );

-- user_profiles 테이블을 생성한다
create table if not exists public.user_profiles (
  id   uuid primary key references auth.users(id) on delete cascade,
  name text not null
);

-- user_profiles 테이블에 대한 RLS를 활성화한다
alter table public.user_profiles enable row level security;

-- user_profiles 테이블에 대한 RLS 정책을 생성한다
create policy "사용자는 자신의 프로필을 조회할 수 있다" on public.user_profiles
  for select using (auth.uid() = id);

create policy "사용자는 자신의 프로필을 생성할 수 있다" on public.user_profiles
  for insert with check (auth.uid() = id);

create policy "사용자는 자신의 프로필을 수정할 수 있다" on public.user_profiles
  for update using (auth.uid() = id);

create policy "사용자는 자신의 프로필을 삭제할 수 있다" on public.user_profiles
  for delete using (auth.uid() = id);



-- 수집함 뷰를 생성한다 (project_id가 null인 태스크들)
create or replace view inbox_tasks as
select
  t.*,
  case
    when t.planned_for is not null then true
    else false
  end as is_planned,
  case
    when exists (
      select 1
      from session_tasks st
      join focus_sessions fs on st.session_id = fs.id
      where st.task_id = t.id
        and now() between fs.start_at and fs.end_at
    ) then true
    else false
  end as is_in_session
from tasks t
where t.project_id is null;

-- 수집함 뷰에 대한 권한을 부여한다
grant select on inbox_tasks to authenticated;

end;
