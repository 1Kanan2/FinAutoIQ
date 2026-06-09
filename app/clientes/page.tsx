'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getClientes, deleteCliente, type Cliente } from '@/lib/supabase-clients'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => { loadClientes() }, [])

  const loadClientes = async () => {
    try { setClientes(await getClientes()) }
    catch { console.error('Error loading clientes') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return
    setDeleteLoading(id)
    try { await deleteCliente(id); setClientes(clientes.filter((c) => c.id !== id)) }
    catch { alert('Error al eliminar el cliente') }
    finally { setDeleteLoading(null) }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#0f2044]">Clientes</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-[#0f2044] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-500 text-sm">Cargando clientes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0f2044]">Gestión de Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/clientes/nuevo"
          className="inline-flex items-center gap-2 bg-[#0f2044] hover:bg-[#1a3260] text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md text-sm"
        >
          + Nuevo Cliente
        </Link>
      </div>

      {clientes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border-l-[3px] border-[#c9a84c] p-16 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-[#0f2044] mb-2">No hay clientes registrados</h3>
          <p className="text-slate-500 text-sm mb-6">Comienza registrando el primer cliente del sistema</p>
          <Link
            href="/clientes/nuevo"
            className="inline-flex items-center gap-2 bg-[#0f2044] hover:bg-[#1a3260] text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 active:scale-95 text-sm"
          >
            + Crear primer cliente
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[#0f2044]">
                  {['Nombre', 'DNI', 'Email', 'Teléfono', 'Acciones'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientes.map((cliente, i) => (
                  <tr key={cliente.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'} hover:bg-[#fefce8] transition-colors duration-150`}>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {cliente.nombre} {cliente.apellidos}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-600">
                      {cliente.dni}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-600">
                      {cliente.email}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-600">
                      {cliente.telefono}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/clientes/${cliente.id}/editar`}
                          className="text-[#0f2044] hover:text-[#1a3260] font-semibold transition-colors"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          disabled={deleteLoading === cliente.id}
                          className="text-red-600 hover:text-red-700 font-semibold transition-colors disabled:opacity-40"
                        >
                          {deleteLoading === cliente.id ? 'Eliminando...' : 'Eliminar'}
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
