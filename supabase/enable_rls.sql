-- Habilita RLS en las tablas públicas sin protección de WOSES.
-- Estado previo comprobado: requests ya tenía RLS; el resto no.
-- Todas las escrituras van por RPC SECURITY DEFINER, así que no se crean
-- policies de insert/update/delete: desde la API anon no se puede escribir.
begin;

alter table public.daily_challenges enable row level security;
alter table public.rooms            enable row level security;
alter table public.room_players     enable row level security;
alter table public.room_words       enable row level security;
alter table public.rounds           enable row level security;

-- Lectura pública (ranking, salas, jugadores, palabras, realtime y RPC INVOKER
-- get_daily_challenge / get_daily_challenge_ranking)
drop policy if exists "public read daily_challenges" on public.daily_challenges;
drop policy if exists "public read rooms"            on public.rooms;
drop policy if exists "public read room_players"     on public.room_players;
drop policy if exists "public read room_words"       on public.room_words;
drop policy if exists "public read rounds"           on public.rounds;

create policy "public read daily_challenges" on public.daily_challenges for select to anon, authenticated using (true);
create policy "public read rooms"            on public.rooms            for select to anon, authenticated using (true);
create policy "public read room_players"     on public.room_players     for select to anon, authenticated using (true);
create policy "public read room_words"       on public.room_words       for select to anon, authenticated using (true);
create policy "public read rounds"           on public.rounds           for select to anon, authenticated using (true);

commit;
