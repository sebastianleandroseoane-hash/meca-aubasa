'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil } from '@/lib/supabase'

export default function DashboardTalleristaElectrico() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'tallerista_electrico' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
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
            <div className="text-[#7ADCE8] text-xs mt-0.5">Tallerista Eléctrico</div>
          </div>
          <div className="bg-[#1ABBD6] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">TALL·E</div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Trabajos del día</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#B87C0F] font-bold text-2xl">4</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Órdenes taller</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#1ABBD6] font-bold text-2xl">1</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Completadas</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#3B6D11] font-bold text-2xl">2</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">En reparación</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#E24B4A] font-bold text-2xl">1</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Sin repuesto</div>
          </div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Órdenes activas</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div>
            <div className="text-[#0F3A42] font-bold text-sm">Reparación balasto · Ref. 441</div>
            <div className="text-[#7A9EA5] text-xs mt-0.5">Ingresó turno noche</div>
          </div>
          <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">En curso</span>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div>
            <div className="text-[#0F3A42] font-bold text-sm">Tablero seccional TS-7</div>
            <div className="text-[#7A9EA5] text-xs mt-0.5">Revisión interruptores</div>
          </div>
          <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">En curso</span>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-3 flex justify-between items-center">
          <div>
            <div className="text-[#0F3A42] font-bold text-sm">Fotocélula · Ref. 228</div>
            <div className="text-[#7A9EA5] text-xs mt-0.5">Sin repuesto disponible</div>
          </div>
          <span className="bg-[#FCEBEB] text-[#A32D2D] text-xs font-bold px-2 py-0.5 rounded-full">Sin repuesto</span>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Servicios de móviles</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-24 flex justify-between items-center">
          <div>
            <div className="text-[#0F3A42] font-bold text-sm">F-350 · PAT 384</div>
            <div className="text-[#7A9EA5] text-xs mt-0.5">Service aprobado · Cambio aceite</div>
          </div>
          <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">Programado</span>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          <span className="text-[#7ADCE8] text-xs">Móviles</span>
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