'use client'

import { useEffect, useRef, useState } from 'react'

export default function AutorCard() {
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

  return (
    <div ref={cardRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Card de autoría */}
      {open && (
        <div
          className="w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-5"
          style={{ animation: 'autorFadeUp 200ms ease-out both' }}
        >
          {/* Botón cerrar */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-sm font-bold"
            aria-label="Cerrar"
          >
            ✕
          </button>

          {/* Logo */}
          <div className="flex flex-col items-center gap-2 mb-4">
            <img src="/LogoKH.png" alt="KH" width={72} height={72} />
            <div className="text-center">
              <p className="text-xs text-slate-400">Creado por:</p>
              <p className="text-lg font-bold text-[#0f2044] leading-tight">Keyner Hancco</p>
            </div>
          </div>

          <hr className="border-slate-100 mb-4" />

          {/* Botones de contacto */}
          <div className="flex items-center justify-center gap-3">

            {/* GitHub */}
            <a
              href="https://github.com/1Kanan2"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#24292e' }}
              aria-label="GitHub"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>

            {/* Email */}
            <a
              href="mailto:keynerivan@outlook.com"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#ea4335' }}
              aria-label="Email"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/51948646060"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#25d366' }}
              aria-label="WhatsApp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM11.5 2C6.25 2 2 6.25 2 11.5c0 1.61.43 3.13 1.17 4.44L2 22l6.19-1.15C9.44 21.59 10.45 22 11.5 22 16.75 22 21 17.75 21 12.5S16.75 2 11.5 2zm0 18c-1.43 0-2.8-.38-3.98-1.06l-.28-.17-2.9.54.55-2.83-.19-.29A8.014 8.014 0 013.5 11.5C3.5 6.81 7.31 3 12 3s8.5 3.81 8.5 8.5S16.69 20 12 20h-.5z" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center overflow-hidden transition-transform duration-200 hover:scale-110 focus:outline-none"
        style={{ border: '2px solid #0f2044' }}
        aria-label="Sobre el autor"
      >
        <img src="/LogoKH.png" alt="KH" width={48} height={48} />
      </button>

      <style>{`
        @keyframes autorFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
