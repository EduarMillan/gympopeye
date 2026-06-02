-- Migración: marca de tiempo del SERVIDOR para la sincronización.
-- Soluciona que dispositivos con relojes distintos se "salten" registros.
-- Ejecutar una vez en el SQL Editor de Supabase.

-- Columna con la hora del servidor (no del dispositivo).
alter table popeye_registros
  add column if not exists server_at timestamptz not null default now();

create index if not exists popeye_registros_server_at
  on popeye_registros (server_at);

-- Disparador: cada insert/update pone server_at = ahora (hora del servidor).
create or replace function popeye_touch()
returns trigger as $$
begin
  new.server_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists popeye_touch_trg on popeye_registros;
create trigger popeye_touch_trg
  before insert or update on popeye_registros
  for each row execute function popeye_touch();
