'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getClienteById, updateCliente, type ClienteForm } from '@/lib/supabase-clients'

const inputCls = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c9a84c]/10 focus:border-[#c9a84c] outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ClienteForm>({
    nombre: '', apellidos: '', dni: '', email: '', telefono: '', direccion: '',
  })

  useEffect(() => { loadCliente() }, [id])

  const loadCliente = async () => {
    try {
      const cliente = await getClienteById(id)
      if (cliente) {
        setFormData({ nombre: cliente.nombre, apellidos: cliente.apellidos, dni: cliente.dni, email: cliente.email, telefono: cliente.telefono, direccion: cliente.direccion })
      } else { setError('Cliente no encontrado') }
    } catch { setError('Error al cargar el cliente') }
    finally { setLoading(false) }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = (): boolean => {
    if (!formData.nombre.trim()) { setError('El nombre es obligatorio'); return false }
    if (!formData.apellidos.trim()) { setError('Los apellidos son obligatorios'); return false }
    if (formData.dni.length !== 8 || !/^\d+$/.test(formData.dni)) { setError('El DNI debe tener exactamente 8 dígitos'); return false }
    if (!formData.email.includes('@')) { setError('Email no válido'); return false }
    if (!formData.telefono.trim()) { setError('El teléfono es obligatorio'); return false }
    if (!formData.direccion.trim()) { setError('La dirección es obligatoria'); return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validateForm()) return
    setSaving(true)
    try { await updateCliente(id, formData); router.push('/clientes') }
    catch (err) { setError(err instanceof Error ? err.message : 'Error al actualizar el cliente') }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-[#0f2044]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/clientes" className="text-[#0f2044] hover:text-[#1a3260] text-sm font-medium transition-colors">
          ← Volver a clientes
        </Link>
        <h1 className="text-3xl font-bold text-[#0f2044] mt-2">Editar Cliente</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md border-l-[3px] border-[#c9a84c] p-8">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Nombre *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Apellidos *</label>
              <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>DNI (8 dígitos) *</label>
              <input type="text" name="dni" value={formData.dni} onChange={handleChange} maxLength={8} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Teléfono *</label>
              <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Dirección *</label>
            <textarea name="direccion" value={formData.direccion} onChange={handleChange} rows={3} className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#0f2044] hover:bg-[#1a3260] disabled:bg-[#0f2044]/50 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <Link
              href="/clientes"
              className="flex-1 border border-[#c9a84c] text-[#0f2044] font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 hover:bg-[#c9a84c]/10 active:scale-[0.98] text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
