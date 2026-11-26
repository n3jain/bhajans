create table public.sai_resources(id text primary key,title text not null,url text not null);
alter table public.sai_resources enable row level security;
revoke all on public.sai_resources from public,anon,authenticated;
grant select on public.sai_resources to anon,authenticated;
create policy sai_resources_read on public.sai_resources for select to anon,authenticated using (true);
insert into public.sai_resources values ('puja','Thursday Sai Puja','https://open.spotify.com/playlist/1L4AwNZKi9h6f1LhgWL82S'),('podcast','Sai Puja podcast','https://open.spotify.com/show/7bok6lkMslhUnMStCSJiLe'),('katha','साईं बाबा व्रत कथा','https://hindunidhi.com/sai-baba-vrat-katha-hindi/pdf/'),('books','Vrat Katha books (set of 11)','https://www.amazon.in/dp/B08LQQN7T8');