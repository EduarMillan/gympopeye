-- Esquema de sincronización para Popeye Gym.
-- Ejecutar una vez en el editor SQL de Supabase.
--
-- La sincronización usa una sola tabla genérica: cada fila es un registro de
-- cualquier tabla de la app (socios, pagos, etc.) guardado como JSON. Así la
-- mezcla es simple y no hay que mantener columnas por cada campo.

create table if not exists popeye_registros (
  tabla       text    not null,
  id          text    not null,
  datos       jsonb   not null,
  updated_at  bigint  not null,
  eliminado   boolean not null default false,
  primary key (tabla, id)
);

create index if not exists popeye_registros_updated_at
  on popeye_registros (updated_at);

-- Seguridad: para empezar, se permite acceso con la clave pública (anon).
-- ⚠️ Esto significa que cualquiera con la URL + anon key puede leer/escribir.
-- Es aceptable para una versión inicial de un gimnasio. Para producción real,
-- conviene añadir autenticación (login) y restringir estas políticas.
alter table popeye_registros enable row level security;

create policy "acceso_anon_lectura"
  on popeye_registros for select to anon using (true);

create policy "acceso_anon_escritura"
  on popeye_registros for insert to anon with check (true);

create policy "acceso_anon_actualizar"
  on popeye_registros for update to anon using (true) with check (true);
