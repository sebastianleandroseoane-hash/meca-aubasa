'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'
import AvatarUpload from '@/app/components/AvatarUpload'

export default function DashboardTecnicoAC() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [ordenActiva, setOrdenActiva] = useState<any>(null)
  const [ordenDetalle, setOrdenDetalle] = useState<any>(null)
  const [obscierre, setObsCierre] = useState('')
  const [showCierre, setShowCierre] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supervisor, setSupervisor] = useState<any>(null)
  const [hora, setHora] = useState('')
  const [fecha, setFecha] = useState('')

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'tecnico_ac' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
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
    const { data } = await supabase
      .from('profiles')
      .select('nombre, apellido')
      .eq('rol', 'supervisor_ac')
      .eq('turno', p.turno)
      .eq('activo', true)
      .limit(1)
      .single()
    setSupervisor(data || null)
  }

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
    if (estado === 'en_curso') return '#FAEEDA|#854F0B'
    if (estado === 'completada') return '#D6F4F8|#0F8FAA'
    if (estado === 'cancelada') return '#FCEBEB|#A32D2D'
    return '#1a3040|#7ADCE8'
  }

  function badgeLabel(estado: string) {
    if (estado === 'en_curso') return 'En curso'
    if (estado === 'completada') return 'Completada'
    if (estado === 'cancelada') return 'Cancelada'
    return 'Pendiente'
  }

  const enCurso = ordenes.filter(o => o.estado === 'en_curso').length

  if (!perfil) return (
    <div style={{ minHeight: '100vh', background: '#07131a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1ABBD6', fontFamily: 'system-ui' }}>
      Cargando...
    </div>
  )

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
              <div style={{ fontSize: 11, color: '#4a8fa0', marginTop: 1 }}>Técnico AC · Turno {perfil.turno}</div>
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
              <button onClick={() => { setOrdenDetalle(null); setShowCierre(false); setObsCierre('') }}
                style={{ background: 'none', border: 'none', color: '#4a8fa0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[['Estado', ordenDetalle.estado], ['Prioridad', ordenDetalle.prioridad]].map(([k, v]) => (
                  <div key={k} style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8', marginTop: 2, textTransform: 'capitalize' }}>{v}</div>
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
              {ordenDetalle.descripcion && (
                <div style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Descripción</div>
                  <div style={{ fontSize: 13, color: '#e8f4f8', marginTop: 2 }}>{ordenDetalle.descripcion}</div>
                </div>
              )}
              {ordenDetalle.tecnicos.length > 0 && (
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
              {ordenDetalle.materiales.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#4a8fa0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Materiales</div>
                  {ordenDetalle.materiales.map((m: any) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#e8f4f8' }}>{m.materiales?.nombre}</span>
                      <span style={{ fontSize: 11, color: '#4a8fa0' }}>{m.cantidad_solicitada} {m.materiales?.unidad}</span>
                    </div>
                  ))}
                </div>
              )}
              {showCierre && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Observaciones de cierre</div>
                  <textarea
                    style={{ width: '100%', background: '#07131a', border: '1px solid #1ABBD6', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                    rows={3} placeholder="Detallá lo realizado..." value={obscierre} onChange={e => setObsCierre(e.target.value)} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {ordenDetalle.estado === 'pendiente' && (
                  <button onClick={() => iniciarOrden(ordenDetalle.id)}
                    style={{ flex: 1, background: '#1ABBD6', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    INICIAR
                  </button>
                )}
                {ordenDetalle.estado === 'en_curso' && !showCierre && (
                  <button onClick={() => setShowCierre(true)}
                    style={{ flex: 1, background: '#1D9E75', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    CERRAR ORDEN
                  </button>
                )}
                {ordenDetalle.estado === 'en_curso' && showCierre && (
                  <button onClick={() => cerrarOrden(ordenDetalle.id)} disabled={loading}
                    style={{ flex: 1, background: loading ? '#1a3040' : '#1D9E75', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    {loading ? 'Cerrando...' : 'CONFIRMAR CIERRE'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '12px 14px 100px' }}>

        {/* SUPERVISOR + ORDEN ACTIVA */}
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
        {ordenActiva && (
          <div onClick={() => abrirDetalle(ordenActiva)}
            style={{ background: '#0c1c24', border: `1px solid ${ordenActiva.estado === 'en_curso' ? '#BA7517' : '#1a3040'}`, borderLeft: `3px solid ${ordenActiva.estado === 'en_curso' ? '#EF9F27' : '#1ABBD6'}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              {ordenActiva.estado === 'en_curso' ? '⚡ Orden en curso' : '📋 Orden pendiente'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>{ordenActiva.titulo}</div>
                <div style={{ fontSize: 11, color: '#4a8fa0', marginTop: 2 }}>OT-{String(ordenActiva.numero_orden).padStart(5, '0')}{ordenActiva.km ? ` · Km ${ordenActiva.km}` : ''}</div>
              </div>
              <div style={{ background: ordenActiva.estado === 'en_curso' ? '#FAEEDA' : '#1a3040', color: ordenActiva.estado === 'en_curso' ? '#854F0B' : '#7ADCE8', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, marginLeft: 8, whiteSpace: 'nowrap' }}>
                {badgeLabel(ordenActiva.estado)}
              </div>
            </div>
          </div>
        )}

        {/* GRID ACCESOS */}
        <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Accesos rápidos</div>
        {(() => {
          const iconos: Record<string, React.ReactNode> = {
            ordenes: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
            checkin: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
            cronograma: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
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
            { label: 'Combustible', sub: 'Cargas de flota', key: 'combustible', path: '/cargas-combustible', active: true },
            { label: 'Calculadora', sub: 'Próximamente', key: 'calculadora', path: '', active: false },
          ]
          return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {items.map((item, i) => (
            <div key={i}
              onClick={() => item.active && (item.path ? router.push(item.path) : item.action?.())}
              style={{
                background: '#0c1c24',
                border: `1px solid ${item.active ? '#1a3040' : '#0f1e28'}`,
                borderRadius: 12,
                padding: '14px 12px',
                cursor: item.active ? 'pointer' : 'default',
                opacity: item.active ? 1 : 0.4,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
              {iconos[item.key]}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>{item.label}</div>
                <div style={{ fontSize: 10, color: item.active ? '#4a8fa0' : '#2a5060', marginTop: 2 }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
          )
        })()}

        {/* LISTA ÓRDENES COMPACTA */}
        {ordenes.length > 1 && (
          <>
            <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Todas mis órdenes</div>
            {ordenes.map(o => (
              <div key={o.id} onClick={() => abrirDetalle(o)}
                style={{ background: '#0c1c24', border: '1px solid #1a3040', borderRadius: 10, padding: '10px 12px', marginBottom: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#4a8fa0' }}>OT-{String(o.numero_orden).padStart(5, '0')}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>{o.titulo}</div>
                </div>
                <div style={{ background: o.estado === 'en_curso' ? '#FAEEDA' : '#1a3040', color: o.estado === 'en_curso' ? '#854F0B' : '#7ADCE8', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  {badgeLabel(o.estado)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* NAVBAR BOTTOM */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(12,28,36,0.97)', borderTop: '1px solid #1a3040', display: 'flex', justifyContent: 'space-around', padding: '8px 0 14px' }}>
        {[
          { label: 'Panel', active: true, path: '', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
          { label: enCurso > 0 ? 'En curso' : 'Órdenes', active: false, path: '', action: () => ordenActiva && abrirDetalle(ordenActiva), svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a8fa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
          { label: 'Checkin', active: false, path: '/dashboard/checkin/hub', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a8fa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
          { label: 'Historial', active: false, path: '/historial', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a8fa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { label: 'Cronograma', active: false, path: '/dashboard/cronograma', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a8fa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
        ].map((item, i) => (
          <div key={i} onClick={() => item.path ? router.push(item.path) : item.action?.()}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', minWidth: 44 }}>
           {item.svg}
            <span style={{ fontSize: 10, color: item.active ? '#1ABBD6' : '#4a8fa0', fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </main>
  )
}