'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { IconPerson, IconCar, IconDoc, IconWallet, IconPersonSolo, IconArrowRight, IconSpinner } from '@/components/ui/icons'

/*
 * Desarrollado por: Keyner Hancco
 * GitHub: https://github.com/1Kanan2
 * keynerivan@outlook.com
 */

interface Metricas {
  totalClientes: number
  totalVehiculos: number
  totalOperaciones: number
  carteraPEN: number
  carteraUSD: number
}

interface UltimaOp {
  id: string
  moneda: 'PEN' | 'USD'
  monto_financiar: number
  tcea: number
  created_at: string
  clientes: { nombre: string; apellidos: string } | null
  vehiculos: { marca: string; modelo: string } | null
}

export default function DashboardPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [ultimasOps, setUltimasOps] = useState<UltimaOp[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      try {
        const [
          { data: { user } },
          { count: totalClientes },
          { count: totalVehiculos },
          { count: totalOperaciones },
          { data: montos },
          { data: ops },
        ] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('clientes').select('*', { count: 'exact', head: true }),
          supabase.from('vehiculos').select('*', { count: 'exact', head: true }),
          supabase.from('operaciones').select('*', { count: 'exact', head: true }),
          supabase.from('operaciones').select('monto_financiar, moneda'),
          supabase
            .from('operaciones')
            .select('id, moneda, monto_financiar, tcea, created_at, clientes(nombre, apellidos), vehiculos(marca, modelo)')
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        if (user?.email) setUserEmail(user.email)

        const lista = montos ?? []
        const carteraPEN = lista.filter((m) => m.moneda === 'PEN').reduce((s, m) => s + m.monto_financiar, 0)
        const carteraUSD = lista.filter((m) => m.moneda === 'USD').reduce((s, m) => s + m.monto_financiar, 0)

        setMetricas({ totalClientes: totalClientes ?? 0, totalVehiculos: totalVehiculos ?? 0, totalOperaciones: totalOperaciones ?? 0, carteraPEN, carteraUSD })
        setUltimasOps((ops ?? []) as unknown as UltimaOp[])
      } catch (err) {
        console.error('Error cargando dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fmtMonto = (n: number, moneda: 'PEN' | 'USD') =>
    `${moneda === 'PEN' ? 'S/' : '$'} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const kpis = [
    { icon: IconPerson, value: (metricas?.totalClientes ?? 0).toLocaleString('es-PE'), label: 'Clientes registrados' },
    { icon: IconCar, value: (metricas?.totalVehiculos ?? 0).toLocaleString('es-PE'), label: 'Vehículos en inventario' },
    { icon: IconDoc, value: (metricas?.totalOperaciones ?? 0).toLocaleString('es-PE'), label: 'Operaciones realizadas' },
  ]

  const primerosPasos = [
    { n: 1, icon: IconPerson, title: 'Registra clientes', desc: 'Crea la ficha de cada cliente para vincularla a sus operaciones.', href: '/clientes' },
    { n: 2, icon: IconCar, title: 'Añade vehículos', desc: 'Suma unidades al inventario disponible para financiar.', href: '/vehiculos' },
    { n: 3, icon: IconDoc, title: 'Genera un crédito', desc: 'Cronograma francés con VAN, TIR y TCEA calculados al instante.', href: '/creditos/nuevo', dark: true },
  ]

  return (
    <div className="space-y-8.5">
      <p className="text-(--ink-mute) text-sm -mt-1">
        {userEmail && <>Bienvenido, <span className="text-(--ink) font-semibold">{userEmail}</span></>}
      </p>

      {/* KPI CARDS */}
      {loading ? (
        <div className="grid gap-4.5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-35 bg-(--surface) rounded-[20px] border border-(--border) animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4.5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
          {kpis.map(({ icon: Icon, value, label }, i) => (
            <div
              key={label}
              className="group bg-(--surface) border border-(--border) rounded-[20px] p-6.5 shadow-(--shadow) relative overflow-hidden animate-fade-up transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.015] hover:shadow-(--shadow-lg)"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="absolute -top-7.5 -right-7.5 w-25 h-25 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--gold-500)_14%,transparent),transparent_70%)]" />
              <Icon size={22} className="text-(--gold-600) mb-4 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3" />
              <div className="font-serif-display text-4xl font-semibold text-(--ink) leading-none tabular-nums">{value}</div>
              <div className="text-[12.5px] text-(--ink-mute) mt-2 font-medium">{label}</div>
            </div>
          ))}

          {/* Cartera */}
          <div
            className="group bg-linear-to-br from-(--navy-900) to-(--navy-800) rounded-[20px] p-6.5 relative overflow-hidden shadow-[0_20px_50px_-20px_rgba(15,31,61,.55)] animate-fade-up transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.015]"
            style={{ animationDelay: '.15s' }}
          >
            <div className="absolute -top-7.5 -right-7.5 w-30 h-30 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--gold-500)_28%,transparent),transparent_70%)]" />
            <IconWallet size={22} className="text-(--gold-400) mb-4 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3" />
            <div className="font-serif-display text-2xl font-semibold text-white leading-tight tabular-nums">
              {(metricas?.carteraPEN ?? 0) > 0 && <div>S/ {(metricas!.carteraPEN).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>}
              {(metricas?.carteraUSD ?? 0) > 0 && <div className="text-lg opacity-75 mt-0.5">$ {(metricas!.carteraUSD).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>}
              {!(metricas?.carteraPEN) && !(metricas?.carteraUSD) && <div>S/ 0</div>}
            </div>
            <div className="text-[12.5px] text-(--gold-400) mt-2.5 font-medium">Monto total en cartera</div>
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div>
        <p className="text-[11px] font-bold text-(--ink-mute) uppercase tracking-[1.5px] mb-3">Accesos rápidos</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/clientes/nuevo"
            className="bg-(--navy-900) hover:bg-(--navy-800) text-white font-semibold py-3 px-5.5 rounded-xl text-[13.5px] shadow-[0_8px_20px_-8px_rgba(15,32,68,.4)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_26px_-8px_rgba(15,32,68,.5)] active:scale-95"
          >
            + Nuevo Cliente
          </Link>
          <Link
            href="/vehiculos/nuevo"
            className="bg-(--navy-900) hover:bg-(--navy-800) text-white font-semibold py-3 px-5.5 rounded-xl text-[13.5px] shadow-[0_8px_20px_-8px_rgba(15,32,68,.4)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_26px_-8px_rgba(15,32,68,.5)] active:scale-95"
          >
            + Nuevo Vehículo
          </Link>
          <Link
            href="/creditos/nuevo"
            className="bg-linear-to-br from-(--gold-400) to-(--gold-600) text-(--navy-950) font-bold py-3 px-5.5 rounded-xl text-[13.5px] shadow-[0_8px_20px_-8px_rgba(198,160,82,.5)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_26px_-8px_rgba(198,160,82,.6)] active:scale-95"
          >
            + Nuevo Crédito
          </Link>
        </div>
      </div>

      {/* Últimas operaciones */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-serif-display italic text-lg font-semibold text-(--ink)">Últimas operaciones</h2>
          <Link href="/creditos" className="group text-[13px] font-bold text-(--gold-600) hover:text-(--gold-500) transition-colors">
            Ver todas <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) p-10 flex justify-center">
            <IconSpinner className="text-(--navy-900)" size={28} />
          </div>
        ) : ultimasOps.length === 0 ? (
          <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) py-14 text-center">
            <IconDoc size={40} className="text-(--ink-mute) mx-auto mb-3" />
            <p className="text-(--ink-mute) text-sm">No hay operaciones registradas aún.</p>
            <Link href="/creditos/nuevo" className="inline-block mt-4 text-(--gold-600) hover:text-(--gold-500) font-semibold text-sm transition-colors">
              Generar el primer crédito →
            </Link>
          </div>
        ) : (
          <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px] border-collapse min-w-170">
                <thead>
                  <tr>
                    {['Cliente', 'Vehículo', 'Monto', 'TCEA', 'Fecha', ''].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5.5 py-3.5 text-[10px] font-bold text-(--ink-mute) uppercase tracking-[1.3px] border-b border-(--border) whitespace-nowrap ${
                          i === 2 ? 'text-right' : i === 3 ? 'text-center' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ultimasOps.map((op) => (
                    <tr key={op.id} className="group hover:bg-(--gold-100) transition-colors">
                      <td className="px-5.5 py-3.5 whitespace-nowrap border-b border-(--border)">
                        <div className="flex items-center gap-3">
                          <span className="w-8.5 h-8.5 shrink-0 rounded-[11px] bg-linear-to-br from-(--navy-800) to-(--navy-950) text-(--gold-400) flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                            <IconPersonSolo />
                          </span>
                          <span className="font-bold text-(--ink)">{op.clientes?.nombre} {op.clientes?.apellidos}</span>
                        </div>
                      </td>
                      <td className="px-5.5 py-3.5 text-(--ink-soft) whitespace-nowrap border-b border-(--border)">
                        {op.vehiculos?.marca} {op.vehiculos?.modelo}
                      </td>
                      <td className="px-5.5 py-3.5 font-bold text-(--ink) tabular-nums whitespace-nowrap text-right border-b border-(--border)">
                        {fmtMonto(op.monto_financiar, op.moneda)}
                      </td>
                      <td className="px-5.5 py-3.5 text-center whitespace-nowrap border-b border-(--border)">
                        <span className="inline-block px-3 py-1 rounded-full bg-(--gold-100) text-(--gold-700) font-bold text-xs">
                          {(op.tcea * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-5.5 py-3.5 text-(--ink-mute) whitespace-nowrap border-b border-(--border)">
                        {new Date(op.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-5.5 py-3.5 text-right whitespace-nowrap border-b border-(--border)">
                        <Link
                          href={`/creditos/${op.id}`}
                          className="group/link inline-flex items-center gap-1.5 font-bold text-xs text-white bg-(--navy-900) hover:bg-(--navy-800) py-1.5 px-3 rounded-lg transition-all duration-200 hover:-translate-y-px hover:shadow-md active:scale-95"
                        >
                          Ver <IconArrowRight className="transition-transform duration-200 group-hover/link:translate-x-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Primeros pasos */}
      <div>
        <p className="text-[11px] font-bold text-(--ink-mute) uppercase tracking-[1.5px] mb-3.5">Primeros pasos</p>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
          {primerosPasos.map(({ n, icon: Icon, title, desc, href, dark }) => (
            <Link
              key={n}
              href={href}
              className={`group rounded-2xl p-5 flex flex-col gap-2.5 transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.02] ${
                dark
                  ? 'bg-linear-to-br from-(--navy-900) to-(--navy-950) shadow-[0_20px_40px_-18px_rgba(15,32,68,.5)]'
                  : 'bg-(--surface) border border-(--border) shadow-(--shadow) hover:shadow-(--shadow-lg)'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center font-extrabold text-[13px] transition-transform duration-200 group-hover:scale-110 ${dark ? 'bg-(--gold-500)/18 text-(--gold-400)' : 'bg-(--gold-100) text-(--gold-700)'}`}>
                  {n}
                </span>
                <Icon size={17} className={`transition-transform duration-200 group-hover:rotate-6 ${dark ? 'text-(--gold-400)' : 'text-(--ink-mute)'}`} />
              </div>
              <p className={`text-sm font-bold m-0 ${dark ? 'text-white' : 'text-(--ink)'}`}>{title}</p>
              <p className={`text-[12.5px] m-0 leading-relaxed ${dark ? 'text-white/55' : 'text-(--ink-mute)'}`}>{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
