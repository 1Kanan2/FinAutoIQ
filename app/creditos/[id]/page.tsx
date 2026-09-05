'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getOperacionById, getCuotasByOperacion, type Operacion, type CuotaBD } from '@/lib/supabase-creditos'
import {
  IconChevronLeft, IconPersonSolo, IconDoc, IconWallet, IconTrendUp, IconChartRise, IconTarget, IconPercent, IconSpinner,
} from '@/components/ui/icons'

/*
 * Desarrollado por: Keyner Hancco
 * GitHub: https://github.com/1Kanan2
 * keynerivan@outlook.com
 */

function iniciales(nombre?: string, apellidos?: string): string {
  const parts = `${nombre ?? ''} ${apellidos ?? ''}`.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?'
}

function buildBars(cuotas: CuotaBD[]) {
  const chartH = 170
  const chartW = 640
  const n = cuotas.length
  if (n === 0) return []
  const gap = 3
  const w = (chartW - gap * (n - 1)) / n
  const max = Math.max(...cuotas.map((c) => c.interes + c.amortizacion), 1) * 1.1
  return cuotas.map((c, i) => {
    const grace = c.tipo !== 'normal'
    const hAmort = (c.amortizacion / max) * chartH
    const hInt = Math.max((c.interes / max) * chartH, 1.5)
    const x = i * (w + gap)
    const yAmort = chartH - hAmort
    const yInt = yAmort - hInt
    return {
      key: c.numero_cuota,
      x: x.toFixed(1), w: w.toFixed(1),
      yAmort: yAmort.toFixed(1), hAmort: hAmort.toFixed(1), hasAmort: c.amortizacion > 0,
      yInt: yInt.toFixed(1), hInt: hInt.toFixed(1), grace,
    }
  })
}

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
          <IconSpinner className="text-(--navy-900) mx-auto mb-3" size={34} />
          <p className="text-(--ink-mute) text-sm">Cargando operación...</p>
        </div>
      </div>
    )
  }

  if (error || !operacion) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-(--bad) text-lg mb-4">{error || 'Operación no encontrada'}</p>
        <Link href="/creditos" className="text-(--navy-700) hover:text-(--navy-900) font-semibold transition-colors">
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

  const tipoLabel = (tipo: string) => {
    if (tipo === 'gracia_total') return { text: 'G. Total', cls: 'bg-(--gold-500)/22 text-(--gold-700)' }
    if (tipo === 'gracia_parcial') return { text: 'G. Parcial', cls: 'bg-(--good)/20 text-(--good)' }
    return { text: 'Normal', cls: 'bg-(--surface-alt) text-(--ink-mute)' }
  }
  const rowBg = (tipo: string) => {
    if (tipo === 'gracia_total') return 'bg-(--gold-500)/13'
    if (tipo === 'gracia_parcial') return 'bg-(--good)/10'
    return undefined
  }

  const cuotaNormal = cuotas.find((c) => c.tipo === 'normal')
  const bars = buildBars(cuotas)

  return (
    <div className="space-y-5.5">
      {/* Header */}
      <div>
        <Link href="/creditos" className="group inline-flex items-center gap-1 text-(--ink-mute) hover:text-(--gold-600) text-[11px] uppercase tracking-[1.5px] font-semibold transition-colors">
          <IconChevronLeft size={12} className="transition-transform duration-200 group-hover:-translate-x-1" /> Historial
        </Link>
        <h1 className="font-serif-display italic text-2xl font-semibold text-(--ink) mt-1">Detalle del Crédito</h1>
      </div>

      {/* HERO */}
      <div className="bg-linear-to-br from-(--navy-900) to-(--navy-950) rounded-[20px] px-7 py-6.5 flex items-center justify-between flex-wrap gap-4 relative overflow-hidden shadow-[0_20px_50px_-22px_rgba(15,32,68,.55)] transition-shadow duration-300 hover:shadow-[0_24px_58px_-20px_rgba(15,32,68,.65)]">
        <div className="absolute -top-15 right-15 w-55 h-55 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--gold-500)_22%,transparent),transparent_70%)] animate-float-slow" />
        <div className="flex items-center gap-4 relative">
          <span className="w-13 h-13 shrink-0 rounded-[15px] bg-linear-to-br from-(--gold-400) to-(--gold-600) text-(--navy-950) font-extrabold text-[17px] flex items-center justify-center transition-transform duration-200 hover:scale-105 hover:rotate-3">
            {iniciales(operacion.clientes?.nombre, operacion.clientes?.apellidos)}
          </span>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-serif-display italic text-lg font-semibold text-white">
                {operacion.clientes?.nombre} {operacion.clientes?.apellidos}
              </span>
              <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-(--good)/22 text-[#7fd6ac] tracking-[.4px] animate-pulse">Activo</span>
            </div>
            <p className="text-[13px] text-white/55 mt-1 mb-0">
              {operacion.vehiculos?.marca} {operacion.vehiculos?.modelo} ({operacion.vehiculos?.anio})
            </p>
          </div>
        </div>
        <div className="text-right relative">
          <div className="text-[11px] text-white/50 uppercase tracking-[1.2px] mb-1">Fecha de originación</div>
          <div className="text-sm font-semibold text-white">
            {new Date(operacion.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4.5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
        <div className="bg-(--surface) border border-(--border) rounded-[18px] shadow-(--shadow) p-6.5 transition-all hover:-translate-y-1 hover:shadow-(--shadow-lg)">
          <div className="flex items-center gap-2.5 mb-4.5 pb-3.5 border-b border-(--border)">
            <span className="w-7.5 h-7.5 rounded-[9px] bg-(--gold-100) text-(--gold-700) flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-110 hover:rotate-6">
              <IconPersonSolo size={15} />
            </span>
            <h2 className="text-xs font-bold text-(--ink) uppercase tracking-[1.3px] m-0">Participantes y Monto</h2>
          </div>
          <InfoRow label="Cliente" value={`${operacion.clientes?.nombre} ${operacion.clientes?.apellidos}`} />
          <InfoRow label="DNI" value={operacion.clientes?.dni ?? '-'} />
          <InfoRow label="Vehículo" value={`${operacion.vehiculos?.marca} ${operacion.vehiculos?.modelo} (${operacion.vehiculos?.anio})`} />
          <InfoRow label="Moneda" value={operacion.moneda === 'PEN' ? 'Soles (PEN)' : 'Dólares (USD)'} />
          <InfoRow label="Precio vehículo" value={fmt(operacion.precio_vehiculo)} />
          <InfoRow label="Cuota inicial" value={fmt(operacion.cuota_inicial)} last />
          <div className="flex justify-between items-center mt-3.5 py-3.5 px-4 rounded-[13px] bg-(--gold-100)">
            <span className="text-(--gold-700) font-semibold text-[13px]">Monto financiado</span>
            <span className="font-serif-display font-bold text-(--gold-700) text-lg tabular-nums">{fmt(operacion.monto_financiar)}</span>
          </div>
        </div>

        <div className="bg-(--surface) border border-(--border) rounded-[18px] shadow-(--shadow) p-6.5 transition-all hover:-translate-y-1 hover:shadow-(--shadow-lg)">
          <div className="flex items-center gap-2.5 mb-4.5 pb-3.5 border-b border-(--border)">
            <span className="w-7.5 h-7.5 rounded-[9px] bg-(--gold-100) text-(--gold-700) flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-110 hover:rotate-6">
              <IconDoc size={15} />
            </span>
            <h2 className="text-xs font-bold text-(--ink) uppercase tracking-[1.3px] m-0">Condiciones del Crédito</h2>
          </div>
          <InfoRow label="Tipo de tasa" value={operacion.tipo_tasa === 'efectiva' ? 'TEA (Efectiva)' : 'TNA (Nominal)'} />
          <InfoRow label="Tasa ingresada" value={`${operacion.tasa_interes}%`} />
          {operacion.capitalizacion && <InfoRow label="Capitalización" value={`${operacion.capitalizacion} períodos/año`} />}
          <InfoRow label="TEM calculada" value={fmtPct(operacion.tem, 6)} />
          <InfoRow label="Plazo" value={`${operacion.plazo_meses} meses`} />
          <InfoRow label="Gracia total / parcial" value={`${operacion.meses_gracia_total} / ${operacion.meses_gracia_parcial} meses`} />
          <InfoRow label="COK" value={`${operacion.cok}%`} />
          <InfoRow label="Seg. Vehicular" value={`${operacion.seguro_vehicular_pct ?? 0.32}% mensual s/ vehículo`} />
          <InfoRow label="Seg. Desgravamen" value={`${operacion.seguro_desgravamen_pct ?? 0.069}% mensual s/ capital`} last />
          <div className="flex justify-between items-center mt-3.5 py-3.5 px-4 rounded-[13px] bg-(--surface-alt) border border-(--border)">
            <span className="text-(--ink-soft) font-semibold text-[13px]">Compra inteligente</span>
            <span className="font-bold text-(--ink) text-sm">
              {operacion.es_compra_inteligente ? `Sí — balón ${operacion.monto_balon ? fmt(operacion.monto_balon) : '-'}` : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
        <MetricCard
          icon={IconDoc}
          label="Cuota Total Mensual"
          value={cuotaNormal ? fmt(cuotaNormal.cuota + segVehMensual + segDesgMensual) : '-'}
          variant="gold"
        />
        <MetricCard icon={IconWallet} label="Total a Pagar" value={fmt(operacion.total_pagado)} variant="neutral" />
        <MetricCard icon={IconPercent} label="Total Intereses" value={fmt(operacion.total_intereses)} variant="neutral" />
        <MetricCard icon={IconTrendUp} label="VAN" value={fmt(operacion.van)} variant="good" />
        <MetricCard icon={IconChartRise} label="TIR mensual" value={fmtPct(operacion.tir)} variant="neutral" />
        <MetricCard icon={IconTarget} label="TCEA anual" value={fmtPct(operacion.tcea, 2)} variant="dark" />
      </div>

      {/* Chart */}
      {bars.length > 0 && (
        <div className="bg-(--surface) border border-(--border) rounded-[18px] shadow-(--shadow) p-6.5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
            <h2 className="font-serif-display italic text-base font-semibold text-(--ink) m-0">Composición de la cuota: interés vs. amortización</h2>
            <span className="text-xs text-(--ink-mute)">{cuotas.length} cuotas · método francés</span>
          </div>
          <p className="text-[12.5px] text-(--ink-mute) mb-4.5">Cada barra es una cuota; muestra cómo el interés cede terreno frente al capital amortizado a medida que avanza el crédito.</p>
          <svg viewBox="0 0 640 190" className="w-full h-52.5" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="navyBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--navy-700)" />
                <stop offset="100%" stopColor="var(--navy-900)" />
              </linearGradient>
              <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold-400)" />
                <stop offset="100%" stopColor="var(--gold-600)" />
              </linearGradient>
              <linearGradient id="goldBarGrace" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold-400)" stopOpacity=".75" />
                <stop offset="100%" stopColor="var(--gold-500)" stopOpacity=".45" />
              </linearGradient>
            </defs>
            <line x1="0" y1="0" x2="640" y2="0" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" />
            <line x1="0" y1="56.5" x2="640" y2="56.5" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" />
            <line x1="0" y1="113" x2="640" y2="113" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" />
            <line x1="0" y1="169.5" x2="640" y2="169.5" stroke="var(--border)" strokeWidth="1" />
            {bars.map((b) => (
              <g key={b.key} className="origin-bottom transition-transform duration-200 [transform-box:fill-box] hover:scale-[1.06]">
                {b.hasAmort && <rect x={b.x} y={b.yAmort} width={b.w} height={b.hAmort} rx="3" fill="url(#navyBar)" />}
                <rect x={b.x} y={b.yInt} width={b.w} height={b.hInt} rx="3" fill={b.grace ? 'url(#goldBarGrace)' : 'url(#goldBar)'} />
                <rect x={b.x} y={b.yInt} width={b.w} height="2" rx="1" fill="#fff" opacity=".3" />
              </g>
            ))}
          </svg>
          <div className="flex justify-between mt-2 text-[11px] text-(--ink-mute)">
            <span>Cuota 1</span>
            <span>Cuota {Math.ceil(cuotas.length / 2)}</span>
            <span>Cuota {cuotas.length}</span>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-(--ink-mute)">
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-[3px] bg-(--gold-600) inline-block" />Interés</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-[3px] bg-(--navy-700) inline-block" />Amortización de capital</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-[3px] bg-(--gold-600) opacity-40 inline-block" />Interés capitalizado en gracia (no se paga, se suma al saldo)</span>
      </div>

      {/* Cronograma */}
      <div className="bg-(--surface) border border-(--border) rounded-[18px] shadow-(--shadow) overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between bg-(--navy-900)">
          <h2 className="text-xs font-bold text-white uppercase tracking-[1.3px] m-0">Cronograma de Pagos</h2>
          <span className="text-[11.5px] text-white/55">{cuotas.length} cuotas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] border-collapse min-w-230">
            <thead>
              <tr className="bg-(--navy-800)">
                {['N°', 'Fecha', 'Saldo Inicial', 'Interés', 'Amortización', 'Cuota', 'Seg. Veh.', 'Seg. Desgr.', 'Total Cuota', 'Saldo Final', 'Tipo'].map((h) => (
                  <th key={h} className="px-3 py-2.75 text-[10px] font-bold text-white/85 uppercase tracking-[1px] whitespace-nowrap text-right first:text-left last:text-center">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cuotas.map((fila) => {
                const badge = tipoLabel(fila.tipo)
                const cuotaTotalFila = fila.cuota + segVehMensual + segDesgMensual
                return (
                  <tr key={fila.numero_cuota} className={`border-t border-(--border) hover:bg-(--gold-100) transition-colors duration-150 ${rowBg(fila.tipo) ?? ''}`}>
                    <td className="px-3 py-2.25 font-bold text-(--ink)">{fila.numero_cuota}</td>
                    <td className="px-3 py-2.25 text-right text-(--ink-mute) whitespace-nowrap text-xs">
                      {new Date(fila.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-2.25 text-right tabular-nums text-(--ink-soft)">{fila.saldo_inicial.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2.25 text-right tabular-nums font-semibold text-(--gold-600)">{fila.interes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2.25 text-right tabular-nums text-(--ink) font-semibold">{fila.amortizacion.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2.25 text-right tabular-nums text-(--ink-soft)">{fila.cuota.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2.25 text-right tabular-nums text-(--good)">{segVehMensual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2.25 text-right tabular-nums text-(--good)">{segDesgMensual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2.25 text-right tabular-nums font-bold text-(--ink)">{cuotaTotalFila.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2.25 text-right tabular-nums text-(--ink-soft)">{fila.saldo_final.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2.25 text-center">
                      <span className={`text-[9.5px] px-2.25 py-0.75 rounded-full font-bold ${badge.cls}`}>{badge.text}</span>
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

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 text-[13.5px] py-2.25 px-1.5 -mx-1.5 rounded-md transition-colors hover:bg-(--surface-alt) ${last ? '' : 'border-b border-(--border)'}`}>
      <span className="text-(--ink-mute) shrink-0">{label}</span>
      <span className="text-right font-semibold text-(--ink)">{value}</span>
    </div>
  )
}

function MetricCard({
  icon: Icon, label, value, variant,
}: {
  icon: (props: { size?: number; className?: string }) => React.ReactElement
  label: string
  value: string
  variant: 'gold' | 'neutral' | 'good' | 'dark'
}) {
  if (variant === 'gold') {
    return (
      <div className="bg-linear-to-br from-(--gold-400) to-(--gold-600) rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.02] shadow-[0_16px_34px_-14px_rgba(198,160,82,.55)] hover:shadow-[0_20px_40px_-14px_rgba(198,160,82,.65)]">
        <div className="absolute -top-5 -right-5 w-17.5 h-17.5 rounded-full bg-white/16" />
        <Icon size={18} className="text-(--navy-950) opacity-70 mb-2.5" />
        <div className="text-[10px] font-bold uppercase tracking-[1px] text-(--navy-950) opacity-75 mb-1.5">{label}</div>
        <div className="font-serif-display text-[21px] font-bold text-(--navy-950) tabular-nums">{value}</div>
      </div>
    )
  }
  if (variant === 'dark') {
    return (
      <div className="bg-linear-to-br from-(--navy-900) to-(--navy-950) rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.02]">
        <div className="absolute -top-5 -right-5 w-17.5 h-17.5 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--gold-500)_30%,transparent),transparent_70%)]" />
        <Icon size={18} className="text-(--gold-400) mb-2.5" />
        <div className="text-[10px] font-bold uppercase tracking-[1px] text-(--gold-400) mb-1.5">{label}</div>
        <div className="font-serif-display text-[21px] font-bold text-white tabular-nums">{value}</div>
      </div>
    )
  }
  if (variant === 'good') {
    return (
      <div className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-(--shadow) bg-(--good)/10 border border-(--good)/30">
        <Icon size={18} className="text-(--good) mb-2.5" />
        <div className="text-[10px] font-bold uppercase tracking-[1px] text-(--good) mb-1.5">{label}</div>
        <div className="font-serif-display text-[21px] font-bold text-(--good) tabular-nums">{value}</div>
      </div>
    )
  }
  return (
    <div className="bg-(--surface) border border-(--border) rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-(--shadow)">
      <Icon size={18} className="text-(--ink-mute) mb-2.5" />
      <div className="text-[10px] font-bold uppercase tracking-[1px] text-(--ink-mute) mb-1.5">{label}</div>
      <div className="font-serif-display text-[21px] font-bold text-(--ink) tabular-nums">{value}</div>
    </div>
  )
}
