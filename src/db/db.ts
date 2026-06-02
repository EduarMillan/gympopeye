import Dexie, { type EntityTable } from 'dexie'

// ---------------------------------------------------------------------------
// Modelo de datos
//
// Reglas de diseño pensadas para la sincronización offline (fase futura):
//  - Cada registro tiene un `id` único (UUID) generado en el dispositivo, así
//    nunca chocan los IDs entre teléfonos distintos.
//  - Cada registro guarda `updatedAt`. Al sincronizar, ante un conflicto de
//    edición gana el más reciente (last-write-wins).
//  - Pagos y asistencias son "solo se agregan" (append-only): no se editan,
//    por lo que prácticamente nunca generan conflictos.
// ---------------------------------------------------------------------------

export interface Socio {
  id: string
  nombre: string
  telefono?: string
  foto?: string // dataURL base64, opcional
  fechaInscripcion: string // ISO yyyy-mm-dd
  turnoId?: string // turno (horario) al que está inscrito
  activo: boolean
  notas?: string
  createdAt: number
  updatedAt: number
  eliminado?: boolean // borrado suave (para que el borrado se sincronice)
}

export type MetodoPago = 'efectivo' | 'transferencia' | 'otro'

export interface Pago {
  id: string
  socioId: string
  monto: number
  fecha: string // ISO yyyy-mm-dd en que se pagó
  periodoDesde: string // inicio del período cubierto
  periodoHasta: string // fin del período cubierto
  promocionId?: string
  metodo: MetodoPago
  notas?: string
  createdAt: number
  updatedAt: number
  eliminado?: boolean // borrado suave (para que el borrado se sincronice)
}

export interface Asistencia {
  id: string
  socioId: string
  dia: string // ISO yyyy-mm-dd (un registro por socio por día)
  createdAt: number // momento exacto del check-in
  updatedAt: number // para resolver toggles en la sincronización
  eliminado?: boolean
}

export interface Ejercicio {
  nombre: string
  series?: number
  repeticiones?: string
  notas?: string
}

export interface Rutina {
  id: string
  socioId: string
  nombre: string
  ejercicios: Ejercicio[]
  createdAt: number
  updatedAt: number
  eliminado?: boolean // borrado suave (para que el borrado se sincronice)
}

export type CategoriaGasto =
  | 'salario'
  | 'limpieza'
  | 'mantenimiento'
  | 'servicios'
  | 'equipos'
  | 'otros'

export interface Gasto {
  id: string
  categoria: CategoriaGasto
  monto: number
  fecha: string // ISO yyyy-mm-dd
  descripcion?: string
  esRecurrente: boolean // p. ej. salarios mensuales
  createdAt: number
  updatedAt: number
  eliminado?: boolean // borrado suave (para que el borrado se sincronice)
}

export type TipoPromocion =
  | 'descuento_porcentaje'
  | 'descuento_fijo'
  | 'meses_gratis'

export interface Promocion {
  id: string
  nombre: string
  tipo: TipoPromocion
  valor: number // % , monto fijo, o cantidad de meses según el tipo
  vigenciaDesde?: string
  vigenciaHasta?: string
  activo: boolean
  descripcion?: string
  createdAt: number
  updatedAt: number
  eliminado?: boolean // borrado suave (para que el borrado se sincronice)
}

export type Rol = 'superadmin' | 'admin'

export interface Usuario {
  id: string
  nombre: string
  usuario: string // nombre de acceso (único)
  rol: Rol
  passwordHash: string // PBKDF2
  salt: string
  preguntaSeguridad?: string // para recuperar la contraseña offline
  respuestaHash?: string
  respuestaSalt?: string
  createdAt: number
  updatedAt: number
  eliminado?: boolean
}

export interface Turno {
  id: string
  inicio: string // "06:00"
  fin: string // "07:00"
  capacidad: number // máximo de socios matriculados
  createdAt: number
  updatedAt: number
  eliminado?: boolean
}

// ---------------------------------------------------------------------------
// Base de datos
// ---------------------------------------------------------------------------

const db = new Dexie('popeyegym') as Dexie & {
  socios: EntityTable<Socio, 'id'>
  pagos: EntityTable<Pago, 'id'>
  asistencias: EntityTable<Asistencia, 'id'>
  rutinas: EntityTable<Rutina, 'id'>
  gastos: EntityTable<Gasto, 'id'>
  promociones: EntityTable<Promocion, 'id'>
  turnos: EntityTable<Turno, 'id'>
  usuarios: EntityTable<Usuario, 'id'>
}

db.version(1).stores({
  // Solo se indexan los campos por los que se busca/ordena.
  socios: 'id, nombre, activo, updatedAt',
  pagos: 'id, socioId, fecha, promocionId, updatedAt',
  asistencias: 'id, socioId, fecha',
  rutinas: 'id, socioId, updatedAt',
  gastos: 'id, categoria, fecha, updatedAt',
  promociones: 'id, activo, updatedAt',
})

// v2: la asistencia pasa a registrarse por día. El índice compuesto
// [socioId+dia] permite consultar/alternar la entrada de un socio en un día.
db.version(2).stores({
  asistencias: 'id, socioId, dia, [socioId+dia]',
})

// v3: turnos (horarios con capacidad) y el socio indexado por turnoId
// para listar rápido los socios de un turno.
db.version(3).stores({
  socios: 'id, nombre, activo, turnoId, updatedAt',
  turnos: 'id, inicio, updatedAt',
})

// v4: usuarios para el login (superadmin / admins).
db.version(4).stores({
  usuarios: 'id, usuario, updatedAt',
})

// Helpers comunes
export const nuevoId = () => crypto.randomUUID()
export const ahora = () => Date.now()

export { db }
