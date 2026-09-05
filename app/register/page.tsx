'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import ThemeToggle from '@/components/ThemeToggle'
import { IconBrand, IconSpinner } from '@/components/ui/icons'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { setError(error.message); setLoading(false); return }
      setSuccess(true)
      setEmail(''); setPassword(''); setConfirmPassword('')
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Error durante el registro')
      setLoading(false)
    }
  }

  const inputCls = (disabled?: boolean) =>
    `w-full box-border px-3.5 py-3 rounded-[11px] border border-(--border) bg-(--surface-alt) text-(--ink) text-[13.5px] outline-none placeholder:text-(--ink-mute) transition-all focus:border-(--gold-500) focus:ring-3 focus:ring-(--gold-500)/15 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`
  const labelCls = 'block text-[12.5px] font-semibold text-(--ink-soft) mb-1.5'

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg) text-(--ink) py-12 px-4 relative">
      <ThemeToggle className="absolute top-7 right-7 w-10.5 h-10.5 rounded-xl border border-(--border) bg-(--surface-alt) text-(--gold-600) flex items-center justify-center cursor-pointer" />

      <div className="w-full max-w-100 animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-11 h-11 mx-auto rounded-xl bg-linear-to-br from-(--gold-400) to-(--gold-600) flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(198,160,82,.5)] mb-3">
            <IconBrand size={22} />
          </div>
          <h1 className="font-serif-display italic text-[26px] font-semibold text-(--ink) mb-1">FinAutoIQ</h1>
          <p className="text-[13.5px] text-(--gold-600) font-semibold">Private Banking Suite</p>
        </div>

        <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) p-8">
          <h2 className="font-serif-display italic text-[20px] font-semibold text-(--ink) mb-6 text-center">
            Crear Cuenta
          </h2>

          {error && (
            <div className="mb-5 p-3 bg-(--bad)/10 border border-(--bad)/30 rounded-lg flex items-start gap-2">
              <span className="text-(--bad) shrink-0 mt-0.5">⚠</span>
              <p className="text-sm text-(--bad)">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-5 p-3 bg-(--good)/10 border border-(--good)/30 rounded-lg flex items-start gap-2">
              <span className="text-(--good) shrink-0 mt-0.5">✓</span>
              <p className="text-sm text-(--good)">¡Registro exitoso! Redirigiendo a inicio de sesión...</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4.5">
            <div>
              <label htmlFor="email" className={labelCls}>Correo Electrónico</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={success}
                className={inputCls(success)}
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
                disabled={success}
                className={inputCls(success)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelCls}>Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={success}
                className={inputCls(success)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="mt-1.5 w-full py-3.5 rounded-[11px] bg-(--navy-900) hover:bg-(--navy-800) disabled:opacity-60 text-white font-bold text-sm cursor-pointer shadow-[0_10px_24px_-10px_rgba(15,32,68,.5)] transition-all hover:-translate-y-px"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <IconSpinner size={16} />
                  Registrando...
                </span>
              ) : 'Crear Cuenta'}
            </button>
          </form>

          <p className="mt-5.5 text-center text-[13px] text-(--ink-mute)">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-bold text-(--gold-600) hover:text-(--gold-500) transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
