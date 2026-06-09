'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getOperaciones, deleteOperacion, type Operacion } from '@/lib/supabase-creditos'

export default function CreditosPage() {
  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadOperaciones() }, [])

  const loadOperaciones = async () => {
    try { setOperaciones(await getOperaciones()) }
    catch { setError('Error al cargar las operaciones') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta operación? Se perderá el cronograma completo.')) return
    try {
      await deleteOperacion(id)
      setOperaciones((prev) => prev.filter((op) => op.id !== id))
    } catch { setError('Error al eliminar la operación') }
  }

  const fmt = (num: number, moneda: string) =>
    `${moneda === 'PEN' ? 'S/' : '$'} ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#0f2044]">Historial de Créditos</h1>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-[#0f2044] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-500 text-sm">Cargando operaciones...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0f2044]">Historial de Créditos</h1>
          <p className="text-slate-500 text-sm mt-1">
            {operaciones.length} {operaciones.length === 1 ? 'operación registrada' : 'operaciones registradas'}
          </p>
        </div>
        <Link
          href="/creditos/nuevo"
          className="inline-flex items-center gap-2 bg-[#0f2044] hover:bg-[#1a3260] text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md text-sm"
        >
          + Nuevo Crédito
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {operaciones.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border-l-[3px] border-[#c9a84c] p-16 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-[#0f2044] mb-2">No hay operaciones aún</h3>
          <p className="text-slate-500 text-sm mb-6">Genera tu primer crédito vehicular usando el método francés</p>
          <Link
            href="/creditos/nuevo"
            className="inline-flex items-center gap-2 bg-[#0f2044] hover:bg-[#1a3260] text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 active:scale-95 text-sm"
          >
            + Generar Crédito
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0f2044]">
                  {['Cliente', 'Vehículo', 'Monto Financiado', 'Tasa', 'Plazo', 'TCEA', 'Fecha', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operaciones.map((op, i) => (
                  <tr key={op.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'} hover:bg-[#fefce8] transition-colors duration-150`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 whitespace-nowrap">
                        {op.clientes?.nombre} {op.clientes?.apellidos}
                      </div>
                      <div className="text-xs text-slate-400">DNI {op.clientes?.dni}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{op.vehiculos?.marca} {op.vehiculos?.modelo}</div>
                      <div className="text-xs text-slate-400">{op.vehiculos?.anio}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#0f2044] tabular-nums whitespace-nowrap">
                      {fmt(op.monto_financiar, op.moneda)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{op.tasa_interes}%</span>
                      <div className="text-xs text-slate-400">
                        {op.tipo_tasa === 'efectiva' ? 'TEA' : `TNA cap.${op.capitalizacion}`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 tabular-nums">{op.plazo_meses}m</td>
                    <td className="px-4 py-3 font-bold tabular-nums" style={{ color: '#c9a84c' }}>
                      {(op.tcea * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(op.created_at).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/creditos/${op.id}`} className="text-[#0f2044] hover:text-[#1a3260] font-semibold transition-colors">
                          Ver
                        </Link>
                        <button
                          onClick={() => handleDelete(op.id)}
                          className="text-red-600 hover:text-red-700 font-medium transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
