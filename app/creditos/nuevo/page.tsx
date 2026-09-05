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
import { IconChevronLeft, IconSpinner } from '@/components/ui/icons'

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
  const conComa = /,\d{1,2}$/.test(s)
  let normalizado = s
  if (conComa) {
    normalizado = s.replace(/\./g, '').replace(',', '.')
  } else {
    normalizado = s.replace(/\.(\d{3})(?=\.|$)/g, '$1')
  }
  return parseFloat(normalizado) || 0
}

// Porcentaje sugerido de balón según plazo (mercado peruano)
function pctBalonSugerido(plazo: number): number {
  if (plazo <= 24) return 30
  if (plazo <= 36) return 35
  if (plazo <= 48) return 40
  if (plazo <= 60) return 45
  return 50
}

export default function NuevoCreditoPage() {
  const router = useRouter()

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
  const [cok, setCok] = useState('15')
  const [seguroVehicularPct, setSeguroVehicularPct] = useState('0.32')
  const [seguroDesgravamenPct, setSeguroDesgravamenPct] = useState('0.080')

  // Resultados
  const [resultado, setResultado] = useState<IResultadoCredito | null>(null)
  const [temCalculado, setTemCalculado] = useState(0)
  const [snapPrecio, setSnapPrecio] = useState(0)
  const [snapInicial, setSnapInicial] = useState(0)
  const [snapMontoFinanciar, setSnapMontoFinanciar] = useState(0)

  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const precioEditadoManualmente = useRef(false)
  const balonEditadoManualmente = useRef(false)

  useEffect(() => {
    Promise.all([getClientes(), getVehiculos()])
      .then(([c, v]) => { setClientes(c); setVehiculos(v) })
      .catch(() => setError('Error al cargar datos. Verifica la conexión.'))
      .finally(() => setLoadingData(false))
  }, [])

  useEffect(() => {
    precioEditadoManualmente.current = false
    if (!vehiculoId) return
    const v = vehiculos.find((x) => x.id === vehiculoId)
    if (!v) return
    setPrecioVehiculo((moneda === 'PEN' ? v.precio_soles : v.precio_dolares).toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculoId])

  useEffect(() => {
    if (precioEditadoManualmente.current) return
    if (!vehiculoId) return
    const v = vehiculos.find((x) => x.id === vehiculoId)
    if (!v) return
    setPrecioVehiculo((moneda === 'PEN' ? v.precio_soles : v.precio_dolares).toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moneda])

  // Auto-sugerir balón al activar compra inteligente o cambiar plazo/capital
  useEffect(() => {
    if (!esCompraInteligente || balonEditadoManualmente.current) return
    const plazo = parseInt(plazoMeses) || 0
    const capital = Math.max(0, parseNumPE(precioVehiculo) - parseNumPE(cuotaInicial))
    if (plazo < 12 || capital <= 0) return
    const pct = pctBalonSugerido(plazo)
    setMontoBalon((capital * pct / 100).toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esCompraInteligente, plazoMeses, precioVehiculo, cuotaInicial])

  // Valores derivados
  const simbolo = moneda === 'PEN' ? 'S/' : '$'
  const precioNum = parseNumPE(precioVehiculo)
  const inicialNum = parseNumPE(cuotaInicial)
  const montoFinanciar = Math.max(0, precioNum - inicialNum)
  const tasaNum = parseFloat(tasa) || 0
  const plazoNum = parseInt(plazoMeses) || 0
  const gtNum = parseInt(mesesGraciaTotal) || 0
  const gpNum = parseInt(mesesGraciaParcial) || 0
  const cokNum = parseFloat(cok) || 0
  const segVehNum = parseFloat(seguroVehicularPct) || 0
  const segDesgNum = parseFloat(seguroDesgravamenPct) || 0
  const balonNum = parseNumPE(montoBalon)

  const fmt = (n: number) =>
    `${simbolo} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtPct = (n: number, d = 4) => `${(n * 100).toFixed(d)}%`

  const getFechaFila = (numeroCuota: number): string => {
    const [y, m, d] = fechaInicio.split('-').map(Number)
    const f = new Date(y, m - 1, d)
    f.setMonth(f.getMonth() + numeroCuota)
    return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`
  }

  // Rangos del mercado peruano 2025-2026
  const precioMin = moneda === 'PEN' ? 15000 : 5000
  const precioMax = moneda === 'PEN' ? 500000 : 135000
  const tasaMin = tipoTasa === 'efectiva' ? 7 : 7
  const tasaMax = tipoTasa === 'efectiva' ? 25 : 28

  // Validaciones en tiempo real (solo para campos con valor ingresado)
  const inv = {
    precio:  precioNum > 0 && (precioNum < precioMin || precioNum > precioMax),
    inicial: precioNum > 0 && inicialNum > 0 && (inicialNum < precioNum * 0.10 || inicialNum > precioNum * 0.80),
    tasa:    tasaNum > 0 && (tasaNum < tasaMin || tasaNum > tasaMax),
    plazo:   plazoNum > 0 && (plazoNum < 12 || plazoNum > 84),
    gt:      gtNum > 3,
    gp:      gpNum > 3,
    gracia:  plazoNum > 0 && (gtNum + gpNum) >= plazoNum,
    cok:     cokNum > 0 && (cokNum < 8 || cokNum > 25),
    segVeh:  segVehNum > 0 && (segVehNum < 0.20 || segVehNum > 0.51),
    segDesg: segDesgNum > 0 && (segDesgNum < 0.058 || segDesgNum > 0.136),
    balon:   esCompraInteligente && montoFinanciar > 0 && balonNum > 0 &&
             (balonNum < montoFinanciar * 0.10 || balonNum > montoFinanciar * 0.50),
  }
  const hayErrores = Object.values(inv).some(Boolean)

  // Estimaciones de seguros para el helper text
  const segVehMensual = (segVehNum / 100) * precioNum
  const segDesgEstimado = (segDesgNum / 100) * montoFinanciar

  const inputBase = 'w-full box-border px-3.5 py-2.5 rounded-[11px] bg-(--surface-alt) outline-none text-sm text-(--ink) placeholder:text-(--ink-mute) transition-all focus:ring-3 focus:ring-(--gold-500)/15'
  const inputCls = (invalid = false) =>
    `${inputBase} border ${invalid ? 'border-(--bad) ring-1 ring-(--bad)/30' : 'border-(--border) focus:border-(--gold-500)'}`

  const labelCls = 'block text-sm font-medium text-(--ink-soft) mb-1'
  const helpCls = 'text-xs text-(--ink-mute) mt-1'
  const toggleActiveCls = 'bg-(--navy-900) text-white border-(--navy-900) scale-[1.02]'
  const toggleInactiveCls = 'bg-(--surface) text-(--ink) border-(--border) hover:bg-(--surface-alt) hover:-translate-y-px'

  const handleCalcular = () => {
    setError(null)
    setResultado(null)

    if (!clienteId) { setError('Selecciona un cliente.'); return }
    if (!vehiculoId) { setError('Selecciona un vehículo.'); return }
    if (!precioNum || precioNum <= 0) { setError('El precio del vehículo debe ser mayor que 0.'); return }
    if (montoFinanciar <= 0) { setError('El monto a financiar debe ser mayor que 0. Reduce la cuota inicial.'); return }
    if (!tasaNum || tasaNum <= 0) { setError('Ingresa una tasa de interés válida mayor que 0.'); return }
    if (!plazoNum || plazoNum < 1) { setError('El plazo debe ser al menos 1 mes.'); return }
    if (gtNum + gpNum >= plazoNum) {
      setError(`Los meses de gracia (${gtNum + gpNum}) deben ser menores que el plazo (${plazoNum}).`)
      return
    }
    if (esCompraInteligente && balonNum <= 0) {
      setError('Ingresa el monto balón/VFG para la compra inteligente.')
      return
    }
    if (esCompraInteligente && balonNum >= montoFinanciar) {
      setError('El monto balón debe ser menor que el capital a financiar.')
      return
    }
    if (hayErrores) {
      setError('Hay campos fuera del rango válido. Revisa los campos marcados en rojo.')
      return
    }

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
      plazoMeses: plazoNum,
      mesesGraciaTotal: gtNum,
      mesesGraciaParcial: gpNum,
      fechaInicio: new Date(y, m - 1, d),
      esCompraInteligente,
      montoBalon: esCompraInteligente ? balonNum : undefined,
      seguroVehicularPct: segVehNum,
      seguroDesgravamenPct: segDesgNum,
      precioVehiculo: precioNum,
    }

    try {
      const res = calcularCredito(params, cokNum / 100)
      setResultado(res)
      setTimeout(() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el cálculo. Verifica los parámetros.')
    }
  }

  const handleGuardar = async () => {
    if (!resultado) return
    setGuardando(true)
    setError(null)

    try {
      if (!clienteId) { setError('Selecciona un cliente.'); setGuardando(false); return }
      if (!vehiculoId) { setError('Selecciona un vehículo.'); setGuardando(false); return }

      const plazo = parseInt(plazoMeses)
      const gt = parseInt(mesesGraciaTotal) || 0
      const gp = parseInt(mesesGraciaParcial) || 0
      const balon = esCompraInteligente ? parseNumPE(montoBalon) : null

      if (!Number.isFinite(plazo) || plazo < 1) { setError('El plazo no es válido.'); setGuardando(false); return }
      if (!Number.isFinite(tasaNum) || tasaNum <= 0) { setError('La tasa no es válida.'); setGuardando(false); return }
      if (!Number.isFinite(snapPrecio) || snapPrecio <= 0) { setError('El precio no es válido. Vuelve a calcular.'); setGuardando(false); return }

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
        seguro_vehicular_pct: segVehNum,
        seguro_desgravamen_pct: segDesgNum,
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/creditos" className="group inline-flex items-center gap-1 text-(--ink-mute) hover:text-(--gold-600) text-sm font-medium transition-colors">
          <IconChevronLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-1" /> Volver al historial
        </Link>
        <h1 className="font-serif-display italic text-2xl font-semibold text-(--ink) mt-1.5">Generar Crédito FinAutoIQ</h1>
        <p className="text-(--ink-mute) mt-1 text-sm">Método francés con período de gracia y compra inteligente</p>
      </div>

      {error && (
        <div className="p-4 bg-(--bad)/10 border border-(--bad)/30 rounded-lg flex items-start gap-3">
          <span className="text-(--bad) text-lg shrink-0">⚠</span>
          <p className="text-sm text-(--bad)">{error}</p>
        </div>
      )}

      {loadingData ? (
        <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) p-12 text-center">
          <IconSpinner className="text-(--navy-900) mx-auto mb-3" size={32} />
          <p className="text-(--ink-mute) text-sm">Cargando clientes y vehículos...</p>
        </div>
      ) : (
        <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) p-6.5 space-y-8">

          {/* ── SECCIÓN 1: Participantes ── */}
          <section>
            <h2 className="text-sm font-bold text-(--ink) uppercase tracking-wider border-b border-(--gold-500)/30 pb-2.5 mb-4">
              Participantes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Cliente *</label>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={inputCls()}>
                  <option value="">-- Selecciona un cliente --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellidos} — DNI {c.dni}</option>
                  ))}
                </select>
                {clientes.length === 0 && (
                  <p className="text-xs text-(--gold-700) mt-1">No hay clientes. <Link href="/clientes/nuevo" className="underline">Crear uno</Link></p>
                )}
              </div>
              <div>
                <label className={labelCls}>Vehículo *</label>
                <select value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)} className={inputCls()}>
                  <option value="">-- Selecciona un vehículo --</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.anio}) — S/ {v.precio_soles.toLocaleString('es-PE')}</option>
                  ))}
                </select>
                {vehiculos.length === 0 && (
                  <p className="text-xs text-(--gold-700) mt-1">No hay vehículos. <Link href="/vehiculos/nuevo" className="underline">Agregar uno</Link></p>
                )}
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 2: Monto y Moneda ── */}
          <section>
            <h2 className="text-sm font-bold text-(--ink) uppercase tracking-wider border-b border-(--gold-500)/30 pb-2.5 mb-4">
              Monto y Moneda
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Moneda *</label>
                <div className="flex border border-(--border) rounded-lg overflow-hidden w-fit">
                  {(['PEN', 'USD'] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setMoneda(m)}
                      className={`px-5 py-2 text-sm font-semibold border-r last:border-r-0 border-(--border) transition-all duration-200 active:scale-95 ${moneda === m ? toggleActiveCls : toggleInactiveCls}`}>
                      {m === 'PEN' ? 'S/ Soles' : '$ Dólares'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Precio del vehículo ({simbolo}) *</label>
                  <input type="number" value={precioVehiculo}
                    onChange={(e) => { precioEditadoManualmente.current = true; setPrecioVehiculo(e.target.value) }}
                    placeholder={moneda === 'PEN' ? 'Ej: 45 000' : 'Ej: 12 000'}
                    min={precioMin} max={precioMax} step="100" className={inputCls(inv.precio)} />
                  <p className={helpCls}>Rango mercado peruano 2025-2026: {simbolo} {precioMin.toLocaleString('es-PE')} – {simbolo} {precioMax.toLocaleString('es-PE')}</p>
                  {inv.precio && <p className="text-xs text-(--bad) mt-0.5">Precio fuera del rango válido ({simbolo} {precioMin.toLocaleString('es-PE')} – {simbolo} {precioMax.toLocaleString('es-PE')})</p>}
                </div>
                <div>
                  <label className={labelCls}>Cuota inicial ({simbolo})</label>
                  <input type="number" value={cuotaInicial}
                    onChange={(e) => setCuotaInicial(e.target.value)}
                    placeholder="0" min="0" step="0.01" className={inputCls(inv.inicial)} />
                  <p className={helpCls}>Rango típico Perú: 10% – 80% del precio. Mín. 10% exigido por entidades financieras.</p>
                  {inv.inicial && <p className="text-xs text-(--bad) mt-0.5">La cuota inicial debe ser entre 10% y 80% del precio del vehículo</p>}
                </div>
                <div>
                  <label className={labelCls}>Monto a financiar (capital)</label>
                  <div className={`px-3.5 py-2.5 rounded-[11px] border text-sm font-bold ${
                    montoFinanciar > 0 ? 'bg-(--gold-100) border-(--gold-500)/50 text-(--gold-700)' : 'bg-(--bad)/10 border-(--bad)/40 text-(--bad)'
                  }`}>
                    {fmt(montoFinanciar)}
                  </div>
                  <p className={helpCls}>{fmt(precioNum)} − {fmt(inicialNum)} = <strong>{fmt(montoFinanciar)}</strong></p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 3: Condiciones del Crédito ── */}
          <section>
            <h2 className="text-sm font-bold text-(--ink) uppercase tracking-wider border-b border-(--gold-500)/30 pb-2.5 mb-4">
              Condiciones del Crédito
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Tipo de tasa *</label>
                <div className="flex border border-(--border) rounded-lg overflow-hidden w-fit">
                  {(['efectiva', 'nominal'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTipoTasa(t)}
                      className={`px-5 py-2 text-sm font-semibold border-r last:border-r-0 border-(--border) transition-all duration-200 active:scale-95 ${tipoTasa === t ? toggleActiveCls : toggleInactiveCls}`}>
                      {t === 'efectiva' ? 'TEA — Efectiva' : 'TNA — Nominal'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tipoTasa === 'nominal' && (
                  <div>
                    <label className={labelCls}>Capitalización *</label>
                    <select value={capitalizacion} onChange={(e) => setCapitalizacion(Number(e.target.value))} className={inputCls()}>
                      {CAP_OPCIONES.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className={labelCls}>
                    {tipoTasa === 'efectiva' ? 'TEA (%)' : capitalizacion === 12 ? 'TEM (%)' : 'TNA (%)'}
                    <span className="text-(--ink-mute) font-normal ml-1 text-xs">Rango: {tasaMin}%–{tasaMax}%</span>
                  </label>
                  <input type="number" value={tasa} onChange={(e) => setTasa(e.target.value)}
                    placeholder={tipoTasa === 'efectiva' ? '18.50' : capitalizacion === 12 ? '4.40' : '18.50'}
                    min={tasaMin} max={tasaMax} step="0.01" className={inputCls(inv.tasa)} />
                  <p className={helpCls}>Rango Perú 2025-2026: {tasaMin}% – {tasaMax}%. Referencial BCP/BBVA/Scotiabank.</p>
                  {inv.tasa && <p className="text-xs text-(--bad) mt-0.5">Tasa fuera del rango válido para el mercado peruano ({tasaMin}% – {tasaMax}%)</p>}
                </div>

                <div>
                  <label className={labelCls}>Plazo (meses) *</label>
                  <input type="number" value={plazoMeses} onChange={(e) => setPlazoMeses(e.target.value)}
                    placeholder="48" min="12" max="84" step="1" className={inputCls(inv.plazo)} />
                  <p className={helpCls}>Rango: 12 – 84 meses. Plazos comunes: 24, 36, 48, 60 meses.</p>
                  {inv.plazo && <p className="text-xs text-(--bad) mt-0.5">El plazo debe ser entre 12 y 84 meses</p>}
                </div>

                <div>
                  <label className={labelCls}>Fecha de inicio</label>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={inputCls()} />
                </div>
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 4: Período de Gracia ── */}
          <section>
            <h2 className="text-sm font-bold text-(--ink) uppercase tracking-wider border-b border-(--gold-500)/30 pb-2.5 mb-4">
              Período de Gracia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Meses de gracia total</label>
                <input type="number" value={mesesGraciaTotal} onChange={(e) => setMesesGraciaTotal(e.target.value)}
                  min="0" max="3" step="1" className={inputCls(inv.gt || inv.gracia)} />
                <p className={helpCls}>Rango: 0 – 3. Cuota = 0, intereses se capitalizan al saldo.</p>
                {inv.gt && <p className="text-xs text-(--bad) mt-0.5">Máximo 3 meses de gracia total</p>}
                {!inv.gt && inv.gracia && <p className="text-xs text-(--bad) mt-0.5">La suma de gracia debe ser menor al plazo</p>}
              </div>
              <div>
                <label className={labelCls}>Meses de gracia parcial</label>
                <input type="number" value={mesesGraciaParcial} onChange={(e) => setMesesGraciaParcial(e.target.value)}
                  min="0" max="3" step="1" className={inputCls(inv.gp || inv.gracia)} />
                <p className={helpCls}>Rango: 0 – 3. Cuota = solo intereses, saldo no varía.</p>
                {inv.gp && <p className="text-xs text-(--bad) mt-0.5">Máximo 3 meses de gracia parcial</p>}
                {!inv.gp && inv.gracia && <p className="text-xs text-(--bad) mt-0.5">La suma de gracia debe ser menor al plazo</p>}
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 5: Opciones Avanzadas ── */}
          <section>
            <h2 className="text-sm font-bold text-(--ink) uppercase tracking-wider border-b border-(--gold-500)/30 pb-2.5 mb-4">
              Opciones Avanzadas
            </h2>
            <div className="space-y-4">
              {/* Compra inteligente */}
              <div className="flex items-start gap-3">
                <input id="compra-inteligente" type="checkbox" checked={esCompraInteligente}
                  onChange={(e) => {
                    setEsCompraInteligente(e.target.checked)
                    if (!e.target.checked) {
                      balonEditadoManualmente.current = false
                      setMontoBalon('')
                    }
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-(--border) accent-(--navy-900) cursor-pointer" />
                <label htmlFor="compra-inteligente" className="text-sm font-semibold text-(--ink) cursor-pointer">
                  Compra Inteligente (Balón / VFG)
                  <span className="block text-xs text-(--ink-mute) font-normal">
                    Cuotas periódicas menores. Al final se paga un monto balón (Valor Futuro Garantizado).
                  </span>
                </label>
              </div>

              {esCompraInteligente && (
                <div className="ml-7 max-w-sm">
                  <label className={labelCls}>Monto Balón / VFG ({simbolo}) *</label>
                  <input type="number" value={montoBalon}
                    onChange={(e) => { balonEditadoManualmente.current = true; setMontoBalon(e.target.value) }}
                    placeholder="Ej: 15000" min="0" step="0.01" className={inputCls(inv.balon)} />
                  {montoFinanciar > 0 && plazoNum >= 12 && (
                    <p className={helpCls}>
                      Sugerido: {pctBalonSugerido(plazoNum)}% del monto a financiar según plazo → {fmt(montoFinanciar * pctBalonSugerido(plazoNum) / 100)}.
                      El balón representa el VFG. Rango válido: 10% – 50% del capital.
                    </p>
                  )}
                  {inv.balon && <p className="text-xs text-(--bad) mt-0.5">El balón debe ser entre 10% y 50% del monto a financiar</p>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* COK */}
                <div>
                  <label className={labelCls}>COK — Costo de Oportunidad (%)</label>
                  <input type="number" value={cok} onChange={(e) => setCok(e.target.value)}
                    placeholder="15" min="8" max="25" step="0.01" className={inputCls(inv.cok)} />
                  <p className={helpCls}>Rango Perú 2025-2026: 8% – 25%. Sugerido: 15% (ref. renta variable S&P Lima). Usado para el VAN.</p>
                  {inv.cok && <p className="text-xs text-(--bad) mt-0.5">El COK debe estar entre 8% y 25%</p>}
                </div>

                {/* Seguro Vehicular */}
                <div>
                  <label className={labelCls}>Seguro Vehicular (% mensual s/ valor vehículo)</label>
                  <input type="number" value={seguroVehicularPct}
                    onChange={(e) => setSeguroVehicularPct(e.target.value)}
                    placeholder="0.32" min="0.20" max="0.51" step="0.01" className={inputCls(inv.segVeh)} />
                  <p className={helpCls}>
                    Rango Perú: 0.20% – 0.51% mensual s/ valor vehículo. BBVA: 0.32%, BCP: ~0.35%, Pacífico: ~0.45%.
                    {precioNum > 0 && <> Est. mensual: <strong>{fmt(segVehMensual)}</strong></>}
                  </p>
                  {inv.segVeh && <p className="text-xs text-(--bad) mt-0.5">Rango válido: 0.20% – 0.51%</p>}
                </div>

                {/* Seguro de Desgravamen */}
                <div>
                  <label className={labelCls}>Seguro de Desgravamen (% mensual s/ saldo deudor)</label>
                  <input type="number" value={seguroDesgravamenPct}
                    onChange={(e) => setSeguroDesgravamenPct(e.target.value)}
                    placeholder="0.080" min="0.058" max="0.136" step="0.001" className={inputCls(inv.segDesg)} />
                  <p className={helpCls}>
                    Rango Perú: 0.058% – 0.136% mensual s/ saldo deudor. BBVA individual: 0.069%, con cónyuge: 0.136%, BCP: ~0.080%.
                    {montoFinanciar > 0 && <> Est. mensual fijo: <strong>{fmt(segDesgEstimado)}</strong></>}
                  </p>
                  {inv.segDesg && <p className="text-xs text-(--bad) mt-0.5">Rango válido: 0.058% – 0.136%</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Resumen de errores + Botón calcular */}
          <div className="pt-2 border-t border-(--border) space-y-3">
            {hayErrores && (
              <div className="p-3 bg-(--bad)/10 border border-(--bad)/30 rounded-lg text-sm text-(--bad) space-y-0.5">
                <p className="font-semibold mb-1">Corrige los siguientes campos antes de calcular:</p>
                {inv.precio && <p>• Precio del vehículo: rango {simbolo} {precioMin.toLocaleString('es-PE')} – {simbolo} {precioMax.toLocaleString('es-PE')}</p>}
                {inv.inicial && <p>• Cuota inicial: debe ser entre 10% y 80% del precio del vehículo</p>}
                {inv.tasa && <p>• Tasa de interés: debe estar entre {tasaMin}% y {tasaMax}%</p>}
                {inv.plazo && <p>• Plazo: debe ser entre 12 y 84 meses</p>}
                {inv.gt && <p>• Gracia total: máximo 3 meses</p>}
                {inv.gp && <p>• Gracia parcial: máximo 3 meses</p>}
                {inv.gracia && <p>• La suma de gracia ({gtNum + gpNum} meses) debe ser menor al plazo ({plazoNum} meses)</p>}
                {inv.cok && <p>• COK: debe estar entre 8% y 25%</p>}
                {inv.segVeh && <p>• Seguro vehicular: debe estar entre 0.20% y 0.51%</p>}
                {inv.segDesg && <p>• Seguro de desgravamen: debe estar entre 0.058% y 0.136%</p>}
                {inv.balon && <p>• Monto balón: debe ser entre 10% y 50% del monto a financiar</p>}
              </div>
            )}
            <button
              type="button"
              onClick={handleCalcular}
              disabled={hayErrores}
              className="w-full md:w-auto bg-(--navy-900) hover:bg-(--navy-800) active:bg-(--navy-950) disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-white font-bold py-3.5 px-12 rounded-[11px] text-base transition-all duration-200 shadow-[0_10px_24px_-10px_rgba(15,32,68,.5)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-10px_rgba(15,32,68,.6)] active:scale-[0.98]"
            >
              CALCULAR CRONOGRAMA
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ RESULTADOS ══════════════ */}
      {resultado && (
        <div id="resultados" className="space-y-6 animate-fade-up">

          <div className="bg-(--gold-100) border border-(--gold-500)/40 rounded-lg px-5 py-3 text-sm text-(--gold-700) flex items-center gap-3">
            <span className="text-lg">🔢</span>
            <span>
              <strong>TEM utilizada:</strong> {fmtPct(temCalculado, 6)} &nbsp;|&nbsp;
              <strong>TEA equivalente:</strong> {fmtPct(Math.pow(1 + temCalculado, 12) - 1, 4)}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard
              label="Cuota Total Mensual"
              value={cuotaNormal ? fmt(cuotaNormal.cuotaTotal) : 'Ver cronograma'}
              subtitle={cuotaNormal ? `Cuota francesa: ${fmt(cuotaNormal.cuota)}` : ''}
              variant="gold" big
            />
            <MetricCard label="Total a Pagar" value={fmt(resultado.totalPagado)} subtitle="Incluye seguros" variant="neutral" big />
            <MetricCard label="Total Intereses" value={fmt(resultado.totalIntereses)} variant="neutral" big />
            <MetricCard
              label="VAN"
              value={fmt(resultado.van)}
              subtitle={resultado.van >= 0 ? 'Favorable para el deudor' : 'Crédito costoso vs COK'}
              variant={resultado.van >= 0 ? 'good' : 'bad'}
            />
            <MetricCard label="TIR Mensual" value={fmtPct(resultado.tir)} subtitle="Solo cuota francesa" variant="neutral" />
            <MetricCard label="TCEA Anual" value={fmtPct(resultado.tcea, 4)} subtitle="Incluye seguros" variant="dark" />
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-5 text-xs text-(--ink-mute)">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-(--gold-500)/40" />
              Gracia total — cuota = 0, saldo crece
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-(--good)/40" />
              Gracia parcial — solo intereses
            </span>
            {esCompraInteligente && (
              <span className="flex items-center gap-1.5 text-(--navy-900) font-semibold">
                ⚡ Compra inteligente — la última cuota incluye el pago completo del balón (saldo final = 0)
              </span>
            )}
          </div>

          {/* Tabla cronograma */}
          <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between bg-(--navy-900)">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider m-0">Cronograma de Pagos</h2>
              <span className="text-xs text-white/60">{resultado.cronograma.length} cuotas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-230">
                <thead>
                  <tr className="bg-(--navy-800)">
                    {['N°', 'Fecha', 'Saldo Inicial', 'Interés', 'Amortización', 'Cuota', 'Seg. Veh.', 'Seg. Desgr.', 'Total Cuota', 'Saldo Final', 'Tipo'].map(
                      (h) => (
                        <th key={h} className="px-3 py-2.75 text-xs font-semibold text-white/90 whitespace-nowrap text-right first:text-left last:text-center">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {resultado.cronograma.map((fila) => {
                    const isGT = fila.tipoFila === 'gracia_total'
                    const isGP = fila.tipoFila === 'gracia_parcial'
                    const rowBg = isGT ? 'bg-(--gold-500)/13' : isGP ? 'bg-(--good)/10' : undefined
                    const badgeText = isGT ? 'G. Total' : isGP ? 'G. Parcial' : 'Normal'
                    const badgeCls = isGT
                      ? 'bg-(--gold-500)/22 text-(--gold-700)'
                      : isGP
                      ? 'bg-(--good)/20 text-(--good)'
                      : 'bg-(--surface-alt) text-(--ink-mute)'

                    return (
                      <tr key={fila.numeroCuota} className={`border-t border-(--border) hover:bg-(--gold-100) transition-colors ${rowBg ?? ''}`}>
                        <td className="px-3 py-2.25 font-semibold text-(--ink)">{fila.numeroCuota}</td>
                        <td className="px-3 py-2.25 text-right text-(--ink-mute) whitespace-nowrap text-xs">{getFechaFila(fila.numeroCuota)}</td>
                        <td className="px-3 py-2.25 text-right tabular-nums text-(--ink-soft)">{fila.saldoInicial.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.25 text-right tabular-nums font-semibold text-(--gold-600)">{fila.interes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.25 text-right tabular-nums text-(--ink) font-semibold">{fila.amortizacion.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.25 text-right tabular-nums text-(--ink-soft)">{fila.cuota.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.25 text-right tabular-nums text-(--good)">{fila.seguroVehicular.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.25 text-right tabular-nums text-(--good)">{fila.seguroDesgravamen.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.25 text-right tabular-nums font-bold text-(--ink)">{fila.cuotaTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.25 text-right tabular-nums text-(--ink-soft)">{fila.saldoFinal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2.25 text-center">
                          <span className={`text-[10px] px-2.25 py-0.75 rounded-full font-bold ${badgeCls}`}>{badgeText}</span>
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
              className="bg-linear-to-br from-(--gold-400) to-(--gold-600) disabled:opacity-50 text-(--navy-950) font-bold py-3.5 px-10 rounded-[11px] text-base transition-all duration-200 shadow-[0_10px_24px_-10px_rgba(198,160,82,.5)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-10px_rgba(198,160,82,.65)] active:scale-[0.98]"
            >
              {guardando ? 'Guardando...' : 'GUARDAR OPERACIÓN'}
            </button>
            <p className="text-xs text-(--ink-mute)">
              Se guardará la operación y el cronograma completo en la base de datos.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label, value, subtitle, variant, big,
}: {
  label: string; value: string; subtitle?: string; variant: string; big?: boolean
}) {
  if (variant === 'gold') {
    return (
      <div className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] bg-linear-to-br from-(--gold-400) to-(--gold-600) shadow-[0_10px_24px_-12px_rgba(198,160,82,.5)] hover:shadow-[0_16px_30px_-12px_rgba(198,160,82,.6)]">
        <div className="text-xs font-semibold mb-1 text-(--navy-950)/75">{label}</div>
        <div className={`font-bold leading-tight break-all tabular-nums text-(--navy-950) ${big ? 'text-2xl' : 'text-base'}`}>{value}</div>
        {subtitle && <div className="text-xs text-(--navy-950)/70 mt-1">{subtitle}</div>}
      </div>
    )
  }
  if (variant === 'dark') {
    return (
      <div className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] bg-linear-to-br from-(--navy-900) to-(--navy-950)">
        <div className="text-xs font-semibold mb-1 text-(--gold-400)">{label}</div>
        <div className={`font-bold leading-tight break-all tabular-nums text-white ${big ? 'text-2xl' : 'text-base'}`}>{value}</div>
        {subtitle && <div className="text-xs text-white/60 mt-1">{subtitle}</div>}
      </div>
    )
  }
  if (variant === 'good' || variant === 'bad') {
    const goodCls = 'border rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-(--shadow) bg-(--good)/10 border-(--good)/30'
    const badCls = 'border rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-(--shadow) bg-(--bad)/10 border-(--bad)/30'
    return (
      <div className={variant === 'good' ? goodCls : badCls}>
        <div className={`text-xs font-semibold mb-1 ${variant === 'good' ? 'text-(--good)' : 'text-(--bad)'}`}>{label}</div>
        <div className={`font-bold leading-tight break-all tabular-nums ${variant === 'good' ? 'text-(--good)' : 'text-(--bad)'} ${big ? 'text-2xl' : 'text-base'}`}>{value}</div>
        {subtitle && <div className="text-xs text-(--ink-soft) mt-1">{subtitle}</div>}
      </div>
    )
  }
  return (
    <div className="border border-(--border) rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-(--shadow) bg-(--surface-alt)">
      <div className="text-xs font-semibold mb-1 text-(--ink-mute)">{label}</div>
      <div className={`font-bold leading-tight break-all tabular-nums text-(--ink) ${big ? 'text-2xl' : 'text-base'}`}>{value}</div>
      {subtitle && <div className="text-xs text-(--ink-soft) mt-1">{subtitle}</div>}
    </div>
  )
}
