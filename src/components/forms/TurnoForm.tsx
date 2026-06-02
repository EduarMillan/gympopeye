import { useState } from 'react'
import type { Turno } from '../../db/db'
import { crearTurno, actualizarTurno } from '../../db/turnos'
import { TextField } from '../ui/TextField'
import Button from '../ui/Button'

type Props = {
  turno?: Turno
  onDone: () => void
}

export default function TurnoForm({ turno, onDone }: Props) {
  const [inicio, setInicio] = useState(turno?.inicio ?? '06:00')
  const [fin, setFin] = useState(turno?.fin ?? '07:00')
  const [capacidad, setCapacidad] = useState(String(turno?.capacidad ?? 20))
  const [guardando, setGuardando] = useState(false)

  const valido = inicio && fin && Number(capacidad) > 0 && !guardando

  async function guardar() {
    if (!valido) return
    setGuardando(true)
    const datos = { inicio, fin, capacidad: Number(capacidad) }
    if (turno) await actualizarTurno(turno.id, datos)
    else await crearTurno(datos)
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Inicio"
          type="time"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
        />
        <TextField
          label="Fin"
          type="time"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
        />
      </div>

      <TextField
        label="Capacidad (máx. de socios) *"
        type="number"
        inputMode="numeric"
        value={capacidad}
        onChange={(e) => setCapacidad(e.target.value)}
        placeholder="20"
      />

      <Button onClick={guardar} disabled={!valido}>
        {turno ? 'Guardar cambios' : 'Crear turno'}
      </Button>
    </div>
  )
}
