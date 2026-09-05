'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getVehiculoById, updateVehiculo, type VehiculoForm } from '@/lib/supabase-vehicles'
import { IconChevronLeft, IconSpinner } from '@/components/ui/icons'

const inputCls = 'w-full box-border px-3.5 py-2.5 rounded-[11px] border border-(--border) bg-(--surface-alt) text-(--ink) text-sm outline-none placeholder:text-(--ink-mute) transition-all focus:border-(--gold-500) focus:ring-3 focus:ring-(--gold-500)/15'
const labelCls = 'block text-sm font-medium text-(--ink-soft) mb-1.5'

export default function EditarVehiculoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<VehiculoForm>({
    marca: '', modelo: '', anio: new Date().getFullYear(), precio_soles: 0, precio_dolares: 0,
  })

  useEffect(() => { loadVehiculo() }, [id])

  const loadVehiculo = async () => {
    try {
      const v = await getVehiculoById(id)
      if (v) setFormData({ marca: v.marca, modelo: v.modelo, anio: v.anio, precio_soles: v.precio_soles, precio_dolares: v.precio_dolares })
      else setError('Vehículo no encontrado')
    } catch { setError('Error al cargar el vehículo') }
    finally { setLoading(false) }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'anio' || name === 'precio_soles' || name === 'precio_dolares'
        ? parseFloat(value) || 0
        : value,
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.marca.trim()) { setError('La marca es obligatoria'); return false }
    if (!formData.modelo.trim()) { setError('El modelo es obligatorio'); return false }
    if (formData.anio < 1900 || formData.anio > new Date().getFullYear() + 1) { setError('Año no válido'); return false }
    if (formData.precio_soles <= 0) { setError('El precio en soles debe ser mayor a 0'); return false }
    if (formData.precio_dolares <= 0) { setError('El precio en dólares debe ser mayor a 0'); return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validateForm()) return
    setSaving(true)
    try { await updateVehiculo(id, formData); router.push('/vehiculos') }
    catch (err) { setError(err instanceof Error ? err.message : 'Error al actualizar el vehículo') }
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
        <Link href="/vehiculos" className="inline-flex items-center gap-1 text-(--ink-mute) hover:text-(--ink) text-sm font-medium transition-colors">
          <IconChevronLeft size={14} /> Volver a vehículos
        </Link>
        <h1 className="font-serif-display italic text-2xl font-semibold text-(--ink) mt-2">Editar Vehículo</h1>
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
              <label className={labelCls}>Marca *</label>
              <input type="text" name="marca" value={formData.marca} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Modelo *</label>
              <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Año *</label>
              <input type="number" name="anio" value={formData.anio} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Precio en Soles (S/) *</label>
              <input type="number" name="precio_soles" value={formData.precio_soles} onChange={handleChange} step="100" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Precio en Dólares (USD) *</label>
              <input type="number" name="precio_dolares" value={formData.precio_dolares} onChange={handleChange} step="100" className={inputCls} />
            </div>
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
              href="/vehiculos"
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
