'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

/*
 * Desarrollado por: Keyner Hancco
 * GitHub: https://github.com/1Kanan2
 * keynerivan@outlook.com
 */

const NAV_LINKS = [
  { href: '/clientes', label: 'Clientes' },
  { href: '/vehiculos', label: 'Vehículos' },
  { href: '/creditos', label: 'Créditos' },
]

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [user, setUser] = useState<{ email: string } | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setUser({ email: user.email || '' })
      } catch { /* ignore */ } finally {
        setLoadingUser(false)
      }
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? { email: session.user.email || '' } : null)
    })
    return () => subscription?.unsubscribe()
  }, [supabase])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'))

  if (pathname === '/login' || pathname === '/register') return null

  return (
    <nav className="bg-[#0f2044] shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity duration-200 shrink-0"
          >
            <img src="/LogoFinAutoIQ.png" alt="FinAutoIQ" width={36} height={36} />
            <span className="text-[#c9a84c] font-bold text-xl tracking-wide">FinAutoIQ</span>
          </Link>

          {/* Desktop links */}
          {user && (
            <div className="hidden md:flex items-center gap-1 ml-8">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 group ${
                    isActive(href)
                      ? 'text-[#c9a84c]'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  {label}
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-0.5 bg-[#c9a84c] rounded-full transition-all duration-200 ${
                      isActive(href) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3 ml-auto md:ml-0">
            {!loadingUser && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-[#1a3260] hover:bg-[#0f2044] text-white text-sm px-3 py-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/60"
                >
                  <span className="w-6 h-6 rounded-full bg-[#c9a84c] text-[#0f2044] flex items-center justify-center text-xs font-bold shrink-0 select-none">
                    {user.email[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:block max-w-[180px] truncate">{user.email}</span>
                  <svg
                    className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Sesión activa</p>
                      <p className="text-sm font-medium text-slate-800 truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : !loadingUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-[#c9a84c] text-sm font-medium hover:text-white transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="bg-[#c9a84c] text-[#0f2044] text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-[#b8960c] transition-colors active:scale-95"
                >
                  Registrarse
                </Link>
              </div>
            ) : null}

            {/* Mobile hamburger */}
            {user && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden text-white/80 hover:text-white p-1 transition-colors"
                aria-label="Menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {user && mobileOpen && (
          <div className="md:hidden border-t border-white/10 pb-3 pt-2 space-y-0.5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive(href)
                    ? 'text-[#c9a84c] bg-white/10'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
