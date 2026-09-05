'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getClientes, deleteCliente, type Cliente } from '@/lib/supabase-clients'
import { IconPerson, IconPersonSolo, IconEdit, IconTrash, IconSpinner } from '@/components/ui/icons'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

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
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <IconSpinner className="text-(--navy-900) mx-auto mb-3" size={32} />
          <p className="text-(--ink-mute) text-sm">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-(--ink-mute) text-sm m-0">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}</p>
        <Link
          href="/clientes/nuevo"
          className="inline-flex items-center gap-2 bg-linear-to-br from-(--gold-400) to-(--gold-600) text-(--navy-950) font-bold py-2.75 px-5 rounded-xl text-[13px] shadow-[0_8px_20px_-8px_rgba(198,160,82,.5)] transition-all hover:-translate-y-0.5 w-fit"
        >
          + Nuevo Cliente
        </Link>
      </div>

      {clientes.length === 0 ? (
        <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) p-16 text-center">
          <IconPerson size={48} className="text-(--gold-500) mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-(--ink) mb-2">No hay clientes registrados</h3>
          <p className="text-(--ink-mute) text-sm mb-6">Comienza registrando el primer cliente del sistema</p>
          <Link
            href="/clientes/nuevo"
            className="inline-flex items-center gap-2 bg-(--navy-900) hover:bg-(--navy-800) text-white font-semibold py-2.5 px-6 rounded-xl transition-all active:scale-95 text-sm"
          >
            + Crear primer cliente
          </Link>
        </div>
      ) : (
        <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px] border-collapse min-w-170">
              <thead>
                <tr>
                  {['Nombre', 'DNI', 'Email', 'Teléfono', ''].map((h) => (
                    <th key={h} className="px-5.5 py-3.5 text-left text-[10px] font-bold text-(--ink-mute) uppercase tracking-[1.3px] border-b border-(--border) whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-(--gold-100) transition-colors">
                    <td className="px-5.5 py-3.5 whitespace-nowrap border-b border-(--border)">
                      <div className="flex items-center gap-3">
                        <span className="w-8.5 h-8.5 shrink-0 rounded-[11px] bg-linear-to-br from-(--navy-800) to-(--navy-950) text-(--gold-400) flex items-center justify-center">
                          <IconPersonSolo />
                        </span>
                        <span className="text-sm font-bold text-(--ink)">{cliente.nombre} {cliente.apellidos}</span>
                      </div>
                    </td>
                    <td className="px-5.5 py-3.5 whitespace-nowrap text-sm text-(--ink-soft) tabular-nums border-b border-(--border)">{cliente.dni}</td>
                    <td className="px-5.5 py-3.5 whitespace-nowrap text-sm text-(--ink-soft) border-b border-(--border)">{cliente.email}</td>
                    <td className="px-5.5 py-3.5 whitespace-nowrap text-sm text-(--ink-soft) tabular-nums border-b border-(--border)">{cliente.telefono}</td>
                    <td className="px-5.5 py-3.5 whitespace-nowrap text-right border-b border-(--border)">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/clientes/${cliente.id}/editar`}
                          className="inline-flex w-8 h-8 rounded-[9px] items-center justify-center text-(--navy-700) hover:bg-(--surface-alt) transition-colors"
                          aria-label="Editar"
                        >
                          <IconEdit />
                        </Link>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          disabled={deleteLoading === cliente.id}
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
