-- Un jugador sale de la sala (botón "volver" o atrás del navegador):
-- se borra de room_players para que desaparezca de la lista de todos.
-- Sus palabras de la sala (room_words) se borran con él (si no, la clave
-- foránea impide borrarlo). El anfitrión no se borra: su fila sostiene la sala.
-- El trigger rt_room_players_del avisa a la sala con la nueva lista.
create or replace function public.leave_room(p_code text, p_player_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id bigint;
begin
  select id into v_room_id from public.rooms where code = p_code;
  if v_room_id is null then
    return;
  end if;

  if not exists (
    select 1 from public.room_players
    where id = p_player_id and room_id = v_room_id and role = 'player'
  ) then
    return;
  end if;

  delete from public.room_words where player_id = p_player_id;
  delete from public.room_players where id = p_player_id;
end;
$$;

grant execute on function public.leave_room(text, bigint) to anon, authenticated;
