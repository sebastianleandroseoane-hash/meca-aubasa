'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil } from '@/lib/supabase'

export default function DashboardSubgerente() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'subgerente') { router.push('/'); return }
      setPerfil(p)
    })
  }, [])

  if (!perfil) return <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Subgerencia</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Vista ejecutiva · {perfil.nombre}</div>
          </div>
          <div className="bg-[#1ABBD6] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">SUB</div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Traza en tiempo real</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#3B6D11] font-bold text-2xl">6.996</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Operativas</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#E24B4A] font-bold text-2xl">4</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Con falla</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#1ABBD6] font-bold text-2xl">8</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Técnicos activos</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#B87C0F] font-bold text-2xl">3</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Móviles en ruta</div>
          </div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Cobertura de turnos hoy</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#0F3A42] text-sm font-medium">Mañana 07–15</span>
            <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">3 técnicos</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#0F3A42] text-sm font-medium">Tarde 14–22</span>
            <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">3 técnicos</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#0F3A42] text-sm font-medium">Noche 22–06</span>
            <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">2 técnicos</span>
          </div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Alertas activas</div>
        <div className="bg-[#FCEBEB] border border-[#F09595] rounded-xl px-3 py-2 flex gap-2 items-start mb-3">
          <div className="w-2 h-2 rounded-full bg-[#E24B4A] mt-1 shrink-0"></div>
          <div className="text-[#A32D2D] text-xs leading-relaxed"><span className="font-bold">2 luminarias</span> sin respuesta +30 min · En atención</div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Resumen semanal</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div><div className="text-[#0F3A42] font-bold text-sm">Semana 16</div><div className="text-[#7A9EA5] text-xs mt-0.5">47 órdenes · 3 alertas · 0 accidentes</div></div>
          <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">Completo</span>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-24 flex justify-between items-center">
          <div><div className="text-[#0F3A42] font-bold text-sm">Consumo stock · Abril</div><div className="text-[#7A9EA5] text-xs mt-0.5">LED 150W: 38u · Fusibles: 12u</div></div>
          <span className="bg-[#E8E8E6] text-[#5F5E5A] text-xs font-bold px-2 py-0.5 rounded-full">Ver</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span className="text-[#1ABBD6] text-xs">Traza</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span className="text-[#7ADCE8] text-xs">Personal</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          <span className="text-[#7ADCE8] text-xs">Alertas</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          <span className="text-[#7ADCE8] text-xs">Stock</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Informes</span>
        </div>
      </div>
    </main>
  )
}