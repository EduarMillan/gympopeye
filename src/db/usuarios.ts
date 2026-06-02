import { db, nuevoId, ahora, type Usuario, type Rol } from './db'

// --- Cifrado de contraseñas (PBKDF2, WebCrypto) --------------------------

const enc = new TextEncoder()

function bytesABase64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function base64ABytes(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64)
  const bytes = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i)
  return bytes
}

async function derivar(password: string, salt: BufferSource): Promise<string> {
  const base = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    base,
    256,
  )
  return bytesABase64(new Uint8Array(bits))
}

async function hashConSal(valor: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivar(valor, salt)
  return { hash, salt: bytesABase64(salt) }
}

const normalizar = (s: string) => s.trim().toLowerCase()

// --- Operaciones ----------------------------------------------------------

export type NuevoUsuario = {
  nombre: string
  usuario: string
  rol: Rol
  password: string
  pregunta?: string
  respuesta?: string
}

export async function crearUsuario(data: NuevoUsuario): Promise<Usuario> {
  const pass = await hashConSal(data.password)
  const ts = ahora()
  const usuario: Usuario = {
    id: nuevoId(),
    nombre: data.nombre.trim(),
    usuario: normalizar(data.usuario),
    rol: data.rol,
    passwordHash: pass.hash,
    salt: pass.salt,
    createdAt: ts,
    updatedAt: ts,
  }
  if (data.pregunta && data.respuesta) {
    const r = await hashConSal(normalizar(data.respuesta))
    usuario.preguntaSeguridad = data.pregunta.trim()
    usuario.respuestaHash = r.hash
    usuario.respuestaSalt = r.salt
  }
  await db.usuarios.add(usuario)
  return usuario
}

export async function actualizarUsuario(
  id: string,
  cambios: {
    nombre?: string
    usuario?: string
    rol?: Rol
    password?: string
    pregunta?: string
    respuesta?: string
  },
): Promise<void> {
  const parche: Partial<Usuario> = { updatedAt: ahora() }
  if (cambios.nombre !== undefined) parche.nombre = cambios.nombre.trim()
  if (cambios.usuario !== undefined) parche.usuario = normalizar(cambios.usuario)
  if (cambios.rol !== undefined) parche.rol = cambios.rol
  if (cambios.password) {
    const p = await hashConSal(cambios.password)
    parche.passwordHash = p.hash
    parche.salt = p.salt
  }
  if (cambios.pregunta !== undefined) parche.preguntaSeguridad = cambios.pregunta.trim()
  if (cambios.respuesta) {
    const r = await hashConSal(normalizar(cambios.respuesta))
    parche.respuestaHash = r.hash
    parche.respuestaSalt = r.salt
  }
  await db.usuarios.update(id, parche)
}

/** Pregunta de seguridad de un usuario (para la recuperación). */
export async function obtenerPregunta(
  usuario: string,
): Promise<{ pregunta: string } | null> {
  const u = await db.usuarios.where('usuario').equals(normalizar(usuario)).first()
  if (!u || u.eliminado || !u.preguntaSeguridad) return null
  return { pregunta: u.preguntaSeguridad }
}

/**
 * Verifica la respuesta de seguridad y, si es correcta, cambia la contraseña.
 * Devuelve true si se restableció.
 */
export async function recuperarPassword(
  usuario: string,
  respuesta: string,
  nuevaPassword: string,
): Promise<boolean> {
  const u = await db.usuarios.where('usuario').equals(normalizar(usuario)).first()
  if (!u || u.eliminado || !u.respuestaHash || !u.respuestaSalt) return false
  const hash = await derivar(normalizar(respuesta), base64ABytes(u.respuestaSalt))
  if (hash !== u.respuestaHash) return false
  await actualizarUsuario(u.id, { password: nuevaPassword })
  return true
}

export async function eliminarUsuario(id: string): Promise<void> {
  await db.usuarios.update(id, { eliminado: true, updatedAt: ahora() })
}

/** Valida credenciales contra la base local. Devuelve el usuario o null. */
export async function verificarCredenciales(
  usuario: string,
  password: string,
): Promise<Usuario | null> {
  const u = await db.usuarios
    .where('usuario')
    .equals(usuario.trim().toLowerCase())
    .first()
  if (!u || u.eliminado) return null
  const hash = await derivar(password, base64ABytes(u.salt))
  return hash === u.passwordHash ? u : null
}

/** ¿Existe al menos un usuario (para saber si hay que crear el superadmin)? */
export async function hayUsuarios(): Promise<boolean> {
  const n = await db.usuarios.filter((u) => !u.eliminado).count()
  return n > 0
}
