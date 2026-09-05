'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { IconClose, IconGithub, IconMail, IconWhatsapp } from '@/components/ui/icons'

const HIDDEN_ROUTES = ['/login', '/register']

export default function AutorCard() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // abre automáticamente la primera vez en la sesión
  useEffect(() => {
    if (!sessionStorage.getItem('autorCardShown')) {
      const t = setTimeout(() => {
        setOpen(true)
        sessionStorage.setItem('autorCardShown', '1')
      }, 1000)
      return () => clearTimeout(t)
    }
  }, [])

  // cierra al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (HIDDEN_ROUTES.includes(pathname)) return null

  return (
    <div ref={cardRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-62.5 bg-(--surface) border border-(--border) rounded-[18px] p-5 shadow-(--shadow) relative animate-fade-up">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 w-5.5 h-5.5 flex items-center justify-center rounded-full text-(--ink-mute) bg-(--surface-alt) hover:text-(--ink) hover:rotate-90 transition-all duration-200"
            aria-label="Cerrar"
          >
            <IconClose />
          </button>

          <div className="flex flex-col items-center gap-2">
            <div className="w-13 h-13 rounded-full p-0.5 bg-(--surface) border-2 border-(--gold-500) overflow-hidden">
              <img src="/LogoKH.png" alt="Keyner Hancco" className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-(--ink-mute) uppercase tracking-wider m-0">Creado por</p>
              <p className="font-serif-display font-semibold text-base text-(--ink) mt-0.5 mb-0">Keyner Hancco</p>
            </div>
          </div>

          <div className="h-px bg-(--border) my-3.5" />

          <div className="flex items-center justify-center gap-2.5">
            <a
              href="https://github.com/1Kanan2"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-(--navy-900) transition-all duration-200 hover:opacity-85 hover:scale-110 hover:-translate-y-0.5 active:scale-95"
              aria-label="GitHub"
            >
              <IconGithub />
            </a>
            <a
              href="mailto:keynerivan@outlook.com"
              className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-(--gold-600) transition-all duration-200 hover:opacity-85 hover:scale-110 hover:-translate-y-0.5 active:scale-95"
              aria-label="Email"
            >
              <IconMail />
            </a>
            <a
              href="https://wa.me/51948646060"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-(--good) transition-all duration-200 hover:opacity-85 hover:scale-110 hover:-translate-y-0.5 active:scale-95"
              aria-label="WhatsApp"
            >
              <IconWhatsapp />
            </a>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-13 h-13 rounded-full p-0.5 bg-(--surface) border-2 border-(--gold-500) shadow-(--shadow) flex items-center justify-center overflow-hidden transition-transform duration-200 hover:scale-110 hover:rotate-3 active:scale-95 focus:outline-none ${open ? '' : 'animate-breathe'}`}
        aria-label="Sobre el autor"
      >
        <img src="/LogoKH.png" alt="KH" width={48} height={48} className="rounded-full object-cover" />
      </button>
    </div>
  )
}
