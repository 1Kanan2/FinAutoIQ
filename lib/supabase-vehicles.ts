import { createClient } from '@/lib/supabase'

export interface Vehiculo {
  id: string
  marca: string
  modelo: string
  anio: number
  precio_soles: number
  precio_dolares: number
  created_at: string
}

export interface VehiculoForm {
  marca: string
  modelo: string
  anio: number
  precio_soles: number
  precio_dolares: number
}

export async function getVehiculos(): Promise<Vehiculo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehiculos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching vehiculos:', error)
    return []
  }

  return data || []
}

export async function getVehiculoById(id: string): Promise<Vehiculo | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vehiculo:', error)
    return null
  }

  return data
}

export async function createVehiculo(vehiculo: VehiculoForm): Promise<Vehiculo | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehiculos')
    .insert([
      {
        ...vehiculo,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating vehiculo:', error)
    throw new Error(error.message)
  }

  return data
}

export async function updateVehiculo(
  id: string,
  vehiculo: VehiculoForm
): Promise<Vehiculo | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehiculos')
    .update({
      ...vehiculo,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating vehiculo:', error)
    throw new Error(error.message)
  }

  return data
}

export async function deleteVehiculo(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('vehiculos').delete().eq('id', id)

  if (error) {
    console.error('Error deleting vehiculo:', error)
    throw new Error(error.message)
  }

  return true
}
