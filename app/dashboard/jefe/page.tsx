'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil } from '@/lib/supabase'

export default function DashboardJefe() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
    })
  }, [])

  if (!perfil) return <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Jefe de Sector</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Vista global · {perfil.nombre}</div>
          </div>
          <div className="bg-[#0A2830] text-[#7ADCE8] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">JEFE</div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Estado general</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
            <div className="text-[#1ABBD6] font-bold text-xl">6.996</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Operativas</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
            <div className="text-[#E24B4A] font-bold text-xl">4</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Con falla</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
            <div className="text-[#3B6D11] font-bold text-xl">8</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Técnicos</div>
          </div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Alertas pendientes</div>
        <div className="bg-[#FCEBEB] border border-[#F09595] rounded-xl px-3 py-2 flex gap-2 items-start mb-2">
          <div className="w-2 h-2 rounded-full bg-[#E24B4A] mt-1 shrink-0"></div>
          <div className="text-[#A32D2D] text-xs leading-relaxed"><span className="font-bold">Km 38.4</span> · Luminaria apagada 47 min · Turno mañana asignado</div>
        </div>
        <div className="bg-[#FCEBEB] border border-[#F09595] rounded-xl px-3 py-2 flex gap-2 items-start mb-3">
          <div className="w-2 h-2 rounded-full bg-[#E24B4A] mt-1 shrink-0"></div>
          <div className="text-[#A32D2D] text-xs leading-relaxed"><span className="font-bold">TS-14 km 22</span> · Ruido en interruptor · Revisión 09:00</div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Aprobaciones pendientes</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2">
          <div className="text-[#0F3A42] font-bold text-sm">Pedido stock · Pañol</div>
          <div className="text-[#7A9EA5] text-xs mt-0.5 mb-2">12x lámpara LED 150W · López</div>
          <div className="flex gap-2">
            <button className="flex-1 bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold py-2 rounded-lg">Aprobar</button>
            <button className="flex-1 bg-[#FCEBEB] text-[#A32D2D] text-xs font-bold py-2 rounded-lg">Rechazar</button>
          </div>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-3">
          <div className="text-[#0F3A42] font-bold text-sm">Service · F-350 PAT 384</div>
          <div className="text-[#7A9EA5] text-xs mt-0.5 mb-2">Cambio aceite + filtros · 84.230 km</div>
          <div className="flex gap-2">
            <button className="flex-1 bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold py-2 rounded-lg">Aprobar</button>
            <button className="flex-1 bg-[#FCEBEB] text-[#A32D2D] text-xs font-bold py-2 rounded-lg">Rechazar</button>
          </div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Informes de los 3 turnos</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div><div className="text-[#0F3A42] font-bold text-sm">Turno noche 22–06</div><div className="text-[#7A9EA5] text-xs">Martínez · 2 tareas · 1 obs.</div></div>
          <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">Leído</span>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div><div className="text-[#0F3A42] font-bold text-sm">Turno tarde 14–22</div><div className="text-[#7A9EA5] text-xs">Suárez · 4 tareas · sin obs.</div></div>
          <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">Leído</span>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-24 flex justify-between items-center">
          <div><div className="text-[#0F3A42] font-bold text-sm">Turno mañana 07–15</div><div className="text-[#7A9EA5] text-xs">González · En curso</div></div>
          <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">En curso</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span className="text-[#1ABBD6] text-xs">Global</span>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span className="text-[#7ADCE8] text-xs">Personal</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span className="text-[#7ADCE8] text-xs">Traza</span>
        </div>
      </div>
    </main>
  )
}