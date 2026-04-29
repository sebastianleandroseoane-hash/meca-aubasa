'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil } from '@/lib/supabase'

export default function DashboardSupervisorElectrico() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'supervisor_electrico') { router.push('/'); return }
      setPerfil(p)
    })
  }, [])

  if (!perfil) return <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Supervisor Eléctrico</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">{perfil.nombre} · Turno {perfil.turno}</div>
          </div>
          <div className="bg-[#0A2830] text-[#7ADCE8] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">SUP·E</div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="bg-[#FCEBEB] border border-[#F09595] rounded-xl px-3 py-2 flex gap-2 items-start mb-3">
          <div className="w-2 h-2 rounded-full bg-[#E24B4A] mt-1 shrink-0"></div>
          <div className="text-[#A32D2D] text-xs leading-relaxed"><span className="font-bold">Monitoreo:</span> Km 38.4 luminaria apagada — pendiente asignación</div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Personal en turno</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-3">
          <div className="flex items-center gap-3 py-2 border-b border-[#E8F4F7]">
            <div className="w-7 h-7 rounded-full bg-[#0F3A42] flex items-center justify-center text-[#7ADCE8] text-xs font-bold">SG</div>
            <div className="flex-1"><div className="text-[#0F3A42] text-sm font-medium">García, S.</div><div className="text-[#7A9EA5] text-xs">Técnico eléctrico</div></div>
            <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">Activo</span>
          </div>
          <div className="flex items-center gap-3 py-2 border-b border-[#E8F4F7]">
            <div className="w-7 h-7 rounded-full bg-[#0F3A42] flex items-center justify-center text-[#7ADCE8] text-xs font-bold">MR</div>
            <div className="flex-1"><div className="text-[#0F3A42] text-sm font-medium">Rodríguez, M.</div><div className="text-[#7A9EA5] text-xs">Técnico eléctrico</div></div>
            <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">Activo</span>
          </div>
          <div className="flex items-center gap-3 py-2">
            <div className="w-7 h-7 rounded-full bg-[#0F3A42] flex items-center justify-center text-[#7ADCE8] text-xs font-bold">JF</div>
            <div className="flex-1"><div className="text-[#0F3A42] text-sm font-medium">Ferreyra, J.</div><div className="text-[#7A9EA5] text-xs">Técnico eléctrico</div></div>
            <span className="bg-[#E8E8E6] text-[#5F5E5A] text-xs font-bold px-2 py-0.5 rounded-full">Vacaciones</span>
          </div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Órdenes de trabajo</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div><div className="text-[#0F3A42] font-bold text-sm">Reemplazo LED · Km 38.4</div><div className="text-[#7A9EA5] text-xs mt-0.5">Asignado: García</div></div>
          <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">En curso</span>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-3 flex justify-between items-center">
          <div><div className="text-[#0F3A42] font-bold text-sm">Revisión TS-14 · Km 22</div><div className="text-[#7A9EA5] text-xs mt-0.5">Asignado: Rodríguez</div></div>
          <span className="bg-[#E8E8E6] text-[#5F5E5A] text-xs font-bold px-2 py-0.5 rounded-full">Pendiente</span>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Balizamiento</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-3 flex justify-between items-center">
          <div><div className="text-[#0F3A42] font-bold text-sm">Zona km 38–39</div><div className="text-[#7A9EA5] text-xs mt-0.5">Solicitado 06:50 · Aprobado</div></div>
          <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">Activo</span>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Flota del turno</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-24">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#E8F4F7]">
            <div><div className="text-[#0F3A42] font-bold text-sm">F-350 · PAT 384</div><div className="text-[#7A9EA5] text-xs">García · 84.230 km</div></div>
            <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">VTV 12d</span>
          </div>
          <div className="flex justify-between items-center">
            <div><div className="text-[#0F3A42] font-bold text-sm">Ranger · PAT 201</div><div className="text-[#7A9EA5] text-xs">Rodríguez · 61.400 km</div></div>
            <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">OK</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span className="text-[#1ABBD6] text-xs">Panel</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span className="text-[#7ADCE8] text-xs">Personal</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Órdenes</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>
          <span className="text-[#7ADCE8] text-xs">Flota</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Informe</span>
        </div>
      </div>
    </main>
  )
}