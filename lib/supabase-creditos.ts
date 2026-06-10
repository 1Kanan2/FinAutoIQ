import { createClient } from '@/lib/supabase'
import type { IFilaCronograma } from './financiero'

/*
 * Desarrollado por: Keyner Hancco
 * GitHub: https://github.com/1Kanan2
 * keynerivan@outlook.com
 */

export interface Operacion {
  id: string
  cliente_id: string
  vehiculo_id: string
  moneda: 'PEN' | 'USD'
  precio_vehiculo: number
  cuota_inicial: number
  monto_financiar: number
  tipo_tasa: 'efectiva' | 'nominal'
  tasa_interes: number
  capitalizacion: number | null
  tem: number
  plazo_meses: number
  meses_gracia_total: number
  meses_gracia_parcial: number
  es_compra_inteligente: boolean
  monto_balon: number | null
  cok: number
  seguro_vehicular_pct: number
  seguro_desgravamen_pct: number
  van: number
  tir: number
  tcea: number
  total_intereses: number
  total_pagado: number
  created_at: string
  clientes?: { nombre: string; apellidos: string; dni: string } | null
  vehiculos?: { marca: string; modelo: string; anio: number } | null
}

export interface OperacionForm {
  cliente_id: string
  vehiculo_id: string
  moneda: 'PEN' | 'USD'
  precio_vehiculo: number
  cuota_inicial: number
  monto_financiar: number
  tipo_tasa: 'efectiva' | 'nominal'
  tasa_interes: number
  capitalizacion: number | null
  tem: number
  plazo_meses: number
  meses_gracia_total: number
  meses_gracia_parcial: number
  es_compra_inteligente: boolean
  monto_balon: number | null
  cok: number
  seguro_vehicular_pct: number
  seguro_desgravamen_pct: number
  van: number
  tir: number
  tcea: number
  total_intereses: number
  total_pagado: number
}

export interface CuotaBD {
  id: string
  operacion_id: string
  numero_cuota: number
  fecha_vencimiento: string
  saldo_inicial: number
  interes: number
  amortizacion: number
  cuota: number
  saldo_final: number
  tipo: 'normal' | 'gracia_total' | 'gracia_parcial'
}

export async function getOperaciones(): Promise<Operacion[]> {
  const supabase = createClient()

  const { data: ops, error } = await supabase
    .from('operaciones')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !ops || ops.length === 0) {
    if (error) console.error('Error fetching operaciones:', error)
    return ops ?? []
  }

  const clienteIds = [...new Set(ops.map((o) => o.cliente_id))]
  const vehiculoIds = [...new Set(ops.map((o) => o.vehiculo_id))]

  const [{ data: clientes }, { data: vehiculos }] = await Promise.all([
    supabase.from('clientes').select('*').in('id', clienteIds),
    supabase.from('vehiculos').select('*').in('id', vehiculoIds),
  ])

  const cMap = Object.fromEntries((clientes ?? []).map((c) => [c.id, c]))
  const vMap = Object.fromEntries((vehiculos ?? []).map((v) => [v.id, v]))

  return ops.map((op) => ({
    ...op,
    clientes: cMap[op.cliente_id] ?? null,
    vehiculos: vMap[op.vehiculo_id] ?? null,
  }))
}

export async function getOperacionById(id: string): Promise<Operacion | null> {
  const supabase = createClient()

  const { data: op, error } = await supabase
    .from('operaciones')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !op) {
    if (error) console.error('Error fetching operacion:', error)
    return null
  }

  const { data: vehiculo } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('id', op.vehiculo_id)
    .single()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', op.cliente_id)
    .single()

  return {
    ...op,
    clientes: cliente,
    vehiculos: vehiculo,
  }
}

export async function getCuotasByOperacion(operacionId: string): Promise<CuotaBD[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cuotas')
    .select('*')
    .eq('operacion_id', operacionId)
    .order('numero_cuota', { ascending: true })

  if (error) {
    console.error('Error fetching cuotas:', error)
    return []
  }
  return data || []
}

function logSupabaseError(context: string, error: unknown) {
  const e = error as Record<string, unknown>
  console.error(`[${context}] code:`, e?.code)
  console.error(`[${context}] message:`, e?.message)
  console.error(`[${context}] details:`, e?.details)
  console.error(`[${context}] hint:`, e?.hint)
  console.error(`[${context}] raw:`, JSON.stringify(error, Object.getOwnPropertyNames(error)))
}

function sanitizeNum(v: number | null | undefined, fallback = 0): number | null {
  if (v === null || v === undefined) return null
  return Number.isFinite(v) ? v : fallback
}

export async function createOperacion(
  form: OperacionForm,
  cronograma: IFilaCronograma[],
  fechaInicio: Date
): Promise<string> {
  const supabase = createClient()

  // limpia NaN/Infinity antes de guardar en supabase
  const payload = {
    cliente_id: form.cliente_id,
    vehiculo_id: form.vehiculo_id,
    moneda: form.moneda,
    precio_vehiculo: sanitizeNum(form.precio_vehiculo) ?? 0,
    cuota_inicial: sanitizeNum(form.cuota_inicial) ?? 0,
    monto_financiar: sanitizeNum(form.monto_financiar) ?? 0,
    tipo_tasa: form.tipo_tasa,
    tasa_interes: sanitizeNum(form.tasa_interes) ?? 0,
    capitalizacion: form.capitalizacion,
    tem: sanitizeNum(form.tem) ?? 0,
    plazo_meses: form.plazo_meses,
    meses_gracia_total: form.meses_gracia_total,
    meses_gracia_parcial: form.meses_gracia_parcial,
    es_compra_inteligente: form.es_compra_inteligente,
    monto_balon: sanitizeNum(form.monto_balon),
    cok: sanitizeNum(form.cok) ?? 0,
    seguro_vehicular_pct: sanitizeNum(form.seguro_vehicular_pct) ?? 0,
    seguro_desgravamen_pct: sanitizeNum(form.seguro_desgravamen_pct) ?? 0,
    van: sanitizeNum(form.van) ?? 0,
    tir: sanitizeNum(form.tir) ?? 0,
    tcea: sanitizeNum(form.tcea) ?? 0,
    total_intereses: sanitizeNum(form.total_intereses) ?? 0,
    total_pagado: sanitizeNum(form.total_pagado) ?? 0,
  }

  console.log('[createOperacion] payload:', JSON.stringify(payload, null, 2))

  const { data, error } = await supabase
    .from('operaciones')
    .insert([payload])
    .select('id')
    .single()

  if (error) {
    logSupabaseError('operaciones INSERT', error)
    throw new Error(error.message || `Error al guardar la operación (código: ${error.code ?? 'desconocido'})`)
  }

  const operacionId = data.id

  const cuotasData = cronograma.map((fila) => {
    const fecha = new Date(
      fechaInicio.getFullYear(),
      fechaInicio.getMonth() + fila.numeroCuota,
      fechaInicio.getDate()
    )
    const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
    return {
      operacion_id: operacionId,
      numero_cuota: fila.numeroCuota,
      fecha_vencimiento: fechaStr,
      saldo_inicial: sanitizeNum(fila.saldoInicial) ?? 0,
      interes: sanitizeNum(fila.interes) ?? 0,
      amortizacion: sanitizeNum(fila.amortizacion) ?? 0,
      cuota: sanitizeNum(fila.cuota) ?? 0,
      saldo_final: sanitizeNum(fila.saldoFinal) ?? 0,
      tipo: fila.tipoFila,
    }
  })

  const { error: cuotasError } = await supabase.from('cuotas').insert(cuotasData)

  if (cuotasError) {
    logSupabaseError('cuotas INSERT', cuotasError)
    await supabase.from('operaciones').delete().eq('id', operacionId)
    throw new Error(cuotasError.message || `Error al guardar el cronograma (código: ${cuotasError.code ?? 'desconocido'})`)
  }

  return operacionId
}

export async function deleteOperacion(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('operaciones').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}
