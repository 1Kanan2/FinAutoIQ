'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCliente, type ClienteForm } from '@/lib/supabase-clients'
import { IconChevronLeft } from '@/components/ui/icons'

const inputCls = 'w-full box-border px-3.5 py-2.5 rounded-[11px] border border-(--border) bg-(--surface-alt) text-(--ink) text-sm outline-none placeholder:text-(--ink-mute) transition-all focus:border-(--gold-500) focus:ring-3 focus:ring-(--gold-500)/15'
const labelCls = 'block text-sm font-medium text-(--ink-soft) mb-1.5'

export default function NuevoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ClienteForm>({
    nombre: '', apellidos: '', dni: '', email: '', telefono: '', direccion: '',
  })

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
    setLoading(true)
    try { await createCliente(formData); router.push('/clientes') }
    catch (err) { setError(err instanceof Error ? err.message : 'Error al crear el cliente') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/clientes" className="inline-flex items-center gap-1 text-(--ink-mute) hover:text-(--ink) text-sm font-medium transition-colors">
          <IconChevronLeft size={14} /> Volver a clientes
        </Link>
        <h1 className="font-serif-display italic text-2xl font-semibold text-(--ink) mt-2">Nuevo Cliente</h1>
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
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                placeholder="Juan" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Apellidos *</label>
              <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange}
                placeholder="Pérez García" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>DNI (8 dígitos) *</label>
              <input type="text" name="dni" value={formData.dni} onChange={handleChange}
                placeholder="12345678" maxLength={8} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="juan@ejemplo.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Teléfono *</label>
              <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                placeholder="987654321" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Dirección *</label>
            <textarea name="direccion" value={formData.direccion} onChange={handleChange}
              placeholder="Av. Principal 123, Lima" rows={3} className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-(--navy-900) hover:bg-(--navy-800) disabled:opacity-60 text-white font-semibold py-2.75 px-6 rounded-xl transition-all active:scale-[0.98] shadow-[0_10px_24px_-10px_rgba(15,32,68,.5)]"
            >
              {loading ? 'Creando...' : 'Crear Cliente'}
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
