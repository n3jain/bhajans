-- Sai Sankalp account persistence: additive schema, no changes to existing catalog.
create table public.sai_sankalps (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 start_date date not null check (extract(isodow from start_date)=4),
 timezone text not null default 'Asia/Kolkata',
 revision bigint not null default 0 check (revision>=0),
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 unique(user_id,id)
);
create unique index sai_one_active on public.sai_sankalps(user_id) where completed_at is null;
create table public.sai_vrat_entries (
 journey_id uuid not null,
 user_id uuid not null,
 thursday date not null check (extract(isodow from thursday)=4),
 sankalp boolean not null default false,
 puja boolean not null default false,
 temple boolean not null default false,
 fast boolean not null default false,
 skipped boolean not null default false,
 books boolean not null default false,
 food boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(journey_id,thursday),
 foreign key(user_id,journey_id) references public.sai_sankalps(user_id,id) on delete cascade,
 check(not skipped or not(sankalp or puja or temple or fast or books or food))
);
create index sai_entries_owner on public.sai_vrat_entries(user_id);
alter table public.sai_sankalps enable row level security;
alter table public.sai_vrat_entries enable row level security;
revoke all on public.sai_sankalps,public.sai_vrat_entries from public,anon,authenticated;
grant select on public.sai_sankalps,public.sai_vrat_entries to authenticated;
create policy sai_journey_read on public.sai_sankalps for select to authenticated using ((select auth.uid())=user_id);
create policy sai_entry_read on public.sai_vrat_entries for select to authenticated using ((select auth.uid())=user_id);
-- Writes intentionally disabled until the atomic revision-checked save API is implemented and tested.
