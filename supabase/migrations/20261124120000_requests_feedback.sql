-- Solicitudes de los jugadores: además de palabras (añadir / quitar), feedback
-- general de la plataforma, en la misma tabla.
--
--   type = 'word'      → word, action ('add' | 'remove'), original_word,
--                        difficulty  (lo de siempre)
--   type = 'feedback'  → message (texto libre); word / action van a null
--
-- Las filas que ya existen quedan como type = 'word' (default).
-- Aplicar ANTES de desplegar el front que envía sugerencias.
begin;

alter table public.requests
  add column if not exists type text not null default 'word',
  add column if not exists message text;

alter table public.requests drop constraint if exists requests_type_check;
alter table public.requests
  add constraint requests_type_check check (type in ('word', 'feedback'));

-- Una sugerencia necesita texto (y no muy largo); una palabra, la palabra
alter table public.requests drop constraint if exists requests_content_check;
alter table public.requests
  add constraint requests_content_check check (
    (type = 'feedback' and message is not null and char_length(message) between 1 and 1000)
    or (type = 'word' and word is not null)
  ) not valid;

-- Para las sugerencias, word y action no aplican
alter table public.requests alter column word drop not null;
alter table public.requests alter column action drop not null;

commit;
