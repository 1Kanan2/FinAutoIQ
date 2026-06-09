'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getVehiculos, deleteVehiculo, type Vehiculo } from '@/lib/supabase-vehicles'

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const router = useRouter()

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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#0f2044]">Vehículos</h1>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-[#0f2044] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-500 text-sm">Cargando vehículos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0f2044]">Gestión de Vehículos</h1>
          <p className="text-slate-500 text-sm mt-1">{vehiculos.length} vehículo{vehiculos.length !== 1 ? 's' : ''} en inventario</p>
        </div>
        <Link
          href="/vehiculos/nuevo"
          className="inline-flex items-center gap-2 bg-[#0f2044] hover:bg-[#1a3260] text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md text-sm"
        >
          + Nuevo Vehículo
        </Link>
      </div>

      {vehiculos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border-l-[3px] border-[#c9a84c] p-16 text-center">
          <div className="text-6xl mb-4">🚗</div>
          <h3 className="text-lg font-semibold text-[#0f2044] mb-2">No hay vehículos registrados</h3>
          <p className="text-slate-500 text-sm mb-6">Agrega vehículos al inventario para generar créditos</p>
          <Link
            href="/vehiculos/nuevo"
            className="inline-flex items-center gap-2 bg-[#0f2044] hover:bg-[#1a3260] text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 active:scale-95 text-sm"
          >
            + Agregar vehículo
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[#0f2044]">
                  {['Vehículo', 'Año', 'Precio (S/)', 'Precio (USD)', 'Acciones'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehiculos.map((v, i) => (
                  <tr key={v.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'} hover:bg-[#fefce8] transition-colors duration-150`}>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">{v.marca} {v.modelo}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-600">{v.anio}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-700 tabular-nums font-medium">
                      S/ {v.precio_soles.toLocaleString('es-PE')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-700 tabular-nums font-medium">
                      $ {v.precio_dolares.toLocaleString('es-PE')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/vehiculos/${v.id}/editar`}
                          className="text-[#0f2044] hover:text-[#1a3260] font-semibold transition-colors"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(v.id)}
                          disabled={deleteLoading === v.id}
                          className="text-red-600 hover:text-red-700 font-semibold transition-colors disabled:opacity-40"
                        >
                          {deleteLoading === v.id ? 'Eliminando...' : 'Eliminar'}
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
