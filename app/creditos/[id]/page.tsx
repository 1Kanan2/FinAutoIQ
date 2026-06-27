'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getOperacionById, getCuotasByOperacion, type Operacion, type CuotaBD } from '@/lib/supabase-creditos'

/*
 * Desarrollado por: Keyner Hancco
 * GitHub: https://github.com/1Kanan2
 * keynerivan@outlook.com
 */

export default function CreditoDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [operacion, setOperacion] = useState<Operacion | null>(null)
  const [cuotas, setCuotas] = useState<CuotaBD[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [op, cus] = await Promise.all([getOperacionById(id), getCuotasByOperacion(id)])
        if (!op) { setError('Operación no encontrada'); return }
        setOperacion(op)
        setCuotas(cus)
      } catch { setError('Error al cargar la operación') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <svg className="animate-spin h-9 w-9 text-[#0f2044] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-500 text-sm">Cargando operación...</p>
        </div>
      </div>
    )
  }

  if (error || !operacion) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-red-600 text-lg mb-4">{error || 'Operación no encontrada'}</p>
        <Link href="/creditos" className="text-[#0f2044] hover:text-[#1a3260] font-semibold transition-colors">
          ← Volver al historial
        </Link>
      </div>
    )
  }

  const simbolo = operacion.moneda === 'PEN' ? 'S/' : '$'
  const fmt = (n: number) =>
    `${simbolo} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtPct = (n: number, d = 4) => `${(n * 100).toFixed(d)}%`

  const segVehMensual = ((operacion.seguro_vehicular_pct ?? 0.32) / 100) * operacion.precio_vehiculo
  const segDesgMensual = ((operacion.seguro_desgravamen_pct ?? 0.069) / 100) * operacion.monto_financiar

  const rowBg = (tipo: string, i: number) => {
    if (tipo === 'gracia_total') return 'bg-yellow-50'
    if (tipo === 'gracia_parcial') return 'bg-blue-50'
    return i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'
  }

  const tipoLabel = (tipo: string) => {
    if (tipo === 'gracia_total') return { text: 'G. Total', cls: 'bg-yellow-100 text-yellow-800 border border-yellow-200' }
    if (tipo === 'gracia_parcial') return { text: 'G. Parcial', cls: 'bg-blue-100 text-blue-800 border border-blue-200' }
    return { text: 'Normal', cls: 'bg-slate-100 text-slate-600 border border-slate-200' }
  }

  const cuotaNormal = cuotas.find((c) => c.tipo === 'normal')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
        <div>
          <Link href="/creditos" className="text-[#0f2044] hover:text-[#1a3260] text-sm font-medium transition-colors">
            ← Volver al historial
          </Link>
          <h1 className="text-3xl font-bold text-[#0f2044] mt-1">Detalle del Crédito</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {operacion.clientes?.nombre} {operacion.clientes?.apellidos} &mdash;{' '}
            {operacion.vehiculos?.marca} {operacion.vehiculos?.modelo}
          </p>
        </div>
        <span className="text-sm text-slate-400 mt-1 shrink-0">
          {new Date(operacion.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-md border-l-[3px] border-[#c9a84c] p-6 space-y-3">
          <h2 className="font-bold text-[#0f2044] text-sm uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
            Participantes y Monto
          </h2>
          <InfoRow label="Cliente" value={`${operacion.clientes?.nombre} ${operacion.clientes?.apellidos}`} />
          <InfoRow label="DNI" value={operacion.clientes?.dni ?? '-'} />
          <InfoRow label="Vehículo" value={`${operacion.vehiculos?.marca} ${operacion.vehiculos?.modelo} (${operacion.vehiculos?.anio})`} />
          <InfoRow label="Moneda" value={operacion.moneda === 'PEN' ? 'Soles (PEN)' : 'Dólares (USD)'} />
          <InfoRow label="Precio vehículo" value={fmt(operacion.precio_vehiculo)} />
          <InfoRow label="Cuota inicial" value={fmt(operacion.cuota_inicial)} />
          <InfoRow label="Monto financiado" value={fmt(operacion.monto_financiar)} bold />
        </div>

        <div className="bg-white rounded-xl shadow-md border-l-[3px] border-[#c9a84c] p-6 space-y-3">
          <h2 className="font-bold text-[#0f2044] text-sm uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
            Condiciones del Crédito
          </h2>
          <InfoRow label="Tipo de tasa" value={operacion.tipo_tasa === 'efectiva' ? 'TEA (Efectiva)' : 'TNA (Nominal)'} />
          <InfoRow label="Tasa ingresada" value={`${operacion.tasa_interes}%`} />
          {operacion.capitalizacion && (
            <InfoRow label="Capitalización" value={`${operacion.capitalizacion} períodos/año`} />
          )}
          <InfoRow label="TEM calculada" value={fmtPct(operacion.tem, 6)} />
          <InfoRow label="Plazo" value={`${operacion.plazo_meses} meses`} />
          <InfoRow label="Gracia total" value={`${operacion.meses_gracia_total} meses`} />
          <InfoRow label="Gracia parcial" value={`${operacion.meses_gracia_parcial} meses`} />
          <InfoRow
            label="Compra inteligente"
            value={operacion.es_compra_inteligente ? `Sí — balón ${operacion.monto_balon ? fmt(operacion.monto_balon) : '-'}` : 'No'}
          />
          <InfoRow label="COK" value={`${operacion.cok}%`} />
          <InfoRow label="Seg. Vehicular" value={`${operacion.seguro_vehicular_pct ?? 0.32}% mensual s/ vehículo`} />
          <InfoRow label="Seg. Desgravamen" value={`${operacion.seguro_desgravamen_pct ?? 0.069}% mensual s/ capital financiado`} />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Cuota Total Mensual"
          value={cuotaNormal ? fmt(cuotaNormal.cuota + segVehMensual + segDesgMensual) : '-'}
          variant="gold"
        />
        <MetricCard label="Total a Pagar" value={fmt(operacion.total_pagado)} variant="neutral" />
        <MetricCard label="Total Intereses" value={fmt(operacion.total_intereses)} variant="orange" />
        <MetricCard label="VAN" value={fmt(operacion.van)} variant={operacion.van >= 0 ? 'green' : 'red'} />
        <MetricCard label="TIR mensual" value={fmtPct(operacion.tir)} variant="purple" />
        <MetricCard label="TCEA anual" value={fmtPct(operacion.tcea, 2)} variant="dark" />
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></span>
          Período de gracia total (cuota = 0, saldo crece)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-300"></span>
          Período de gracia parcial (solo intereses)
        </span>
      </div>

      {/* Cronograma */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#0f2044]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cronograma de Pagos</h2>
          <span className="text-xs text-white/60">{cuotas.length} cuotas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a3260]/80">
                {['N°', 'Fecha', 'Saldo Inicial', 'Interés', 'Amortización', 'Cuota', 'Seg. Veh.', 'Seg. Desgr.', 'Total Cuota', 'Saldo Final', 'Tipo'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-xs font-semibold text-white/90 whitespace-nowrap text-right first:text-left last:text-center">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuotas.map((fila, i) => {
                const badge = tipoLabel(fila.tipo)
                const cuotaTotalFila = fila.cuota + segVehMensual + segDesgMensual
                return (
                  <tr key={fila.numero_cuota} className={`${rowBg(fila.tipo, i)} hover:bg-[#fefce8] transition-colors duration-100`}>
                    <td className="px-3 py-2 font-semibold text-[#0f2044]">{fila.numero_cuota}</td>
                    <td className="px-3 py-2 text-right text-slate-500 whitespace-nowrap text-xs">
                      {new Date(fila.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">{fila.saldo_inicial.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: '#b8960c' }}>{fila.interes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[#0f2044] font-medium">{fila.amortizacion.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">{fila.cuota.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{segVehMensual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{segDesgMensual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900">{cuotaTotalFila.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">{fila.saldo_final.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-slate-400 shrink-0 text-xs">{label}</span>
      <span className={`text-right ${bold ? 'font-bold text-[#0f2044] text-base' : 'font-medium text-slate-800'}`}>
        {value}
      </span>
    </div>
  )
}

function MetricCard({ label, value, variant }: { label: string; value: string; variant: string }) {
  type CardStyle = { container: string; label: string; value: string }
  const styles: Record<string, CardStyle> = {
    gold:    { container: 'bg-amber-50 border border-amber-200',   label: 'text-amber-700',  value: 'text-slate-900' },
    neutral: { container: 'bg-slate-50 border border-slate-200',   label: 'text-slate-500',  value: 'text-slate-900' },
    orange:  { container: 'bg-orange-50 border border-orange-200', label: 'text-orange-700', value: 'text-orange-900' },
    green:   { container: 'bg-green-50 border border-green-200',   label: 'text-green-700',  value: 'text-green-900' },
    red:     { container: 'bg-red-50 border border-red-200',       label: 'text-red-700',    value: 'text-red-900' },
    purple:  { container: 'bg-purple-50 border border-purple-200', label: 'text-purple-700', value: 'text-purple-900' },
    dark:    { container: 'bg-slate-100 border border-slate-300',  label: 'text-slate-600',  value: 'text-slate-900' },
  }
  const s = styles[variant] ?? styles.neutral
  return (
    <div className={`rounded-xl p-3 text-center hover:shadow-md transition-shadow duration-200 ${s.container}`}>
      <div className={`text-[10px] font-semibold mb-1 leading-tight uppercase tracking-wide ${s.label}`}>{label}</div>
      <div className={`text-sm font-bold leading-snug break-all tabular-nums ${s.value}`}>{value}</div>
    </div>
  )
}
