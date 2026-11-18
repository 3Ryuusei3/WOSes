-- =============================================================================
-- Realtime multijugador: Broadcast desde la base de datos + reloj de ronda
-- =============================================================================
-- Cambios ADITIVOS: no se borra ni se modifica ninguna tabla/RPC existente.
-- Los clientes antiguos (postgres_changes) siguen funcionando porque las
-- tablas permanecen en la publicación supabase_realtime.
--
-- Topics (canales públicos):
--   room:<CODE>  eventos: room_state | word_correct | players
--   scores       eventos: score_added
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Reloj de ronda autoritativo del servidor
-- -----------------------------------------------------------------------------
alter table public.rounds
  add column if not exists started_at timestamptz,
  add column if not exists duration_seconds integer;

create index if not exists room_players_room_id_idx
  on public.room_players (room_id);

-- -----------------------------------------------------------------------------
-- 2. Helpers internos (no expuestos a la API)
-- -----------------------------------------------------------------------------

-- Estado de la sala + ronda actual, tal y como lo consume el cliente
create or replace function public.rt_room_state(p_room_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'room', jsonb_build_object(
      'id', r.id,
      'code', r.code,
      'state', r.state,
      'current_word', r.current_word,
      'difficulty', r.difficulty,
      'language', r.language,
      'new_room_code', r.new_room_code
    ),
    'round', (
      select jsonb_build_object(
        'id', rd.id,
        'current_word', rd.current_word,
        'started_at', rd.started_at,
        'duration_seconds', rd.duration_seconds
      )
      from public.rounds rd
      where rd.room_id = r.id
      order by rd.id desc
      limit 1
    ),
    'server_time', clock_timestamp()
  )
  from public.rooms r
  where r.id = p_room_id;
$$;

-- Lista completa de jugadores de una sala (idempotente: el cliente reemplaza)
create or replace function public.rt_room_players(p_room_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'score', coalesce(p.score, 0),
        'last_round_score', coalesce(p.last_round_score, 0),
        'role', p.role
      )
      order by p.id
    ),
    '[]'::jsonb
  )
  from public.room_players p
  where p.room_id = p_room_id;
$$;

-- Envía un broadcast al topic de la sala. Nunca lanza error
-- (realtime.send ya captura sus excepciones; esto es un cinturón extra).
create or replace function public.rt_broadcast_room(p_room_id bigint, p_event text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  select code into v_code from public.rooms where id = p_room_id;
  if v_code is null then
    return;
  end if;
  perform realtime.send(p_payload, p_event, 'room:' || v_code, false);
exception when others then
  raise warning 'rt_broadcast_room(%, %) failed: %', p_room_id, p_event, sqlerrm;
end;
$$;

revoke execute on function public.rt_room_state(bigint) from public, anon, authenticated;
revoke execute on function public.rt_room_players(bigint) from public, anon, authenticated;
revoke execute on function public.rt_broadcast_room(bigint, text, jsonb) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Triggers
-- -----------------------------------------------------------------------------

-- rooms: cambios de estado de sala -> room_state
create or replace function public.rt_rooms_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Marca el inicio/fin de la ronda con la hora del servidor
  if new.state = 'game' and old.state is distinct from 'game' then
    update public.rounds
       set started_at = clock_timestamp()
     where id = (select id from public.rounds where room_id = new.id order by id desc limit 1)
       and started_at is null;
  elsif new.state in ('lobby', 'lost') and old.state = 'game' then
    update public.rounds
       set finished_at = clock_timestamp()
     where id = (select id from public.rounds where room_id = new.id order by id desc limit 1)
       and finished_at is null;
  end if;

  perform public.rt_broadcast_room(new.id, 'room_state', public.rt_room_state(new.id));
  return null;
end;
$$;

drop trigger if exists rt_rooms_after_update on public.rooms;
create trigger rt_rooms_after_update
  after update on public.rooms
  for each row
  when (
    new.code is not null and (
      old.state         is distinct from new.state or
      old.current_word  is distinct from new.current_word or
      old.new_room_code is distinct from new.new_room_code or
      old.difficulty    is distinct from new.difficulty
    )
  )
  execute function public.rt_rooms_after_update();

-- room_words: palabra acertada -> word_correct
-- (las filas 'pending' sembradas NO generan eventos: se acabó el aluvión)
create or replace function public.rt_room_words_correct()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  select name into v_name from public.room_players where id = new.player_id;
  perform public.rt_broadcast_room(
    new.room_id,
    'word_correct',
    jsonb_build_object(
      'round_id', new.round_id,
      'word', new.word,
      'player_id', new.player_id,
      'player_name', coalesce(v_name, '')
    )
  );
  return null;
end;
$$;

drop trigger if exists rt_room_words_correct_ins on public.room_words;
create trigger rt_room_words_correct_ins
  after insert on public.room_words
  for each row
  when (new.status = 'correct')
  execute function public.rt_room_words_correct();

drop trigger if exists rt_room_words_correct_upd on public.room_words;
create trigger rt_room_words_correct_upd
  after update of status on public.room_words
  for each row
  when (new.status = 'correct' and old.status is distinct from 'correct')
  execute function public.rt_room_words_correct();

-- room_players: altas/bajas/puntos -> players (un único evento por sentencia y sala)
create or replace function public.rt_room_players_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id bigint;
begin
  if tg_op = 'DELETE' then
    for v_room_id in select distinct room_id from old_rows where room_id is not null loop
      perform public.rt_broadcast_room(v_room_id, 'players',
        jsonb_build_object('players', public.rt_room_players(v_room_id), 'server_time', clock_timestamp()));
    end loop;
  else
    for v_room_id in select distinct room_id from new_rows where room_id is not null loop
      perform public.rt_broadcast_room(v_room_id, 'players',
        jsonb_build_object('players', public.rt_room_players(v_room_id), 'server_time', clock_timestamp()));
    end loop;
  end if;
  return null;
end;
$$;

drop trigger if exists rt_room_players_ins on public.room_players;
create trigger rt_room_players_ins
  after insert on public.room_players
  referencing new table as new_rows
  for each statement
  execute function public.rt_room_players_changed();

drop trigger if exists rt_room_players_upd on public.room_players;
create trigger rt_room_players_upd
  after update on public.room_players
  referencing new table as new_rows
  for each statement
  execute function public.rt_room_players_changed();

drop trigger if exists rt_room_players_del on public.room_players;
create trigger rt_room_players_del
  after delete on public.room_players
  referencing old table as old_rows
  for each statement
  execute function public.rt_room_players_changed();

-- rooms: nueva puntuación final (single, daily o multi) -> scores/score_added
create or replace function public.rt_score_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'difficulty', new.difficulty,
      'language', new.language,
      'challenge_number', new.challenge_number
    ),
    'score_added',
    'scores',
    false
  );
  return null;
exception when others then
  raise warning 'rt_score_added failed: %', sqlerrm;
  return null;
end;
$$;

drop trigger if exists rt_rooms_score_added on public.rooms;
create trigger rt_rooms_score_added
  after insert or update of state, score on public.rooms
  for each row
  when (new.state = 'lost' and new.score is not null)
  execute function public.rt_score_added();

-- -----------------------------------------------------------------------------
-- 4. RPC públicas nuevas
-- -----------------------------------------------------------------------------

-- Inicia una ronda guardando su duración (reutiliza start_room_with_word).
-- Ya no hace falta sembrar room_words: submit_word inserta la correcta si no existe.
create or replace function public.start_round(p_code text, p_current_word text, p_duration_seconds integer)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result json;
begin
  if p_duration_seconds is null or p_duration_seconds < 3 or p_duration_seconds > 600 then
    raise exception 'Invalid round duration';
  end if;

  v_result := public.start_room_with_word(p_code, p_current_word);

  update public.rounds
     set duration_seconds = p_duration_seconds
   where id = (v_result->>'round_id')::bigint;

  return v_result;
end;
$$;

-- Foto completa de la sala: se pide al conectar, al reconectar y al volver
-- a la pestaña. Es la fuente de verdad; los broadcasts solo la adelantan.
create or replace function public.get_room_snapshot(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_room_id bigint;
  v_state jsonb;
  v_round_id bigint;
begin
  select id into v_room_id from public.rooms where code = p_code;
  if v_room_id is null then
    raise exception 'Room not found';
  end if;

  v_state := public.rt_room_state(v_room_id);
  v_round_id := (v_state->'round'->>'id')::bigint;

  return v_state || jsonb_build_object(
    'players', public.rt_room_players(v_room_id),
    'correct_words', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'round_id', w.round_id,
          'word', w.word,
          'player_id', w.player_id,
          'player_name', coalesce(p.name, '')
        )
        order by w.validated_at nulls last, w.id
      )
      from public.room_words w
      left join public.room_players p on p.id = w.player_id
      where w.room_id = v_room_id
        and w.round_id = v_round_id
        and w.status = 'correct'
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.start_round(text, text, integer) to anon, authenticated;
grant execute on function public.get_room_snapshot(text) to anon, authenticated;

commit;
