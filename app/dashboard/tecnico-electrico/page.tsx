'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'
import AvatarUpload from '@/app/components/AvatarUpload'

export default function DashboardTecnicoElectrico() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [ordenActiva, setOrdenActiva] = useState<any>(null)
  const [ordenDetalle, setOrdenDetalle] = useState<any>(null)
  const [trabajosRealizados, setTrabajosRealizados] = useState('')
  const [mediciones, setMediciones] = useState('')
  const [pendientes, setPendientes] = useState('')
  const [showCierre, setShowCierre] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supervisor, setSupervisor] = useState<any>(null)
  const [hora, setHora] = useState('')
  const [fecha, setFecha] = useState('')
  const [obsRecepcion, setObsRecepcion] = useState<Record<string, string>>({})

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'tecnico_electrico' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
      await Promise.all([cargarOrdenes(p.id), cargarSupervisor(p)])
    })
    const tick = () => {
      const now = new Date()
      setHora(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
      setFecha(now.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }))
    }
    tick()
    const interval = setInterval(tick, 60000)
    return () => clearInterval(interval)
  }, [])

  async function cargarSupervisor(p: any) {
    const { data: sup } = await supabase
      .from('profiles')
      .select('nombre, apellido')
      .eq('rol', 'supervisor_electrico')
      .eq('turno', p.turno)
      .eq('activo', true)
      .eq('grupo', p.grupo)
      .maybeSingle()
    if (sup) { setSupervisor(sup); return }
    const { data: supFallback } = await supabase
      .from('profiles')
      .select('nombre, apellido')
      .eq('rol', 'supervisor_electrico')
      .eq('turno', p.turno)
      .eq('activo', true)
      .limit(1)
      .maybeSingle()
    setSupervisor(supFallback || null)
  }

  async function cargarOrdenes(userId: string) {
    const { data: ords1 } = await supabase.from('ordenes_trabajo').select('*')
      .eq('asignado_a', userId).in('estado', ['pendiente', 'en_curso', 'cierre_propuesto', 'devuelta_supervisor'])
    const { data: ots } = await supabase.from('orden_tecnicos').select('orden_id').eq('tecnico_id', userId)
    const ids = (ots || []).map((o: any) => o.orden_id)
    let ords2: any[] = []
    if (ids.length > 0) {
      const { data } = await supabase.from('ordenes_trabajo').select('*')
      .in('id', ids).in('estado', ['pendiente', 'en_curso', 'cierre_propuesto', 'devuelta_supervisor'])  
      ords2 = data || []
    }
    const todas = [...(ords1 || []), ...ords2]
    const unicas = todas.filter((o, i, arr) => arr.findIndex(x => x.id === o.id) === i)
    const ordenadas = unicas.sort((a, b) => {
  if (a.estado === 'en_curso' && b.estado !== 'en_curso') return -1
  if (b.estado === 'en_curso' && a.estado !== 'en_curso') return 1
  const fa = new Date(a.fecha_programada || a.created_at).getTime()
  const fb = new Date(b.fecha_programada || b.created_at).getTime()
  if (fa !== fb) return fa - fb
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
})
    setOrdenes(ordenadas)
    setOrdenActiva(ordenadas.find((o: any) => o.estado === 'en_curso') || ordenadas[0] || null)
  }

  

  async function confirmarRecepcionMaterial(ordenMaterialId: string, observacion: string) {
    await supabase.from('orden_materiales').update({
      estado: 'recibido',
      recibido_por: perfil.id,
      recibido_at: new Date().toISOString(),
      observacion_tecnico: observacion || null
    }).eq('id', ordenMaterialId).eq('estado', 'entregado')
    if (ordenDetalle) await abrirDetalle(ordenDetalle)
  }

  async function abrirDetalle(orden: any) {
    const { data: tecnicos } = await supabase.from('orden_tecnicos')
      .select('*, profiles!orden_tecnicos_tecnico_id_fkey(nombre, rol)').eq('orden_id', orden.id)
    const { data: materiales } = await supabase.from('orden_materiales')
      .select('id, cantidad, estado, entregado_at, recibido_por, recibido_at, observacion_tecnico, materiales!orden_materiales_material_id_fkey(nombre, unidad)').eq('orden_id', orden.id)
    const { data: pedidos } = await supabase.from('pedidos_material').select('*').eq('orden_trabajo_id', orden.id)
    setOrdenDetalle({ ...orden, tecnicos: tecnicos || [], materiales: materiales || [], pedidos: pedidos || [] })
  }

  async function iniciarOrden(id: string) {
    await supabase.from('ordenes_trabajo').update({ estado: 'en_curso', fecha_inicio: new Date().toISOString() }).eq('id', id)
    await cargarOrdenes(perfil.id)
    setOrdenDetalle(null)
  }

  async function proponerCierre(id: string) {
    if (!trabajosRealizados) return
    setLoading(true)
    await supabase
      .from('ordenes_trabajo')
      .update({
        estado: 'cierre_propuesto',
        trabajos_realizados: trabajosRealizados,
        mediciones: mediciones || null,
        pendientes_descripcion: pendientes || null,
        cierre_propuesto_at: new Date().toISOString(),
        cierre_propuesto_por: perfil.id,
        observacion_supervisor: null,
        devuelto_por: null,
        devuelto_at: null,
      })
      .eq('id', id)
      .in('estado', ['en_curso', 'devuelta_supervisor'])
      .select()
    // DEUDA: cerro=true significa "intervención finalizada", no "OT cerrada". Revisar al implementar supervisor.
    await supabase.from('orden_tecnicos').update({ cerro: true }).eq('orden_id', id).eq('tecnico_id', perfil.id)
    setLoading(false)
    setShowCierre(false)
    setTrabajosRealizados('')
    setMediciones('')
    setPendientes('')
    setOrdenDetalle(null)
    await cargarOrdenes(perfil.id)
  }

 function badgeLabel(estado: string) {
    if (estado === 'en_curso') return 'En curso'
    if (estado === 'completada') return 'Completada'
    if (estado === 'cierre_propuesto') return '⏳ En revisión'
    if (estado === 'devuelta_supervisor') return '↩️ Devuelta'
    if (estado === 'cancelada') return 'Cancelada'
    return 'Pendiente'
  }

  const enCurso = ordenes.filter(o => o.estado === 'en_curso').length

  if (!perfil) return (
    <div style={{ minHeight: '100vh', background: '#07131a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1ABBD6', fontFamily: 'system-ui' }}>
      Cargando...
    </div>
  )

  const iconos: Record<string, React.ReactNode> = {
    ordenes: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    checkin: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    cronograma: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    historial: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    vehiculos: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5"/><circle cx="16" cy="19" r="2"/><circle cx="7" cy="19" r="2"/><path d="M13 17H9"/></svg>,
    calculadora: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a5060" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>,
  }

  const items = [
    { label: 'Órdenes', sub: enCurso > 0 ? `${enCurso} en curso` : `${ordenes.length} total`, key: 'ordenes', path: '', action: () => ordenActiva ? abrirDetalle(ordenActiva) : null, active: true },
    { label: 'Checkin', sub: 'Vehículos · Herram.', key: 'checkin', path: '/dashboard/checkin/hub', active: true },
    { label: 'Cronograma', sub: `Turno ${perfil.turno}`, key: 'cronograma', path: '/dashboard/cronograma', active: true },
    { label: 'Historial', sub: 'Mis trabajos', key: 'historial', path: '/historial', active: true },
    { label: 'Vehículos', sub: 'Checkin de flota', key: 'vehiculos', path: '/dashboard/checkin/vehiculos', active: true },
    { label: 'Calculadora', sub: 'Próximamente', key: 'calculadora', path: '', active: false },
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#07131a', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#e8f4f8' }}>

      {/* HEADER */}
      <div style={{ background: '#0c1c24', borderBottom: '1px solid #1a3040', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AvatarUpload
              perfil={perfil}
              onUpdatePerfil={updates => setPerfil((prev: any) => ({ ...prev, ...updates }))}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e8f4f8' }}>{perfil.nombre} {perfil.apellido}</div>
              <div style={{ fontSize: 11, color: '#4a8fa0', marginTop: 1 }}>Técnico Eléctrico · Turno {perfil.turno}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1ABBD6' }}>{hora}</div>
              <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'capitalize' }}>{fecha}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75' }}></div>
              <span style={{ fontSize: 10, color: '#1D9E75', fontWeight: 600 }}>ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DETALLE */}
      {ordenDetalle && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ background: '#0c1c24', borderRadius: '16px 16px 0 0', padding: 16, maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid #1a3040' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#4a8fa0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>OT-{String(ordenDetalle.numero_orden).padStart(5, '0')}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#e8f4f8' }}>{ordenDetalle.titulo}</div>
              </div>
              <button onClick={() => { setOrdenDetalle(null); setShowCierre(false); setTrabajosRealizados(''); setMediciones(''); setPendientes('') }}
                style={{ background: 'none', border: 'none', color: '#4a8fa0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[['Estado', badgeLabel(ordenDetalle.estado)], ['Prioridad', ordenDetalle.prioridad]].map(([k, v]) => (
                  <div key={k} style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8', marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
              {(ordenDetalle.km || ordenDetalle.ubicacion) && (
                <div style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ubicación</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8', marginTop: 2 }}>
                    {ordenDetalle.km ? `Km ${ordenDetalle.km}` : ''}{ordenDetalle.ubicacion ? ` · ${ordenDetalle.ubicacion}` : ''}
                  </div>
                </div>
              )}
              {(ordenDetalle.balizamiento_desde || ordenDetalle.balizamiento_hasta) && (
                <div style={{ background: '#3A2A00', border: '1px solid #EF9F2744', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#EF9F27', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>⚠️ Balizamiento</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>
                    Km {ordenDetalle.balizamiento_desde} → {ordenDetalle.balizamiento_hasta}
                    {(ordenDetalle.balizamiento_hora_ingreso || ordenDetalle.balizamiento_hora_egreso) && (
                      <span style={{ fontSize: 11, color: '#EF9F27', marginLeft: 8 }}>
                        {ordenDetalle.balizamiento_hora_ingreso} – {ordenDetalle.balizamiento_hora_egreso}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {ordenDetalle.descripcion && (
                <div style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Descripción</div>
                  <div style={{ fontSize: 13, color: '#e8f4f8', marginTop: 2 }}>{ordenDetalle.descripcion}</div>
                </div>
              )}
              {ordenDetalle.tecnicos?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#4a8fa0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Técnicos</div>
                  {ordenDetalle.tecnicos.map((t: any) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#e8f4f8' }}>{t.profiles?.nombre}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: t.cerro ? '#0F6E56' : '#1a3040', color: t.cerro ? '#9FE1CB' : '#4a8fa0' }}>
                        {t.cerro ? 'Cerró' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {ordenDetalle.materiales?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#4a8fa0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Materiales</div>
                  {ordenDetalle.materiales.map((m: any) => (
                    <div key={m.id} style={{ background: '#07131a', border: `1px solid ${m.estado === 'recibido' ? '#1D9E75' : m.estado === 'entregado' ? '#1ABBD6' : '#1a3040'}`, borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#e8f4f8' }}>{m.materiales?.nombre}</span>
                        <span style={{ fontSize: 11, color: '#4a8fa0' }}>{m.cantidad} {m.materiales?.unidad}</span>
                      </div>
                      {m.estado === 'entregado' && (
                        <div style={{ marginTop: 8 }}>
                          <input
                            placeholder="Observación (opcional)"
                            value={obsRecepcion[m.id] || ''}
                            onChange={e => setObsRecepcion(prev => ({ ...prev, [m.id]: e.target.value }))}
                            style={{ width: '100%', background: '#0c1c24', border: '1px solid #1a3040', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#e8f4f8', outline: 'none', boxSizing: 'border-box' as const, marginBottom: 6 }}
                          />
                          <button
                            onClick={() => confirmarRecepcionMaterial(m.id, obsRecepcion[m.id] || '')}
                            style={{ background: '#1ABBD6', border: 'none', borderRadius: 6, color: 'white', fontWeight: 700, fontSize: 11, padding: '6px 12px', cursor: 'pointer' }}>
                            ✅ CONFIRMAR RECEPCIÓN
                          </button>
                        </div>
                      )}
                      {m.estado === 'recibido' && (
                        <div style={{ marginTop: 4, fontSize: 11, color: '#1D9E75' }}>
                          ✅ Recibido · {m.recibido_at ? new Date(m.recibido_at).toLocaleString('es-AR') : ''}
                          {m.observacion_tecnico && <div style={{ color: '#4a8fa0', marginTop: 2 }}>{m.observacion_tecnico}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {ordenDetalle.estado === 'devuelta_supervisor' && ordenDetalle.observacion_supervisor && (
                <div style={{ background: '#2A1A00', border: '1px solid #EF9F2744', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#EF9F27', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>↩️ Observación del supervisor</div>
                  <div style={{ fontSize: 13, color: '#e8f4f8' }}>{ordenDetalle.observacion_supervisor}</div>
                </div>
              )}
              {showCierre && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>¿Qué trabajos realizaste? *</div>
                  <textarea
                    style={{ width: '100%', background: '#07131a', border: '1px solid #1ABBD6', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                    rows={3} placeholder="Describí qué hiciste..." value={trabajosRealizados} onChange={e => setTrabajosRealizados(e.target.value)} />
                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Mediciones (opcional)</div>
                  <textarea
                    style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                    rows={2} placeholder="Tensiones, corrientes, aislación..." value={mediciones} onChange={e => setMediciones(e.target.value)} />
                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>¿Quedó algo pendiente?</div>
                  <textarea
                    style={{ width: '100%', background: '#07131a', border: `1px solid ${pendientes ? '#EF9F27' : '#1a3040'}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                    rows={2} placeholder="Describí qué quedó sin resolver..." value={pendientes} onChange={e => setPendientes(e.target.value)} />
                  {pendientes.length > 0 && (
                    <div style={{ fontSize: 11, color: '#EF9F27', marginTop: 4 }}>⚠️ El supervisor revisará los trabajos pendientes informados</div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {ordenDetalle.estado === 'pendiente' && (
                  <button onClick={() => iniciarOrden(ordenDetalle.id)}
                    style={{ flex: 1, background: '#1ABBD6', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    INICIAR
                  </button>
                )}
                {(ordenDetalle.estado === 'en_curso' || ordenDetalle.estado === 'devuelta_supervisor') && !showCierre && (
                  <button onClick={() => setShowCierre(true)}
                    style={{ flex: 1, background: ordenDetalle.estado === 'devuelta_supervisor' ? '#EF9F27' : '#1D9E75', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    {ordenDetalle.estado === 'devuelta_supervisor' ? 'CORREGIR Y REPROPONER' : 'PROPONER CIERRE'}
                  </button>
                )}
                {(ordenDetalle.estado === 'en_curso' || ordenDetalle.estado === 'devuelta_supervisor') && showCierre && (
                  <button onClick={() => proponerCierre(ordenDetalle.id)} disabled={loading || !trabajosRealizados}
                    style={{ flex: 1, background: loading || !trabajosRealizados ? '#1a3040' : '#1D9E75', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    {loading ? 'Enviando...' : 'ENVIAR AL SUPERVISOR'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '12px 14px 100px' }}>

        {/* SUPERVISOR + ÓRDENES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div style={{ background: '#0c1c24', border: '1px solid #1a3040', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Supervisor de turno</div>
            {supervisor ? (
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e8f4f8' }}>{supervisor.nombre} {supervisor.apellido}</div>
            ) : (
              <div style={{ fontSize: 11, color: '#E24B4A' }}>No conectado</div>
            )}
          </div>
          <div style={{ background: '#0c1c24', border: '1px solid #1a3040', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Mis órdenes</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: enCurso > 0 ? '#1ABBD6' : '#4a8fa0' }}>{ordenes.length}</span>
              {enCurso > 0 && <span style={{ fontSize: 11, color: '#1D9E75' }}>{enCurso} en curso</span>}
            </div>
          </div>
        </div>

        {/* ORDEN ACTIVA */}
        {ordenActiva && (() => {
          const hayEnCurso = ordenes.some(o => o.estado === 'en_curso')
          const primeraPendienteId = !hayEnCurso
            ? ordenes.find(o => o.estado === 'pendiente')?.id
            : null
          const esClickeable =
            ordenActiva.estado === 'en_curso' ||
            ordenActiva.estado === 'cierre_propuesto' ||
            ordenActiva.estado === 'devuelta_supervisor' ||
            (!hayEnCurso && ordenActiva.id === primeraPendienteId)

          return (
            <div onClick={() => esClickeable && abrirDetalle(ordenActiva)}
              style={{ background: '#0c1c24', border: `1px solid ${ordenActiva.estado === 'en_curso' ? '#BA7517' : '#1a3040'}`, borderLeft: `3px solid ${ordenActiva.estado === 'en_curso' ? '#EF9F27' : '#1ABBD6'}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10, cursor: esClickeable ? 'pointer' : 'default' }}>
              <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                {ordenActiva.estado === 'en_curso' ? '⚡ Orden en curso' : '📋 Orden pendiente'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>{ordenActiva.titulo}</div>
                  <div style={{ fontSize: 11, color: '#4a8fa0', marginTop: 2 }}>OT-{String(ordenActiva.numero_orden).padStart(5, '0')}{ordenActiva.km ? ` · Km ${ordenActiva.km}` : ''}</div>
                </div>
                <div style={{ background: ordenActiva.estado === 'en_curso' ? '#FAEEDA' : ordenActiva.estado === 'cierre_propuesto' ? '#FFF3CD' : ordenActiva.estado === 'devuelta_supervisor' ? '#2A1A00' : '#1a3040', color: ordenActiva.estado === 'en_curso' ? '#854F0B' : ordenActiva.estado === 'cierre_propuesto' ? '#856404' : ordenActiva.estado === 'devuelta_supervisor' ? '#EF9F27' : '#7ADCE8', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, marginLeft: 8, whiteSpace: 'nowrap' }}>
                  {badgeLabel(ordenActiva.estado)}
                </div>
              </div>
            </div>
          )
        })()}

        {/* GRID ACCESOS */}
        <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Accesos rápidos</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {items.map((item, i) => (
            <div key={i}
              onClick={() => item.active && (item.path ? router.push(item.path) : item.action?.())}
              style={{ background: '#0c1c24', border: `1px solid ${item.active ? '#1a3040' : '#0f1e28'}`, borderRadius: 12, padding: '14px 12px', cursor: item.active ? 'pointer' : 'default', opacity: item.active ? 1 : 0.4, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {iconos[item.key]}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>{item.label}</div>
                <div style={{ fontSize: 10, color: item.active ? '#4a8fa0' : '#2a5060', marginTop: 2 }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* LISTA ÓRDENES */}
        {ordenes.length > 1 && (() => {
          const hayEnCurso = ordenes.some(o => o.estado === 'en_curso')
          const primeraPendiente = !hayEnCurso
            ? ordenes.find(o => o.estado === 'pendiente')?.id
            : null

          return (
            <>
              <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Todas mis órdenes</div>
              {ordenes.map(o => {
                const esClickeable =
                  o.estado === 'en_curso' ||
                  o.estado === 'cierre_propuesto' ||
                  o.estado === 'devuelta_supervisor' ||
                  (!hayEnCurso && o.id === primeraPendiente)

                return (
                  <div key={o.id}
                    onClick={() => esClickeable && abrirDetalle(o)}
                    style={{
                      background: '#0c1c24',
                      border: `1px solid ${esClickeable ? '#1a3040' : '#0f1e28'}`,
                      borderRadius: 10,
                      padding: '10px 12px',
                      marginBottom: 6,
                      cursor: esClickeable ? 'pointer' : 'default',
                      opacity: esClickeable ? 1 : 0.4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#4a8fa0' }}>OT-{String(o.numero_orden).padStart(5, '0')}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>{o.titulo}</div>
                      {!esClickeable && (
                        <div style={{ fontSize: 10, color: '#2a5060', marginTop: 2 }}>En espera</div>
                      )}
                    </div>
                    <div style={{
                      background: o.estado === 'en_curso' ? '#FAEEDA' : o.estado === 'cierre_propuesto' ? '#FFF3CD' : o.estado === 'devuelta_supervisor' ? '#2A1A00' : '#1a3040',
                      color: o.estado === 'en_curso' ? '#854F0B' : o.estado === 'cierre_propuesto' ? '#856404' : o.estado === 'devuelta_supervisor' ? '#EF9F27' : '#7ADCE8',
                      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap'
                    }}>
                      {badgeLabel(o.estado)}
                    </div>
                  </div>
                )
              })}
            </>
          )
        })()}
      </div>

      {/* NAVBAR */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(12,28,36,0.97)', borderTop: '1px solid #1a3040', display: 'flex', justifyContent: 'space-around', padding: '8px 0 14px' }}>
        {[
          { label: 'Panel', active: true, path: '', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
          { label: enCurso > 0 ? 'En curso' : 'Órdenes', active: false, path: '', action: () => ordenActiva && abrirDetalle(ordenActiva), svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a8fa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
          { label: 'Checkin', active: false, path: '/dashboard/checkin/hub', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a8fa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
          { label: 'Historial', active: false, path: '/historial', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a8fa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { label: 'Cronograma', active: false, path: '/dashboard/cronograma', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a8fa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { label: 'Mapa', active: false, path: '/dashboard/mapa', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a8fa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg> },
        ].map((item, i) => (
          <div key={i} onClick={() => item.path ? router.push(item.path) : (item as any).action?.()}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', minWidth: 44 }}>
            {item.svg}
            <span style={{ fontSize: 10, color: item.active ? '#1ABBD6' : '#4a8fa0', fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </main>
  )
}