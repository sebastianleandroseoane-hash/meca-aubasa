'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

export default function DashboardTecnicoAC() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [ordenActiva, setOrdenActiva] = useState<any>(null)
  const [ordenDetalle, setOrdenDetalle] = useState<any>(null)
  const [obscierre, setObsCierre] = useState('')
  const [showCierre, setShowCierre] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'tecnico_ac' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
      await cargarOrdenes(p.id)
    })
  }, [])

  async function cargarOrdenes(userId: string) {
    const { data: ords1 } = await supabase.from('ordenes_trabajo').select('*')
      .eq('asignado_a', userId).eq('sector', 'ac').in('estado', ['pendiente', 'en_curso'])
    const { data: ots } = await supabase.from('orden_tecnicos').select('orden_id').eq('tecnico_id', userId)
    const ids = (ots || []).map((o: any) => o.orden_id)
    let ords2: any[] = []
    if (ids.length > 0) {
      const { data } = await supabase.from('ordenes_trabajo').select('*')
        .in('id', ids).eq('sector', 'ac').in('estado', ['pendiente', 'en_curso'])
      ords2 = data || []
    }
    const todas = [...(ords1 || []), ...ords2]
    const unicas = todas.filter((o, i, arr) => arr.findIndex(x => x.id === o.id) === i)
    const ordenadas = unicas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setOrdenes(ordenadas)
    setOrdenActiva(ordenadas.find((o: any) => o.estado === 'en_curso') || ordenadas[0] || null)
  }

  async function abrirDetalle(orden: any) {
    const { data: tecnicos } = await supabase.from('orden_tecnicos')
      .select('*, profiles!orden_tecnicos_tecnico_id_fkey(nombre, rol)').eq('orden_id', orden.id)
    const { data: materiales } = await supabase.from('orden_materiales')
      .select('*, materiales!orden_materiales_material_id_fkey(nombre, unidad)').eq('orden_id', orden.id)
    const { data: pedidos } = await supabase.from('pedidos_material').select('*').eq('orden_trabajo_id', orden.id)
    setOrdenDetalle({ ...orden, tecnicos: tecnicos || [], materiales: materiales || [], pedidos: pedidos || [] })
  }

  async function iniciarOrden(id: string) {
    await supabase.from('ordenes_trabajo').update({ estado: 'en_curso', fecha_inicio: new Date().toISOString() }).eq('id', id)
    await cargarOrdenes(perfil.id)
    setOrdenDetalle(null)
  }

  async function cerrarOrden(id: string) {
    setLoading(true)
    await supabase.from('ordenes_trabajo').update({ estado: 'completada', fecha_cierre: new Date().toISOString(), observaciones: obscierre }).eq('id', id)
    await supabase.from('orden_tecnicos').update({ cerro: true }).eq('orden_id', id).eq('tecnico_id', perfil.id)
    setLoading(false)
    setShowCierre(false)
    setObsCierre('')
    setOrdenDetalle(null)
    await cargarOrdenes(perfil.id)
  }

  function badgeColor(estado: string) {
    if (estado === 'en_curso') return 'bg-[#FAEEDA] text-[#854F0B]'
    if (estado === 'completada') return 'bg-[#D6F4F8] text-[#0F8FAA]'
    if (estado === 'cancelada') return 'bg-[#FCEBEB] text-[#A32D2D]'
    return 'bg-[#E8E8E6] text-[#5F5E5A]'
  }

  function badgeLabel(estado: string) {
    if (estado === 'en_curso') return 'En curso'
    if (estado === 'completada') return 'Completada'
    if (estado === 'cancelada') return 'Cancelada'
    return 'Pendiente'
  }

  const enCurso = ordenes.filter(o => o.estado === 'en_curso').length
  const pendientes = ordenes.filter(o => o.estado === 'pendiente').length

  if (!perfil) return <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>

  return (
    <main className="min-h-screen bg-[#F0FAFB]">

      {/* HEADER */}
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-base tracking-wide">{perfil.nombre} {perfil.apellido}</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Técnico AC · Turno {perfil.turno}</div>
          </div>
          <div className="bg-[#0A2830] text-[#7ADCE8] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">AC</div>
        </div>
      </div>

      {/* MODAL DETALLE ORDEN */}
      {ordenDetalle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase">OT-{String(ordenDetalle.numero_orden).padStart(5, '0')}</div>
                <div className="text-[#0F3A42] font-bold text-sm">{ordenDetalle.titulo}</div>
              </div>
              <button onClick={() => { setOrdenDetalle(null); setShowCierre(false); setObsCierre('') }} className="text-[#7A9EA5] text-xs font-bold">CERRAR</button>
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Estado</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5 capitalize">{ordenDetalle.estado}</div>
                </div>
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Prioridad</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5 capitalize">{ordenDetalle.prioridad}</div>
                </div>
              </div>
              {(ordenDetalle.km || ordenDetalle.ubicacion) && (
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2 mb-3">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Ubicación</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5">
                    {ordenDetalle.km ? `Km ${ordenDetalle.km}` : ''}{ordenDetalle.ubicacion ? ` · ${ordenDetalle.ubicacion}` : ''}
                  </div>
                </div>
              )}
              {ordenDetalle.descripcion && (
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2 mb-3">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Descripción</div>
                  <div className="text-[#0F3A42] text-sm mt-0.5">{ordenDetalle.descripcion}</div>
                </div>
              )}
              {ordenDetalle.tecnicos.length > 0 && (
                <div className="mb-3">
                  <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-1">Técnicos</div>
                  {ordenDetalle.tecnicos.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 mb-1">
                      <span className="text-[#0F3A42] text-sm">{t.profiles?.nombre}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.cerro ? 'bg-[#D6F4F8] text-[#0F8FAA]' : 'bg-[#E8E8E6] text-[#5F5E5A]'}`}>
                        {t.cerro ? 'Cerró' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {ordenDetalle.materiales.length > 0 && (
                <div className="mb-3">
                  <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-1">Materiales</div>
                  {ordenDetalle.materiales.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 mb-1">
                      <span className="text-[#0F3A42] text-sm">{m.materiales?.nombre}</span>
                      <span className="text-[#7A9EA5] text-xs">{m.cantidad_solicitada} {m.materiales?.unidad}</span>
                    </div>
                  ))}
                </div>
              )}
              {showCierre && (
                <div className="mb-3">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest mb-1">Observaciones de cierre</div>
                  <textarea className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
                    rows={3} placeholder="Detallá lo realizado..." value={obscierre} onChange={e => setObsCierre(e.target.value)} />
                </div>
              )}
              <div className="flex gap-2 mt-2">
                {ordenDetalle.estado === 'pendiente' && (
                  <button onClick={() => iniciarOrden(ordenDetalle.id)} className="flex-1 bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl">INICIAR</button>
                )}
                {ordenDetalle.estado === 'en_curso' && !showCierre && (
                  <button onClick={() => setShowCierre(true)} className="flex-1 bg-[#3B6D11] text-white font-bold text-sm py-3 rounded-xl">CERRAR ORDEN</button>
                )}
                {ordenDetalle.estado === 'en_curso' && showCierre && (
                  <button onClick={() => cerrarOrden(ordenDetalle.id)} disabled={loading} className="flex-1 bg-[#3B6D11] text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50">
                    {loading ? 'Cerrando...' : 'CONFIRMAR CIERRE'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-28">

        {/* ORDEN ACTIVA — solo si existe */}
        {ordenActiva && (
          <div onClick={() => abrirDetalle(ordenActiva)}
            className={`border rounded-xl p-3 mb-4 cursor-pointer ${ordenActiva.estado === 'en_curso' ? 'bg-[#FAEEDA] border-[#E8C97A]' : 'bg-white border-[#B2E0E8]'}`}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[#7A9EA5] text-xs font-bold uppercase tracking-widest">
                  {ordenActiva.estado === 'en_curso' ? '🔄 Orden en curso' : '📋 Orden pendiente'}
                </div>
                <div className="text-[#0F3A42] font-bold text-sm mt-0.5">{ordenActiva.titulo}</div>
                <div className="text-[#7A9EA5] text-xs mt-0.5">OT-{String(ordenActiva.numero_orden).padStart(5, '0')}{ordenActiva.km ? ` · Km ${ordenActiva.km}` : ''}</div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${badgeColor(ordenActiva.estado)}`}>
                {badgeLabel(ordenActiva.estado)}
              </span>
            </div>
          </div>
        )}

        {/* GRID DE ACCESOS */}
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-3">Accesos</div>
        <div className="grid grid-cols-3 gap-3 mb-4">

          <button onClick={() => router.push('/dashboard/tecnico-aire-acondicionado')}
            className="bg-white border border-[#B2E0E8] rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-[#F0FAFB]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div className="text-center">
              <div className="text-[#0F3A42] font-bold text-xs">Órdenes</div>
              {ordenes.length > 0 && <div className="text-[#1ABBD6] text-xs font-bold mt-0.5">{enCurso > 0 ? `${enCurso} en curso` : `${pendientes} pend.`}</div>}
            </div>
          </button>

          <button onClick={() => router.push('/dashboard/checkin/hub')}
            className="bg-white border border-[#B2E0E8] rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-[#F0FAFB]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <div className="text-[#0F3A42] font-bold text-xs text-center">Checkin</div>
          </button>

          <button onClick={() => router.push('/dashboard/cronograma')}
            className="bg-white border border-[#B2E0E8] rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-[#F0FAFB]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div className="text-[#0F3A42] font-bold text-xs text-center">Cronograma</div>
          </button>

          <button onClick={() => router.push('/historial')}
            className="bg-white border border-[#B2E0E8] rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-[#F0FAFB]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div className="text-[#0F3A42] font-bold text-xs text-center">Historial</div>
          </button>

          <button onClick={() => router.push('/dashboard/checkin/vehiculos/historial')}
            className="bg-white border border-[#B2E0E8] rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-[#F0FAFB]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5"/><circle cx="16" cy="19" r="2"/><circle cx="7" cy="19" r="2"/><path d="M13 17H9"/></svg>
            <div className="text-[#0F3A42] font-bold text-xs text-center">Vehículos</div>
          </button>

          <button
            className="bg-[#F8F8F8] border border-dashed border-[#B2E0E8] rounded-2xl p-4 flex flex-col items-center gap-2 opacity-50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A9EA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="6" x2="12" y2="18"/><line x1="8" y1="10" x2="16" y2="10"/></svg>
            <div className="text-[#7A9EA5] font-bold text-xs text-center">Calculadora</div>
          </button>

        </div>

        {/* LISTA DE ÓRDENES — compacta */}
        {ordenes.length > 0 && (
          <>
            <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Mis órdenes · {ordenes.length}</div>
            {ordenes.map(o => (
              <div key={o.id} onClick={() => abrirDetalle(o)}
                className="bg-white border border-[#B2E0E8] rounded-xl px-3 py-2.5 mb-2 cursor-pointer active:bg-[#F0FAFB] flex justify-between items-center">
                <div>
                  <div className="text-[#7A9EA5] text-xs">OT-{String(o.numero_orden).padStart(5, '0')}</div>
                  <div className="text-[#0F3A42] font-bold text-sm">{o.titulo}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 ${badgeColor(o.estado)}`}>
                  {badgeLabel(o.estado)}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* NAVBAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span className="text-[#1ABBD6] text-xs">Panel</span>
        </div>
        <div onClick={() => abrirDetalle(ordenActiva)} className={`flex flex-col items-center gap-0.5 cursor-pointer ${!ordenActiva ? 'opacity-40' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          <span className="text-[#7ADCE8] text-xs">
            {enCurso > 0 ? `En curso` : ordenes.length > 0 ? `${ordenes.length} ord.` : 'Órdenes'}
          </span>
        </div>
        <div onClick={() => router.push('/dashboard/checkin/hub')} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span className="text-[#7ADCE8] text-xs">Checkin</span>
        </div>
        <div onClick={() => router.push('/historial')} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="text-[#7ADCE8] text-xs">Historial</span>
        </div>
        <div onClick={() => router.push('/dashboard/cronograma')} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="text-[#7ADCE8] text-xs">Cronograma</span>
        </div>
      </div>
    </main>
  )
}