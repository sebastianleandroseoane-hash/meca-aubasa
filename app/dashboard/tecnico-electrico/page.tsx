'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

export default function DashboardTecnicoElectrico() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [ordenActiva, setOrdenActiva] = useState<any>(null)
  const [showCierre, setShowCierre] = useState(false)
  const [informe, setInforme] = useState('')
  const [loading, setLoading] = useState(false)
  const [ordenDetalle, setOrdenDetalle] = useState<any>(null)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'tecnico_electrico' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
      await cargarOrdenes(p.id)
    })
  }, [])

  async function cargarOrdenes(userId: string) {
    // ordenes donde es responsable principal
    const { data: ords1 } = await supabase
      .from('ordenes_trabajo')
      .select('*')
      .eq('asignado_a', userId)
      .in('estado', ['pendiente', 'en_curso'])

    // ordenes donde figura en orden_tecnicos
    const { data: ots } = await supabase
      .from('orden_tecnicos')
      .select('orden_id')
      .eq('tecnico_id', userId)

    const ids = (ots || []).map((o: any) => o.orden_id)
    let ords2: any[] = []
    if (ids.length > 0) {
      const { data } = await supabase
        .from('ordenes_trabajo')
        .select('*')
        .in('id', ids)
        .in('estado', ['pendiente', 'en_curso'])
      ords2 = data || []
    }

    // unir sin duplicados
    const todas = [...(ords1 || []), ...ords2]
    const unicas = todas.filter((o, i, arr) => arr.findIndex(x => x.id === o.id) === i)
    const ordenadas = unicas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setOrdenes(ordenadas)
    const activa = ordenadas.find((o: any) => o.estado === 'en_curso')
    setOrdenActiva(activa || ordenadas[0] || null)
  }

  async function abrirDetalle(orden: any) {
    const { data: tecnicos } = await supabase
      .from('orden_tecnicos')
      .select('*, profiles!orden_tecnicos_tecnico_id_fkey(nombre, rol)')
      .eq('orden_id', orden.id)

    const { data: materiales } = await supabase
      .from('orden_materiales')
      .select('*, materiales!orden_materiales_material_id_fkey(nombre, unidad)')
      .eq('orden_id', orden.id)

    const { data: pedidos } = await supabase
      .from('pedidos_material')
      .select('*')
      .eq('orden_trabajo_id', orden.id)

    setOrdenDetalle({ ...orden, tecnicos: tecnicos || [], materiales: materiales || [], pedidos: pedidos || [] })
  }
  async function iniciarOrden(orden: any) {
    await supabase
      .from('ordenes_trabajo')
      .update({ estado: 'en_curso', fecha_inicio: new Date().toISOString() })
      .eq('id', orden.id)
    await cargarOrdenes(perfil.id)
  }

  async function cerrarOrden() {
    if (!informe || !ordenActiva) return
    setLoading(true)
    await supabase
      .from('ordenes_trabajo')
      .update({
        estado: 'completada',
        fecha_cierre: new Date().toISOString(),
        observaciones: informe
      })
      .eq('id', ordenActiva.id)
    setLoading(false)
    setShowCierre(false)
    setInforme('')
    await cargarOrdenes(perfil.id)
  }

  function badgeColor(estado: string) {
    if (estado === 'en_curso') return 'bg-[#FAEEDA] text-[#854F0B]'
    if (estado === 'completada') return 'bg-[#D6F4F8] text-[#0F8FAA]'
    return 'bg-[#E8E8E6] text-[#5F5E5A]'
  }

  if (!perfil) return <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Buen día, {perfil.nombre.split(' ')[0]}</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Técnico Eléctrico · Turno {perfil.turno}</div>
          </div>
          <div className="bg-[#1ABBD6] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">ELEC</div>
        </div>
      </div>

{ordenDetalle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase">OT-{String(ordenDetalle.numero_orden).padStart(5, '0')}</div>
                <div className="text-[#0F3A42] font-bold text-sm">{ordenDetalle.titulo}</div>
              </div>
              <button onClick={() => setOrdenDetalle(null)} className="text-[#7A9EA5] text-xs font-bold">CERRAR</button>
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
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Tipo</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5">{ordenDetalle.tipo}</div>
                </div>
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Origen</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5 capitalize">{ordenDetalle.origen}</div>
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
                      <span className="text-[#0F3A40] text-sm">{m.materiales?.nombre}</span>
                      <span className="text-[#7A9EA5] text-xs">{m.cantidad_solicitada} {m.materiales?.unidad}</span>
                    </div>
                  ))}
                </div>
              )}

              {ordenDetalle.pedidos.length > 0 && (
                <div className="mb-3">
                  <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-1">Pedidos a pañol</div>
                  {ordenDetalle.pedidos.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between bg-[#FCEBEB] border border-[#F09595] rounded-lg px-3 py-2 mb-1">
                      <span className="text-[#A32D2D] text-sm">{p.material_nombre}</span>
                      <span className="text-[#A32D2D] text-xs font-bold">{p.estado}</span>
                    </div>
                  ))}
                </div>
              )}

              {ordenDetalle.fecha_programada && (
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2 mb-3">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Fecha programada</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5">{ordenDetalle.fecha_programada}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="px-4 pt-3">

        {/* STATS */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#B87C0F] font-bold text-2xl">{ordenes.length}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Tareas asignadas</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#1ABBD6] font-bold text-2xl">{ordenes.filter(o => o.estado === 'en_curso').length}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">En curso</div>
          </div>
        </div>

        {/* ORDEN ACTIVA */}
        {ordenActiva && (
          <>
            <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Orden activa</div>
            <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="text-[#0F3A42] font-bold text-sm">{ordenActiva.titulo}</div>
                  {ordenActiva.km && <div className="text-[#7A9EA5] text-xs mt-0.5">Km {ordenActiva.km} {ordenActiva.ubicacion ? `· ${ordenActiva.ubicacion}` : ''}</div>}
                  {ordenActiva.descripcion && <div className="text-[#7A9EA5] text-xs mt-1">{ordenActiva.descripcion}</div>}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${badgeColor(ordenActiva.estado)}`}>
                  {ordenActiva.estado === 'en_curso' ? 'En curso' : 'Pendiente'}
                </span>
              </div>

              {ordenActiva.estado === 'pendiente' && (
                <button
                  onClick={() => iniciarOrden(ordenActiva)}
                  className="w-full bg-[#1ABBD6] text-white font-bold text-sm py-2 rounded-lg mt-1"
                >
                  INICIAR ORDEN
                </button>
              )}

              {ordenActiva.estado === 'en_curso' && !showCierre && (
                <button
                  onClick={() => setShowCierre(true)}
                  className="w-full bg-[#3B6D11] text-white font-bold text-sm py-2 rounded-lg mt-1"
                >
                  CERRAR ORDEN
                </button>
              )}

              {showCierre && (
                <div className="mt-2">
                  <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Informe de cierre *</div>
                  <textarea
                    className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-2 outline-none"
                    placeholder="Describí qué hiciste o por qué no pudiste completar la tarea"
                    rows={4}
                    value={informe}
                    onChange={e => setInforme(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={cerrarOrden}
                      disabled={loading || !informe}
                      className="flex-1 bg-[#3B6D11] text-white font-bold text-sm py-2 rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Cerrando...' : 'CONFIRMAR CIERRE'}
                    </button>
                    <button
                      onClick={() => setShowCierre(false)}
                      className="flex-1 bg-[#E8E8E6] text-[#5F5E5A] font-bold text-sm py-2 rounded-lg"
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* TODAS LAS ORDENES */}
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Mis órdenes</div>
        {ordenes.length === 0 ? (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 text-center text-[#7A9EA5] text-sm mb-3">
            No tenés órdenes asignadas
          </div>
        ) : (
          ordenes.map(o => (
            <div key={o.id} onClick={() => abrirDetalle(o)} className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center cursor-pointer active:bg-[#F0FAFB]">
              <div>
                <div className="text-[#0F3A42] font-bold text-sm">{o.titulo}</div>
                {o.km && <div className="text-[#7A9EA5] text-xs mt-0.5">Km {o.km}</div>}
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor(o.estado)}`}>
                {o.estado === 'en_curso' ? 'En curso' : 'Pendiente'}
              </span>
            </div>
          ))
        )}

      </div>

      <div className="h-24"></div>

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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>
          <span className="text-[#7ADCE8] text-xs">Traza</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Informe</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Manual</span>
        </div>
        <div onClick={() => router.push('/historial')} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="text-[#7ADCE8] text-xs">Historial</span>
        </div>
      </div>
    </main>
  )
}