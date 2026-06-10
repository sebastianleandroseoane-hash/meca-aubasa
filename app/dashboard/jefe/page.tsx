'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'

export default function DashboardJefe() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [kpis, setKpis] = useState({ activas: 0, cierres_pendientes: 0, criticas: 0, tecnicos: 0 })
  const [pedidos, setPedidos] = useState<any[]>([])
  const [obsMap, setObsMap] = useState<Record<string, string>>({})
  const [loadingResp, setLoadingResp] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [filtroSector, setFiltroSector] = useState('todos')
  const [ordenDetalle, setOrdenDetalle] = useState<any>(null)
  const [detalleTecnicos, setDetalleTecnicos] = useState<any[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [verMasOTs, setVerMasOTs] = useState(false)
  const [solicitudesEliminacion, setSolicitudesEliminacion] = useState<any[]>([])
  const [loadingEliminacion, setLoadingEliminacion] = useState<string | null>(null)

  // OT Supra
  const [supras, setSupras] = useState<any[]>([])
  const [supervisoresDisponibles, setSupervisoresDisponibles] = useState<any[]>([])
  const [showFormSupra, setShowFormSupra] = useState(false)
  const [loadingSupra, setLoadingSupra] = useState(false)
  const [msgSupra, setMsgSupra] = useState<{ ok: boolean; text: string } | null>(null)
  const SECTORES_SUPRA = ['electrico', 'ac', 'edificios', 'peaje', 'general']
  const emptyFormSupra = { titulo: '', descripcion: '', tipo: 'correctiva', prioridad: 'normal', plazo_estimado: '', sectores: [] as string[], supervisores: [] as string[] }
  const [formSupra, setFormSupra] = useState(emptyFormSupra)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'jefe' && p.rol !== 'delegado' && p.rol !== 'superadmin') { router.push('/'); return }
      setPerfil(p)
      await Promise.all([cargarDatos(), cargarSupras(), cargarSupervisores()])
      setLoading(false)
    })
  }, [])

  async function cargarDatos() {
    cargarSolicitudesEliminacion()
    const [{ data: ords }, { data: tecs }, { data: peds }] = await Promise.all([
      supabase.from('ordenes_trabajo').select('id, numero_orden, titulo, estado, tipo, sector, created_at').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id').in('rol', ['tecnico_electrico', 'tecnico_ac']).eq('activo', true),
      supabase.from('pedidos_jefe').select('*, pedidos_jefe_items(*), profiles!pedidos_jefe_panolero_id_fkey(nombre, apellido)').eq('estado', 'pendiente').order('created_at', { ascending: true }),
    ])
    const ordenes = ords || []
    setOrdenes(ordenes)
    setKpis({
      activas: ordenes.filter((o: any) => ['pendiente', 'en_curso'].includes(o.estado)).length,
      cierres_pendientes: ordenes.filter((o: any) => o.estado === 'cierre_propuesto').length,
      criticas: ordenes.filter((o: any) => ['Correctivo Crítico', 'Emergencia'].includes(o.tipo) && ['pendiente', 'en_curso'].includes(o.estado)).length,
      tecnicos: (tecs || []).length,
    })
    setPedidos(peds || [])
  }

  async function cargarSolicitudesEliminacion() {
    const { data } = await supabase
      .from('ordenes_trabajo')
      .select('id, numero_orden, titulo, sector, observacion_supervisor, created_at')
      .eq('estado', 'eliminacion_solicitada')
      .order('created_at', { ascending: false })
    setSolicitudesEliminacion(data || [])
  }

  async function rechazarEliminacion(id: string) {
    setLoadingEliminacion(id)
    await supabase
      .from('ordenes_trabajo')
      .update({ estado: 'pendiente', observacion_supervisor: null })
      .eq('id', id)
    setLoadingEliminacion(null)
    await Promise.all([cargarDatos(), cargarSolicitudesEliminacion()])
  }

  async function aprobarEliminacion(id: string) {
    setLoadingEliminacion(id)
    await supabase
      .from('ordenes_trabajo')
      .update({ estado: 'eliminada' })
      .eq('id', id)
    setLoadingEliminacion(null)
    await Promise.all([cargarDatos(), cargarSolicitudesEliminacion()])
  }

  async function responderPedido(id: string, accion: 'aprobado' | 'rechazado') {

    setLoadingResp(id)
    await supabase.from('pedidos_jefe').update({
      estado: accion,
      observaciones_jefe: obsMap[id] || null,
      resuelta_at: new Date().toISOString(),
    }).eq('id', id)
    setPedidos(prev => prev.filter(p => p.id !== id))
    setLoadingResp(null)
  }

  async function abrirDetalle(orden: any) {
    setOrdenDetalle(orden)
    setDetalleTecnicos([])
    setLoadingDetalle(true)
    const { data } = await supabase.from('orden_tecnicos')
      .select('*, profiles!orden_tecnicos_tecnico_id_fkey(nombre, apellido, rol)')
      .eq('orden_id', orden.id)
    setDetalleTecnicos(data || [])
    setLoadingDetalle(false)
  }

  async function cargarSupras() {
    const { data } = await supabase
      .from('ots_supra')
      .select(`
        id, numero_supra, titulo, tipo, prioridad, estado, plazo_estimado, created_at,
        ots_supra_sectores(sector),
        ots_supra_supervisores(supervisor_id, profiles!ots_supra_supervisores_supervisor_id_fkey(nombre, apellido))
      `)
      .order('created_at', { ascending: false })
    setSupras(data || [])
  }

  async function cargarSupervisores() {
    const { data } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, rol')
      .in('rol', ['supervisor_electrico', 'supervisor_ac', 'supervisor_edificios'])
      .eq('activo', true)
      .order('apellido', { ascending: true })
    setSupervisoresDisponibles(data || [])
  }

  async function crearSupra() {
    if (!['jefe','superadmin'].includes(perfil.rol)) return
    if (!formSupra.titulo.trim()) { setMsgSupra({ ok: false, text: 'El título es obligatorio' }); return }
    if (formSupra.sectores.length === 0) { setMsgSupra({ ok: false, text: 'Seleccioná al menos un sector' }); return }
    if (formSupra.supervisores.length === 0) { setMsgSupra({ ok: false, text: 'Seleccioná al menos un supervisor' }); return }
    setLoadingSupra(true)
    setMsgSupra(null)
    try {
      const { error } = await supabase.rpc('crear_ot_supra', {
        p_titulo: formSupra.titulo.trim(),
        p_descripcion: formSupra.descripcion.trim() || null,
        p_tipo: formSupra.tipo,
        p_prioridad: formSupra.prioridad,
        p_plazo_estimado: formSupra.plazo_estimado || null,
        p_creado_por: perfil.id,
        p_sectores: formSupra.sectores,
        p_supervisores: formSupra.supervisores,
      })
      if (error) throw error
      setMsgSupra({ ok: true, text: 'OT Supra creada correctamente' })
      setFormSupra(emptyFormSupra)
      await cargarSupras()
    } catch (e: any) {
      setMsgSupra({ ok: false, text: e.message || 'Error al crear la OT Supra' })
    }
    setLoadingSupra(false)
  }

  function toggleItem(lista: string[], valor: string): string[] {
    return lista.includes(valor) ? lista.filter(x => x !== valor) : [...lista, valor]
  }

  if (!perfil || loading) return (
    <div className="min-h-screen bg-[#061418] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-cyan-300/70 text-sm tracking-widest uppercase">Cargando</span>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#061418] text-white pb-40">
      <div className="max-w-6xl mx-auto">

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <header className="bg-linear-to-br
 from-[#092b34] via-[#071c24] to-[#061418] border-b border-cyan-400/20 px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#071c24] border-2 border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.35)] flex items-center justify-center text-cyan-300 shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-xl tracking-wide uppercase leading-none">JEFE DE SECTOR</span>
                  <span className="bg-cyan-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase shadow-[0_0_12px_rgba(34,211,238,0.4)]">JEFE</span>
                </div>
                <div className="text-[#8ecbd8] text-xs mt-1 tracking-wide">Vista global · {perfil.nombre} {perfil.apellido}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 pt-4 space-y-6">

          {/* ── 1. KPIs ARRIBA ────────────────────────────────────────── */}
          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="rounded-2xl bg-[#071c24]/90 border border-cyan-400/30 shadow-[0_0_18px_rgba(34,211,238,0.12)] p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#8ecbd8] text-[10px] font-bold tracking-[0.18em] uppercase">OTs activas</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-cyan-300 opacity-70"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <div className="text-cyan-300 text-3xl font-black tracking-tight leading-none">{kpis.activas}</div>
              </div>
              <div className="rounded-2xl bg-[#071c24]/90 border border-yellow-400/30 shadow-[0_0_18px_rgba(251,191,36,0.12)] p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#8ecbd8] text-[10px] font-bold tracking-[0.18em] uppercase leading-tight">Cierres pend.</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 opacity-70"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div className="text-yellow-400 text-3xl font-black tracking-tight leading-none">{kpis.cierres_pendientes}</div>
              </div>
              <div className="rounded-2xl bg-[#071c24]/90 border border-red-400/30 shadow-[0_0_18px_rgba(239,68,68,0.12)] p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#8ecbd8] text-[10px] font-bold tracking-[0.18em] uppercase leading-tight">Críticas</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 opacity-70"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div className={`text-3xl font-black tracking-tight leading-none ${kpis.criticas > 0 ? 'text-red-400' : 'text-[#8ecbd8]'}`}>{kpis.criticas}</div>
              </div>
              <div className="rounded-2xl bg-[#071c24]/90 border border-green-400/30 shadow-[0_0_18px_rgba(34,197,94,0.12)] p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#8ecbd8] text-[10px] font-bold tracking-[0.18em] uppercase">Técnicos</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 opacity-70"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="text-green-400 text-3xl font-black tracking-tight leading-none">{kpis.tecnicos}</div>
              </div>
            </div>
          </section>

          {/* ── 2. ACCESO RÁPIDO POR ROL (solo jefe y superadmin) ─────── */}
          {['jefe','superadmin'].includes(perfil?.rol) && (
            <section>
              <span className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase block mb-3">Acceso rápido por rol</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[
                  { label: 'Gerente', sub: 'Vista ejecutiva', path: '/dashboard/gerente' },
                  { label: 'Subgerente', sub: 'Vista ejecutiva', path: '/dashboard/Sub-gerente' },
                  { label: 'Supervisor Elec.', sub: 'Turno eléctrico', path: '/dashboard/supervisor-electrico' },
                  { label: 'Supervisor AC', sub: 'Turno AC', path: '/dashboard/supervisor-aire-acondicionado' },
                  { label: 'Técnico Elec.', sub: 'Campo eléctrico', path: '/dashboard/tecnico-electrico' },
                  { label: 'Técnico AC', sub: 'Campo AC', path: '/dashboard/tecnico-aire-acondicionado' },
                  { label: 'Técnico Edificios', sub: 'Cabinas peaje', path: '/dashboard/tecnico-electrico-edificios' },
                  { label: 'Tallerista Elec.', sub: 'Taller eléctrico', path: '/dashboard/tallerista-electrico' },
                  { label: 'Tallerista AC', sub: 'Taller AC', path: '/dashboard/tallerista-aire-acondicionado' },
                  { label: 'Pañolero', sub: 'Stock', path: '/dashboard/panolero' },
                ].map(r => (
                  <button key={r.path} onClick={() => router.push(r.path)}
                    className="rounded-xl bg-[#071c24]/90 border border-cyan-400/20 p-3 text-left active:scale-[0.97] hover:border-cyan-300/50 transition-all">
                    <div className="text-cyan-300 font-bold text-sm">{r.label}</div>
                    <div className="text-[#8ecbd8] text-xs mt-0.5">{r.sub}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── SOLICITUDES DE ELIMINACIÓN ───────────────────────────── */}
          {solicitudesEliminacion.length > 0 && (
            <section className="mb-4">
              <div className="text-red-400 text-[11px] font-black tracking-[0.22em] uppercase mb-3">
                🗑 Solicitudes de eliminación · {solicitudesEliminacion.length}
              </div>
              {solicitudesEliminacion.map((o: any) => (
                <div key={o.id} className="rounded-xl bg-[#2A0F0F] border border-red-400/40 p-3 mb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="text-red-300 font-black text-xs">OT-{String(o.numero_orden).padStart(5,'0')} · {o.sector}</div>
                      <div className="text-[#e8f4f8] font-bold text-sm mt-0.5">{o.titulo}</div>
                      {o.observacion_supervisor && (
                        <div className="text-yellow-300 text-xs mt-1">Motivo: {o.observacion_supervisor}</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => rechazarEliminacion(o.id)}
                        disabled={loadingEliminacion === o.id}
                        className="bg-[#07131a] border border-cyan-400/40 text-cyan-300 text-[10px] font-black px-3 py-1.5 rounded-lg disabled:opacity-50">
                        {loadingEliminacion === o.id ? '...' : 'RECHAZAR'}
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm(`¿Confirmás la eliminación de OT-${String(o.numero_orden).padStart(5,'0')}?\n\n"${o.titulo}"\n\nEsta acción no se puede deshacer.`)) return
                          aprobarEliminacion(o.id)
                        }}
                        disabled={loadingEliminacion === o.id}
                        className="bg-red-900 border border-red-500 text-red-200 text-[10px] font-black px-3 py-1.5 rounded-lg disabled:opacity-50">
                        {loadingEliminacion === o.id ? '...' : 'ELIMINAR'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* ── 3. PEDIDOS DEL PAÑOLERO ──────────────────────────────── */}
          <section>
            <div className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase mb-3">
              Pedidos del pañolero {pedidos.length > 0 && <span className="text-red-400 normal-case font-bold">· {pedidos.length} pendiente{pedidos.length > 1 ? 's' : ''}</span>}
            </div>
            {pedidos.length === 0 ? (
              <div className="rounded-xl bg-[#071c24]/90 border border-cyan-400/15 p-3 text-center text-[#8ecbd8] text-xs">Sin pedidos pendientes</div>
            ) : (
              pedidos.map((p: any) => (
                <div key={p.id} className="bg-white border border-[#B2E0E8] rounded-xl mb-3 overflow-hidden">
                  <div className="bg-[#0F3A42] px-4 py-3">
                    <div className="flex justify-between items-center">
                      <div className="text-white font-bold text-sm">📧 PJ-{String(p.numero_pedido).padStart(4, '0')}</div>
                      <div className="text-[#7ADCE8] text-xs">{new Date(p.created_at).toLocaleDateString('es-AR')}</div>
                    </div>
                    <div className="text-[#7ADCE8] text-xs mt-0.5">De: {p.profiles?.nombre} {p.profiles?.apellido} (Pañolero)</div>
                    <div className="text-[#7ADCE8] text-xs">Para: Jefe de Sector</div>
                    <div className="text-[#7ADCE8] text-xs">Asunto: Solicitud — {p.tipo?.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="px-4 py-3">
                    {(p.pedidos_jefe_items || []).length > 0 ? (
                      <div className="mb-3">
                        <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-2">Ítems solicitados</div>
                        {(p.pedidos_jefe_items || []).map((it: any) => (
                          <div key={it.id} className="border border-[#B2E0E8] rounded-lg px-3 py-2 mb-1.5">
                            <div className="flex justify-between items-center">
                              <div className="text-[#0F3A42] font-bold text-xs">{it.nombre}</div>
                              <div className="text-[#1ABBD6] font-bold text-xs">{it.cantidad} {it.unidad || 'u'}</div>
                            </div>
                            {it.codigo && <div className="text-[#7A9EA5] text-xs">Código: {it.codigo}</div>}
                            {it.url_externa && (
                              <a href={it.url_externa} target="_blank" rel="noopener noreferrer"
                                className="text-[#1ABBD6] text-xs underline">🔗 Ver link</a>
                            )}
                            {it.observacion && <div className="text-[#7A9EA5] text-xs mt-0.5">Obs: {it.observacion}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[#0F3A42] text-xs mb-3">{p.descripcion}</div>
                    )}
                    {p.observaciones_panolero && (
                      <div className="bg-[#FAEEDA] border border-[#E8C97A] rounded-lg px-3 py-2 mb-3 text-xs text-[#854F0B]">
                        💬 {p.observaciones_panolero}
                      </div>
                    )}
                    <textarea
                      className="w-full border border-[#B2E0E8] rounded-lg p-2 text-xs text-[#0F3A42] bg-[#F0FAFB] resize-none mb-2 outline-none"
                      rows={2} placeholder="Observación del jefe (opcional)..."
                      value={obsMap[p.id] || ''}
                      onChange={e => setObsMap(prev => ({ ...prev, [p.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => responderPedido(p.id, 'aprobado')} disabled={loadingResp === p.id}
                        className="flex-1 bg-[#1ABBD6] text-white text-xs font-bold py-2 rounded-lg disabled:opacity-50">
                        ✅ Aprobar
                      </button>
                      <button onClick={() => responderPedido(p.id, 'rechazado')} disabled={loadingResp === p.id}
                        className="flex-1 bg-[#FCEBEB] text-[#A32D2D] text-xs font-bold py-2 rounded-lg border border-[#F09595] disabled:opacity-50">
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* ── 4. GRID DESKTOP: OTs SUPRA + OTs OPERATIVAS ─────────── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* OTs SUPRA */}
            <div className="rounded-2xl bg-[#071c24]/90 border border-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.07)] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase">OTs Supra</span>
                  {supras.filter(s => s.estado === 'pendiente_planificacion').length > 0 && (
                    <span className="ml-2 text-yellow-400 text-[11px] font-bold bg-yellow-400/10 border border-yellow-400/25 px-2 py-0.5 rounded-full">
                      {supras.filter(s => s.estado === 'pendiente_planificacion').length} sin planificar
                    </span>
                  )}
                </div>
                {['jefe','superadmin'].includes(perfil.rol) && (
                  <button onClick={() => { setShowFormSupra(true); setMsgSupra(null) }}
                    className="bg-cyan-400 text-[#062027] text-xs font-black px-3 py-1.5 rounded-lg shadow-[0_0_16px_rgba(34,211,238,0.35)] hover:bg-cyan-300 active:scale-95 transition-all tracking-wide">
                    + NUEVA SUPRA
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {supras.length === 0 ? (
                  <div className="text-[#8ecbd8] text-xs text-center py-4">Sin OTs Supra creadas</div>
                ) : supras.map((s: any) => {
                  const estadoColor: Record<string,string> = {
                    pendiente_planificacion: 'text-yellow-400',
                    en_ejecucion: 'text-cyan-300',
                    completada: 'text-green-400',
                    cancelada: 'text-[#8ecbd8]',
                    cierre_forzado: 'text-red-400',
                  }
                  const prioridadColor: Record<string,string> = {
                    critica: 'bg-red-500/15 text-red-400 border border-red-400/30',
                    alta: 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30',
                    normal: 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30',
                    baja: 'bg-[#8ecbd8]/10 text-[#8ecbd8] border border-[#8ecbd8]/20',
                  }
                  const sectores = (s.ots_supra_sectores || []).map((x: any) => x.sector).join(', ')
                  const supervisores = (s.ots_supra_supervisores || []).map((x: any) => `${x.profiles?.apellido}`).join(', ')
                  return (
                    <div key={s.id} className="rounded-xl bg-[#071c24]/90 border-l-4 border-l-cyan-400/60 border border-cyan-400/15 px-4 py-3 flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-white font-black text-sm tracking-wide">S-{String(s.numero_supra).padStart(4,'0')}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prioridadColor[s.prioridad] || 'bg-[#8ecbd8]/10 text-[#8ecbd8] border border-[#8ecbd8]/20'}`}>{s.prioridad}</span>
                      </div>
                      <div className="text-white font-semibold text-sm leading-tight">{s.titulo}</div>
                      <div className="text-[#8ecbd8] text-[11px]">{s.tipo?.replace(/_/g,' ')} · {sectores || '—'}</div>
                      <div className="flex items-center justify-between">
                        <div className={`text-[11px] font-semibold ${estadoColor[s.estado] || 'text-[#8ecbd8]'}`}>{s.estado?.replace(/_/g,' ')}</div>
                        <div className="text-[#8ecbd8] text-[10px]">{supervisores || '—'}</div>
                      </div>
                      {s.plazo_estimado && (
                        <div className="text-[#8ecbd8] text-[10px]">Plazo: {new Date(s.plazo_estimado).toLocaleDateString('es-AR')}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* OTs OPERATIVAS */}
            <div className="rounded-2xl bg-[#071c24]/90 border border-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.07)] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase">Órdenes operativas</span>
                <span className="text-cyan-300 text-xs font-bold">{ordenes.filter((o: any) => ['pendiente','en_curso','cierre_propuesto','rebotada','devuelta_supervisor'].includes(o.estado) && (filtroSector === 'todos' || o.sector === filtroSector)).length} activas</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {['todos','electrico','ac','edificio'].map(s => (
                  <button key={s} onClick={() => setFiltroSector(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${filtroSector === s ? 'bg-cyan-400 text-[#062027] shadow-[0_0_12px_rgba(34,211,238,0.35)]' : 'bg-[#0b2630] text-[#8ecbd8] border border-cyan-400/15 hover:border-cyan-400/35'}`}>
                    {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {(() => {
                  const ESTADOS_OPERATIVOS = ['pendiente','en_curso','cierre_propuesto','rebotada','devuelta_supervisor']
                  const filtradas = ordenes.filter((o: any) =>
                    ESTADOS_OPERATIVOS.includes(o.estado) &&
                    (filtroSector === 'todos' || o.sector === filtroSector)
                  )
                  const visibles = verMasOTs ? filtradas : filtradas.slice(0, 5)
                  return (<>
                    {visibles.map((o: any) => {
                      const estadoColor: Record<string,string> = {
                        pendiente: 'text-yellow-400',
                        en_curso: 'text-cyan-300',
                        cierre_propuesto: 'text-blue-400',
                        cerrada: 'text-green-400',
                        derivada: 'text-[#8ecbd8]',
                        rebotada: 'text-red-400',
                      }
                      const sectorColor: Record<string,string> = {
                        electrico: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/25',
                        ac: 'bg-blue-400/10 text-blue-300 border-blue-400/25',
                        edificio: 'bg-purple-400/10 text-purple-300 border-purple-400/25',
                      }
                      return (
                        <div key={o.id} onClick={() => abrirDetalle(o)}
                          className="rounded-xl bg-[#071c24]/90 border border-cyan-400/15 px-4 py-3 cursor-pointer active:opacity-70 hover:border-cyan-400/35 transition-all">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-white font-black text-sm tracking-wide">OT-{String(o.numero_orden).padStart(4,'0')}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sectorColor[o.sector] || 'bg-[#8ecbd8]/10 text-[#8ecbd8] border-[#8ecbd8]/20'}`}>
                              {o.sector || '—'}
                            </span>
                          </div>
                          <div className="text-[#8ecbd8] text-xs mb-1.5 leading-snug">{o.titulo}</div>
                          <div className="flex justify-between items-center">
                            <div className={`text-[11px] font-semibold ${estadoColor[o.estado] || 'text-[#8ecbd8]'}`}>
                              {o.estado?.replace(/_/g,' ')}
                            </div>
                            <div className="text-[#8ecbd8]/60 text-[10px]">{o.tipo || '—'}</div>
                          </div>
                          <div className="text-[#8ecbd8]/50 text-[10px] mt-1">{new Date(o.created_at).toLocaleDateString('es-AR')}</div>
                        </div>
                      )
                    })}
                    {filtradas.length === 0 && (
                      <div className="text-[#8ecbd8] text-xs text-center py-4">Sin órdenes operativas</div>
                    )}
                    {filtradas.length > 5 && (
                      <button onClick={() => setVerMasOTs(v => !v)}
                        className="w-full py-2.5 rounded-xl border border-cyan-400/20 text-[#8ecbd8] text-xs font-bold tracking-widest uppercase hover:border-cyan-400/40 hover:text-cyan-300 transition-all">
                        {verMasOTs ? 'Ver menos' : `Ver más (${filtradas.length - 5} más)`}
                      </button>
                    )}
                  </>)
                })()}
              </div>
            </div>
          </section>

          {/* ── 5. SISTEMA (solo jefe y superadmin) ───────────────────── */}
          {['jefe','superadmin'].includes(perfil?.rol) && (
            <section>
              <span className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase block mb-3">Sistema</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div onClick={() => router.push('/dashboard/superadmin/usuarios')}
                  className="rounded-xl bg-[#071c24]/90 border border-cyan-400/15 p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] hover:border-cyan-400/40 transition-all">
                  <span className="text-cyan-400 shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm leading-tight">Usuarios</div>
                    <div className="text-[#8ecbd8] text-[11px] mt-0.5 leading-tight">Gestión de accesos</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                <div onClick={() => router.push('/dashboard/mapa')}
                  className="rounded-xl bg-[#071c24]/90 border border-cyan-400/15 p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] hover:border-cyan-400/40 transition-all">
                  <span className="text-cyan-400 shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm leading-tight">Mapa traza</div>
                    <div className="text-[#8ecbd8] text-[11px] mt-0.5 leading-tight">BA–LP · TS y CT</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                <div onClick={() => router.push('/dashboard/jefe/datos')}
                  className="rounded-xl bg-[#071c24]/90 border border-cyan-400/15 p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] hover:border-cyan-400/40 transition-all">
                  <span className="text-cyan-400 shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm leading-tight">Datos</div>
                    <div className="text-[#8ecbd8] text-[11px] mt-0.5 leading-tight">Métricas operativas</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            </section>
          )}

        </div>{/* /px-4 */}
      </div>{/* /max-w-6xl */}

      {/* ── MODAL DETALLE OT (sin cambios de lógica) ──────────────────── */}
      {ordenDetalle && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setOrdenDetalle(null)}>
          <div className="bg-[#0c1c24] border border-[#1a3040] rounded-t-2xl w-full max-w-lg p-5 pb-8 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="text-[#e8f4f8] font-bold text-sm">OT-{String(ordenDetalle.numero_orden).padStart(4,'0')}</div>
              <button onClick={() => setOrdenDetalle(null)} className="text-[#7ab3c8] text-xs px-3 py-1 border border-[#1a3040] rounded-lg">✕ Cerrar</button>
            </div>
            <div className="text-[#e8f4f8] font-bold text-base mb-4 leading-snug">{ordenDetalle.titulo}</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#07131a] border border-[#1a3040] rounded-lg p-2">
                <div className="text-[#7ab3c8] text-xs mb-0.5">Sector</div>
                <div className="text-[#e8f4f8] text-xs font-bold">{ordenDetalle.sector || '—'}</div>
              </div>
              <div className="bg-[#07131a] border border-[#1a3040] rounded-lg p-2">
                <div className="text-[#7ab3c8] text-xs mb-0.5">Estado</div>
                <div className="text-[#e8f4f8] text-xs font-bold">{ordenDetalle.estado?.replace(/_/g,' ')}</div>
              </div>
              <div className="bg-[#07131a] border border-[#1a3040] rounded-lg p-2">
                <div className="text-[#7ab3c8] text-xs mb-0.5">Tipo</div>
                <div className="text-[#e8f4f8] text-xs font-bold">{ordenDetalle.tipo || '—'}</div>
              </div>
              <div className="bg-[#07131a] border border-[#1a3040] rounded-lg p-2">
                <div className="text-[#7ab3c8] text-xs mb-0.5">Fecha</div>
                <div className="text-[#e8f4f8] text-xs font-bold">{new Date(ordenDetalle.created_at).toLocaleDateString('es-AR')}</div>
              </div>
            </div>
            <div className="bg-[#07131a] border border-[#1a3040] rounded-lg p-3">
              <div className="text-[#7ab3c8] text-xs font-bold mb-2">Técnicos asignados</div>
              {loadingDetalle
                ? <div className="text-[#7ab3c8] text-xs">Cargando...</div>
                : detalleTecnicos.length === 0
                  ? <div className="text-[#7ab3c8] text-xs">Sin técnicos asignados</div>
                  : detalleTecnicos.map((t: any, i: number) => (
                    <div key={i} className="text-[#e8f4f8] text-xs py-1 border-b border-[#1a3040] last:border-0">
                      {t.profiles?.apellido}, {t.profiles?.nombre}
                      <span className="text-[#7ab3c8] ml-2">{t.profiles?.rol?.replace(/_/g,' ')}</span>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVA SUPRA (sin cambios de lógica) ─────────────────── */}
      {showFormSupra && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setShowFormSupra(false)}>
          <div className="bg-[#0c1c24] border border-[#1a3040] rounded-t-2xl w-full max-w-lg p-5 pb-8 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="text-[#e8f4f8] font-bold text-sm">Nueva OT Supra</div>
              <button onClick={() => setShowFormSupra(false)} className="text-[#7ab3c8] text-xs px-3 py-1 border border-[#1a3040] rounded-lg">CERRAR</button>
            </div>
            {msgSupra && (
              <div style={{ background: msgSupra.ok ? '#0F2A1A' : '#2A0F0F', border: `1px solid ${msgSupra.ok ? '#1D9E75' : '#E24B4A'}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: msgSupra.ok ? '#1D9E75' : '#E24B4A' }}>
                {msgSupra.ok ? '✅' : '❌'} {msgSupra.text}
              </div>
            )}
            <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Título *</div>
            <input
              className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] mb-3 outline-none"
              placeholder="Ej: Campaña inspección columnas Km 0–20"
              value={formSupra.titulo}
              onChange={e => setFormSupra({ ...formSupra, titulo: e.target.value })}
            />
            <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Descripción / Alcance</div>
            <textarea
              className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] mb-3 outline-none resize-none"
              rows={3} placeholder="Objetivo, alcance y contexto general..."
              value={formSupra.descripcion}
              onChange={e => setFormSupra({ ...formSupra, descripcion: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Tipo *</div>
                <select className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none"
                  value={formSupra.tipo} onChange={e => setFormSupra({ ...formSupra, tipo: e.target.value })}>
                  <option value="correctiva">Correctiva</option>
                  <option value="preventiva">Preventiva</option>
                  <option value="campania">Campaña</option>
                  <option value="emergencia">Emergencia</option>
                  <option value="obra">Obra</option>
                </select>
              </div>
              <div>
                <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Prioridad *</div>
                <select className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none"
                  value={formSupra.prioridad} onChange={e => setFormSupra({ ...formSupra, prioridad: e.target.value })}>
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
            </div>
            <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Plazo estimado</div>
            <input type="date"
              className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] mb-3 outline-none"
              value={formSupra.plazo_estimado}
              onChange={e => setFormSupra({ ...formSupra, plazo_estimado: e.target.value })}
            />
            <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-2">Sectores *{formSupra.sectores.length === 0 && <span className="text-[#E24B4A]"> (ninguno)</span>}</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {SECTORES_SUPRA.map(s => (
                <button key={s} onClick={() => setFormSupra({ ...formSupra, sectores: toggleItem(formSupra.sectores, s) })}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid',
                    background: formSupra.sectores.includes(s) ? '#1ABBD6' : '#07131a',
                    color: formSupra.sectores.includes(s) ? 'white' : '#4a8fa0',
                    borderColor: formSupra.sectores.includes(s) ? '#1ABBD6' : '#1a3040',
                  }}>
                  {s}
                </button>
              ))}
            </div>
            <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-2">Supervisores *{formSupra.supervisores.length === 0 && <span className="text-[#E24B4A]"> (ninguno)</span>}</div>
            {supervisoresDisponibles.length === 0 ? (
              <div className="text-[#7ab3c8] text-xs mb-3">No hay supervisores activos disponibles</div>
            ) : (
              <div className="flex flex-col gap-1 mb-4">
                {supervisoresDisponibles.map((sv: any) => (
                  <button key={sv.id} onClick={() => setFormSupra({ ...formSupra, supervisores: toggleItem(formSupra.supervisores, sv.id) })}
                    style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', textAlign: 'left',
                      background: formSupra.supervisores.includes(sv.id) ? '#0F2A35' : '#07131a',
                      color: formSupra.supervisores.includes(sv.id) ? '#1ABBD6' : '#4a8fa0',
                      borderColor: formSupra.supervisores.includes(sv.id) ? '#1ABBD6' : '#1a3040',
                    }}>
                    {formSupra.supervisores.includes(sv.id) ? '✓ ' : ''}{sv.apellido}, {sv.nombre} <span style={{ fontSize: 10, opacity: 0.7 }}>· {sv.rol.replace(/_/g,' ')}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={crearSupra} disabled={loadingSupra}
              style={{ width: '100%', background: loadingSupra ? '#1a3040' : '#1ABBD6', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, padding: '13px 0', cursor: loadingSupra ? 'default' : 'pointer' }}>
              {loadingSupra ? 'CREANDO...' : 'CREAR OT SUPRA'}
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#061418]/95 backdrop-blur-sm border-t border-cyan-400/20 z-50 flex justify-around py-2">
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span className="text-cyan-300 text-xs font-bold">Global</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer opacity-30">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8ecbd8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          <span className="text-[#8ecbd8] text-xs">Alertas</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer opacity-30">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8ecbd8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          <span className="text-[#8ecbd8] text-xs">Stock</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer opacity-30">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8ecbd8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span className="text-[#8ecbd8] text-xs">Personal</span>
        </div>
        <div onClick={() => router.push('/historial')} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8ecbd8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="text-[#8ecbd8] text-xs">Historial</span>
        </div>
        <div onClick={() => router.push('/dashboard/checkin/historial')} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8ecbd8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span className="text-[#8ecbd8] text-xs">Checkins</span>
        </div>
      </nav>
    </main>
  )
}
