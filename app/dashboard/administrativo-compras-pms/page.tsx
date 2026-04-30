'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil } from '@/lib/supabase'

export default function DashboardAdminComprasPMS() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'administrativo_compras_pms' && p.rol !== 'superadmin') { router.push('/'); return }
      setPerfil(p)
    })
  }, [])

  if (!perfil) return <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Compras & PMS</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">{perfil.nombre} · Administrativo</div>
          </div>
          <div className="bg-[#0A2830] text-[#7ADCE8] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">PMS</div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Pedidos activos</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#B87C0F] font-bold text-2xl">5</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Pendientes</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#1ABBD6] font-bold text-2xl">3</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">En camino</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#3B6D11] font-bold text-2xl">8</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Recibidos mes</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#E24B4A] font-bold text-2xl">1</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Con problema</div>
          </div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Pedidos recientes</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div>
            <div className="text-[#0F3A42] font-bold text-sm">Pedido #041 · LED 150W</div>
            <div className="text-[#7A9EA5] text-xs mt-0.5">12 unidades · Pañol eléctrico</div>
          </div>
          <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">En camino</span>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div>
            <div className="text-[#0F3A42] font-bold text-sm">Pedido #042 · Gas R-410A</div>
            <div className="text-[#7A9EA5] text-xs mt-0.5">10 kg · Taller AC</div>
          </div>
          <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">Pendiente</span>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-3 flex justify-between items-center">
          <div>
            <div className="text-[#0F3A42] font-bold text-sm">Pedido #039 · Fusibles NH</div>
            <div className="text-[#7A9EA5] text-xs mt-0.5">20 unidades · Pañol eléctrico</div>
          </div>
          <span className="bg-[#FCEBEB] text-[#A32D2D] text-xs font-bold px-2 py-0.5 rounded-full">Con problema</span>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Herramientas · Seguimiento</div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div>
            <div className="text-[#0F3A42] font-bold text-sm">Analizador de redes</div>
            <div className="text-[#7A9EA5] text-xs mt-0.5">Solicitado hace 15 días · En gestión</div>
          </div>
          <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full">En gestión</span>
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-24 flex justify-between items-center">
          <div>
            <div className="text-[#0F3A42] font-bold text-sm">Cargador de gas AC</div>
            <div className="text-[#7A9EA5] text-xs mt-0.5">Aprobado · Entrega estimada 05/05</div>
          </div>
          <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full">Aprobado</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span className="text-[#1ABBD6] text-xs">Panel</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span className="text-[#7ADCE8] text-xs">Pedidos</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Herramientas</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Informes</span>
        </div>
      </div>
    </main>
  )
}