'use client'

import { useEffect, useState } from 'react'
import { IconSun, IconMoon } from '@/components/ui/icons'

const STORAGE_KEY = 'finautoiq-theme'

export default function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    try { localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light') } catch { /* ignore */ }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema claro/oscuro"
      className={
        className ??
        'w-[42px] h-[42px] rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--gold-600)] flex items-center justify-center cursor-pointer shrink-0 hover:brightness-105 transition-all'
      }
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </button>
  )
}
