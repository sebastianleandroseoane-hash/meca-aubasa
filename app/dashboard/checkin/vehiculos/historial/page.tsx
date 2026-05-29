'use client'


import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'

export default function HistorialCheckinVehiculos() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [checkins, setCheckins] = useState<any[]>([])
  const [detalle, setDetalle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aprobando, setAprobando] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroFecha, setFiltroFecha] = useState('')

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      setPerfil(p)
      await cargar()
      setLoading(false)
    })
  }, [])

  async function cargar() {
    const { data } = await supabase
      .from('checkins_vehiculos')
      .select('*, moviles(marca, modelo, patente, sector), conductor:conductor_id(nombre, apellido), aprobador:aprobado_por(nombre, apellido)')
      .order('created_at', { ascending: false })
      .limit(60)
    setCheckins(data || [])
  }

  async function abrirDetalle(ch: any) {
    const { data: items } = await supabase
      .from('checkins_vehiculos_items')
      .select('*')
      .eq('checkin_id', ch.id)
      .order('orden', { ascending: true })
    setDetalle({ ...ch, items: items || [] })
  }

  async function aprobar(id: string) {
    setAprobando(true)
    await supabase.from('checkins_vehiculos').update({
      estado: 'aprobado',
      aprobado_por: perfil.id,
      aprobado_at: new Date().toISOString(),
      aprobador_nombre_display: [perfil.apellido, perfil.nombre].filter(Boolean).join(', '),
    }).eq('id', id)
    setDetalle(null)
    await cargar()
    setAprobando(false)
  }

  async function aprobarConObs(id: string) {
    setAprobando(true)
    await supabase.from('checkins_vehiculos').update({
      estado: 'aprobado_con_observaciones',
      aprobado_por: perfil.id,
      aprobado_at: new Date().toISOString(),
      aprobador_nombre_display: [perfil.apellido, perfil.nombre].filter(Boolean).join(', '),
    }).eq('id', id)
    setDetalle(null)
    await cargar()
    setAprobando(false)
  }

  const puedeAprobar = perfil && ['supervisor_electrico', 'supervisor_ac', 'jefe', 'superadmin', 'tecnico_electrico', 'tecnico_ac', 'tecnico_electrico_edificio'].includes(perfil.rol)

  const checkinsFiltrados = checkins.filter(c => {
    if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false
    if (filtroFecha && c.fecha !== filtroFecha) return false
    return true
  })

  function estadoBadge(estado: string) {
    if (estado === 'aprobado') return 'bg-[#D6F4F8] text-[#0F8FAA]'
    if (estado === 'aprobado_con_observaciones') return 'bg-[#FAEEDA] text-[#854F0B]'
    return 'bg-[#E8E8E6] text-[#5F5E5A]'
  }

  function estadoLabel(estado: string) {
    if (estado === 'aprobado') return '✅ Aprobado'
    if (estado === 'aprobado_con_observaciones') return '⚠️ Aprobado c/obs'
    return '🕐 Pend. aprobación'
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>
  )

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Historial Checkins</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Vehículos · {checkinsFiltrados.length} registros</div>
          </div>
          <button onClick={() => router.back()} className="text-[#7ADCE8] text-xs font-bold">← VOLVER</button>
        </div>
      </div>

      {/* DETALLE / APROBACIÓN */}
      {detalle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-4 max-h-[90vh] flex flex-col print-area">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-[#1ABBD6] font-bold text-xs">CHK-{String(detalle.numero_checkin).padStart(4, '0')}</div>
                <div className="text-[#0F3A42] font-bold text-sm">{detalle.moviles?.marca} {detalle.moviles?.modelo} — {detalle.moviles?.patente}</div>
                <div className="text-[#7A9EA5] text-xs">{detalle.conductor_nombre_display || [detalle.conductor?.apellido, detalle.conductor?.nombre].filter(Boolean).join(', ') || 'Conductor no registrado'} · {detalle.turno} · {detalle.fecha}</div>
              </div>
              <button onClick={() => setDetalle(null)} className="text-[#7A9EA5] text-xs font-bold">CERRAR</button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* KM */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2 text-center">
                  <div className="text-[#7A9EA5] text-xs">Km Inicial</div>
                  <div className="text-[#0F3A42] font-bold text-sm">{detalle.km_inicial ?? '—'}</div>
                </div>
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2 text-center">
                  <div className="text-[#7A9EA5] text-xs">Km Final</div>
                  <div className="text-[#0F3A42] font-bold text-sm">{detalle.km_final ?? '—'}</div>
                </div>
              </div>

              {/* ÍTEMS */}
              <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-2">Inspección</div>
              <div className="bg-white border border-[#B2E0E8] rounded-xl overflow-hidden mb-3">
                {(detalle.items || []).map((it: any, i: number) => (
                  <div key={it.id} className={`px-3 py-2 ${i < detalle.items.length - 1 ? 'border-b border-[#F0FAFB]' : ''} ${it.estado === 'mal' ? 'bg-[#FFF8F8]' : ''}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#0F3A42] flex-1 pr-2">{it.item}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${it.estado === 'bien' ? 'bg-[#D6F4F8] text-[#0F8FAA]' : 'bg-[#FCEBEB] text-[#A32D2D]'}`}>
                        {it.estado.toUpperCase()}
                      </span>
                    </div>
                    {it.observacion && <div className="text-[#E24B4A] text-xs mt-0.5">Obs: {it.observacion}</div>}
                  </div>
                ))}
              </div>

              {/* OBSERVACIONES GENERALES */}
              {detalle.observaciones_generales && (
                <div className="bg-[#FAEEDA] border border-[#E8C97A] rounded-xl px-3 py-2 mb-3">
                  <div className="text-[#854F0B] text-xs font-bold mb-0.5">Observaciones generales</div>
                  <div className="text-[#854F0B] text-xs">{detalle.observaciones_generales}</div>
                </div>
              )}

              {/* APROBADO POR */}
              {['panolero', 'supervisor_electrico', 'supervisor_ac', 'jefe', 'superadmin'].includes(perfil.rol) && (
                <button
                  onClick={() => window.print()}
                  className="w-full bg-[#0F3A42] text-white font-bold text-sm py-3 rounded-xl mb-3 flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  IMPRIMIR PLANILLA
                </button>
              )}

              {['panolero', 'supervisor_electrico', 'supervisor_ac', 'jefe', 'superadmin'].includes(perfil.rol) && (
                <button
                  onClick={() => window.print()}
                  className="w-full bg-[#0F3A42] text-white font-bold text-sm py-3 rounded-xl mb-3 flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  IMPRIMIR PLANILLA
                </button>
              )}

              {(detalle.aprobador_nombre_display || detalle.aprobador) && (
                <div className="bg-[#D6F4F8] border border-[#1ABBD6] rounded-xl px-3 py-2 mb-3">
                  <div className="text-[#0F8FAA] text-xs font-bold mb-0.5">Aprobado por</div>
                  <div className="text-[#0F8FAA] text-xs">
                    {detalle.aprobador_nombre_display || [detalle.aprobador?.apellido, detalle.aprobador?.nombre].filter(Boolean).join(', ') || 'Aprobador no registrado'} · {detalle.aprobado_at ? new Date(detalle.aprobado_at).toLocaleString('es-AR') : ''}
                  </div>
                </div>
              )}

              {/* BOTONES APROBACIÓN */}
              {detalle.estado === 'pendiente_aprobacion' && puedeAprobar && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => aprobar(detalle.id)} disabled={aprobando}
                    className="flex-1 bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50">
                    ✅ Aprobar entrega
                  </button>
                  <button onClick={() => aprobarConObs(detalle.id)} disabled={aprobando}
                    className="flex-1 bg-[#FAEEDA] text-[#854F0B] font-bold text-sm py-3 rounded-xl border border-[#E8C97A] disabled:opacity-50">
                    ⚠️ Aprobar c/obs
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-3 pb-6">
        {/* FILTROS */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <select
            className="bg-white border border-[#B2E0E8] rounded-xl px-3 py-2 text-xs text-[#0F3A42] outline-none"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            <option value="pendiente_aprobacion">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="aprobado_con_observaciones">Con observaciones</option>
          </select>
          <input type="date"
            className="bg-white border border-[#B2E0E8] rounded-xl px-3 py-2 text-xs text-[#0F3A42] outline-none"
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)} />
        </div>

        {checkinsFiltrados.length === 0 ? (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 text-center text-[#7A9EA5] text-sm">
            Sin checkins registrados
          </div>
        ) : (
          checkinsFiltrados.map(c => (
            <div key={c.id} onClick={() => abrirDetalle(c)}
              className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 cursor-pointer active:bg-[#F0FAFB]">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[#1ABBD6] font-bold text-xs">CHK-{String(c.numero_checkin).padStart(4, '0')}</span>
                    <span className="text-[#7A9EA5] text-xs">{c.fecha}</span>
                  </div>
                  <div className="text-[#0F3A42] font-bold text-sm">{c.moviles?.marca} {c.moviles?.modelo} — {c.moviles?.patente}</div>
                  <div className="text-[#7A9EA5] text-xs">{c.conductor_nombre_display || [c.conductor?.apellido, c.conductor?.nombre].filter(Boolean).join(', ') || 'Conductor no registrado'} · {c.turno}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${estadoBadge(c.estado)}`}>
                  {estadoLabel(c.estado)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}