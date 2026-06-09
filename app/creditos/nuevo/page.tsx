'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getClientes, type Cliente } from '@/lib/supabase-clients'
import { getVehiculos, type Vehiculo } from '@/lib/supabase-vehicles'
import {
  calcularCredito,
  tnaATem,
  teaATem,
  type IParametrosCredito,
  type IResultadoCredito,
} from '@/lib/financiero'
import { createOperacion, type OperacionForm } from '@/lib/supabase-creditos'

/*
 * Desarrollado por: Keyner Hancco
 * GitHub: https://github.com/1Kanan2
 * keynerivan@outlook.com
 */

const CAP_OPCIONES = [
  { label: 'Diaria (360)', value: 360 },
  { label: 'Mensual (12)', value: 12 },
  { label: 'Bimestral (6)', value: 6 },
  { label: 'Trimestral (4)', value: 4 },
  { label: 'Semestral (2)', value: 2 },
  { label: 'Anual (1)', value: 1 },
]

const hoy = () => new Date().toISOString().split('T')[0]

// parsea números en formato peruano (23.700,50) o inglés (23700.50)
function parseNumPE(s: string): number {
  if (!s) return 0
  // coma decimal: "23.700,50" → quitar puntos, cambiar coma
  const conComa = /,\d{1,2}$/.test(s)
  let normalizado = s
  if (conComa) {
    normalizado = s.replace(/\./g, '').replace(',', '.')
  } else {
    // sin coma: "23.700" → si el punto va antes de 3 dígitos finales, es miles
    normalizado = s.replace(/\.(\d{3})(?=\.|$)/g, '$1')
  }
  return parseFloat(normalizado) || 0
}

export default function NuevoCreditoPage() {
  const router = useRouter()

  // Datos externos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Campos del formulario
  const [clienteId, setClienteId] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [moneda, setMoneda] = useState<'PEN' | 'USD'>('PEN')
  const [precioVehiculo, setPrecioVehiculo] = useState('')
  const [cuotaInicial, setCuotaInicial] = useState('0')
  const [tipoTasa, setTipoTasa] = useState<'efectiva' | 'nominal'>('efectiva')
  const [capitalizacion, setCapitalizacion] = useState(360)
  const [tasa, setTasa] = useState('')
  const [plazoMeses, setPlazoMeses] = useState('')
  const [fechaInicio, setFechaInicio] = useState(hoy())
  const [mesesGraciaTotal, setMesesGraciaTotal] = useState('0')
  const [mesesGraciaParcial, setMesesGraciaParcial] = useState('0')
  const [esCompraInteligente, setEsCompraInteligente] = useState(false)
  const [montoBalon, setMontoBalon] = useState('')
  const [cok, setCok] = useState('12')
  const [costosAdicionales, setCostosAdicionales] = useState('0')

  // Resultados
  const [resultado, setResultado] = useState<IResultadoCredito | null>(null)
  const [temCalculado, setTemCalculado] = useState(0)
  // snapshot al calcular — guardar usa estos valores aunque el usuario edite después
  const [snapPrecio, setSnapPrecio] = useState(0)
  const [snapInicial, setSnapInicial] = useState(0)
  const [snapMontoFinanciar, setSnapMontoFinanciar] = useState(0)

  // Estado UI
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Cargar clientes y vehículos
  useEffect(() => {
    Promise.all([getClientes(), getVehiculos()])
      .then(([c, v]) => {
        setClientes(c)
        setVehiculos(v)
      })
      .catch(() => setError('Error al cargar datos. Verifica la conexión.'))
      .finally(() => setLoadingData(false))
  }, [])

  // true si el usuario tocó el precio; evita sobreescribir su edición
  const precioEditadoManualmente = useRef(false)

  useEffect(() => {
    // al elegir vehículo: resetear y autocompletar precio
    precioEditadoManualmente.current = false
    if (!vehiculoId) return
    const v = vehiculos.find((x) => x.id === vehiculoId)
    if (!v) return
    const precio = moneda === 'PEN' ? v.precio_soles : v.precio_dolares
    setPrecioVehiculo(precio.toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculoId])

  useEffect(() => {
    // al cambiar moneda: actualizar precio si no fue editado
    if (precioEditadoManualmente.current) return
    if (!vehiculoId) return
    const v = vehiculos.find((x) => x.id === vehiculoId)
    if (!v) return
    const precio = moneda === 'PEN' ? v.precio_soles : v.precio_dolares
    setPrecioVehiculo(precio.toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moneda])

  const simbolo = moneda === 'PEN' ? 'S/' : '$'
  const precioNum = parseNumPE(precioVehiculo)
  const inicialNum = parseNumPE(cuotaInicial)
  const montoFinanciar = Math.max(0, precioNum - inicialNum)

  const fmt = (n: number) =>
    `${simbolo} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtPct = (n: number, d = 4) => `${(n * 100).toFixed(d)}%`

  const getFechaFila = (numeroCuota: number): string => {
    const [y, m, d] = fechaInicio.split('-').map(Number)
    const f = new Date(y, m - 1, d)
    f.setMonth(f.getMonth() + numeroCuota)
    return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`
  }

  // calcular
  const handleCalcular = () => {
    setError(null)
    setResultado(null)

    if (!clienteId) { setError('Selecciona un cliente.'); return }
    if (!vehiculoId) { setError('Selecciona un vehículo.'); return }
    if (isNaN(precioNum) || precioNum <= 0) { setError('El precio del vehículo debe ser mayor que 0.'); return }
    if (inicialNum < 0) { setError('La cuota inicial no puede ser negativa.'); return }
    if (montoFinanciar <= 0) { setError('El monto a financiar debe ser mayor que 0. Reduce la cuota inicial.'); return }

    const tasaNum = parseFloat(tasa)
    if (isNaN(tasaNum) || tasaNum <= 0) { setError('Ingresa una tasa de interés válida mayor que 0.'); return }

    const plazo = parseInt(plazoMeses)
    if (isNaN(plazo) || plazo < 1) { setError('El plazo debe ser al menos 1 mes.'); return }

    const gt = parseInt(mesesGraciaTotal) || 0
    const gp = parseInt(mesesGraciaParcial) || 0
    if (gt < 0 || gp < 0) { setError('Los períodos de gracia no pueden ser negativos.'); return }
    if (gt + gp >= plazo) {
      setError(`Los meses de gracia (${gt + gp}) deben ser menores que el plazo (${plazo}).`)
      return
    }

    const cokNum = parseFloat(cok) || 0
    const costos = parseFloat(costosAdicionales) || 0
    const balon = esCompraInteligente ? parseNumPE(montoBalon) : 0

    if (esCompraInteligente && balon <= 0) {
      setError('Ingresa el monto balón/VFG para la compra inteligente.')
      return
    }
    if (esCompraInteligente && balon >= montoFinanciar) {
      setError('El monto balón debe ser menor que el capital a financiar.')
      return
    }

    // convierte tasa a TEM (m=12 → TEM directo; otros → TNA anual)
    let tem: number
    if (tipoTasa === 'efectiva') {
      tem = teaATem(tasaNum / 100)
    } else if (capitalizacion === 12) {
      tem = tasaNum / 100
    } else {
      tem = tnaATem(tasaNum / 100, capitalizacion)
    }

    if (tem <= 0 || !isFinite(tem)) {
      setError('La tasa ingresada produce un TEM inválido. Verifica los valores.')
      return
    }

    setTemCalculado(tem)
    setSnapPrecio(precioNum)
    setSnapInicial(inicialNum)
    setSnapMontoFinanciar(montoFinanciar)

    const [y, m, d] = fechaInicio.split('-').map(Number)
    const params: IParametrosCredito = {
      capital: montoFinanciar,
      tem,
      plazoMeses: plazo,
      mesesGraciaTotal: gt,
      mesesGraciaParcial: gp,
      fechaInicio: new Date(y, m - 1, d),
      esCompraInteligente,
      montoBalon: esCompraInteligente ? balon : undefined,
    }

    try {
      const res = calcularCredito(params, cokNum / 100, costos)
      setResultado(res)
      setTimeout(() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el cálculo. Verifica los parámetros.')
    }
  }

  // guardar
  const handleGuardar = async () => {
    if (!resultado) return
    setGuardando(true)
    setError(null)

    try {
      if (!clienteId) { setError('Selecciona un cliente antes de guardar.'); setGuardando(false); return }
      if (!vehiculoId) { setError('Selecciona un vehículo antes de guardar.'); setGuardando(false); return }

      const plazo = parseInt(plazoMeses)
      const gt = parseInt(mesesGraciaTotal) || 0
      const gp = parseInt(mesesGraciaParcial) || 0
      const tasaNum = parseFloat(tasa)
      const cokNum = parseFloat(cok) || 0
      const costos = parseFloat(costosAdicionales) || 0
      const balon = esCompraInteligente ? parseNumPE(montoBalon) : null

      if (!Number.isFinite(plazo) || plazo < 1) { setError('El plazo no es válido.'); setGuardando(false); return }
      if (!Number.isFinite(tasaNum) || tasaNum <= 0) { setError('La tasa no es válida.'); setGuardando(false); return }
      if (!Number.isFinite(snapPrecio) || snapPrecio <= 0) { setError('El precio del vehículo no es válido. Vuelve a calcular.'); setGuardando(false); return }

      const form: OperacionForm = {
        cliente_id: clienteId,
        vehiculo_id: vehiculoId,
        moneda,
        precio_vehiculo: snapPrecio,
        cuota_inicial: snapInicial,
        monto_financiar: snapMontoFinanciar,
        tipo_tasa: tipoTasa,
        tasa_interes: tasaNum,
        capitalizacion: tipoTasa === 'nominal' ? capitalizacion : null,
        tem: temCalculado,
        plazo_meses: plazo,
        meses_gracia_total: gt,
        meses_gracia_parcial: gp,
        es_compra_inteligente: esCompraInteligente,
        monto_balon: balon,
        cok: cokNum,
        costos_adicionales: costos,
        van: resultado.van,
        tir: resultado.tir,
        tcea: resultado.tcea,
        total_intereses: resultado.totalIntereses,
        total_pagado: resultado.totalPagado,
      }

      const [y, m, d] = fechaInicio.split('-').map(Number)
      const operacionId = await createOperacion(form, resultado.cronograma, new Date(y, m - 1, d))
      router.push(`/creditos/${operacionId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Error al guardar la operación. Revisa la consola para más detalles.')
      setGuardando(false)
    }
  }

  const cuotaNormal = resultado?.cronograma.find((f) => f.tipoFila === 'normal')

  const inputCls = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c9a84c]/10 focus:border-[#c9a84c] outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1'
  const toggleActiveCls = 'bg-[#0f2044] text-white border-[#0f2044]'
  const toggleInactiveCls = 'bg-white text-[#0f2044] border-slate-200 hover:bg-slate-50'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/creditos" className="text-[#0f2044] hover:text-[#1a3260] text-sm font-medium transition-colors">
          ← Volver al historial
        </Link>
        <h1 className="text-3xl font-bold text-[#0f2044] mt-1">Generar Crédito FinAutoIQ</h1>
        <p className="text-slate-500 mt-1">Método francés con período de gracia y compra inteligente</p>
      </div>

      {/* Error global */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <span className="text-red-500 text-lg shrink-0">⚠</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loadingData ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <svg className="animate-spin h-8 w-8 text-[#0f2044] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-500 text-sm">Cargando clientes y vehículos...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6 space-y-8">

          {/* ── SECCIÓN 1: Participantes ── */}
          <section>
            <h2 className="text-sm font-bold text-[#0f2044] uppercase tracking-wider border-b border-[#c9a84c]/30 pb-2 mb-4">
              Participantes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Cliente *</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellidos} — DNI {c.dni}
                    </option>
                  ))}
                </select>
                {clientes.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No hay clientes.{' '}
                    <Link href="/clientes/nuevo" className="underline">Crear uno</Link>
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Vehículo *</label>
                <select
                  value={vehiculoId}
                  onChange={(e) => setVehiculoId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Selecciona un vehículo --</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} ({v.anio}) — S/ {v.precio_soles.toLocaleString('es-PE')}
                    </option>
                  ))}
                </select>
                {vehiculos.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No hay vehículos.{' '}
                    <Link href="/vehiculos/nuevo" className="underline">Agregar uno</Link>
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 2: Monto y Moneda ── */}
          <section>
            <h2 className="text-sm font-bold text-[#0f2044] uppercase tracking-wider border-b border-[#c9a84c]/30 pb-2 mb-4">
              Monto y Moneda
            </h2>
            <div className="space-y-4">
              {/* Moneda toggle */}
              <div>
                <label className={labelCls}>Moneda *</label>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden w-fit">
                  {(['PEN', 'USD'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMoneda(m)}
                      className={`px-5 py-2 text-sm font-semibold border-r last:border-r-0 transition ${
                        moneda === m ? toggleActiveCls : toggleInactiveCls
                      }`}
                    >
                      {m === 'PEN' ? 'S/ Soles' : '$ Dólares'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Precio del vehículo ({simbolo}) *</label>
                  <input
                    type="number"
                    value={precioVehiculo}
                    onChange={(e) => {
                      precioEditadoManualmente.current = true
                      setPrecioVehiculo(e.target.value)
                    }}
                    placeholder="Ej: 45000"
                    min="0"
                    step="0.01"
                    className={inputCls}
                  />
                  <p className="text-xs text-gray-400 mt-1">Auto-completado al elegir vehículo</p>
                </div>
                <div>
                  <label className={labelCls}>Cuota inicial ({simbolo})</label>
                  <input
                    type="number"
                    value={cuotaInicial}
                    onChange={(e) => setCuotaInicial(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Monto a financiar (capital)</label>
                  <div className={`px-3 py-2 rounded-lg border text-sm font-bold ${
                    montoFinanciar > 0
                      ? 'bg-[#0f2044]/5 border-[#c9a84c]/50 text-[#0f2044]'
                      : 'bg-red-50 border-red-300 text-red-600'
                  }`}>
                    {fmt(montoFinanciar)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {fmt(precioNum)} − {fmt(inicialNum)} = <strong>{fmt(montoFinanciar)}</strong>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 3: Condiciones del Crédito ── */}
          <section>
            <h2 className="text-sm font-bold text-[#0f2044] uppercase tracking-wider border-b border-[#c9a84c]/30 pb-2 mb-4">
              Condiciones del Crédito
            </h2>
            <div className="space-y-4">
              {/* Tipo de tasa toggle */}
              <div>
                <label className={labelCls}>Tipo de tasa *</label>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden w-fit">
                  {(['efectiva', 'nominal'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipoTasa(t)}
                      className={`px-5 py-2 text-sm font-semibold border-r last:border-r-0 transition ${
                        tipoTasa === t ? toggleActiveCls : toggleInactiveCls
                      }`}
                    >
                      {t === 'efectiva' ? 'TEA — Efectiva' : 'TNA — Nominal'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Capitalización (solo nominal) */}
                {tipoTasa === 'nominal' && (
                  <div>
                    <label className={labelCls}>Capitalización *</label>
                    <select
                      value={capitalizacion}
                      onChange={(e) => setCapitalizacion(Number(e.target.value))}
                      className={inputCls}
                    >
                      {CAP_OPCIONES.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className={labelCls}>
                    {tipoTasa === 'efectiva'
                      ? 'TEA — Tasa Efectiva Anual (%)'
                      : capitalizacion === 12
                        ? 'TEM — Tasa Mensual Efectiva (%)'
                        : 'TNA — Tasa Nominal Anual (%)'}
                    <span className="text-gray-400 font-normal ml-1 text-xs">
                      ej: {tipoTasa === 'nominal' && capitalizacion === 12 ? '4.40' : '18.5'}
                    </span>
                  </label>
                  <input
                    type="number"
                    value={tasa}
                    onChange={(e) => setTasa(e.target.value)}
                    placeholder={tipoTasa === 'nominal' && capitalizacion === 12 ? '4.40' : '18.5'}
                    min="0"
                    step="0.001"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Plazo (meses) *</label>
                  <input
                    type="number"
                    value={plazoMeses}
                    onChange={(e) => setPlazoMeses(e.target.value)}
                    placeholder="36"
                    min="1"
                    step="1"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Fecha de inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 4: Período de Gracia ── */}
          <section>
            <h2 className="text-sm font-bold text-[#0f2044] uppercase tracking-wider border-b border-[#c9a84c]/30 pb-2 mb-4">
              Período de Gracia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Meses de gracia total</label>
                <input
                  type="number"
                  value={mesesGraciaTotal}
                  onChange={(e) => setMesesGraciaTotal(e.target.value)}
                  min="0"
                  step="1"
                  className={inputCls}
                />
                <p className="text-xs text-yellow-700 mt-1 bg-yellow-50 px-2 py-1 rounded">
                  Cuota = 0. Los intereses se capitalizan al saldo.
                </p>
              </div>
              <div>
                <label className={labelCls}>Meses de gracia parcial</label>
                <input
                  type="number"
                  value={mesesGraciaParcial}
                  onChange={(e) => setMesesGraciaParcial(e.target.value)}
                  min="0"
                  step="1"
                  className={inputCls}
                />
                <p className="text-xs text-blue-700 mt-1 bg-blue-50 px-2 py-1 rounded">
                  Cuota = solo intereses. El saldo no varía.
                </p>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 5: Opciones Avanzadas ── */}
          <section>
            <h2 className="text-sm font-bold text-[#0f2044] uppercase tracking-wider border-b border-[#c9a84c]/30 pb-2 mb-4">
              Opciones Avanzadas
            </h2>
            <div className="space-y-4">
              {/* Compra inteligente */}
              <div className="flex items-start gap-3">
                <input
                  id="compra-inteligente"
                  type="checkbox"
                  checked={esCompraInteligente}
                  onChange={(e) => setEsCompraInteligente(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#0f2044] focus:ring-[#c9a84c]/40 cursor-pointer"
                />
                <label htmlFor="compra-inteligente" className="text-sm font-semibold text-[#0f2044] cursor-pointer">
                  Compra Inteligente (Balón / VFG)
                  <span className="block text-xs text-slate-500 font-normal">
                    Las cuotas periódicas son menores. Al final se paga un monto balón acordado.
                  </span>
                </label>
              </div>

              {esCompraInteligente && (
                <div className="ml-7 max-w-xs">
                  <label className={labelCls}>Monto Balón / VFG ({simbolo}) *</label>
                  <input
                    type="number"
                    value={montoBalon}
                    onChange={(e) => setMontoBalon(e.target.value)}
                    placeholder="Ej: 15000"
                    min="0"
                    step="0.01"
                    className={inputCls}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    COK — Costo de Oportunidad del deudor (%)
                  </label>
                  <input
                    type="number"
                    value={cok}
                    onChange={(e) => setCok(e.target.value)}
                    placeholder="12"
                    min="0"
                    step="0.01"
                    className={inputCls}
                  />
                  <p className="text-xs text-gray-400 mt-1">Usado para calcular el VAN</p>
                </div>
                <div>
                  <label className={labelCls}>
                    Costos adicionales ({simbolo})
                  </label>
                  <input
                    type="number"
                    value={costosAdicionales}
                    onChange={(e) => setCostosAdicionales(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={inputCls}
                  />
                  <p className="text-xs text-gray-400 mt-1">Comisiones, seguros, gastos notariales, etc.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── BOTÓN CALCULAR ── */}
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCalcular}
              className="w-full md:w-auto bg-[#0f2044] hover:bg-[#1a3260] active:bg-[#0a1a38] text-white font-bold py-3 px-12 rounded-lg text-base transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              CALCULAR CRONOGRAMA
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ RESULTADOS ══════════════ */}
      {resultado && (
        <div id="resultados" className="space-y-6">

          {/* TEM calculado */}
          <div className="bg-[#0f2044]/5 border border-[#c9a84c]/40 rounded-lg px-5 py-3 text-sm text-[#0f2044] flex items-center gap-3">
            <span className="text-lg">🔢</span>
            <span>
              <strong>TEM utilizada:</strong> {fmtPct(temCalculado, 6)} &nbsp;|&nbsp;
              <strong>TEA equivalente:</strong> {fmtPct(Math.pow(1 + temCalculado, 12) - 1, 4)}
            </span>
          </div>

          {/* Tarjetas de métricas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard
              label="Cuota Mensual"
              value={cuotaNormal ? fmt(cuotaNormal.cuota) : 'Ver cronograma'}
              subtitle={cuotaNormal?.tipoFila === 'normal' ? 'Cuotas normales' : ''}
              color="gold"
              big
            />
            <MetricCard
              label="Total a Pagar"
              value={fmt(resultado.totalPagado)}
              color="neutral"
              big
            />
            <MetricCard
              label="Total Intereses"
              value={fmt(resultado.totalIntereses)}
              color="orange"
              big
            />
            <MetricCard
              label="VAN"
              value={fmt(resultado.van)}
              subtitle={resultado.van >= 0 ? 'Favorable para el deudor' : 'Crédito costoso vs COK'}
              color={resultado.van >= 0 ? 'green' : 'red'}
            />
            <MetricCard
              label="TIR Mensual"
              value={fmtPct(resultado.tir)}
              subtitle="Tasa interna de retorno"
              color="purple"
            />
            <MetricCard
              label="TCEA Anual"
              value={fmtPct(resultado.tcea, 4)}
              subtitle="Costo efectivo anual total"
              color="dark"
            />
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></span>
              Gracia total — cuota = 0, saldo crece
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-300"></span>
              Gracia parcial — solo intereses
            </span>
            {esCompraInteligente && (
              <span className="flex items-center gap-1.5 text-[#0f2044] font-semibold">
                ⚡ Compra inteligente — el saldo final de la última cuota representa el balón a pagar
              </span>
            )}
          </div>

          {/* Tabla cronograma */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between bg-[#0f2044]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cronograma de Pagos</h2>
              <span className="text-xs text-white/60">{resultado.cronograma.length} cuotas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1a3260]/80">
                    {['N°', 'Fecha', 'Saldo Inicial', 'Interés', 'Amortización', 'Cuota', 'Saldo Final', 'Tipo'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-xs font-semibold text-white/90 whitespace-nowrap text-right first:text-left last:text-center"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resultado.cronograma.map((fila, idx) => {
                    const isGT = fila.tipoFila === 'gracia_total'
                    const isGP = fila.tipoFila === 'gracia_parcial'
                    const rowBg = isGT ? 'bg-yellow-50' : isGP ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'
                    const badgeText = isGT ? 'G. Total' : isGP ? 'G. Parcial' : 'Normal'
                    const badgeCls = isGT
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : isGP
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'

                    return (
                      <tr key={fila.numeroCuota} className={`${rowBg} hover:bg-[#fefce8] transition-colors duration-100`}>
                        <td className="px-3 py-2 font-semibold text-[#0f2044]">{fila.numeroCuota}</td>
                        <td className="px-3 py-2 text-right text-slate-500 whitespace-nowrap text-xs">
                          {getFechaFila(fila.numeroCuota)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                          {fila.saldoInicial.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: '#b8960c' }}>
                          {fila.interes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-[#0f2044] font-medium">
                          {fila.amortizacion.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900">
                          {fila.cuota.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                          {fila.saldoFinal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeCls}`}>
                            {badgeText}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botón guardar */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pb-6">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="bg-[#c9a84c] hover:bg-[#b8960c] disabled:bg-[#c9a84c]/50 text-[#0f2044] font-bold py-3 px-10 rounded-lg text-base transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              {guardando ? 'Guardando...' : 'GUARDAR OPERACIÓN'}
            </button>
            <p className="text-xs text-slate-500">
              Se guardará la operación y el cronograma completo en la base de datos.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  subtitle,
  color,
  big,
}: {
  label: string
  value: string
  subtitle?: string
  color: string
  big?: boolean
}) {
  const palette: Record<string, string> = {
    gold:    'bg-[#c9a84c]/10 border-[#c9a84c]/40 text-[#b8960c]',
    orange:  'bg-orange-50   border-orange-200   text-orange-700',
    green:   'bg-green-50    border-green-200    text-green-700',
    red:     'bg-red-50      border-red-200      text-red-700',
    purple:  'bg-purple-50   border-purple-200   text-purple-700',
    dark:    'bg-[#0f2044]/10 border-[#0f2044]/20 text-[#0f2044]',
    neutral: 'bg-slate-50    border-slate-200    text-slate-700',
  }
  return (
    <div className={`border rounded-xl p-4 hover:shadow-md transition-shadow duration-200 ${palette[color] ?? palette.neutral}`}>
      <div className="text-xs font-medium opacity-60 mb-1">{label}</div>
      <div className={`font-bold leading-tight break-all ${big ? 'text-xl' : 'text-base'}`}>{value}</div>
      {subtitle && <div className="text-xs opacity-60 mt-1">{subtitle}</div>}
    </div>
  )
}
