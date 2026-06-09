'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

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

function Spinner() {
  return (
    <svg className="animate-spin h-7 w-7 text-[#0f2044] mx-auto" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
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

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-[#0f2044]">Dashboard</h1>
        {userEmail && (
          <p className="text-slate-500 text-sm mt-1">
            Bienvenido, <span className="font-medium text-[#0f2044]">{userEmail}</span>
          </p>
        )}
      </div>

      {/* Métricas */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '👥', value: (metricas?.totalClientes ?? 0).toLocaleString('es-PE'), label: 'Clientes registrados' },
            { icon: '🚗', value: (metricas?.totalVehiculos ?? 0).toLocaleString('es-PE'), label: 'Vehículos en inventario' },
            { icon: '📋', value: (metricas?.totalOperaciones ?? 0).toLocaleString('es-PE'), label: 'Operaciones realizadas' },
          ].map(({ icon, value, label }) => (
            <div key={label} className="bg-white rounded-xl shadow-md border-l-[3px] border-[#c9a84c] p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-2xl font-bold text-[#0f2044] tabular-nums">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
          {/* Cartera */}
          <div className="bg-white rounded-xl shadow-md border-l-[3px] border-[#c9a84c] p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className="text-2xl mb-2">💰</div>
            {(metricas?.carteraPEN ?? 0) > 0 && (
              <div className="text-lg font-bold text-[#0f2044] tabular-nums leading-tight">
                S/ {(metricas!.carteraPEN).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            )}
            {(metricas?.carteraUSD ?? 0) > 0 && (
              <div className="text-lg font-bold text-[#0f2044] tabular-nums leading-tight">
                $ {(metricas!.carteraUSD).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            )}
            {!(metricas?.carteraPEN) && !(metricas?.carteraUSD) && (
              <div className="text-lg font-bold text-[#0f2044]">S/ 0</div>
            )}
            <div className="text-xs text-slate-500 mt-0.5">Monto total en cartera</div>
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Accesos rápidos</p>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/clientes/nuevo', label: '+ Nuevo Cliente', color: 'bg-[#0f2044] hover:bg-[#1a3260]' },
            { href: '/vehiculos/nuevo', label: '+ Nuevo Vehículo', color: 'bg-[#0f2044] hover:bg-[#1a3260]' },
            { href: '/creditos/nuevo', label: '+ Nuevo Crédito', color: 'bg-[#c9a84c] hover:bg-[#b8960c] text-[#0f2044]' },
          ].map(({ href, label, color }) => (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-2 ${color} font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 active:scale-95 text-sm text-white shadow-sm hover:shadow-md`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Últimas 5 operaciones */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#0f2044]">Últimas operaciones</h2>
          <Link href="/creditos" className="text-sm text-[#c9a84c] hover:text-[#b8960c] font-semibold transition-colors">
            Ver todas →
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-10 flex justify-center">
            <Spinner />
          </div>
        ) : ultimasOps.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border-l-[3px] border-[#c9a84c] py-14 text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-slate-500 text-sm">No hay operaciones registradas aún.</p>
            <Link href="/creditos/nuevo" className="inline-block mt-4 text-[#c9a84c] hover:text-[#b8960c] font-semibold text-sm transition-colors">
              Generar el primer crédito →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0f2044]">
                    {['Cliente', 'Vehículo', 'Monto Financiado', 'TCEA', 'Fecha', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ultimasOps.map((op, i) => (
                    <tr key={op.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'} hover:bg-[#fefce8] transition-colors duration-150`}>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {op.clientes?.nombre} {op.clientes?.apellidos}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {op.vehiculos?.marca} {op.vehiculos?.modelo}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0f2044] tabular-nums whitespace-nowrap">
                        {fmtMonto(op.monto_financiar, op.moneda)}
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums" style={{ color: '#c9a84c' }}>
                        {(op.tcea * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(op.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/creditos/${op.id}`} className="text-[#0f2044] hover:text-[#1a3260] font-semibold whitespace-nowrap transition-colors">
                          Ver detalle →
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

      {/* Guía */}
      <div className="bg-[#0f2044]/5 border-l-4 border-[#c9a84c] p-5 rounded-lg">
        <h3 className="text-sm font-bold text-[#0f2044] mb-2">Primeros pasos</h3>
        <ul className="text-slate-600 space-y-1 text-sm">
          <li>✓ Registra clientes desde <Link href="/clientes" className="text-[#c9a84c] hover:text-[#b8960c] font-medium transition-colors">Clientes</Link></li>
          <li>✓ Añade vehículos al inventario desde <Link href="/vehiculos" className="text-[#c9a84c] hover:text-[#b8960c] font-medium transition-colors">Vehículos</Link></li>
          <li>✓ Genera créditos con cronograma francés, VAN, TIR y TCEA desde <Link href="/creditos/nuevo" className="text-[#c9a84c] hover:text-[#b8960c] font-medium transition-colors">Nuevo Crédito</Link></li>
        </ul>
      </div>
    </div>
  )
}
