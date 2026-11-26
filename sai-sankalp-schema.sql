-- Apply only after restoring the project. No changes to existing bhajan tables.
create table public.sai_sankalps (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 start_date date not null check(extract(dow from start_date)=4),
 timezone text not null default 'Asia/Kolkata',
 entries jsonb not null default '{}'::jsonb check(jsonb_typeof(entries)='object' and octet_length(entries::text)<100000),
 completed_at timestamptz,
 revision integer not null default 0,
 created_at timestamptz not null default now()
);
create unique index sai_one_active on public.sai_sankalps(user_id) where completed_at is null;
alter table public.sai_sankalps enable row level security;
revoke all on public.sai_sankalps from anon, authenticated;
grant select, insert, update on public.sai_sankalps to authenticated;
create policy sai_read on public.sai_sankalps for select to authenticated using ((select auth.uid())=user_id);
create policy sai_insert on public.sai_sankalps for insert to authenticated with check ((select auth.uid())=user_id);
create policy sai_update on public.sai_sankalps for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create function public.sai_validate_journey() returns trigger language plpgsql security invoker set search_path='' as $$
declare e record; d date; n int:=0; last_entry jsonb;
begin
 if tg_op='UPDATE' then
   if new.user_id<>old.user_id or new.start_date<>old.start_date or new.timezone<>old.timezone or new.id<>old.id then raise exception 'Journey identity cannot change'; end if;
   if old.completed_at is not null then raise exception 'Completed journey is read-only'; end if;
   new.revision:=old.revision+1;
 else new.revision:=0; end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.timezone) then raise exception 'Invalid timezone'; end if;
 if new.start_date>(now() at time zone new.timezone)::date then raise exception 'Start date is in the future'; end if;
 for e in select key,value from pg_catalog.jsonb_each(new.entries) order by key loop
   if e.key !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid date'; end if;
   d:=e.key::date;
   if d<new.start_date or extract(dow from d)<>4 or d>(now() at time zone new.timezone)::date then raise exception 'Invalid Thursday'; end if;
   if jsonb_typeof(e.value)<>'object' then raise exception 'Invalid checklist'; end if;
   if exists(select 1 from pg_catalog.jsonb_each(e.value) x where x.key not in ('skip','puja','temple','fast','sankalp','books','food') or jsonb_typeof(x.value)<>'boolean') then raise exception 'Invalid checklist field'; end if;
   if coalesce((e.value->>'skip')::boolean,false) then
     if e.value - 'skip' <> '{}'::jsonb then raise exception 'Skipped date must have no checklist'; end if;
   elsif coalesce((e.value->>'fast')::boolean,false) and coalesce((e.value->>'puja')::boolean,false) then
     n:=n+1; last_entry:=e.value;
   end if;
 end loop;
 if n>9 then raise exception 'Maximum nine vrats'; end if;
 new.completed_at:=case when n=9 and coalesce((last_entry->>'books')::boolean,false) and coalesce((last_entry->>'food')::boolean,false) then now() else null end;
 return new;
end $$;
create trigger sai_validate before insert or update on public.sai_sankalps for each row execute function public.sai_validate_journey();
create table public.sai_resources(id text primary key, title text not null, url text not null);
alter table public.sai_resources enable row level security;
grant select on public.sai_resources to anon, authenticated;
create policy sai_resources_read on public.sai_resources for select to anon, authenticated using (true);
insert into public.sai_resources values
('puja','Thursday Sai Puja','https://open.spotify.com/playlist/1L4AwNZKi9h6f1LhgWL82S'),
('podcast','Sai Puja podcast','https://open.spotify.com/show/7bok6lkMslhUnMStCSJiLe'),
('katha','साईं बाबा व्रत कथा','https://hindunidhi.com/sai-baba-vrat-katha-hindi/pdf/'),
('books','Vrat Katha books (set of 11)','https://www.amazon.in/dp/B08LQQN7T8');
create table public.sai_katha_sections(id integer primary key, language text not null, title text not null, body text not null, source_url text not null, rights_basis text not null);
alter table public.sai_katha_sections enable row level security;
grant select on public.sai_katha_sections to anon, authenticated;
create policy sai_katha_read on public.sai_katha_sections for select to anon, authenticated using (true);
-- Full Katha not copied: reproduction permission has not been verified.
-- Seed User 0 only after confirming the existing auth account:
-- insert into public.sai_sankalps(user_id,start_date,timezone) select id,'2026-11-26','Asia/Kolkata' from auth.users where lower(email)='neha.hbti.it@gmail.com' on conflict do nothing;
