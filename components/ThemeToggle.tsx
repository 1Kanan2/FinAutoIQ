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
        'w-10.5 h-10.5 rounded-xl border border-(--border) bg-(--surface-alt) text-(--gold-600) flex items-center justify-center cursor-pointer shrink-0 transition-all duration-200 hover:brightness-105 hover:-translate-y-px hover:shadow-md active:scale-90'
      }
    >
      <span
        key={isDark ? 'dark' : 'light'}
        className="inline-flex animate-fade-up"
        style={{ animationDuration: '.35s' }}
      >
        {isDark ? <IconSun /> : <IconMoon />}
      </span>
    </button>
  )
}
