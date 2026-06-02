import { useState } from 'react'
import type { Usuario, Rol } from '../../db/db'
import { crearUsuario, actualizarUsuario } from '../../db/usuarios'
import { TextField, PasswordField } from '../ui/TextField'
import { SelectField } from '../ui/SelectField'
import Button from '../ui/Button'

type Props = {
  usuario?: Usuario
  onDone: () => void
}

export default function UsuarioForm({ usuario, onDone }: Props) {
  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [acceso, setAcceso] = useState(usuario?.usuario ?? '')
  const [rol, setRol] = useState<Rol>(usuario?.rol ?? 'admin')
  const [password, setPassword] = useState('')
  const [pregunta, setPregunta] = useState(usuario?.preguntaSeguridad ?? '')
  const [respuesta, setRespuesta] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const esNuevo = !usuario
  const valido =
    nombre.trim() && acceso.trim() && (!esNuevo || password.length >= 4) && !guardando

  async function guardar() {
    setError('')
    if (esNuevo && password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.')
      return
    }
    setGuardando(true)
    try {
      if (usuario) {
        await actualizarUsuario(usuario.id, {
          nombre,
          usuario: acceso,
          rol,
          password: password || undefined,
          pregunta,
          respuesta: respuesta || undefined,
        })
      } else {
        await crearUsuario({
          nombre,
          usuario: acceso,
          rol,
          password,
          pregunta: pregunta.trim() || undefined,
          respuesta: respuesta.trim() || undefined,
        })
      }
      onDone()
    } catch {
      setError('No se pudo guardar.')
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Nombre *"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre del admin"
        autoFocus
      />
      <TextField
        label="Usuario *"
        value={acceso}
        onChange={(e) => setAcceso(e.target.value)}
        autoCapitalize="none"
        placeholder="usuario de acceso"
      />
      <SelectField
        label="Rol"
        value={rol}
        onChange={(e) => setRol(e.target.value as Rol)}
      >
        <option value="admin">Admin</option>
        <option value="superadmin">Superadmin</option>
      </SelectField>
      <PasswordField
        label={esNuevo ? 'Contraseña *' : 'Nueva contraseña (opcional)'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={esNuevo ? '' : 'Dejar vacío para no cambiar'}
      />
      <TextField
        label="Pregunta de seguridad"
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        placeholder="Opcional (para recuperar contraseña)"
      />
      <TextField
        label={esNuevo ? 'Respuesta' : 'Nueva respuesta (opcional)'}
        value={respuesta}
        onChange={(e) => setRespuesta(e.target.value)}
        placeholder="Opcional"
      />

      {error && <p className="text-body-md text-error">{error}</p>}

      <Button onClick={guardar} disabled={!valido}>
        {esNuevo ? 'Crear usuario' : 'Guardar cambios'}
      </Button>
    </div>
  )
}
