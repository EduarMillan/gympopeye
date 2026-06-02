import { useMemo, useState, type ChangeEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera } from 'lucide-react'
import { db, type Socio } from '../../db/db'
import { crearSocio, actualizarSocio } from '../../db/socios'
import { etiquetaTurno } from '../../db/turnos'
import { hoyISO } from '../../lib/format'
import { comprimirImagen } from '../../lib/imagen'
import { TextField, TextArea } from '../ui/TextField'
import { SelectField } from '../ui/SelectField'
import Button from '../ui/Button'

type Props = {
  socio?: Socio
  onDone: () => void
}

export default function SocioForm({ socio, onDone }: Props) {
  const [nombre, setNombre] = useState(socio?.nombre ?? '')
  const [telefono, setTelefono] = useState(socio?.telefono ?? '')
  const [fechaInscripcion, setFecha] = useState(
    socio?.fechaInscripcion ?? hoyISO(),
  )
  const [turnoId, setTurnoId] = useState(socio?.turnoId ?? '')
  const [precioMensual, setPrecio] = useState(
    socio?.precioMensual != null ? String(socio.precioMensual) : '',
  )
  const [activo, setActivo] = useState(socio?.activo ?? true)
  const [notas, setNotas] = useState(socio?.notas ?? '')
  const [foto, setFoto] = useState<string | undefined>(socio?.foto)
  const [guardando, setGuardando] = useState(false)

  const turnos = useLiveQuery(
    () => db.turnos.filter((t) => !t.eliminado).sortBy('inicio'),
    [],
  )
  const socios = useLiveQuery(
    () => db.socios.filter((s) => !s.eliminado).toArray(),
    [],
  )

  // Cuántos socios hay por turno (excluyendo a este si se está editando).
  const conteoTurno = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of socios ?? []) {
      if (socio && s.id === socio.id) continue
      if (s.turnoId) m.set(s.turnoId, (m.get(s.turnoId) ?? 0) + 1)
    }
    return m
  }, [socios, socio])

  async function onFoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setFoto(await comprimirImagen(file))
    } catch {
      // Si algo falla, no bloquea el alta del socio (queda sin foto).
    }
  }

  async function guardar() {
    if (!nombre.trim() || guardando) return
    setGuardando(true)
    const datos = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
      fechaInscripcion,
      turnoId: turnoId || undefined,
      precioMensual: precioMensual ? Number(precioMensual) : undefined,
      activo,
      notas: notas.trim() || undefined,
      foto,
    }
    if (socio) await actualizarSocio(socio.id, datos)
    else await crearSocio(datos)
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Foto */}
      <label className="mx-auto flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-surface-variant bg-surface-container-low text-on-surface-variant">
        {foto ? (
          <img src={foto} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera size={28} strokeWidth={2} />
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFoto}
        />
      </label>

      <TextField
        label="Nombre *"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre y apellidos"
        autoFocus
      />
      <TextField
        label="Teléfono"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        inputMode="tel"
        placeholder="Opcional"
      />

      <SelectField
        label="Turno"
        value={turnoId}
        onChange={(e) => setTurnoId(e.target.value)}
      >
        <option value="">Sin turno</option>
        {(turnos ?? []).map((t) => {
          const usados = conteoTurno.get(t.id) ?? 0
          const lleno = usados >= t.capacidad
          return (
            <option key={t.id} value={t.id}>
              {etiquetaTurno(t)} ({usados}/{t.capacidad})
              {lleno ? ' — LLENO' : ''}
            </option>
          )
        })}
      </SelectField>

      <TextField
        label="Precio mensual"
        type="number"
        inputMode="decimal"
        value={precioMensual}
        onChange={(e) => setPrecio(e.target.value)}
        placeholder="Mensualidad de este socio"
      />

      <TextField
        label="Fecha de inscripción"
        type="date"
        value={fechaInscripcion}
        onChange={(e) => setFecha(e.target.value)}
      />

      <label className="flex items-center justify-between rounded border-2 border-surface-variant bg-surface-container-low px-3 py-2.5 text-label-lg font-semibold uppercase tracking-wide text-on-surface-variant">
        Activo
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="h-5 w-5 accent-primary-container"
        />
      </label>

      <TextArea
        label="Notas"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Opcional"
      />

      <Button onClick={guardar} disabled={!nombre.trim() || guardando}>
        {socio ? 'Guardar cambios' : 'Agregar socio'}
      </Button>
    </div>
  )
}
