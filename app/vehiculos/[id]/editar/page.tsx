'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getVehiculoById, updateVehiculo, type VehiculoForm } from '@/lib/supabase-vehicles'

const inputCls = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c9a84c]/10 focus:border-[#c9a84c] outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

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
        <Link href="/vehiculos" className="text-[#0f2044] hover:text-[#1a3260] text-sm font-medium transition-colors">
          ← Volver a vehículos
        </Link>
        <h1 className="text-3xl font-bold text-[#0f2044] mt-2">Editar Vehículo</h1>
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
              className="flex-1 bg-[#0f2044] hover:bg-[#1a3260] disabled:bg-[#0f2044]/50 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <Link
              href="/vehiculos"
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
