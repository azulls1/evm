-- ════════════════════════════════════════════════════════════════════════════
-- ValorGanado · seguridad. Idempotente; toda migración que cree tablas debe terminar reaplicando este archivo
-- (los privilegios por defecto del esquema public de Supabase abren las tablas nuevas a anon/authenticated).
-- 1) Rol propio de la aplicación (la contraseña se pasa con -v app_password=…)
-- 2) anon/authenticated no leen nada: se revocan tablas y secuencias, RLS forzado en todas.
-- 3) Una sola política, para valorganado_app.
-- Uso: psql -v app_password="'…'" -f 002_seguridad.sql
-- ════════════════════════════════════════════════════════════════════════════
begin;

do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'valorganado_app') then
        create role valorganado_app login;
    end if;
end $$;
alter role valorganado_app with login password :app_password;
alter role valorganado_app set search_path = public;
grant usage on schema public to valorganado_app;

do $$
declare
    t text;
    s text;
begin
    for t in select tablename from pg_tables where schemaname = 'public' and tablename like 'ValorGanado\_%' loop
        execute format('revoke all on public.%I from anon, authenticated', t);
        execute format('alter table public.%I enable row level security', t);
        execute format('alter table public.%I force row level security', t);
        execute format('grant select, insert, update, delete on public.%I to valorganado_app', t);
        execute format('drop policy if exists "ValorGanado_app_todo" on public.%I', t);
        execute format('create policy "ValorGanado_app_todo" on public.%I for all to valorganado_app using (true) with check (true)', t);
    end loop;
    for s in select sequencename from pg_sequences where schemaname = 'public' and sequencename like 'ValorGanado\_%' loop
        execute format('revoke all on sequence public.%I from anon, authenticated', s);
        execute format('grant usage, select on sequence public.%I to valorganado_app', s);
    end loop;
end $$;

commit;
