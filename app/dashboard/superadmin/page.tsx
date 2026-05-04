'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil } from '@/lib/supabase'

export default function DashboardSuperAdmin() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
    })
  }, [])

  if (!perfil) return <div className="min-h-screen bg-[#0F3A42] flex items-center justify-center text-white">Cargando...</div>

  return (
    <main className="min-h-screen bg-[#0A1F24]">
      <div className="bg-[#0F3A42] px-4 py-3 border-b border-[#1A4A54]">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Super Admin</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">{perfil.nombre} · Acceso total</div>
          </div>
          <div className="bg-[#E24B4A] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">ROOT</div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="text-[#7ADCE8] text-xs font-bold tracking-widest uppercase mb-2">Acceso rápido por rol</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => router.push('/dashboard/gerente')} className="bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3 text-left">
            <div className="text-[#1ABBD6] font-bold text-sm">Gerente</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Vista ejecutiva</div>
          </button>
          <button onClick={() => router.push('/dashboard/Sub-gerente')} className="bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3 text-left">
            <div className="text-[#1ABBD6] font-bold text-sm">Subgerente</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Vista ejecutiva</div>
          </button>
          <button onClick={() => router.push('/dashboard/jefe')} className="bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3 text-left">
            <div className="text-[#1ABBD6] font-bold text-sm">Jefe de sector</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Vista global</div>
          </button>
          <button onClick={() => router.push('/dashboard/supervisor-electrico')} className="bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3 text-left">
            <div className="text-[#1ABBD6] font-bold text-sm">Supervisor Elec.</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Turno eléctrico</div>
          </button>
          <button onClick={() => router.push('/dashboard/supervisor-aire-acondicionado')} className="bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3 text-left">
            <div className="text-[#1ABBD6] font-bold text-sm">Supervisor AC</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Turno AC</div>
          </button>
          <button onClick={() => router.push('/dashboard/tecnico-electrico')} className="bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3 text-left">
            <div className="text-[#1ABBD6] font-bold text-sm">Técnico Elec.</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Campo eléctrico</div>
          </button>
          <button onClick={() => router.push('/dashboard/tecnico-aire-acondicionado')} className="bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3 text-left">
            <div className="text-[#1ABBD6] font-bold text-sm">Técnico AC</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Campo AC</div>
          </button>
          <button onClick={() => router.push('/dashboard/tecnico-electrico-edificios')} className="bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3 text-left">
            <div className="text-[#1ABBD6] font-bold text-sm">Técnico Edificios</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Cabinas peaje</div>
          </button>
          <button onClick={() => router.push('/dashboard/tallerista-electrico')} className="bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3 text-left">
            <div className="text-[#1ABBD6] font-bold text-sm">Tallerista Elec.</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Taller eléctrico</div>
          </button>
          <button onClick={() => router.push('/dashboard/tallerista-aire-acondicionado')} className="bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3 text-left">
            <div className="text-[#1ABBD6] font-bold text-sm">Tallerista AC</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Taller AC</div>
          </button>
          <button onClick={() => router.push('/dashboard/panolero')} className="bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3 text-left">
            <div className="text-[#1ABBD6] font-bold text-sm">Pañolero</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Stock</div>
          </button>
        </div>

        <div className="text-[#7ADCE8] text-xs font-bold tracking-widest uppercase mb-2">Sistema</div>
        <div className="bg-[#0F3A42] border border-[#1A4A54] rounded-xl p-3 mb-2 flex justify-between items-center">
          <div><div className="text-white font-bold text-sm">Usuarios registrados</div><div className="text-[#7ADCE8] text-xs mt-0.5">Gestión de accesos</div></div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div className="bg-[#0F3A42] border border-[#1A4A54] rounded-xl p-3 mb-24 flex justify-between items-center">
          <div><div className="text-white font-bold text-sm">Base de datos</div><div className="text-[#7ADCE8] text-xs mt-0.5">Supabase · meca-aubasa</div></div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span className="text-[#1ABBD6] text-xs">Panel</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span className="text-[#7ADCE8] text-xs">Usuarios</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          <span className="text-[#7ADCE8] text-xs">Sistema</span>
        </div>
      </div>
    </main>
  )
}