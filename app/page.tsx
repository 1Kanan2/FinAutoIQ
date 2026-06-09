'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { router.push('/dashboard') }
      else { setLoading(false) }
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#0f2044]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fc] to-white px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0f2044] mb-2 tracking-wide">FinAutoIQ</h1>
          <p className="text-[#c9a84c] text-sm font-medium">Portal de Financiamiento · FIE</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-10 space-y-6">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-[#0f2044]">¿Eres usuario registrado?</h2>
            <a
              href="/login"
              className="inline-block bg-[#0f2044] hover:bg-[#1a3260] text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md"
            >
              Iniciar Sesión
            </a>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-3">
            <h2 className="text-xl font-bold text-[#0f2044]">¿No tienes cuenta?</h2>
            <a
              href="/register"
              className="inline-block border-2 border-[#c9a84c] text-[#0f2044] font-bold py-3 px-8 rounded-lg transition-all duration-200 hover:bg-[#c9a84c]/10 active:scale-[0.98]"
            >
              Crear Cuenta
            </a>
          </div>

          <div className="border-t border-slate-100 pt-6 bg-slate-50 rounded-xl p-5 text-left">
            <h3 className="text-sm font-bold text-[#0f2044] mb-3 uppercase tracking-wider">Características</h3>
            <ul className="text-slate-600 space-y-1.5 text-sm">
              <li className="flex items-center gap-2"><span className="text-[#c9a84c] font-bold">✓</span> Gestión integral de clientes y vehículos</li>
              <li className="flex items-center gap-2"><span className="text-[#c9a84c] font-bold">✓</span> Cronograma con método francés (VAN, TIR, TCEA)</li>
              <li className="flex items-center gap-2"><span className="text-[#c9a84c] font-bold">✓</span> Gracia total, parcial y compra inteligente</li>
              <li className="flex items-center gap-2"><span className="text-[#c9a84c] font-bold">✓</span> Autenticación segura con Supabase</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
