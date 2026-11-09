-- Supabase SQL Editor 里整段执行
create table if not exists state (
  id int primary key check (id = 1),
  doc jsonb not null,
  updated_at timestamptz not null default now()
);
insert into state (id, doc) values (1, '{}'::jsonb) on conflict do nothing;

-- 行级安全：任何人可读；写仅 service_role（anon key 读、支委拿 service key 写）
alter table state enable row level security;
create policy "public read" on state for select using (true);
create policy "service write" on state for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;
drop trigger if exists t_state_touch on state;
create trigger t_state_touch before update on state
  for each row execute function touch_updated_at();
