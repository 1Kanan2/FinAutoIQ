import { createClient } from '@/lib/supabase'

export interface Cliente {
  id: string
  nombre: string
  apellidos: string
  dni: string
  email: string
  telefono: string
  direccion: string
  created_at: string
}

export interface ClienteForm {
  nombre: string
  apellidos: string
  dni: string
  email: string
  telefono: string
  direccion: string
}

export async function getClientes(): Promise<Cliente[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clientes:', error)
    return []
  }

  return data || []
}

export async function getClienteById(id: string): Promise<Cliente | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching cliente:', error)
    return null
  }

  return data
}

export async function createCliente(cliente: ClienteForm): Promise<Cliente | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clientes')
    .insert([
      {
        ...cliente,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating cliente:', error)
    throw new Error(error.message)
  }

  return data
}

export async function updateCliente(
  id: string,
  cliente: ClienteForm
): Promise<Cliente | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clientes')
    .update({
      ...cliente,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating cliente:', error)
    throw new Error(error.message)
  }

  return data
}

export async function deleteCliente(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('clientes').delete().eq('id', id)

  if (error) {
    console.error('Error deleting cliente:', error)
    throw new Error(error.message)
  }

  return true
}
