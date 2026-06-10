'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'
// ─── helpers ───────────────────────────────────────────────────────────────

import { formatFechaAR } from '@/lib/fecha-local'

function fmt(v: any) {
  if (!v) return 'No registrado'
  try { return new Date(v).toLocaleString('es-AR') } catch { return String(v) }
}
function fmtFecha(v: any) {
  return formatFechaAR(v)
}

function val(v: any) { return v === null || v === undefined || v === '' ? 'No registrado' : String(v) }

function FSeccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#174A7C', textTransform: 'uppercase' as const, letterSpacing: 1, borderBottom: '2px solid #D8E2EE', paddingBottom: 4, marginBottom: 10 }}>
        {titulo}
      </div>
      {children}
    </div>
  )
}

function FInfoLine({ label, value, strong }: { label: string; value: any; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, alignItems: 'baseline' }}>
      <span style={{ fontWeight: 900, color: '#0F2A3A', minWidth: 130, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: strong ? '#13795B' : '#1F2937', fontWeight: strong ? 900 : 700 }}>{val(value)}</span>
    </div>
  )
}

function FPersona({ perfil, rol }: { perfil: any; rol: string }) {
  const nombre = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ') || 'No registrado'
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#F8FAFC', border: '1px solid #D8E2EE', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
      {perfil?.avatar_url
        ? <img src={perfil.avatar_url} alt={nombre} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' as const, border: '2px solid #0B5CAB' }} />
        : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0B2A4A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>{iniciales || '?'}</div>
      }
      <div>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>{nombre}</div>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#174A7C', textTransform: 'uppercase' as const }}>{rol}</div>
        {perfil?.sector_trabajo && <div style={{ fontSize: 10, color: '#64748B' }}>{perfil.sector_trabajo}</div>}
      </div>
    </div>
  )
}

function FKpi({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ padding: '12px 14px', borderRight: '1px solid #D8E2EE', minWidth: 0 }}>
      <div style={{ fontSize: 9, color: '#174A7C', fontWeight: 900, textTransform: 'uppercase' as const, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 900, color: '#0F172A', wordBreak: 'break-word' as const }}>{val(value)}</div>
    </div>
  )
}

function FichaTecnicaOT({ ordenDetalle, informeDetalle, tecnicos, materiales, hijas, otMadre, aprobadorPerfil, creadorPerfil, cierrePropuestoPerfil }: any) {
  const otNumero = `OT-${String(ordenDetalle?.numero_orden || '').padStart(5, '0')}`
  const activoOperativo = informeDetalle?.activo_operativo !== false
  const hijasActivas = hijas.filter((h: any) => ['pendiente', 'en_curso', 'cierre_propuesto', 'devuelta_supervisor'].includes(h.estado))

  return (
    <div>
      <style>{`
        @media print {
          body { background: white !important; }
          .ficha-no-print { display: none !important; }
          .ficha-meca { max-width: none !important; margin: 0 !important; padding: 6mm !important; box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      <button className="ficha-no-print" onClick={() => window.print()}
        style={{ marginBottom: 16, background: '#061B33', color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}>
        🖨️ Imprimir ficha técnica
      </button>

      <div className="ficha-meca" style={{ background: '#FFFFFF', color: '#0F172A', minWidth: 700, maxWidth: 1100, margin: '0 auto', borderRadius: 16, boxShadow: '0 12px 48px rgba(2,12,27,.18)', fontFamily: 'Arial, sans-serif' }}>

        <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, #061B33 0%, #0B2A4A 70%, #083A5A 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #26C6F9' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: .6 }}>AUBASA · MECA</div>
            <div style={{ margin: '6px 0 4px', fontSize: 26, fontWeight: 900, letterSpacing: .4 }}>FICHA TÉCNICA DE INTERVENCIÓN</div>
            <div style={{ color: '#9DE8FF', fontSize: 13, fontWeight: 800 }}>Sistema Integral de Gestión de Mantenimiento</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#26C6F9' }}>{otNumero}</div>
            <div style={{ marginTop: 8, display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: String(ordenDetalle?.estado || '').includes('cerr') ? '#1D9E75' : '#EF9F27', color: 'white', fontSize: 12, fontWeight: 900 }}>
              {String(ordenDetalle?.estado || '').toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: '1px solid #D8E2EE', background: '#FFFFFF' }}>
          <FKpi label="Estado" value={ordenDetalle?.estado} />
          <FKpi label="Prioridad" value={ordenDetalle?.prioridad} />
          <FKpi label="Creación" value={fmtFecha(ordenDetalle?.created_at)} />
          <FKpi label="Cierre" value={fmtFecha(ordenDetalle?.aprobado_at || ordenDetalle?.fecha_cierre)} />
          <FKpi label="Tipo" value={ordenDetalle?.tipo} />
          <FKpi label="Origen" value={ordenDetalle?.origen} />
        </div>

        <div style={{ padding: 24, background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#FFF', border: '1px solid #D8E2EE', borderRadius: 14, padding: 16 }}>
              <FSeccion titulo="Activo / Ubicación">
                <FInfoLine label="Sector" value={ordenDetalle?.sector} />
                <FInfoLine label="Nomenclatura" value={ordenDetalle?.nomenclatura} />
                <FInfoLine label="Km" value={ordenDetalle?.km} />
                <FInfoLine label="Ubicación" value={ordenDetalle?.ubicacion} />
                <FInfoLine label="Activo ID" value={ordenDetalle?.activo_id} />
                <FInfoLine label="Estado final" value={activoOperativo ? 'OPERATIVO' : 'NO OPERATIVO'} strong={activoOperativo} />
              </FSeccion>
            </div>
            <div style={{ background: '#FFF', border: '1px solid #D8E2EE', borderRadius: 14, padding: 16 }}>
              <FSeccion titulo="Impacto operativo">
                <FInfoLine label="Estado encontrado" value={informeDetalle?.estado_encontrado} />
                <FInfoLine label="Causa probable" value={informeDetalle?.causa_probable} />
                <FInfoLine label="Activo operativo" value={activoOperativo ? 'SÍ' : 'NO'} strong={activoOperativo} />
                <FInfoLine label="Personal" value={`${tecnicos.length} técnico${tecnicos.length !== 1 ? 's' : ''}`} />
                <FInfoLine label="Materiales" value={`${materiales.length} ítem${materiales.length !== 1 ? 's' : ''}`} />
                <FInfoLine label="Riesgo residual" value={informeDetalle?.riesgo_controlado === false ? 'ALTO / No controlado' : informeDetalle ? 'BAJO / Controlado' : 'No registrado'} />
                <FInfoLine label="Seguimiento" value={informeDetalle?.requiere_seguimiento ? 'SÍ' : informeDetalle ? 'NO' : 'No registrado'} />
              </FSeccion>
            </div>
          </div>

          <div style={{ background: '#FFF', border: '1px solid #D8E2EE', borderRadius: 14, padding: 16 }}>
            <FSeccion titulo="Responsables e intervinientes">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {creadorPerfil && <FPersona perfil={creadorPerfil} rol="Creó la OT" />}
                {cierrePropuestoPerfil && <FPersona perfil={cierrePropuestoPerfil} rol="Propuso cierre" />}
                {aprobadorPerfil && <FPersona perfil={aprobadorPerfil} rol="Aprobó / Supervisó" />}
                {tecnicos.map((t: any, i: number) => (
                  <FPersona key={t.id || i} perfil={t.profiles} rol={t.cerro ? 'Técnico · Cerró' : 'Técnico interviniente'} />
                ))}
                {!creadorPerfil && !aprobadorPerfil && tecnicos.length === 0 && (
                  <div style={{ color: '#64748B', fontSize: 12 }}>Sin responsables registrados</div>
                )}
              </div>
            </FSeccion>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
            <div style={{ background: '#FFF', border: '1px solid #D8E2EE', borderRadius: 14, padding: 16 }}>
              <FSeccion titulo="Motivo de intervención">
                <div style={{ fontWeight: 900, fontSize: 14, color: '#0F2A3A', marginBottom: 8 }}>{val(ordenDetalle?.titulo)}</div>
                <div style={{ whiteSpace: 'pre-wrap' as const, lineHeight: 1.6, fontSize: 13, color: '#1F2937' }}>{val(ordenDetalle?.descripcion)}</div>
                {ordenDetalle?.observacion_supervisor && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: '#FFF8E8', borderRadius: 8, fontSize: 12, color: '#854F0B' }}>
                    <strong>Obs. supervisor:</strong> {ordenDetalle.observacion_supervisor}
                  </div>
                )}
              </FSeccion>
            </div>
            <div style={{ background: '#FFF', border: '1px solid #D8E2EE', borderLeft: '6px solid #0B5CAB', borderRadius: 14, padding: 16 }}>
              <FSeccion titulo="Informe técnico de intervención">
                {informeDetalle?.trabajo_detalle
                  ? <div style={{ whiteSpace: 'pre-wrap' as const, lineHeight: 1.75, fontSize: 13.5, color: '#1F2937', textAlign: 'justify' as const }}>{informeDetalle.trabajo_detalle}</div>
                  : <div style={{ color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>Sin informe técnico registrado para esta OT.</div>
                }
              </FSeccion>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { titulo: 'Diagnóstico', value: informeDetalle?.estado_encontrado_detalle || informeDetalle?.causa_detalle || null },
              { titulo: 'Mediciones eléctricas', value: informeDetalle?.mediciones_detalle || [informeDetalle?.tension_entrada && `Tensión entrada: ${informeDetalle.tension_entrada}`, informeDetalle?.tension_salida && `Tensión salida: ${informeDetalle.tension_salida}`, informeDetalle?.corriente && `Corriente: ${informeDetalle.corriente}`].filter(Boolean).join('\n') || null },
              { titulo: 'Condición final', value: activoOperativo ? 'OPERATIVO\nSistema normalizado.' : 'NO OPERATIVO\nRequiere seguimiento.' },
            ].map(({ titulo, value }) => (
              <div key={titulo} style={{ background: '#FFF', border: '1px solid #D8E2EE', borderRadius: 14, padding: 16 }}>
                <FSeccion titulo={titulo}>
                  <div style={{ whiteSpace: 'pre-wrap' as const, fontSize: 13, lineHeight: 1.55, color: '#1F2937', fontWeight: 700 }}>{val(value)}</div>
                </FSeccion>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg,#FFF 0%,#F0FFF7 100%)', border: '1px solid #D8E2EE', borderRadius: 14, padding: 16 }}>
              <FSeccion titulo="Seguridad y riesgos">
                <FInfoLine label="Tipo de riesgo" value={informeDetalle?.riesgo_tipo} />
                <FInfoLine label="Riesgo controlado" value={informeDetalle?.riesgo_controlado === false ? 'NO' : informeDetalle ? 'SÍ' : 'No registrado'} />
                <FInfoLine label="Requiere seguimiento" value={informeDetalle?.requiere_seguimiento ? 'SÍ' : informeDetalle ? 'NO' : 'No registrado'} />
                {informeDetalle?.seguimiento_detalle && <FInfoLine label="Detalle seguimiento" value={informeDetalle.seguimiento_detalle} />}
                {informeDetalle?.observaciones_seguridad && (
                  <div style={{ marginTop: 10, whiteSpace: 'pre-wrap' as const, fontSize: 12, color: '#1F2937' }}>{informeDetalle.observaciones_seguridad}</div>
                )}
              </FSeccion>
            </div>
            <div style={{ background: '#FFF', border: '1px solid #D8E2EE', borderRadius: 14, padding: 16 }}>
              <FSeccion titulo="Materiales y herramientas">
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['#', 'Descripción', 'Cant.', 'Estado'].map(h => (
                        <th key={h} style={{ background: '#0B2A4A', color: 'white', padding: '6px 8px', textAlign: 'left' as const, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materiales.length ? materiales.map((m: any, i: number) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#F8FAFC' : '#FFF' }}>
                        <td style={{ padding: '6px 8px', border: '1px solid #D8E2EE' }}>{i + 1}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #D8E2EE' }}>{m.materiales?.nombre || 'No registrado'}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #D8E2EE' }}>{m.cantidad_entregada ?? m.cantidad_preparada ?? m.cantidad_solicitada ?? m.cantidad ?? '—'} {m.materiales?.unidad || ''}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #D8E2EE' }}>{m.estado || '—'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} style={{ padding: '10px 8px', color: '#94A3B8', fontStyle: 'italic' }}>Sin materiales registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </FSeccion>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#FFF', border: '1px solid #D8E2EE', borderRadius: 14, padding: 16 }}>
              <FSeccion titulo="Derivaciones y relaciones">
                {otMadre ? (
                  <div style={{ padding: '8px 12px', background: '#EEF5FC', borderRadius: 8, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
                    🔗 Derivada de OT-{String(otMadre.numero_orden || '').padStart(5, '0')} · {val(otMadre.titulo)} · {val(otMadre.estado)}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>No es derivada de otra OT</div>
                )}
                {hijas.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#0F2A3A', marginBottom: 6 }}>OTs derivadas generadas:</div>
                    {hijas.map((h: any, i: number) => (
                      <div key={i} style={{ padding: '6px 10px', background: hijasActivas.includes(h) ? '#F0FFF7' : '#F8FAFC', border: `1px solid ${hijasActivas.includes(h) ? '#1D9E75' : '#D8E2EE'}`, borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                        OT-{String(h.numero_orden || '').padStart(5, '0')} · {val(h.estado)} · {fmtFecha(h.created_at)}
                      </div>
                    ))}
                  </>
                )}
                {hijas.length === 0 && !otMadre && (
                  <div style={{ fontSize: 12, color: '#64748B' }}>Sin derivaciones registradas</div>
                )}
              </FSeccion>
            </div>
            <div style={{ background: '#FFF', border: '1px solid #D8E2EE', borderRadius: 14, padding: 16 }}>
              <FSeccion titulo="Observaciones y cierre">
                <FInfoLine label="Aprobado por" value={[aprobadorPerfil?.nombre, aprobadorPerfil?.apellido].filter(Boolean).join(' ')} />
                <FInfoLine label="Fecha aprobación" value={fmt(ordenDetalle?.aprobado_at)} />
                {ordenDetalle?.pendientes_descripcion && <FInfoLine label="Pendientes" value={ordenDetalle.pendientes_descripcion} />}
                {ordenDetalle?.observaciones && (
                  <div style={{ marginTop: 10, whiteSpace: 'pre-wrap' as const, fontSize: 13, lineHeight: 1.6, color: '#1F2937' }}>{ordenDetalle.observaciones}</div>
                )}
              </FSeccion>
            </div>
          </div>

          <div style={{ background: '#FFF', border: '1px solid #D8E2EE', borderRadius: 14, padding: 16 }}>
            <FSeccion titulo="Línea de tiempo">
              <div style={{ display: 'flex', gap: 0, overflowX: 'auto' as const }}>
                {[
                  { label: 'OT generada', fecha: ordenDetalle?.created_at, quien: [creadorPerfil?.nombre, creadorPerfil?.apellido].filter(Boolean).join(' ') },
                  { label: 'Fecha programada', fecha: ordenDetalle?.fecha_programada, quien: ordenDetalle?.ubicacion },
                  { label: 'Inicio', fecha: ordenDetalle?.fecha_inicio, quien: '' },
                  { label: 'Cierre propuesto', fecha: ordenDetalle?.cierre_propuesto_at, quien: [cierrePropuestoPerfil?.nombre, cierrePropuestoPerfil?.apellido].filter(Boolean).join(' ') },
                  { label: 'Aprobada / Cerrada', fecha: ordenDetalle?.aprobado_at || ordenDetalle?.fecha_cierre, quien: [aprobadorPerfil?.nombre, aprobadorPerfil?.apellido].filter(Boolean).join(' ') },
                ].filter(e => e.fecha).map((e, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 120, padding: '0 12px', borderRight: '1px solid #D8E2EE', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#26C6F9', marginBottom: 4 }}>●</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#0F2A3A' }}>{e.label}</div>
                    <div style={{ fontSize: 11, color: '#174A7C', fontWeight: 700 }}>{fmtFecha(e.fecha)}</div>
                    {e.quien && <div style={{ fontSize: 10, color: '#64748B' }}>{e.quien}</div>}
                  </div>
                ))}
              </div>
            </FSeccion>
          </div>

        </div>

        <div style={{ background: '#061B33', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800 }}>
          <span>AUBASA · MECA</span>
          <span>Gestión inteligente de mantenimiento</span>
          <span>Generado automáticamente · {new Date().toLocaleString('es-AR')}</span>
        </div>
      </div>
    </div>
  )
}
export default function Historial() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [ordenDetalle, setOrdenDetalle] = useState<any>(null)
  const [filtros, setFiltros] = useState({
    texto: '',
    sector: 'todos',
    estado: 'todos',
    desde: '',
    hasta: ''
  })
  const [subvista, setSubvista] = useState<'ordenes' | 'checkins'>('ordenes')
  const [checkins, setCheckins] = useState<any[]>([])
  const [loadingCheckins, setLoadingCheckins] = useState(false)
  const [checkinDetalle, setCheckinDetalle] = useState<any>(null)
  const [informeDetalle, setInformeDetalle] = useState<any>(null)
  const [aprobadorPerfil, setAprobadorPerfil] = useState<any>(null)
  const [creadorPerfil, setCreadorPerfil] = useState<any>(null)
  const [cierrePropuestoPerfil, setCierrePropuestoPerfil] = useState<any>(null)
  const [otMadre, setOtMadre] = useState<any>(null)
  const [otHijas, setOtHijas] = useState<any[]>([])

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      setPerfil(p)
      await buscar(filtros, p)
    })
  }, [])

  async function buscar(f: typeof filtros, p?: any) {
    setLoading(true)
    const perfActual = p || perfil

    const { data, error } = await supabase.rpc('get_historial_ordenes', {
      p_sector: f.sector !== 'todos' ? f.sector : null,
      p_estado: f.estado !== 'todos' ? f.estado : null,
      p_desde: f.desde || null,
      p_hasta: f.hasta || null,
      p_texto: f.texto || null
    })

    if (error) {
      console.error('Error cargando historial:', error)
      setOrdenes([])
      setLoading(false)
      return
    }

    setOrdenes(data || [])
    setLoading(false)
  }
async function cargarCheckins() {
    setLoadingCheckins(true)
    const { data } = await supabase
      .from('checkins_herramientas')
      .select('*, profiles!checkins_herramientas_tecnico_id_fkey(nombre)')
      .order('created_at', { ascending: false })
      .limit(100)
    setCheckins(data || [])
    setLoadingCheckins(false)
  }

  async function abrirCheckinDetalle(checkin: any) {
    const { data: items } = await supabase
      .from('checkin_items')
      .select('*')
      .eq('checkin_id', checkin.id)
      .order('created_at')
    setCheckinDetalle({ ...checkin, items: items || [] })
  }
 async function abrirDetalle(orden: any) {
    const { data: tecnicos } = await supabase
      .from('orden_tecnicos')
      .select('*, profiles!orden_tecnicos_tecnico_id_fkey(nombre, apellido, avatar_url, rol, sector_trabajo)')
      .eq('orden_id', orden.id)

    const { data: materiales } = await supabase
      .from('orden_materiales')
      .select('*, materiales!orden_materiales_material_id_fkey(nombre, unidad)')
      .eq('orden_id', orden.id)

    const { data: pedidos } = await supabase
      .from('pedidos_material')
      .select('*')
      .eq('orden_trabajo_id', orden.id)

    const { data: informe } = await supabase
      .from('informes_tecnicos')
      .select('trabajo_detalle, mediciones_detalle, activo_operativo, requiere_seguimiento, seguimiento_detalle, riesgo_tipo, riesgo_controlado, observaciones_seguridad, estado_encontrado, estado_encontrado_detalle, causa_probable, causa_detalle, tension_entrada, tension_salida, corriente, informe_final_tecnico')
      .eq('orden_id', orden.id)
      .maybeSingle()

    const { data: hijas } = await supabase
      .from('ordenes_trabajo')
      .select('numero_orden, titulo, estado, created_at')
      .eq('madre_id', orden.id)

    let madre = null
    if (orden.madre_id) {
      const { data: m } = await supabase
        .from('ordenes_trabajo')
        .select('numero_orden, titulo, estado')
        .eq('id', orden.madre_id)
        .maybeSingle()
      madre = m
    }

    let aprobador = null
    if (orden.aprobado_por) {
      const { data: a } = await supabase
        .from('profiles')
        .select('nombre, apellido, avatar_url, rol')
        .eq('id', orden.aprobado_por)
        .maybeSingle()
      aprobador = a
    }

    let creador = null
    if (orden.creado_por) {
      const { data: c } = await supabase
        .from('profiles')
        .select('nombre, apellido, avatar_url, rol')
        .eq('id', orden.creado_por)
        .maybeSingle()
      creador = c
    }

    let cierrePropuesto = null
    if (orden.cierre_propuesto_por) {
      const { data: cp } = await supabase
        .from('profiles')
        .select('nombre, apellido, avatar_url, rol')
        .eq('id', orden.cierre_propuesto_por)
        .maybeSingle()
      cierrePropuesto = cp
    }

    setInformeDetalle(informe ?? null)
    setAprobadorPerfil(aprobador)
    setCreadorPerfil(creador)
    setCierrePropuestoPerfil(cierrePropuesto)
    setOtMadre(madre)
    setOtHijas(hijas || [])
    setOrdenDetalle({ ...orden, tecnicos: tecnicos || [], materiales: materiales || [], pedidos: pedidos || [] })
  }

  function badgeColor(estado: string) {
    if (estado === 'en_curso') return 'bg-[#3A2A00] text-[#EF9F27]'
    if (estado === 'completada') return 'bg-[#0F2A35] text-[#1ABBD6]'
    if (estado === 'cerrada') return 'bg-[#0F2A1F] text-[#1D9E75]'
    if (estado === 'cancelada') return 'bg-[#2A0F0F] text-[#E24B4A]'
    if (estado === 'derivada') return 'bg-[#1a3040] text-[#4a8fa0]'
    if (estado === 'cierre_propuesto') return 'bg-[#2A1A00] text-[#EF9F27]'
    return 'bg-[#1a3040] text-[#4a8fa0]'
  }

  if (!perfil) return (
    <div className="min-h-screen bg-[#07131a] flex items-center justify-center text-[#1ABBD6]">
      Cargando...
    </div>
  )

  return (
    <main className="min-h-screen bg-[#07131a]">
      <div className="bg-[#0c1c24] px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#1ABBD6] text-sm font-bold">←</button>
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Historial</div>
            <div className="text-[#1ABBD6] text-xs mt-0.5">Órdenes de trabajo</div>
          </div>
        </div>
      </div>

      {ordenDetalle && (
        <div className="fixed inset-0 z-50 bg-black/70 flex flex-col justify-end">
          <div className="bg-[#0c1c24] rounded-t-2xl max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 border-b border-[#1a3040]">
              <div>
                <div className="text-[#4a8fa0] text-xs font-bold tracking-widest uppercase">OT-{String(ordenDetalle.numero_orden).padStart(5, '0')}</div>
                <div className="text-[#e8f4f8] font-bold text-sm">{ordenDetalle.titulo}</div>
              </div>
              <button onClick={() => { setOrdenDetalle(null); setInformeDetalle(null); setAprobadorPerfil(null); setCreadorPerfil(null); setCierrePropuestoPerfil(null); setOtMadre(null); setOtHijas([]) }} className="text-[#4a8fa0] text-xs font-bold">CERRAR</button>
            </div>
            <div className="overflow-y-auto overflow-x-auto flex-1 p-4">
              <FichaTecnicaOT
                ordenDetalle={ordenDetalle}
                informeDetalle={informeDetalle}
                tecnicos={ordenDetalle.tecnicos || []}
                materiales={ordenDetalle.materiales || []}
                hijas={otHijas}
                otMadre={otMadre}
                aprobadorPerfil={aprobadorPerfil}
                creadorPerfil={creadorPerfil}
                cierrePropuestoPerfil={cierrePropuestoPerfil}
              />
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-3">

        <div className="flex gap-2 mb-3">
          <button onClick={() => setSubvista('ordenes')}
            className={`flex-1 text-xs font-bold py-2 rounded-lg ${subvista === 'ordenes' ? 'bg-[#1ABBD6] text-white' : 'bg-[#0c1c24] border border-[#1a3040] text-[#4a8fa0]'}`}>
            ÓRDENES
          </button>
          <button onClick={() => { setSubvista('checkins'); cargarCheckins() }}
            className={`flex-1 text-xs font-bold py-2 rounded-lg ${subvista === 'checkins' ? 'bg-[#1ABBD6] text-white' : 'bg-[#0c1c24] border border-[#1a3040] text-[#4a8fa0]'}`}>
            CHECKINS
          </button>
        </div>

        {checkinDetalle && (
          <div className="fixed inset-0 z-50 bg-black/70 flex flex-col justify-end">
            <div className="bg-[#0c1c24] rounded-t-2xl p-4 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="text-[#4a8fa0] text-xs font-bold tracking-widest uppercase">Checkin · Caja {checkinDetalle.caja?.toUpperCase()}</div>
                  <div className="text-[#e8f4f8] font-bold text-sm">{checkinDetalle.profiles?.nombre}</div>
                  <div className="text-[#4a8fa0] text-xs">{new Date(checkinDetalle.created_at).toLocaleString('es-AR')}</div>
                </div>
                <button onClick={() => setCheckinDetalle(null)} className="text-[#4a8fa0] text-xs font-bold">CERRAR</button>
              </div>
              <div className="overflow-y-auto flex-1">
                {checkinDetalle.items?.length === 0 ? (
                  <div className="text-center text-[#4a8fa0] text-sm py-4">Sin ítems registrados</div>
                ) : checkinDetalle.items?.map((item: any, idx: number) => (
                  <div key={idx} className={`rounded-lg p-3 mb-2 border ${item.estado === 'faltante' ? 'bg-[#2A0F0F] border-[#E24B4A44]' : item.estado === 'ok' ? 'bg-[#0F2A1F] border-[#1D9E7544]' : 'bg-[#2A1A00] border-[#EF9F2744]'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.estado === 'faltante' ? 'bg-[#3A1A1A] text-[#E24B4A]' : item.estado === 'ok' ? 'bg-[#0F2A1F] text-[#1D9E75]' : 'bg-[#3A2A00] text-[#EF9F27]'}`}>
                        {item.estado === 'faltante' ? '❌ FALTANTE' : item.estado === 'ok' ? '✅ OK' : '🔄 REEMPLAZO'}
                      </span>
                      <span className="text-[#4a8fa0] text-xs">×{item.cantidad}</span>
                    </div>
                    <div className="text-[#e8f4f8] text-sm font-medium">{item.detalle}</div>
                    {item.observacion && <div className="text-[#4a8fa0] text-xs mt-1">Obs: {item.observacion}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {subvista === 'checkins' && (
          <div>
            {loadingCheckins ? (
              <div className="text-center text-[#4a8fa0] text-sm py-4">Cargando...</div>
            ) : checkins.length === 0 ? (
              <div className="bg-[#0c1c24] border border-[#1a3040] rounded-xl p-4 text-center text-[#4a8fa0] text-sm">Sin checkins registrados</div>
            ) : checkins.map(c => (
              <div key={c.id} onClick={() => abrirCheckinDetalle(c)}
                className="bg-[#0c1c24] border border-[#1a3040] rounded-xl p-3 mb-2 cursor-pointer active:bg-[#0a1820]">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[#e8f4f8] font-bold text-sm">Caja {c.caja?.toUpperCase()}</div>
                    <div className="text-[#4a8fa0] text-xs">{c.profiles?.nombre}</div>
                    <div className="text-[#4a8fa0] text-xs">{new Date(c.created_at).toLocaleString('es-AR')}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.estado === 'con_faltantes' ? 'bg-[#2A0F0F] text-[#E24B4A]' : c.estado === 'completado' ? 'bg-[#0F2A1F] text-[#1D9E75]' : 'bg-[#1a3040] text-[#4a8fa0]'}`}>
                    {c.estado === 'con_faltantes' ? '⚠️ FALTANTE' : c.estado === 'completado' ? '✅ OK' : c.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {subvista === 'ordenes' && (
        <>
        <input
          className="w-full bg-[#0c1c24] border border-[#1a3040] rounded-xl px-3 py-2 text-sm text-[#e8f4f8] mb-2 outline-none"
          placeholder="Buscar por título, km, ubicación, nomenclatura..."
          value={filtros.texto}
          onChange={e => setFiltros({ ...filtros, texto: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-2 mb-2">
          <select
            className="w-full bg-[#0c1c24] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none"
            value={filtros.sector}
            onChange={e => setFiltros({ ...filtros, sector: e.target.value })}
          >
            <option value="todos">Todos los sectores</option>
            <option value="electrico">Eléctrico</option>
            <option value="ac">AC</option>
            <option value="edificio">Edificio</option>
          </select>
          <select
            className="w-full bg-[#0c1c24] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none"
            value={filtros.estado}
            onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_curso">En curso</option>
            <option value="cierre_propuesto">En revisión</option>
            <option value="completada">Completada</option>
            <option value="cerrada">Cerrada</option>
            <option value="derivada">Derivada</option>
            <option value="cancelada">Cancelada</option>
            <option value="archivada">Archivada</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="date"
            className="w-full bg-[#0c1c24] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none"
            value={filtros.desde}
            onChange={e => setFiltros({ ...filtros, desde: e.target.value })}
          />
          <input
            type="date"
            className="w-full bg-[#0c1c24] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none"
            value={filtros.hasta}
            onChange={e => setFiltros({ ...filtros, hasta: e.target.value })}
          />
        </div>

        <button
          onClick={() => buscar(filtros)}
          disabled={loading}
          className="w-full bg-[#1ABBD6] text-white font-bold text-sm py-2 rounded-xl mb-3 disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'BUSCAR'}
        </button>

        <div className="text-[#4a8fa0] text-xs font-bold tracking-widest uppercase mb-2">
          {ordenes.length} resultado{ordenes.length !== 1 ? 's' : ''}
        </div>

        {ordenes.map(o => (
          <div key={o.id} onClick={() => abrirDetalle(o)} className="bg-[#0c1c24] border border-[#1a3040] rounded-xl p-3 mb-2 cursor-pointer active:bg-[#0a1820]">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-[#4a8fa0] text-xs">OT-{String(o.numero_orden).padStart(5, '0')} · {o.nomenclatura || o.sector}</div>
                <div className="text-[#e8f4f8] font-bold text-sm">{o.titulo}</div>
                {o.km && <div className="text-[#4a8fa0] text-xs mt-0.5">Km {o.km}{o.ubicacion ? ` · ${o.ubicacion}` : ''}</div>}
                {o.fecha_programada && <div className="text-[#4a8fa0] text-xs">{formatFechaAR(o.fecha_programada)}</div>}
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${badgeColor(o.estado)}`}>
                {o.estado}
              </span>
            </div>
          </div>
        ))}

        <div className="h-24"></div>
        </>
        )}
      </div>
    </main>
  )
}