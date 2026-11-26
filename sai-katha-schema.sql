create table public.sai_katha_sections(id integer primary key, language text not null, title text not null, body text not null, source_url text not null, rights_basis text not null);
alter table public.sai_katha_sections enable row level security;
revoke all on public.sai_katha_sections from public, anon, authenticated;
grant select on public.sai_katha_sections to anon, authenticated;
create policy sai_katha_read on public.sai_katha_sections for select to anon, authenticated using (true);
insert into public.sai_katha_sections values
(1,'hi','कथा का सार','किरन बहन के घर में आर्थिक कठिनाई और कलह थी। एक वृद्ध से नौ गुरुवार के व्रत का मार्ग जानकर उन्होंने श्रद्धा से पूजा की और अंतिम गुरुवार जरूरतमंदों को भोजन कराया। कथा में उनके परिवार में शांति लौटने और उनके संबंधियों के अनुभवों का वर्णन है।','https://hindunidhi.com/sai-baba-vrat-katha-hindi/pdf/','original_summary'),
(2,'hi','पूजा विधि का सार','गुरुवार को संकल्प लेकर साईं बाबा की प्रतिमा या चित्र के सामने दीपक, फूल और प्रसाद अर्पित करें। कथा पढ़ें, आरती करें और प्रसाद बाँटें। अपनी सामर्थ्य के अनुसार सेवा करें।','https://hindunidhi.com/sai-baba-vrat-katha-hindi/pdf/','original_summary');