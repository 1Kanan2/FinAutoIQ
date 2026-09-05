'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getOperaciones, deleteOperacion, type Operacion } from '@/lib/supabase-creditos'
import { IconDoc, IconPersonSolo, IconArrowRight, IconTrash, IconSpinner } from '@/components/ui/icons'

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
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <IconSpinner className="text-(--navy-900) mx-auto mb-3" size={32} />
          <p className="text-(--ink-mute) text-sm">Cargando operaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-(--ink-mute) text-sm m-0">
          {operaciones.length} {operaciones.length === 1 ? 'operación registrada' : 'operaciones registradas'}
        </p>
        <Link
          href="/creditos/nuevo"
          className="inline-flex items-center gap-2 bg-linear-to-br from-(--gold-400) to-(--gold-600) text-(--navy-950) font-bold py-2.75 px-5 rounded-xl text-[13px] shadow-[0_8px_20px_-8px_rgba(198,160,82,.5)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_26px_-8px_rgba(198,160,82,.6)] active:scale-95 w-fit"
        >
          + Nuevo Crédito
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-(--bad)/10 border border-(--bad)/30 rounded-lg flex items-start gap-2">
          <span className="text-(--bad) shrink-0 mt-0.5">⚠</span>
          <p className="text-sm text-(--bad)">{error}</p>
        </div>
      )}

      {operaciones.length === 0 ? (
        <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) p-16 text-center">
          <IconDoc size={48} className="text-(--gold-500) mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-(--ink) mb-2">No hay operaciones aún</h3>
          <p className="text-(--ink-mute) text-sm mb-6">Genera tu primer crédito vehicular usando el método francés</p>
          <Link
            href="/creditos/nuevo"
            className="inline-flex items-center gap-2 bg-(--navy-900) hover:bg-(--navy-800) text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 text-sm"
          >
            + Generar Crédito
          </Link>
        </div>
      ) : (
        <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px] border-collapse min-w-205">
              <thead>
                <tr>
                  {['Cliente', 'Vehículo', 'Monto', 'Tasa', 'Plazo', 'TCEA', 'Fecha', ''].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5.5 py-3.5 text-[10px] font-bold text-(--ink-mute) uppercase tracking-[1.3px] border-b border-(--border) whitespace-nowrap ${
                        i === 2 ? 'text-right' : i === 4 || i === 5 ? 'text-center' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {operaciones.map((op) => (
                  <tr key={op.id} className="group hover:bg-(--gold-100) transition-colors duration-150">
                    <td className="px-5.5 py-3.5 whitespace-nowrap border-b border-(--border)">
                      <div className="flex items-center gap-3">
                        <span className="w-8.5 h-8.5 shrink-0 rounded-[11px] bg-linear-to-br from-(--navy-800) to-(--navy-950) text-(--gold-400) flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                          <IconPersonSolo />
                        </span>
                        <div>
                          <div className="font-bold text-(--ink)">{op.clientes?.nombre} {op.clientes?.apellidos}</div>
                          <div className="text-[11px] text-(--ink-mute) mt-0.5">DNI {op.clientes?.dni}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5.5 py-3.5 whitespace-nowrap border-b border-(--border)">
                      <div className="text-(--ink-soft) font-semibold">{op.vehiculos?.marca} {op.vehiculos?.modelo}</div>
                      <div className="text-[11px] text-(--ink-mute) mt-0.5">{op.vehiculos?.anio}</div>
                    </td>
                    <td className="px-5.5 py-3.5 font-bold text-(--ink) tabular-nums whitespace-nowrap text-right border-b border-(--border)">
                      {fmt(op.monto_financiar, op.moneda)}
                    </td>
                    <td className="px-5.5 py-3.5 whitespace-nowrap border-b border-(--border)">
                      <div className="font-semibold text-(--ink)">{op.tasa_interes}%</div>
                      <div className="text-[11px] text-(--ink-mute) mt-0.5">
                        {op.tipo_tasa === 'efectiva' ? 'TEA' : `TNA cap.${op.capitalizacion}`}
                      </div>
                    </td>
                    <td className="px-5.5 py-3.5 text-(--ink-soft) tabular-nums text-center whitespace-nowrap border-b border-(--border)">{op.plazo_meses}m</td>
                    <td className="px-5.5 py-3.5 text-center whitespace-nowrap border-b border-(--border)">
                      <span className="inline-block px-3 py-1 rounded-full bg-(--gold-100) text-(--gold-700) font-bold text-xs">
                        {(op.tcea * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-5.5 py-3.5 text-(--ink-mute) whitespace-nowrap border-b border-(--border)">
                      {new Date(op.created_at).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-5.5 py-3.5 whitespace-nowrap text-right border-b border-(--border)">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/creditos/${op.id}`}
                          className="group/link inline-flex items-center gap-1.5 font-bold text-[12.5px] text-(--navy-700) hover:bg-(--surface-alt) hover:-translate-y-px py-1.5 px-2.5 rounded-lg transition-all duration-200 active:scale-95"
                        >
                          Ver <IconArrowRight className="transition-transform duration-200 group-hover/link:translate-x-1" />
                        </Link>
                        <button
                          onClick={() => handleDelete(op.id)}
                          className="inline-flex w-8 h-8 rounded-[9px] items-center justify-center text-(--bad) hover:bg-(--surface-alt) hover:scale-110 active:scale-90 transition-all duration-200"
                          aria-label="Eliminar"
                        >
                          <IconTrash />
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
