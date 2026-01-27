

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."advance_room_to_game"("p_code" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room record;
  v_round record;
begin
  select id, code, state, players, current_word
  into v_room
  from public.rooms
  where code = p_code
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.state <> 'loading' then
    raise exception 'Room not in loading';
  end if;

  -- Ronda activa más reciente
  select id, room_id, current_word
  into v_round
  from public.rounds
  where room_id = v_room.id
  order by id desc
  limit 1;

  if not found then
    raise exception 'No active round';
  end if;

  update public.rooms
  set state = 'game'
  where id = v_room.id;

  return json_build_object(
    'room_id', v_room.id,
    'code', v_room.code,
    'state', 'game',
    'players', v_room.players,
    'current_word', v_room.current_word,
    'round_id', v_round.id
  );
end;
$$;


ALTER FUNCTION "public"."advance_room_to_game"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_word_points"("p_word" "text", "p_language" "text") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
declare
  v_points int := 0;
  v_map jsonb;
  c text;
  i int;
  v_lower text := lower(p_word);
begin
  if p_language = 'en' then
    v_map := '{
      "a":1,"e":1,"i":1,"o":1,"n":1,"r":1,"t":1,"l":1,"s":1,"u":1,
      "d":2,"g":2,"b":3,"c":3,"m":3,"p":3,"f":4,"h":4,"v":4,"w":4,"y":4,
      "k":5,"j":8,"x":8,"q":10,"z":10
    }'::jsonb;
  else
    v_map := '{
      "a":1,"e":1,"i":1,"l":1,"n":1,"o":1,"r":1,"s":1,"t":1,"u":1,
      "d":2,"g":2,"b":3,"c":3,"m":3,"p":3,"f":4,"h":4,"v":4,"y":4,
      "q":5,"j":8,"ñ":8,"x":8,"z":10,"k":10,"w":10
    }'::jsonb;
  end if;

  for i in 1..char_length(v_lower) loop
    c := substr(v_lower, i, 1);
    v_points := v_points + coalesce((v_map->>c)::int, 0);
  end loop;

  return v_points;
end;
$$;


ALTER FUNCTION "public"."calculate_word_points"("p_word" "text", "p_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_room_with_host"("p_code" "text", "p_host_name" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room_id bigint;
  v_host_player_id bigint;
begin
  -- Intenta crear la sala con estado y players deseados
  insert into public.rooms(code, state, players)
  values (p_code, 'preparation', 'multi')
  returning id into v_room_id;

  insert into public.room_players(room_id, name, role, score)
  values (v_room_id, p_host_name, 'host', 0)
  returning id into v_host_player_id;

  return json_build_object(
    'room_id', v_room_id,
    'code', p_code,
    'state', 'preparation',
    'players', 'multi',
    'host_player_id', v_host_player_id
  );
exception
  when unique_violation then
    -- Esta excepción sólo ocurre si ya existe code (por el índice único)
    raise exception 'Room code already exists';
end;
$$;


ALTER FUNCTION "public"."create_room_with_host"("p_code" "text", "p_host_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_room_with_host"("p_code" "text", "p_host_name" "text", "p_difficulty" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room_id bigint;
  v_host_player_id bigint;
begin
  insert into public.rooms(code, state, players, name, difficulty)
  values (p_code, 'room', 'multi', p_host_name, p_difficulty)
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
    'name', p_host_name,
    'difficulty', p_difficulty
  );
exception
  when unique_violation then
    raise exception 'Room code already exists';
end;
$$;


ALTER FUNCTION "public"."create_room_with_host"("p_code" "text", "p_host_name" "text", "p_difficulty" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finish_round_to_lobby"("p_code" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room record;
begin
  select id, code, state, players
  into v_room
  from public.rooms
  where code = p_code
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.state <> 'game' then
    raise exception 'Room not in game';
  end if;

  update public.rooms
  set state = 'lobby'
  where id = v_room.id;

  return json_build_object(
    'room_id', v_room.id,
    'code', v_room.code,
    'state', 'lobby',
    'players', v_room.players
  );
end;
$$;


ALTER FUNCTION "public"."finish_round_to_lobby"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finish_round_to_lost"("p_code" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room record;
begin
  select id, code, state, players
  into v_room
  from public.rooms
  where code = p_code
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.state <> 'game' then
    raise exception 'Room not in game';
  end if;

  update public.rooms
  set state = 'lost'
  where id = v_room.id;

  return json_build_object(
    'room_id', v_room.id,
    'code', v_room.code,
    'state', 'lost',
    'players', v_room.players
  );
end;
$$;


ALTER FUNCTION "public"."finish_round_to_lost"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finish_round_to_lost"("p_code" "text", "p_level" integer, "p_score" integer, "p_rounds" integer, "p_perfects" integer) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room record;
begin
  select id, code, state, players
  into v_room
  from public.rooms
  where code = p_code
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.state <> 'game' then
    raise exception 'Room not in game';
  end if;

  update public.rooms
  set state = 'lost',
      level = p_level,
      score = p_score,
      rounds = p_rounds,
      perfects = p_perfects
  where id = v_room.id;

  return json_build_object(
    'room_id', v_room.id,
    'code', v_room.code,
    'state', 'lost',
    'players', v_room.players
  );
end;
$$;

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" bigint NOT NULL,
    "name" "text",
    "score" numeric,
    "level" numeric,
    "difficulty" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "language" "text" DEFAULT 'es'::"text",
    "rounds" numeric DEFAULT '0'::numeric,
    "perfects" numeric DEFAULT '0'::numeric,
    "state" "text" DEFAULT 'finished'::"text",
    "players" "text" DEFAULT 'single'::"text",
    "code" "text",
    "current_word" "text",
    "new_room_code" "text"
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_score_with_next_id"("p_name" "text", "p_score" integer, "p_level" integer, "p_difficulty" "text", "p_language" "text", "p_created_at" timestamp with time zone, "p_rounds" numeric, "p_perfects" numeric) RETURNS SETOF "public"."rooms"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  r public.rooms%rowtype;
begin
  insert into public.rooms (name, score, level, difficulty, language, created_at, rounds, perfects, state, players)
  values (p_name, p_score, p_level, p_difficulty, p_language, p_created_at, p_rounds, p_perfects, 'lost', 'single')
  returning * into r;

  return next r;
end;
$$;


ALTER FUNCTION "public"."insert_score_with_next_id"("p_name" "text", "p_score" integer, "p_level" integer, "p_difficulty" "text", "p_language" "text", "p_created_at" timestamp with time zone, "p_rounds" numeric, "p_perfects" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_room_as_player"("p_code" "text", "p_player_name" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room record;
  v_player_id bigint;
begin
  select id, code, state, players
  into v_room
  from public.rooms
  where code = p_code;

  if not found then
    raise exception 'Room not found';
  end if;

  -- Solo permite unirse cuando la sala está en 'room'
  if v_room.state <> 'room' then
    raise exception 'Room not joinable';
  end if;

  insert into public.room_players(room_id, name, role, score)
  values (v_room.id, p_player_name, 'player', 0)
  returning id into v_player_id;

  return json_build_object(
    'room_id', v_room.id,
    'code', v_room.code,
    'state', v_room.state,
    'players', v_room.players,
    'player_id', v_player_id,
    'player_name', p_player_name
  );
end;
$$;


ALTER FUNCTION "public"."join_room_as_player"("p_code" "text", "p_player_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_room"("p_code" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room record;
  v_players_count int;
begin
  select id, code, state, players
  into v_room
  from public.rooms
  where code = p_code
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.state <> 'room' then
    raise exception 'Room already started or finished';
  end if;

  select count(*) into v_players_count
  from public.room_players
  where room_id = v_room.id
    and role = 'player';

  if v_players_count < 1 then
    raise exception 'Need at least 1 player (host not counted)';
  end if;

  update public.rooms
  set state = 'loading'
  where id = v_room.id;

  return json_build_object(
    'room_id', v_room.id,
    'code', v_room.code,
    'state', 'loading',
    'players', v_room.players
  );
end;
$$;


ALTER FUNCTION "public"."start_room"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_room_with_word"("p_code" "text", "p_current_word" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room record;
  v_players_count int;
  v_round_id bigint;
begin
  select id, code, state, players
  into v_room
  from public.rooms
  where code = p_code
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.state not in ('room','lobby') then
    raise exception 'Room already started or finished';
  end if;

  select count(*) into v_players_count
  from public.room_players
  where room_id = v_room.id
    and role = 'player';

  if v_players_count < 1 then
    raise exception 'Need at least 1 player (host not counted)';
  end if;

  -- Reiniciar marcador de la última ronda
  update public.room_players
  set last_round_score = 0
  where room_id = v_room.id;

  insert into public.rounds(room_id, current_word)
  values (v_room.id, p_current_word)
  returning id into v_round_id;

  update public.rooms
  set state = 'loading',
      current_word = p_current_word
  where id = v_room.id;

  return json_build_object(
    'room_id', v_room.id,
    'code', v_room.code,
    'state', 'loading',
    'players', v_room.players,
    'current_word', p_current_word,
    'round_id', v_round_id
  );
end;
$$;


ALTER FUNCTION "public"."start_room_with_word"("p_code" "text", "p_current_word" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_word"("p_code" "text", "p_player_id" bigint, "p_word" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room record;
  v_round record;
  v_row record;
begin
  select id, code, state from public.rooms
  where code = p_code
  into v_room;

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.state <> 'game' then
    raise exception 'Room not in game';
  end if;

  -- ronda activa
  select id, room_id from public.rounds
  where room_id = v_room.id
  order by id desc
  limit 1
  into v_round;

  if not found then
    raise exception 'No active round';
  end if;

  -- Inserta intento (pendiente)
  insert into public.room_words(room_id, round_id, player_id, word, status)
  values (v_room.id, v_round.id, p_player_id, lower(p_word), 'pending')
  on conflict (room_id, round_id, player_id, word) do nothing
  returning id, room_id, round_id, player_id, word, status
  into v_row;

  return json_build_object(
    'id', v_row.id,
    'room_id', v_room.id,
    'round_id', v_round.id,
    'player_id', p_player_id,
    'word', p_word,
    'status', coalesce(v_row.status, 'pending')
  );
end;
$$;


ALTER FUNCTION "public"."submit_word"("p_code" "text", "p_player_id" bigint, "p_word" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_word"("p_code" "text", "p_player_id" bigint, "p_word" "text", "p_is_valid" boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room_id bigint;
  v_round_id bigint;
  v_updated boolean := false;
  v_language text := 'es';
  v_points integer := 0;
begin
  select id into v_room_id from rooms where code = p_code;
  if v_room_id is null then
    raise exception 'Room not found';
  end if;

  -- idioma de la sala (por defecto 'es')
  select coalesce(language, 'es') into v_language from rooms where id = v_room_id;

  select id into v_round_id
  from rounds
  where room_id = v_room_id
  order by id desc
  limit 1;

  if not p_is_valid then
    return jsonb_build_object('status','invalid');
  end if;

  -- calcula puntos por la palabra en base al idioma
  v_points := calculate_word_points(lower(p_word), v_language);

  update room_words
  set status = 'correct',
      player_id = p_player_id,
      validated_by = p_player_id,
      validated_at = now()
  where room_id = v_room_id
    and round_id = v_round_id
    and word = lower(p_word)
    and status = 'pending'
  returning true into v_updated;

  if v_updated then
    -- primera validación correcta: sumar puntos al jugador
    update room_players
    set score = coalesce(score,0) + v_points,
        last_round_score = coalesce(last_round_score,0) + v_points
    where id = p_player_id and room_id = v_room_id;
    return jsonb_build_object('status','correct', 'points', v_points);
  end if;

  if exists (
    select 1 from room_words
    where room_id = v_room_id
      and round_id = v_round_id
      and word = lower(p_word)
      and status = 'correct'
  ) then
    return jsonb_build_object('status','rejected');
  end if;

  -- fallback: si no hay fila pending, intenta insertar correct directamente
  insert into room_words (room_id, round_id, player_id, word, status, validated_by, validated_at)
  values (v_room_id, v_round_id, p_player_id, lower(p_word), 'correct', p_player_id, now())
  on conflict (room_id, round_id, word) do nothing;

  if found then
    -- inserción como correcta: sumar puntos
    update room_players
    set score = coalesce(score,0) + v_points,
        last_round_score = coalesce(last_round_score,0) + v_points
    where id = p_player_id and room_id = v_room_id;
    return jsonb_build_object('status','correct', 'points', v_points);
  else
    return jsonb_build_object('status','rejected');
  end if;
end;
$$;


ALTER FUNCTION "public"."submit_word"("p_code" "text", "p_player_id" bigint, "p_word" "text", "p_is_valid" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_word"("p_code" "text", "p_host_player_id" bigint, "p_word" "text", "p_status" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room record;
  v_round record;
  v_row record;
begin
  if p_status not in ('correct', 'rejected') then
    raise exception 'Invalid status';
  end if;

  select id, code from public.rooms
  where code = p_code
  into v_room;

  if not found then
    raise exception 'Room not found';
  end if;

  -- Aseguramos ronda activa
  select id from public.rounds
  where room_id = v_room.id
  order by id desc
  limit 1
  into v_round;

  if not found then
    raise exception 'No active round';
  end if;

  -- Marca una única vez como correct (índice parcial evita duplicados de correct)
  update public.room_words rw
  set status = p_status,
      validated_by = p_host_player_id,
      validated_at = now()
  where rw.room_id = v_room.id
    and rw.round_id = v_round.id
    and rw.word = lower(p_word)
  returning id, room_id, round_id, player_id, word, status, validated_by, validated_at
  into v_row;

  return json_build_object(
    'id', v_row.id,
    'room_id', v_room.id,
    'round_id', v_round.id,
    'player_id', v_row.player_id,
    'word', v_row.word,
    'status', v_row.status
  );
end;
$$;


ALTER FUNCTION "public"."validate_word"("p_code" "text", "p_host_player_id" bigint, "p_word" "text", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_round_words"("p_code" "text", "p_words" "text"[]) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room_id bigint;
  v_round_id bigint;
  v_word text;
  v_inserted integer := 0;
begin
  -- Obtener room_id por el código
  select id into v_room_id
  from public.rooms
  where code = p_code;

  if v_room_id is null then
    raise exception 'Room not found';
  end if;

  -- Obtener la ronda más reciente
  select id into v_round_id
  from public.rounds
  where room_id = v_room_id
  order by id desc
  limit 1;

  if v_round_id is null then
    raise exception 'Round not found';
  end if;

  -- Insertar todas las palabras como pending
  -- El índice único room_words_unique_round_word previene duplicados
  foreach v_word in array p_words
  loop
    begin
      insert into public.room_words (room_id, round_id, word, status, player_id)
      values (v_room_id, v_round_id, lower(v_word), 'pending', null)
      on conflict (room_id, round_id, word) do nothing;

      if found then
        v_inserted := v_inserted + 1;
      end if;
    exception
      when unique_violation then
        -- Ignorar duplicados silenciosamente
        null;
    end;
  end loop;

  return json_build_object(
    'room_id', v_room_id,
    'round_id', v_round_id,
    'inserted', v_inserted,
    'total', array_length(p_words, 1)
  );
end;
$$;


ALTER FUNCTION "public"."seed_round_words"("p_code" "text", "p_words" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_new_room_code"("p_old_code" "text", "p_new_code" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_room record;
begin
  select id, code, state
  into v_room
  from public.rooms
  where code = p_old_code
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  update public.rooms
  set new_room_code = p_new_code
  where id = v_room.id;

  return json_build_object(
    'room_id', v_room.id,
    'old_code', p_old_code,
    'new_room_code', p_new_code
  );
end;
$$;


ALTER FUNCTION "public"."set_new_room_code"("p_old_code" "text", "p_new_code" "text") OWNER TO "postgres";


ALTER FUNCTION "public"."seed_round_words"("p_code" "text", "p_words" "text"[]) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requests" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "word" "text",
    "word_reference" integer,
    "issue" "text"
);


ALTER TABLE "public"."requests" OWNER TO "postgres";


ALTER TABLE "public"."requests" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."requests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."room_players" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "room_id" bigint,
    "name" "text",
    "score" numeric DEFAULT '0'::numeric,
    "role" "text",
    "last_round_score" integer DEFAULT 0
);


ALTER TABLE "public"."room_players" OWNER TO "postgres";


ALTER TABLE "public"."room_players" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."room_players_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."room_words" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "room_id" bigint,
    "player_id" bigint,
    "word" "text",
    "round_id" bigint,
    "status" "text" DEFAULT 'pending'::"text",
    "validated_by" bigint,
    "validated_at" timestamp with time zone
);


ALTER TABLE "public"."room_words" OWNER TO "postgres";


ALTER TABLE "public"."room_words" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."room_words_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."rooms" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."rooms_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."rounds" (
    "id" bigint NOT NULL,
    "room_id" bigint,
    "current_word" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone
);


ALTER TABLE "public"."rounds" OWNER TO "postgres";


ALTER TABLE "public"."rounds" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."rounds_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_players"
    ADD CONSTRAINT "room_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_words"
    ADD CONSTRAINT "room_words_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "room_words_unique_player_round_word" ON "public"."room_words" USING "btree" ("room_id", "round_id", "player_id", "word");



CREATE UNIQUE INDEX "room_words_unique_round_correct" ON "public"."room_words" USING "btree" ("room_id", "round_id", "word") WHERE ("status" = 'correct'::"text");



CREATE UNIQUE INDEX "room_words_unique_round_word" ON "public"."room_words" USING "btree" ("room_id", "round_id", "word");



CREATE UNIQUE INDEX "rooms_code_key" ON "public"."rooms" USING "btree" ("code");



CREATE INDEX "rounds_room_id_idx" ON "public"."rounds" USING "btree" ("room_id");



ALTER TABLE ONLY "public"."room_players"
    ADD CONSTRAINT "room_players_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."room_words"
    ADD CONSTRAINT "room_words_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."room_players"("id");



ALTER TABLE ONLY "public"."room_words"
    ADD CONSTRAINT "room_words_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."room_words"
    ADD CONSTRAINT "room_words_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."room_players";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."room_words";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rooms";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."advance_room_to_game"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."advance_room_to_game"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."advance_room_to_game"("p_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_word_points"("p_word" "text", "p_language" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_word_points"("p_word" "text", "p_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_word_points"("p_word" "text", "p_language" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_room_with_host"("p_code" "text", "p_host_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_room_with_host"("p_code" "text", "p_host_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_room_with_host"("p_code" "text", "p_host_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_room_with_host"("p_code" "text", "p_host_name" "text", "p_difficulty" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_room_with_host"("p_code" "text", "p_host_name" "text", "p_difficulty" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_room_with_host"("p_code" "text", "p_host_name" "text", "p_difficulty" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."finish_round_to_lobby"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."finish_round_to_lobby"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."finish_round_to_lobby"("p_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."finish_round_to_lost"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."finish_round_to_lost"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."finish_round_to_lost"("p_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."finish_round_to_lost"("p_code" "text", "p_level" integer, "p_score" integer, "p_rounds" integer, "p_perfects" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."finish_round_to_lost"("p_code" "text", "p_level" integer, "p_score" integer, "p_rounds" integer, "p_perfects" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."finish_round_to_lost"("p_code" "text", "p_level" integer, "p_score" integer, "p_rounds" integer, "p_perfects" integer) TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_score_with_next_id"("p_name" "text", "p_score" integer, "p_level" integer, "p_difficulty" "text", "p_language" "text", "p_created_at" timestamp with time zone, "p_rounds" numeric, "p_perfects" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_score_with_next_id"("p_name" "text", "p_score" integer, "p_level" integer, "p_difficulty" "text", "p_language" "text", "p_created_at" timestamp with time zone, "p_rounds" numeric, "p_perfects" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_score_with_next_id"("p_name" "text", "p_score" integer, "p_level" integer, "p_difficulty" "text", "p_language" "text", "p_created_at" timestamp with time zone, "p_rounds" numeric, "p_perfects" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."join_room_as_player"("p_code" "text", "p_player_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."join_room_as_player"("p_code" "text", "p_player_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_room_as_player"("p_code" "text", "p_player_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_round_words"("p_code" "text", "p_words" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."seed_round_words"("p_code" "text", "p_words" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_round_words"("p_code" "text", "p_words" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_new_room_code"("p_old_code" "text", "p_new_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_new_room_code"("p_old_code" "text", "p_new_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_new_room_code"("p_old_code" "text", "p_new_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."start_room"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."start_room"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_room"("p_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."start_room_with_word"("p_code" "text", "p_current_word" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."start_room_with_word"("p_code" "text", "p_current_word" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_room_with_word"("p_code" "text", "p_current_word" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_word"("p_code" "text", "p_player_id" bigint, "p_word" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_word"("p_code" "text", "p_player_id" bigint, "p_word" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_word"("p_code" "text", "p_player_id" bigint, "p_word" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_word"("p_code" "text", "p_player_id" bigint, "p_word" "text", "p_is_valid" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."submit_word"("p_code" "text", "p_player_id" bigint, "p_word" "text", "p_is_valid" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_word"("p_code" "text", "p_player_id" bigint, "p_word" "text", "p_is_valid" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_word"("p_code" "text", "p_host_player_id" bigint, "p_word" "text", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_word"("p_code" "text", "p_host_player_id" bigint, "p_word" "text", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_word"("p_code" "text", "p_host_player_id" bigint, "p_word" "text", "p_status" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."requests" TO "anon";
GRANT ALL ON TABLE "public"."requests" TO "authenticated";
GRANT ALL ON TABLE "public"."requests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."requests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."requests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."requests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."room_players" TO "anon";
GRANT ALL ON TABLE "public"."room_players" TO "authenticated";
GRANT ALL ON TABLE "public"."room_players" TO "service_role";



GRANT ALL ON SEQUENCE "public"."room_players_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."room_players_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."room_players_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."room_words" TO "anon";
GRANT ALL ON TABLE "public"."room_words" TO "authenticated";
GRANT ALL ON TABLE "public"."room_words" TO "service_role";



GRANT ALL ON SEQUENCE "public"."room_words_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."room_words_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."room_words_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rooms_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rooms_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rooms_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rounds" TO "anon";
GRANT ALL ON TABLE "public"."rounds" TO "authenticated";
GRANT ALL ON TABLE "public"."rounds" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rounds_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
