'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil } from '@/lib/supabase'

export default function DashboardAdminRRHH() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'administrativo_rrhh' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
    })
  }, [])

  if (!perfil) return <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Recursos Humanos</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">{perfil.nombre} · Administrativo</div>
          </div>
          <div className="bg-[#0A2830] text-[#7ADCE8] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">RRHH</div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Personal del sector</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#1ABBD6] font-bold text-2xl">24</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Total personal</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#3B6D11] font-bold text-2xl">21</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Activos hoy</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#B87C0F] font-bold text-2xl">2</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">De vacaciones</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#E24B4A] font-bold text-2xl">1</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Con licencia</div>
          </div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Solicitudes pendientes</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[#0F3A42] font-bold text-sm">Vacaciones · García S.</div>
              <div className="text-[#7A9EA5] text-xs mt-0.5">15/05 al 30/05 · 15 días</div>
            </div>
            <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">Pendiente</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="flex-1 bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold py-2 rounded-lg">Aprobar</button>
            <button className="flex-1 bg-[#FCEBEB] text-[#A32D2D] text-xs font-bold py-2 rounded-lg">Rechazar</button>
          </div>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[#0F3A42] font-bold text-sm">Licencia · Rodríguez M.</div>
              <div className="text-[#7A9EA5] text-xs mt-0.5">Médica · desde 28/04</div>
            </div>
            <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">Pendiente</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="flex-1 bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold py-2 rounded-lg">Aprobar</button>
            <button className="flex-1 bg-[#FCEBEB] text-[#A32D2D] text-xs font-bold py-2 rounded-lg">Rechazar</button>
          </div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Cobertura de turnos</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-24">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#E8F4F7]">
            <span className="text-[#0F3A42] text-sm font-medium">Mañana 07–15</span>
            <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">3 técnicos</span>
          </div>
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#E8F4F7]">
            <span className="text-[#0F3A42] text-sm font-medium">Tarde 14–22</span>
            <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">3 técnicos</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#0F3A42] text-sm font-medium">Noche 22–06</span>
            <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">2 técnicos</span>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="text-[#7ADCE8] text-xs">Ausencias</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Informes</span>
        </div>
      </div>
    </main>
  )
}