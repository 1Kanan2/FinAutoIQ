'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { IconBrand, IconSpinner } from '@/components/ui/icons'

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
      <div className="min-h-screen flex items-center justify-center bg-(--bg)">
        <IconSpinner className="text-(--navy-900)" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg) text-(--ink) px-4">
      <div className="max-w-lg w-full text-center space-y-8 animate-fade-up">
        <div>
          <div className="w-11 h-11 mx-auto rounded-xl bg-linear-to-br from-(--gold-400) to-(--gold-600) flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(198,160,82,.5)] mb-3">
            <IconBrand size={22} />
          </div>
          <h1 className="font-serif-display italic text-4xl font-semibold text-(--ink) mb-1">FinAutoIQ</h1>
          <p className="text-(--gold-600) text-sm font-semibold">Private Banking Suite</p>
        </div>

        <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) p-10 space-y-6">
          <div className="space-y-3">
            <h2 className="font-serif-display italic text-xl font-semibold text-(--ink)">¿Eres usuario registrado?</h2>
            <a
              href="/login"
              className="inline-block bg-(--navy-900) hover:bg-(--navy-800) text-white font-bold py-3 px-8 rounded-[11px] transition-all active:scale-[0.98] shadow-[0_10px_24px_-10px_rgba(15,32,68,.5)] hover:-translate-y-px"
            >
              Iniciar Sesión
            </a>
          </div>

          <div className="border-t border-(--border) pt-6 space-y-3">
            <h2 className="font-serif-display italic text-xl font-semibold text-(--ink)">¿No tienes cuenta?</h2>
            <a
              href="/register"
              className="inline-block border-2 border-(--gold-500) text-(--ink) font-bold py-3 px-8 rounded-[11px] transition-all hover:bg-(--gold-100) active:scale-[0.98]"
            >
              Crear Cuenta
            </a>
          </div>

          <div className="border-t border-(--border) pt-6 bg-(--surface-alt) rounded-xl p-5 text-left">
            <h3 className="text-sm font-bold text-(--ink) mb-3 uppercase tracking-wider">Características</h3>
            <ul className="text-(--ink-soft) space-y-1.5 text-sm">
              <li className="flex items-center gap-2"><span className="text-(--gold-600) font-bold">✓</span> Gestión integral de clientes y vehículos</li>
              <li className="flex items-center gap-2"><span className="text-(--gold-600) font-bold">✓</span> Cronograma con método francés (VAN, TIR, TCEA)</li>
              <li className="flex items-center gap-2"><span className="text-(--gold-600) font-bold">✓</span> Gracia total, parcial y compra inteligente</li>
              <li className="flex items-center gap-2"><span className="text-(--gold-600) font-bold">✓</span> Autenticación segura con Supabase</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
