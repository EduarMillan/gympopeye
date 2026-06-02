# 💪 Popeye Gym

App para gestionar el gimnasio (en Cuba), administrada desde Chile. Diseñada
para funcionar **100% sin internet**: los datos viven en el teléfono y la
conexión solo sirve para sincronizar/respaldar cuando aparece (~cada 24h).

## Arquitectura

- **PWA en React** (Vite + TypeScript) — instalable en Android, funciona offline.
- **IndexedDB vía Dexie** — base de datos local en el dispositivo.
- **Supabase** (Postgres) — base de datos online; punto de unión de los datos
  de todos los dispositivos. _(Fase 5)_
- **Sincronización eventual** — cada registro tiene `id` único (UUID) y
  `updatedAt`; al sincronizar gana la última edición. Pagos y asistencias solo
  se agregan, así que casi nunca hay conflictos. _(Fase 5)_
- **Exportar/Importar archivo JSON** — respaldo y "sincronización manual" por
  WhatsApp/USB para cuando no haya forma de conectar. _(Fase 5)_

## Módulos

| Módulo     | Qué hace                                                          |
| ---------- | ---------------------------------------------------------------- |
| Socios     | Alta y gestión de miembros (datos, foto, activo/inactivo)        |
| Pagos      | Mensualidades, promociones aplicadas, vencimientos, deudores     |
| Asistencia | Registro de entradas diarias (check-in)                          |
| Rutinas    | Planes de entrenamiento por socio                                |
| Gastos     | Salarios (recurrentes), limpieza, mantenimiento, etc.            |
| Dashboard  | Contabilidad: ingresos/gastos del mes, balance, acumulados, etc. |

## Plan por fases

1. ✅ **Esqueleto** — PWA instalable + offline, navegación y modelo de datos.
2. ✅ **Socios + Pagos + Promociones** — el corazón del negocio.
3. ✅ **Asistencia + Rutinas**.
4. ✅ **Gastos + Dashboard contable**.
5. ✅ **Sincronización Supabase + exportar/importar archivo**.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción (genera la PWA)
npm run preview  # previsualizar el build
```

> Los íconos de la PWA se generan desde `public/logo.png` con
> `node scripts/gen-icons.mjs` (requiere `sharp`). Si cambias el logo, vuelve a
> ejecutarlo.

## Sincronización con Supabase (opcional)

La app funciona completa sin esto. Para activar la sync automática en la nube:

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql).
3. En **Settings → API**, copia la _Project URL_ y la _anon public key_.
4. Copia `.env.example` como `.env.local` y pega ambas claves.
5. Reinicia `npm run dev`. En **Ajustes** (engranaje arriba a la derecha)
   aparecerá la sincronización; además se sincroniza sola al abrir la app y al
   recuperar la conexión.

**Cómo funciona:** cada registro lleva un `id` único y `updatedAt`. La sync
sube los cambios locales y baja los remotos; ante un conflicto gana el más
reciente. Los borrados son "suaves" (`eliminado`) para que también se propaguen.

> ⚠️ Seguridad: el esquema inicial permite acceso con la clave pública. Para
> producción, añade autenticación y endurece las políticas RLS.

## Copia de seguridad por archivo

En **Ajustes** puedes **Exportar** un archivo `.json` (para respaldar o enviar
por WhatsApp) e **Importar** uno recibido. Al importar, los datos se combinan
(gana lo más reciente) — es la sincronización manual cuando no hay forma de
conectar a la nube.
