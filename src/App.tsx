import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabaseConfigurado } from './lib/supabase'
import { sincronizar } from './db/sync'
import { useAuth } from './auth/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Socios from './pages/Socios'
import SocioDetalle from './pages/SocioDetalle'
import Turnos from './pages/Turnos'
import TurnoDetalle from './pages/TurnoDetalle'
import Pagos from './pages/Pagos'
import Promociones from './pages/Promociones'
import Asistencia from './pages/Asistencia'
import Rutinas from './pages/Rutinas'
import RutinasSocio from './pages/RutinasSocio'
import Gastos from './pages/Gastos'
import Deudores from './pages/Deudores'
import Ajustes from './pages/Ajustes'
import Usuarios from './pages/Usuarios'

export default function App() {
  const { usuario, cargando } = useAuth()

  // Sincronización automática: al iniciar y cada vez que vuelve la conexión.
  useEffect(() => {
    if (!supabaseConfigurado) return
    const sync = () => {
      if (navigator.onLine) sincronizar().catch((e) => console.warn('Sync:', e))
    }
    sync()
    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [])

  if (cargando) return null
  if (!usuario) return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="socios" element={<Socios />} />
        <Route path="socios/:id" element={<SocioDetalle />} />
        <Route path="turnos" element={<Turnos />} />
        <Route path="turnos/:id" element={<TurnoDetalle />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="promociones" element={<Promociones />} />
        <Route path="asistencia" element={<Asistencia />} />
        <Route path="rutinas" element={<Rutinas />} />
        <Route path="rutinas/:socioId" element={<RutinasSocio />} />
        <Route path="gastos" element={<Gastos />} />
        <Route path="deudores" element={<Deudores />} />
        <Route path="ajustes" element={<Ajustes />} />
        <Route path="usuarios" element={<Usuarios />} />
      </Route>
    </Routes>
  )
}
