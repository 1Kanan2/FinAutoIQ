'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import ThemeToggle from '@/components/ThemeToggle'
import { IconBrand, IconDoc, IconWallet, IconPerson, IconSpinner } from '@/components/ui/icons'

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

  const inputCls = 'w-full box-border px-3.5 py-3 rounded-[11px] border border-(--border) bg-(--surface-alt) text-(--ink) text-[13.5px] outline-none placeholder:text-(--ink-mute) transition-all focus:border-(--gold-500) focus:ring-3 focus:ring-(--gold-500)/15'
  const labelCls = 'block text-[12.5px] font-semibold text-(--ink-soft) mb-1.5'

  const features = [
    { icon: IconDoc, title: 'Cronograma francés completo', desc: 'Amortización, seguros y períodos de gracia mes a mes.' },
    { icon: IconWallet, title: 'VAN, TIR y TCEA automáticos', desc: 'Indicadores financieros calculados al instante para cada operación.' },
    { icon: IconPerson, title: 'Gestión de clientes y flota', desc: 'Cartera de clientes y vehículos centralizada en un solo panel.' },
  ]

  return (
    <div className="min-h-screen flex flex-wrap bg-(--bg) text-(--ink)">
      {/* IZQUIERDA: presentación */}
      <div className="flex-1 basis-120 min-w-0 bg-linear-to-br from-(--navy-900) to-(--navy-950) text-white px-8 py-14 md:px-14 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute -top-30 -right-30 w-85 h-85 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--gold-500)_22%,transparent),transparent_70%)] animate-float-slow" />
        <div className="absolute -bottom-40 -left-25 w-85 h-85 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--gold-500)_14%,transparent),transparent_70%)]" />

        <div className="relative max-w-115 animate-fade-up">
          <div className="flex items-center gap-3 mb-9">
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-(--gold-400) to-(--gold-600) flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(198,160,82,.5)]">
              <IconBrand size={22} />
            </div>
            <div>
              <div className="font-serif-display italic text-[23px] font-semibold">FinAutoIQ</div>
              <div className="text-[10px] tracking-[2px] text-(--gold-500) uppercase">Private Banking Suite</div>
            </div>
          </div>

          <h1 className="font-serif-display text-[32px] md:text-[38px] leading-[1.18] font-semibold mb-4.5">
            Financiamiento vehicular con <span className="italic text-(--gold-400)">precisión</span> de banca privada.
          </h1>
          <p className="text-[14.5px] leading-[1.7] text-white/68 mb-8.5">
            Simulador de crédito automotor que calcula cronogramas bajo el método francés, con VAN, TIR y TCEA en tiempo real — pensado para asesorías financieras que exigen exactitud y presentación impecable.
          </p>

          <div className="flex flex-col gap-4.5 mb-9">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3.5 items-start">
                <div className="w-8.5 h-8.5 shrink-0 rounded-[9px] bg-(--gold-500)/14 flex items-center justify-center">
                  <Icon size={16} className="text-(--gold-400)" />
                </div>
                <div>
                  <p className="text-[13.5px] font-bold mb-0.5">{title}</p>
                  <p className="text-[12.5px] text-white/55 m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 pt-5 border-t border-white/10">
            <div className="w-7.5 h-7.5 rounded-[9px] bg-linear-to-br from-(--gold-400) to-(--gold-600) text-(--navy-950) font-extrabold text-xs flex items-center justify-center">KH</div>
            <p className="text-xs text-white/55 m-0">Proyecto de portafolio de <span className="text-white font-semibold">Keyner Hancco</span></p>
          </div>
        </div>
      </div>

      {/* DERECHA: formulario */}
      <div className="flex-1 basis-95 min-w-0 flex items-center justify-center px-6 py-12 relative">
        <ThemeToggle className="absolute top-7 right-7 w-10.5 h-10.5 rounded-xl border border-(--border) bg-(--surface-alt) text-(--gold-600) flex items-center justify-center cursor-pointer" />

        <div className="w-full max-w-100 animate-fade-up [animation-delay:.1s]">
          <div className="mb-8">
            <h2 className="font-serif-display italic text-[26px] font-semibold text-(--ink) mb-1.5">Iniciar sesión</h2>
            <p className="text-[13.5px] text-(--ink-mute) m-0">Accede a tu panel de financiamiento</p>
          </div>

          <div className="bg-(--surface) border border-(--border) rounded-[20px] shadow-(--shadow) p-8">
            {error && (
              <div className="mb-5 p-3 bg-(--bad)/10 border border-(--bad)/30 rounded-lg flex items-start gap-2">
                <span className="text-(--bad) shrink-0 mt-0.5">⚠</span>
                <p className="text-sm text-(--bad)">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4.5">
              <div>
                <label htmlFor="email" className={labelCls}>Correo electrónico</label>
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
                className="mt-1.5 w-full py-3.5 rounded-[11px] bg-(--navy-900) hover:bg-(--navy-800) disabled:opacity-60 text-white font-bold text-sm cursor-pointer shadow-[0_10px_24px_-10px_rgba(15,32,68,.5)] transition-all hover:-translate-y-px"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <IconSpinner size={16} />
                    Iniciando sesión...
                  </span>
                ) : 'Iniciar Sesión'}
              </button>
            </form>

            <p className="mt-5.5 text-center text-[13px] text-(--ink-mute)">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="font-bold text-(--gold-600) hover:text-(--gold-500) transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
