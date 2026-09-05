'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getVehiculos, deleteVehiculo, type Vehiculo } from '@/lib/supabase-vehicles'
import { IconCar, IconEdit, IconTrash, IconSpinner } from '@/components/ui/icons'

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => { loadVehiculos() }, [])

  const loadVehiculos = async () => {
    try { setVehiculos(await getVehiculos()) }
    catch { console.error('Error loading vehiculos') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este vehículo?')) return
    setDeleteLoading(id)
    try { await deleteVehiculo(id); setVehiculos(vehiculos.filter((v) => v.id !== id)) }
    catch { alert('Error al eliminar el vehículo') }
    finally { setDeleteLoading(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <IconSpinner className="text-(--navy-900) mx-auto mb-3" size={32} />
          <p className="text-(--ink-mute) text-sm">Cargando vehículos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-(--ink-mute) text-sm m-0">{vehiculos.length} vehículo{vehiculos.length !== 1 ? 's' : ''} en inventario</p>
        <Link
          href="/vehiculos/nuevo"
          className="inline-flex items-center gap-2 bg-linear-to-br from-(--gold-400) to-(--gold-600) text-(--navy-950) font-bold py-2.75 px-5 rounded-xl text-[13px] shadow-[0_8px_20px_-8px_rgba(198,160,82,.5)] transition-all hover:-translate-y-0.5 w-fit"
        >
          + Nuevo Vehículo
        </Link>
      </div>

      {vehiculos.length === 0 ? (
        <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) p-16 text-center">
          <IconCar size={48} className="text-(--gold-500) mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-(--ink) mb-2">No hay vehículos registrados</h3>
          <p className="text-(--ink-mute) text-sm mb-6">Agrega vehículos al inventario para generar créditos</p>
          <Link
            href="/vehiculos/nuevo"
            className="inline-flex items-center gap-2 bg-(--navy-900) hover:bg-(--navy-800) text-white font-semibold py-2.5 px-6 rounded-xl transition-all active:scale-95 text-sm"
          >
            + Agregar vehículo
          </Link>
        </div>
      ) : (
        <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px] border-collapse min-w-170">
              <thead>
                <tr>
                  {['Vehículo', 'Año', 'Precio (S/)', 'Precio (USD)', ''].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5.5 py-3.5 text-[10px] font-bold text-(--ink-mute) uppercase tracking-[1.3px] border-b border-(--border) whitespace-nowrap ${
                        i === 1 ? 'text-center' : i === 2 || i === 3 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehiculos.map((v) => (
                  <tr key={v.id} className="hover:bg-(--gold-100) transition-colors">
                    <td className="px-5.5 py-3.5 whitespace-nowrap border-b border-(--border)">
                      <div className="flex items-center gap-3">
                        <span className="w-8.5 h-8.5 shrink-0 rounded-[11px] bg-(--gold-100) text-(--gold-700) flex items-center justify-center">
                          <IconCar size={16} />
                        </span>
                        <span className="text-sm font-bold text-(--ink)">{v.marca} {v.modelo}</span>
                      </div>
                    </td>
                    <td className="px-5.5 py-3.5 whitespace-nowrap text-sm text-(--ink-soft) text-center tabular-nums border-b border-(--border)">{v.anio}</td>
                    <td className="px-5.5 py-3.5 whitespace-nowrap text-sm text-(--ink) font-bold tabular-nums text-right border-b border-(--border)">
                      S/ {v.precio_soles.toLocaleString('es-PE')}
                    </td>
                    <td className="px-5.5 py-3.5 whitespace-nowrap text-sm text-(--ink) font-bold tabular-nums text-right border-b border-(--border)">
                      $ {v.precio_dolares.toLocaleString('es-PE')}
                    </td>
                    <td className="px-5.5 py-3.5 whitespace-nowrap text-right border-b border-(--border)">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/vehiculos/${v.id}/editar`}
                          className="inline-flex w-8 h-8 rounded-[9px] items-center justify-center text-(--navy-700) hover:bg-(--surface-alt) transition-colors"
                          aria-label="Editar"
                        >
                          <IconEdit />
                        </Link>
                        <button
                          onClick={() => handleDelete(v.id)}
                          disabled={deleteLoading === v.id}
                          className="inline-flex w-8 h-8 rounded-[9px] items-center justify-center text-(--bad) hover:bg-(--surface-alt) transition-colors disabled:opacity-40"
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
