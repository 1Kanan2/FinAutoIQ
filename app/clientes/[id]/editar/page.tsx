'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getClienteById, updateCliente, type ClienteForm } from '@/lib/supabase-clients'
import { IconChevronLeft, IconSpinner } from '@/components/ui/icons'

const inputCls = 'w-full box-border px-3.5 py-2.5 rounded-[11px] border border-(--border) bg-(--surface-alt) text-(--ink) text-sm outline-none placeholder:text-(--ink-mute) transition-all focus:border-(--gold-500) focus:ring-3 focus:ring-(--gold-500)/15'
const labelCls = 'block text-sm font-medium text-(--ink-soft) mb-1.5'

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
      <div className="flex items-center justify-center py-24">
        <IconSpinner className="text-(--navy-900)" size={32} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/clientes" className="inline-flex items-center gap-1 text-(--ink-mute) hover:text-(--ink) text-sm font-medium transition-colors">
          <IconChevronLeft size={14} /> Volver a clientes
        </Link>
        <h1 className="font-serif-display italic text-2xl font-semibold text-(--ink) mt-2">Editar Cliente</h1>
      </div>

      <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) p-8">
        {error && (
          <div className="mb-6 p-3 bg-(--bad)/10 border border-(--bad)/30 rounded-lg flex items-start gap-2">
            <span className="text-(--bad) shrink-0 mt-0.5">⚠</span>
            <p className="text-sm text-(--bad)">{error}</p>
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
              className="flex-1 bg-(--navy-900) hover:bg-(--navy-800) disabled:opacity-60 text-white font-semibold py-2.75 px-6 rounded-xl transition-all active:scale-[0.98] shadow-[0_10px_24px_-10px_rgba(15,32,68,.5)]"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <Link
              href="/clientes"
              className="flex-1 border border-(--gold-500) text-(--ink) font-semibold py-2.75 px-6 rounded-xl transition-all hover:bg-(--gold-100) active:scale-[0.98] text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
