'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'

export default function DashboardJefe() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [stats, setStats] = useState({ operativas: 0, con_falla: 0, tecnicos: 0 })
  const [alertas, setAlertas] = useState<any[]>([])
  const [informes, setInformes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'jefe' && p.rol !== 'delegado' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
      await cargarDatos()
      setLoading(false)
    })
  }, [])

  async function cargarDatos() {
    const hoy = new Date().toISOString().split('T')[0]

    const { data: ordenes } = await supabase
      .from('ordenes_trabajo')
      .select('estado')

    const operativas = (ordenes || []).filter((o: any) => o.estado === 'pendiente' || o.estado === 'en_curso').length
    const con_falla = (ordenes || []).filter((o: any) => o.estado === 'pendiente').length

    const { data: tecnicos } = await supabase
      .from('profiles')
      .select('id')
      .in('rol', ['tecnico_electrico', 'tecnico_ac', 'tecnico_electrico_edificio'])
      .eq('activo', true)

    setStats({
      operativas,
      con_falla,
      tecnicos: (tecnicos || []).length
    })

    const { data: alertasData } = await supabase
      .from('alertas')
      .select('*')
      .in('estado', ['activa', 'en_atencion'])
      .order('created_at', { ascending: false })
      .limit(5)

    setAlertas(alertasData || [])

    const { data: informesData } = await supabase
      .from('informes_turno')
      .select('*, supervisor:supervisor_id(nombre, apellido)')
      .eq('fecha', hoy)
      .order('turno', { ascending: true })

    setInformes(informesData || [])
  }

  if (!perfil || loading) return (
    <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">
      Cargando...
    </div>
  )

  const turnosNombre: Record<string, string> = {
    '1': 'Turno mañana 07–15',
    '2': 'Turno tarde 14–22',
    '3': 'Turno noche 22–06',
  }

  const prioridadColor: Record<string, string> = {
    critica: 'bg-[#FCEBEB] border-[#F09595] text-[#A32D2D]',
    urgente: 'bg-[#FAEEDA] border-[#E8C97A] text-[#854F0B]',
    normal: 'bg-[#F0FAFB] border-[#B2E0E8] text-[#0F3A42]',
  }

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Jefe de Sector</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Vista global · {perfil.nombre} {perfil.apellido}</div>
          </div>
          <div className="bg-[#0A2830] text-[#7ADCE8] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">JEFE</div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Acceso rápido por rol</div>
<div className="grid grid-cols-2 gap-2 mb-4">
  <button onClick={() => router.push('/dashboard/supervisor-electrico')} className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-left">
    <div className="text-[#1ABBD6] font-bold text-sm">Supervisor Elec.</div>
    <div className="text-[#7A9EA5] text-xs mt-0.5">Turno eléctrico</div>
  </button>
  <button onClick={() => router.push('/dashboard/supervisor-aire-acondicionado')} className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-left">
    <div className="text-[#1ABBD6] font-bold text-sm">Supervisor AC</div>
    <div className="text-[#7A9EA5] text-xs mt-0.5">Turno AC</div>
  </button>
  <button onClick={() => router.push('/dashboard/tecnico-electrico')} className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-left">
    <div className="text-[#1ABBD6] font-bold text-sm">Técnico Elec.</div>
    <div className="text-[#7A9EA5] text-xs mt-0.5">Campo eléctrico</div>
  </button>
  <button onClick={() => router.push('/dashboard/tecnico-aire-acondicionado')} className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-left">
    <div className="text-[#1ABBD6] font-bold text-sm">Técnico AC</div>
    <div className="text-[#7A9EA5] text-xs mt-0.5">Campo AC</div>
  </button>
  <button onClick={() => router.push('/dashboard/panolero')} className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-left">
    <div className="text-[#1ABBD6] font-bold text-sm">Pañolero</div>
    <div className="text-[#7A9EA5] text-xs mt-0.5">Stock</div>
  </button>
  <button onClick={() => router.push('/dashboard/tallerista-electrico')} className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-left">
    <div className="text-[#1ABBD6] font-bold text-sm">Tallerista Elec.</div>
    <div className="text-[#7A9EA5] text-xs mt-0.5">Taller eléctrico</div>
  </button>
</div>
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Estado general</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
            <div className="text-[#1ABBD6] font-bold text-xl">{stats.operativas}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Órdenes activas</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
            <div className="text-[#E24B4A] font-bold text-xl">{alertas.length}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Alertas</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
            <div className="text-[#3B6D11] font-bold text-xl">{stats.tecnicos}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Técnicos</div>
          </div>
        </div>

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Alertas activas</div>
        {alertas.length === 0 ? (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-3 text-center text-[#7A9EA5] text-xs">Sin alertas activas</div>
        ) : (
          alertas.map(a => (
            <div key={a.id} className={`border rounded-xl px-3 py-2 flex gap-2 items-start mb-2 ${prioridadColor[a.prioridad] || prioridadColor.normal}`}>
              <div className="w-2 h-2 rounded-full bg-current mt-1 shrink-0"></div>
              <div className="text-xs leading-relaxed">
                <span className="font-bold">{a.ubicacion || `Km ${a.km}`}</span> · {a.descripcion}
              </div>
            </div>
          ))
        )}

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2 mt-1">Informes de turno · hoy</div>
        {informes.length === 0 ? (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-24 text-center text-[#7A9EA5] text-xs">Sin informes cargados hoy</div>
        ) : (
          informes.map((inf, i) => (
            <div key={inf.id} className={`bg-white border border-[#B2E0E8] rounded-xl p-3 ${i === informes.length - 1 ? 'mb-24' : 'mb-2'} flex justify-between items-center`}>
              <div>
                <div className="text-[#0F3A42] font-bold text-sm">{turnosNombre[inf.turno] || `Turno ${inf.turno}`}</div>
                <div className="text-[#7A9EA5] text-xs">
                  {inf.supervisor?.nombre} · {inf.tareas_realizadas} tareas
                  {inf.observaciones ? ' · con obs.' : ' · sin obs.'}
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${inf.leido_por_jefe ? 'bg-[#D6F4F8] text-[#0F8FAA]' : 'bg-[#FAEEDA] text-[#854F0B]'}`}>
                {inf.leido_por_jefe ? 'Leído' : 'Sin leer'}
              </span>
            </div>
          ))
        )}
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