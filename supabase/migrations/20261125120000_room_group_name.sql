-- =============================================================================
-- Nombre de grupo para las salas en las que el anfitrión también juega
-- =============================================================================
-- Hasta ahora create_room_with_host usaba p_host_name para dos cosas: el
-- nombre de la partida (rooms.name, el que sale en el top global) y el nombre
-- del anfitrión como jugador (room_players.name). Sin pantalla principal el
-- anfitrión juega con su propio nombre y la partida necesita uno de grupo.
--
-- Cambios ADITIVOS:
--   1. Nueva variante create_room_with_host(..., p_room_name). La de 3
--      parámetros se mantiene para los clientes que ya están publicados.
--   2. rt_room_state envía también rooms.name para que todos vean el grupo.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Crear sala con nombre de grupo (vacío -> el nombre del anfitrión)
-- -----------------------------------------------------------------------------
create or replace function public.create_room_with_host(
  p_code text,
  p_host_name text,
  p_difficulty text,
  p_room_name text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id bigint;
  v_host_player_id bigint;
  v_room_name text := coalesce(nullif(btrim(p_room_name), ''), p_host_name);
begin
  insert into public.rooms(code, state, players, name, difficulty)
  values (p_code, 'room', 'multi', v_room_name, p_difficulty)
  returning id into v_room_id;

  insert into public.room_players(room_id, name, role, score)
  values (v_room_id, p_host_name, 'host', 0)
  returning id into v_host_player_id;

  return json_build_object(
    'room_id', v_room_id,
    'code', p_code,
    'state', 'room',
    'players', 'multi',
    'host_player_id', v_host_player_id,
    'name', v_room_name,
    'difficulty', p_difficulty
  );
exception
  when unique_violation then
    raise exception 'Room code already exists';
end;
$$;

grant execute on function public.create_room_with_host(text, text, text, text)
  to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Estado de la sala: añade el nombre (grupo)
-- -----------------------------------------------------------------------------
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
      'name', r.name,
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

revoke execute on function public.rt_room_state(bigint) from public, anon, authenticated;

commit;
