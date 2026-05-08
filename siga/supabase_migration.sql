-- ============================================================
-- SIGA — Migração Multi-usuário
-- Cole e execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela de perfis
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'servidor' check (role in ('admin','chefe','servidor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Trigger: cria profile automaticamente ao criar usuário no Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Adicionar owner_id na tabela processes
alter table public.processes
  add column if not exists owner_id uuid references public.profiles(id);

-- 4. Compartilhamento de processos
create table if not exists public.process_shares (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  shared_with_user_id uuid not null references public.profiles(id) on delete cascade,
  shared_by_user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(process_id, shared_with_user_id)
);

-- 5. Comunicados
create table if not exists public.comunicados (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Folgas
create table if not exists public.folgas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  registered_by uuid not null references public.profiles(id),
  date date not null,
  description text,
  created_at timestamptz not null default now()
);

-- 7. Notificações
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  related_id uuid,
  related_type text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

-- profiles: todos autenticados leem; owner edita próprio; admin edita qualquer
alter table public.profiles enable row level security;
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- processes: servidor vê os próprios + shared; chefe/admin veem tudo
alter table public.processes enable row level security;
drop policy if exists "processes_select" on public.processes;
create policy "processes_select" on public.processes for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','chefe'))
  or owner_id = auth.uid()
  or exists (select 1 from public.process_shares ps where ps.process_id = id and ps.shared_with_user_id = auth.uid())
);
drop policy if exists "processes_insert" on public.processes;
create policy "processes_insert" on public.processes for insert to authenticated with check (true);
drop policy if exists "processes_update" on public.processes;
create policy "processes_update" on public.processes for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','chefe'))
  or owner_id = auth.uid()
  or exists (select 1 from public.process_shares ps where ps.process_id = id and ps.shared_with_user_id = auth.uid())
);
drop policy if exists "processes_delete" on public.processes;
create policy "processes_delete" on public.processes for delete to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','chefe'))
  or owner_id = auth.uid()
);

-- steps: segue as regras do processo pai
alter table public.steps enable row level security;
drop policy if exists "steps_select" on public.steps;
create policy "steps_select" on public.steps for select to authenticated using (
  exists (
    select 1 from public.processes pr
    where pr.id = process_id
    and (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','chefe'))
      or pr.owner_id = auth.uid()
      or exists (select 1 from public.process_shares ps where ps.process_id = pr.id and ps.shared_with_user_id = auth.uid())
    )
  )
);
drop policy if exists "steps_insert" on public.steps;
create policy "steps_insert" on public.steps for insert to authenticated with check (true);
drop policy if exists "steps_update" on public.steps;
create policy "steps_update" on public.steps for update to authenticated using (true);
drop policy if exists "steps_delete" on public.steps;
create policy "steps_delete" on public.steps for delete to authenticated using (true);

-- process_shares
alter table public.process_shares enable row level security;
drop policy if exists "process_shares_select" on public.process_shares;
create policy "process_shares_select" on public.process_shares for select to authenticated using (
  shared_with_user_id = auth.uid()
  or shared_by_user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','chefe'))
);
drop policy if exists "process_shares_insert" on public.process_shares;
create policy "process_shares_insert" on public.process_shares for insert to authenticated with check (true);
drop policy if exists "process_shares_delete" on public.process_shares;
create policy "process_shares_delete" on public.process_shares for delete to authenticated using (
  shared_by_user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','chefe'))
);

-- comunicados: todos leem; chefe/admin escrevem
alter table public.comunicados enable row level security;
drop policy if exists "comunicados_select" on public.comunicados;
create policy "comunicados_select" on public.comunicados for select to authenticated using (true);
drop policy if exists "comunicados_insert" on public.comunicados;
create policy "comunicados_insert" on public.comunicados for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','chefe')));
drop policy if exists "comunicados_update" on public.comunicados;
create policy "comunicados_update" on public.comunicados for update to authenticated
  using (author_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "comunicados_delete" on public.comunicados;
create policy "comunicados_delete" on public.comunicados for delete to authenticated
  using (author_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- folgas: todos leem; chefe/admin escrevem
alter table public.folgas enable row level security;
drop policy if exists "folgas_select" on public.folgas;
create policy "folgas_select" on public.folgas for select to authenticated using (true);
drop policy if exists "folgas_insert" on public.folgas;
create policy "folgas_insert" on public.folgas for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','chefe')));
drop policy if exists "folgas_delete" on public.folgas;
create policy "folgas_delete" on public.folgas for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','chefe')));

-- notifications: cada um vê só as suas
alter table public.notifications enable row level security;
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications for insert to authenticated with check (true);
drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications for update to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- Habilitar Realtime nas notificações
-- ============================================================
-- Execute também no Supabase Dashboard → Database → Replication
-- e adicione a tabela 'notifications' à lista de tabelas com realtime ativo.
-- Ou rode:
-- alter publication supabase_realtime add table public.notifications;
