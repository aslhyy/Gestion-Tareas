-- Extensión para UUID
create extension if not exists pgcrypto;

--------------------------------------------------
-- TABLA DE PERFILES
--------------------------------------------------

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    email text not null unique,
    role text not null default 'usuario'
        check (role in ('admin', 'usuario')),
    created_at timestamptz not null default now()
);

-- Migración segura para instalaciones existentes.
alter table public.profiles
add column if not exists role text not null default 'usuario';

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('admin', 'usuario'));

--------------------------------------------------
-- TABLA DE PROYECTOS
--------------------------------------------------

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 3 and 100),
    description text default '',
    owner_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

--------------------------------------------------
-- TABLA DE TAREAS
--------------------------------------------------

create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    title text not null check (char_length(title) between 3 and 120),
    description text default '',
    status text not null default 'pendiente'
        check (status in ('pendiente', 'en_progreso', 'completada')),
    priority text not null default 'media'
        check (priority in ('baja', 'media', 'alta')),
    due_date date,
    project_id uuid not null references public.projects(id) on delete cascade,
    assignee_id uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

--------------------------------------------------
-- ÍNDICES
--------------------------------------------------

create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_assignee on public.tasks(assignee_id);
create index if not exists idx_tasks_status on public.tasks(status);

--------------------------------------------------
-- CREACIÓN AUTOMÁTICA DEL PERFIL
--------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, name, email)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
        new.email
    )
    on conflict (id) do update
    set
        name = excluded.name,
        email = excluded.email;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

--------------------------------------------------
-- SINCRONIZAR USUARIOS EXISTENTES
--------------------------------------------------

insert into public.profiles (id, name, email)
select
    id,
    coalesce(raw_user_meta_data ->> 'name', split_part(email, '@', 1)),
    email
from auth.users
on conflict (id) do update
set
    name = excluded.name,
    email = excluded.email;

--------------------------------------------------
-- ADMINISTRADOR INICIAL
--------------------------------------------------

-- Si todavía no existe un administrador, el perfil más antiguo
-- se convierte en admin. Los usuarios nuevos conservan el rol usuario.
update public.profiles
set role = 'admin'
where id = (
    select id
    from public.profiles
    order by created_at asc
    limit 1
)
and not exists (
    select 1
    from public.profiles
    where role = 'admin'
);

--------------------------------------------------
-- ROW LEVEL SECURITY
--------------------------------------------------

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- SERVICE_ROLE ignora estas políticas. Se mantienen para acceso autenticado.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "projects_all" on public.projects;
create policy "projects_all"
on public.projects
for all
to authenticated
using (true)
with check (true);

drop policy if exists "tasks_all" on public.tasks;
create policy "tasks_all"
on public.tasks
for all
to authenticated
using (true)
with check (true);
