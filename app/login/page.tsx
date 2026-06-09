'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setLoading(false)
      router.push('/')
    } catch {
      setError('Error durante el inicio de sesión')
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c9a84c]/10 focus:border-[#c9a84c] outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fc] to-white py-12 px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo / header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#0f2044] mb-1 tracking-wide">
            FinAutoIQ
          </h1>
          <p className="text-[#c9a84c] text-sm font-medium">Portal de Financiamiento · FIE</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-[#0f2044] mb-6 text-center">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className={labelCls}>Correo Electrónico</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className={labelCls}>Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputCls}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f2044] hover:bg-[#1a3260] disabled:bg-[#0f2044]/50 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-[#c9a84c] hover:text-[#b8960c] font-semibold transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
