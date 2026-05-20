'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getPerfil } from '@/lib/supabase'

export default function CheckinHub() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) { router.push('/'); return }
      setPerfil(p)
    })
  }, [])

  if (!perfil) return (
    <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>
  )

  return (
    <main className="min-h-screen bg-[#0F3A42] flex flex-col">
      <div className="px-4 py-5">
        <button onClick={() => router.back()} className="text-[#7ADCE8] text-xs font-bold mb-4">← VOLVER</button>
        <div className="text-white font-bold text-2xl tracking-wide mb-1">Checkin</div>
        <div className="text-[#7ADCE8] text-xs">{perfil.nombre} {perfil.apellido} · {perfil.turno}</div>
      </div>

      <div className="flex-1 bg-[#F0FAFB] rounded-t-3xl px-4 pt-6 pb-10">
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-4">Seleccioná el tipo de checkin</div>

        <button onClick={() => router.push('/dashboard/checkin/vehiculos')}
          className="w-full bg-white border border-[#B2E0E8] rounded-2xl p-4 mb-3 text-left active:bg-[#F0FAFB]">
          <div className="flex items-center gap-4">
            <div className="bg-[#D6F4F8] rounded-xl p-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5"/>
                <circle cx="16" cy="19" r="2"/>
                <circle cx="7" cy="19" r="2"/>
                <path d="M13 17H9"/>
              </svg>
            </div>
            <div>
              <div className="text-[#0F3A42] font-bold text-base">Vehículos</div>
              <div className="text-[#7A9EA5] text-xs mt-0.5">Check list de vehículos y equipos · todos los sectores</div>
            </div>
          </div>
        </button>

        <button onClick={() => router.push('/dashboard/checkin')}
          className="w-full bg-white border border-[#B2E0E8] rounded-2xl p-4 mb-3 text-left active:bg-[#F0FAFB]">
          <div className="flex items-center gap-4">
            <div className="bg-[#D6F4F8] rounded-xl p-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <div className="text-[#0F3A42] font-bold text-base">Herramientas</div>
              <div className="text-[#7A9EA5] text-xs mt-0.5">Control de herramientas por turno</div>
            </div>
          </div>
        </button>

        <div className="w-full bg-[#F8F8F8] border border-dashed border-[#B2E0E8] rounded-2xl p-4 opacity-60">
          <div className="flex items-center gap-4">
            <div className="bg-[#E8E8E6] rounded-xl p-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A9EA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div className="text-[#7A9EA5] font-bold text-base">EPP</div>
              <div className="text-[#7A9EA5] text-xs mt-0.5">Elementos de protección personal · Próximamente</div>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}