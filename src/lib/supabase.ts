import { createClient } from '@supabase/supabase-js'

// Las claves se leen de variables de entorno (.env.local). Si no están, la
// app sigue funcionando 100% offline y solo se deshabilita la sync automática.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigurado = Boolean(url && key)

export const supabase = supabaseConfigurado ? createClient(url!, key!) : null
