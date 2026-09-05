'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import ThemeToggle from '@/components/ThemeToggle'
import { IconBrand, IconGrid, IconPerson, IconCar, IconDoc, IconChevronLeft, IconMenu, IconClose } from '@/components/ui/icons'

/*
 * Desarrollado por: Keyner Hancco
 * GitHub: https://github.com/1Kanan2
 * keynerivan@outlook.com
 */

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: IconGrid },
  { href: '/clientes', label: 'Clientes', icon: IconPerson },
  { href: '/vehiculos', label: 'Vehículos', icon: IconCar },
  { href: '/creditos', label: 'Créditos', icon: IconDoc },
]

const SECTION_META: Record<string, { eyebrow: string; title: string }> = {
  '/dashboard': { eyebrow: 'Panel General', title: 'Dashboard' },
  '/clientes': { eyebrow: 'Gestión', title: 'Clientes' },
  '/vehiculos': { eyebrow: 'Gestión', title: 'Vehículos' },
  '/creditos': { eyebrow: 'Historial', title: 'Créditos' },
}

const NO_SHELL_ROUTES = ['/', '/login', '/register']

const COLLAPSE_KEY = 'finautoiq-sidebar-collapsed'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (NO_SHELL_ROUTES.includes(pathname)) {
    return <>{children}</>
  }

  return <Shell pathname={pathname}>{children}</Shell>
}

function Shell({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_KEY)
      if (stored === '1') setCollapsed(true)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setUser({ email: user.email || '' })
      } catch { /* ignore */ }
    }
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? { email: session.user.email || '' } : null)
    })
    return () => subscription?.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0') } catch { /* ignore */ }
      return next
    })
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const section = SECTION_META[('/' + pathname.split('/')[1]) as string] ?? SECTION_META['/dashboard']

  return (
    <div className="min-h-screen flex bg-(--bg) text-(--ink)">
      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-40 flex-shrink-0 bg-linear-to-b from-(--navy-900) to-(--navy-950) border-r border-[color-mix(in_srgb,var(--gold-500)_18%,transparent)] flex flex-col overflow-hidden transition-[width,transform] duration-250 ease-[cubic-bezier(.4,0,.2,1)]
          ${collapsed ? 'md:w-19' : 'md:w-66'}
          w-66 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex items-center gap-3 px-5 py-6 whitespace-nowrap">
          <div className="w-9.5 h-9.5 shrink-0 rounded-[11px] bg-linear-to-br from-(--gold-400) to-(--gold-600) flex items-center justify-center shadow-[0_6px_16px_-4px_rgba(198,160,82,.5)]">
            <IconBrand size={20} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-serif-display italic text-[19px] font-semibold text-white leading-tight tracking-[.2px]">FinAutoIQ</div>
              <div className="text-[9.5px] tracking-[2px] text-(--gold-500) uppercase mt-0.5">Private Banking Suite</div>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto md:hidden text-white/60 hover:text-white p-1"
            aria-label="Cerrar menú"
          >
            <IconClose size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 pt-2 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[11px] text-[13.5px] font-semibold whitespace-nowrap border-l-2 transition-colors ${
                  active
                    ? 'bg-linear-to-r from-[color-mix(in_srgb,var(--gold-500)_16%,transparent)] to-transparent border-(--gold-500) text-white'
                    : 'border-transparent text-white/62 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={toggleCollapse}
          className="hidden md:flex mx-3 mb-4.5 mt-2.5 p-2.5 border border-white/10 bg-white/5 rounded-[10px] text-white/55 hover:bg-white/10 hover:text-white items-center justify-center cursor-pointer"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <IconChevronLeft size={16} className={`transition-transform duration-250 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TOPBAR */}
        <header className="h-18.5 shrink-0 flex items-center justify-between px-5 md:px-8 border-b border-(--border) bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-(--ink-mute) hover:text-(--ink) p-1 shrink-0"
              aria-label="Abrir menú"
            >
              <IconMenu />
            </button>
            <div className="min-w-0">
              <div className="text-[11px] text-(--ink-mute) uppercase tracking-[1.5px] font-semibold truncate">{section.eyebrow}</div>
              <div className="font-serif-display italic text-[20px] md:text-[22px] font-semibold text-(--ink) mt-0.5 truncate">{section.title}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-3.5 shrink-0">
            <ThemeToggle />
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2.5 pl-1.5 sm:pr-3.5 pr-1.5 py-1.5 rounded-xl bg-(--surface-alt) border border-(--border) cursor-pointer hover:brightness-105"
                >
                  <span className="w-7.5 h-7.5 rounded-[9px] bg-linear-to-br from-(--gold-400) to-(--gold-600) text-(--navy-950) font-bold text-[13px] flex items-center justify-center shrink-0">
                    {user.email[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:inline text-[13px] font-semibold text-(--ink) max-w-[180px] truncate">{user.email}</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-(--surface) border border-(--border) rounded-xl shadow-(--shadow) py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-(--border)">
                      <p className="text-[10px] text-(--ink-mute) uppercase tracking-wider">Sesión activa</p>
                      <p className="text-sm font-medium text-(--ink) truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-(--bad) hover:bg-(--surface-alt) transition-colors font-medium"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-5 py-7 md:px-8 md:py-8 box-border">
          {children}
        </main>
      </div>
    </div>
  )
}
