'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil } from '@/lib/supabase'

export default function DashboardTecnicoEdificio() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'tecnico_electrico_edificio' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
    })
  }, [])

  if (!perfil) return <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Buen día, {perfil.nombre}</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Técnico Eléctrico · Edificios de peaje</div>
          </div>
          <div className="bg-[#1ABBD6] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">EDIF</div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Mi turno hoy</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#B87C0F] font-bold text-2xl">5</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Tareas asignadas</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#1ABBD6] font-bold text-2xl">2</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Completadas</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#3B6D11] font-bold text-2xl">OK</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Stock pañol</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#3B6D11] font-bold text-2xl">OK</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">VTV móvil</div>
          </div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Orden activa</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[#0F3A42] font-bold text-sm">Revisión tablero · Cabina km 18</div>
              <div className="text-[#7A9EA5] text-xs mt-0.5">Inspección circuito iluminación</div>
            </div>
            <div className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">En curso</div>
          </div>
          <div className="bg-[#E8F4F7] rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-[#1ABBD6] h-full rounded-full" style={{width:'40%'}}></div>
          </div>
          <div className="text-[#7A9EA5] text-xs mt-1">2 de 5 puntos completados</div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Edificios a revisar hoy</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div>
            <div className="text-[#0F3A42] font-bold text-sm">Cabina peaje · Km 18</div>
            <div className="text-[#7A9EA5] text-xs mt-0.5">Tablero + iluminación</div>
          </div>
          <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">En curso</span>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div>
            <div className="text-[#0F3A42] font-bold text-sm">Cabina peaje · Km 34</div>
            <div className="text-[#7A9EA5] text-xs mt-0.5">Reemplazo luminaria interior</div>
          </div>
          <span className="bg-[#E8E8E6] text-[#5F5E5A] text-xs font-bold px-2 py-0.5 rounded-full">Pendiente</span>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Turno anterior dejó</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-24">
          <div className="text-[#0F3A42] font-bold text-sm">Informe 22–06 · López</div>
          <div className="text-[#7A9EA5] text-xs mt-0.5">4 cabinas OK · Km 52 sin luz exterior</div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span className="text-[#1ABBD6] text-xs">Inicio</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span className="text-[#7ADCE8] text-xs">Órdenes</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          <span className="text-[#7ADCE8] text-xs">Edificios</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Informe</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Manual</span>
        </div>
      </div>
    </main>
  )
}