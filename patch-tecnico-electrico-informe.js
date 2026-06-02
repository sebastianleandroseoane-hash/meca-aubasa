const fs = require('fs')
const path = require('path')

const filePath = path.join(process.cwd(), 'app', 'dashboard', 'tecnico-electrico', 'page.tsx')

if (!fs.existsSync(filePath)) {
  console.error('ERROR: No se encontró el archivo en:', filePath)
  process.exit(1)
}

let content = fs.readFileSync(filePath, 'utf8')
const original = content

// ============================================================
// PATCH 1: Agregar estados React del informe técnico
// ============================================================

const ANCHOR_ESTADOS = `  const [recepcionMarcada, setRecepcionMarcada] = useState<Record<string, boolean>>({})
  const [showConfirmRecepcion, setShowConfirmRecepcion] = useState(false)`

const NUEVOS_ESTADOS = `  const [recepcionMarcada, setRecepcionMarcada] = useState<Record<string, boolean>>({})
  const [showConfirmRecepcion, setShowConfirmRecepcion] = useState(false)

  // Informe técnico estructurado
  const [itEstadoEncontrado, setItEstadoEncontrado] = useState('')
  const [itCausaProbable, setItCausaProbable] = useState('')
  const [itCausaDetalle, setItCausaDetalle] = useState('')
  const [itTrabajoRealizado, setItTrabajoRealizado] = useState('')
  const [itTrabajoDetalle, setItTrabajoDetalle] = useState('')
  const [itActivoOperativo, setItActivoOperativo] = useState<boolean | null>(null)
  const [itRequiereSeguimiento, setItRequiereSeguimiento] = useState(false)
  const [itSeguimientoDetalle, setItSeguimientoDetalle] = useState('')
  const [itRiesgoTipo, setItRiesgoTipo] = useState('ninguno')
  const [itRequiereCorte, setItRequiereCorte] = useState(false)
  const [itRequiereBalizamiento, setItRequiereBalizamiento] = useState(false)
  const [itRequiereHidrogrua, setItRequiereHidrogrua] = useState(false)
  const [itRequiereConsignacion, setItRequiereConsignacion] = useState(false)
  const [itRiesgoControlado, setItRiesgoControlado] = useState(true)
  const [itObservacionesSeguridad, setItObservacionesSeguridad] = useState('')
  const [itTensionEntrada, setItTensionEntrada] = useState('')
  const [itTensionSalida, setItTensionSalida] = useState('')
  const [itCorriente, setItCorriente] = useState('')
  const [itMedicionesDetalle, setItMedicionesDetalle] = useState('')`

if (!content.includes(ANCHOR_ESTADOS)) {
  console.error('ERROR PATCH 1: No se encontró el anchor de estados.')
  process.exit(1)
}
content = content.replace(ANCHOR_ESTADOS, NUEVOS_ESTADOS)
console.log('✅ PATCH 1: Estados React agregados')

// ============================================================
// PATCH 2: Reemplazar función proponerCierre + agregar resetInforme
// ============================================================

const FUNCION_VIEJA = `  async function proponerCierre(id: string) {
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
  }`

const FUNCION_NUEVA = `  function resetInforme() {
    setTrabajosRealizados('')
    setMediciones('')
    setPendientes('')
    setItEstadoEncontrado('')
    setItCausaProbable('')
    setItCausaDetalle('')
    setItTrabajoRealizado('')
    setItTrabajoDetalle('')
    setItActivoOperativo(null)
    setItRequiereSeguimiento(false)
    setItSeguimientoDetalle('')
    setItRiesgoTipo('ninguno')
    setItRequiereCorte(false)
    setItRequiereBalizamiento(false)
    setItRequiereHidrogrua(false)
    setItRequiereConsignacion(false)
    setItRiesgoControlado(true)
    setItObservacionesSeguridad('')
    setItTensionEntrada('')
    setItTensionSalida('')
    setItCorriente('')
    setItMedicionesDetalle('')
  }

  async function proponerCierre(id: string) {
    // Guards de validación
    if (loading) return
    if (!itTrabajoDetalle) return
    if (itActivoOperativo === null) { alert('Indicá si el activo quedó operativo.'); return }
    if (itRiesgoTipo !== 'ninguno' && !itObservacionesSeguridad) {
      alert('Completá las observaciones de seguridad antes de enviar.')
      return
    }

    setLoading(true)

    // Armar texto fallback para ordenes_trabajo (compatibilidad supervisor actual)
    const fallbackTrabajos = [
      itTrabajoRealizado ? \`[\${itTrabajoRealizado.toUpperCase()}]\` : '',
      itTrabajoDetalle,
    ].filter(Boolean).join(' — ')

    const fallbackMediciones = [
      itTensionEntrada ? \`Entrada: \${itTensionEntrada}V\` : '',
      itTensionSalida  ? \`Salida: \${itTensionSalida}V\`  : '',
      itCorriente      ? \`Corriente: \${itCorriente}A\`   : '',
      itMedicionesDetalle,
    ].filter(Boolean).join(' / ')

    const fallbackPendientes = itRequiereSeguimiento ? itSeguimientoDetalle : ''

    // Bloque informe técnico estructurado
    if (!ordenDetalle.activo_id) {
      // OT sin activo: alerta visible, se continúa solo con fallback
      alert('Esta OT no tiene activo asignado. Informá al supervisor. El cierre se registra sin informe estructurado.')
    } else {
      // Detectar si es repropuesta
      const esRepropuesta = ordenDetalle.estado === 'devuelta_supervisor'
      const { data: informeExistente } = await supabase
        .from('informes_tecnicos')
        .select('id, estado_informe, version')
        .eq('orden_id', id)
        .in('estado_informe', ['observado', 'rechazado'])
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      const tieneInformeDevuelto = !!informeExistente
      const camposInforme = {
        estado_encontrado:       itEstadoEncontrado || null,
        causa_probable:          itCausaProbable    || null,
        causa_detalle:           itCausaDetalle     || null,
        trabajo_realizado:       itTrabajoRealizado || null,
        trabajo_detalle:         itTrabajoDetalle,
        activo_operativo:        itActivoOperativo,
        requiere_seguimiento:    itRequiereSeguimiento,
        seguimiento_detalle:     itSeguimientoDetalle   || null,
        riesgo_tipo:             itRiesgoTipo,
        requiere_corte:          itRequiereCorte,
        requiere_balizamiento:   itRequiereBalizamiento,
        requiere_hidrogrua:      itRequiereHidrogrua,
        requiere_consignacion:   itRequiereConsignacion,
        riesgo_controlado:       itRiesgoControlado,
        observaciones_seguridad: itObservacionesSeguridad || null,
        tension_entrada:         itTensionEntrada ? parseFloat(itTensionEntrada) : null,
        tension_salida:          itTensionSalida  ? parseFloat(itTensionSalida)  : null,
        corriente:               itCorriente      ? parseFloat(itCorriente)      : null,
        mediciones_detalle:      itMedicionesDetalle || null,
      }

      if (esRepropuesta || tieneInformeDevuelto) {
        // FLUJO NUEVA VERSIÓN
        const { data: nuevoId, error: errVersion } = await supabase
          .rpc('crear_nueva_version_informe', { p_orden_id: id })
        if (errVersion || !nuevoId) {
          console.error('Error al crear nueva versión del informe:', errVersion)
        } else {
          const { error: errUpdate } = await supabase
            .from('informes_tecnicos')
            .update(camposInforme)
            .eq('id', nuevoId)
          if (errUpdate) {
            console.error('Error al actualizar nueva versión:', errUpdate)
          } else {
            const { error: errRpc } = await supabase
              .rpc('presentar_informe', { p_informe_id: nuevoId })
            if (errRpc) console.error('Error al presentar informe (nueva versión):', errRpc)
          }
        }
      } else {
        // FLUJO INSERT NUEVO (primera vez) — version la asigna PostgreSQL por default
        const { data: inf, error: errInf } = await supabase
          .from('informes_tecnicos')
          .insert({
            orden_id:       id,
            activo_id:      ordenDetalle.activo_id,
            tecnico_id:     perfil.id,
            estado_informe: 'borrador',
            creado_por:     perfil.id,
            ...camposInforme,
          })
          .select('id')
          .single()
        if (errInf || !inf) {
          console.error('Error al insertar informe técnico:', errInf)
        } else {
          const { error: errRpc } = await supabase
            .rpc('presentar_informe', { p_informe_id: inf.id })
          if (errRpc) console.error('Error al presentar informe (nuevo):', errRpc)
        }
      }
    }

    // Actualizar ordenes_trabajo — igual que hoy, siempre
    await supabase
      .from('ordenes_trabajo')
      .update({
        estado:                 'cierre_propuesto',
        trabajos_realizados:    fallbackTrabajos,
        mediciones:             fallbackMediciones || null,
        pendientes_descripcion: fallbackPendientes || null,
        cierre_propuesto_at:    new Date().toISOString(),
        cierre_propuesto_por:   perfil.id,
        observacion_supervisor: null,
        devuelto_por:           null,
        devuelto_at:            null,
      })
      .eq('id', id)
      .in('estado', ['en_curso', 'devuelta_supervisor'])

    // DEUDA: cerro=true significa "intervención finalizada", no "OT cerrada". Revisar al implementar supervisor.
    await supabase.from('orden_tecnicos').update({ cerro: true }).eq('orden_id', id).eq('tecnico_id', perfil.id)

    setLoading(false)
    setShowCierre(false)
    resetInforme()
    setOrdenDetalle(null)
    await cargarOrdenes(perfil.id)
  }`

if (!content.includes(FUNCION_VIEJA)) {
  console.error('ERROR PATCH 2: No se encontró la función proponerCierre original.')
  process.exit(1)
}
content = content.replace(FUNCION_VIEJA, FUNCION_NUEVA)
console.log('✅ PATCH 2: Función proponerCierre + resetInforme reemplazadas')

// ============================================================
// PATCH 3: Reemplazar bloque JSX de las 3 textareas
// ============================================================

const JSX_VIEJO = `              {showCierre && (
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
                    style={{ width: '100%', background: '#07131a', border: \`1px solid \${pendientes ? '#EF9F27' : '#1a3040'}\`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                    rows={2} placeholder="Describí qué quedó sin resolver..." value={pendientes} onChange={e => setPendientes(e.target.value)} />
                  {pendientes.length > 0 && (
                    <div style={{ fontSize: 11, color: '#EF9F27', marginTop: 4 }}>⚠️ El supervisor revisará los trabajos pendientes informados</div>
                  )}
                </div>
              )}`

const JSX_NUEVO = `              {showCierre && (
                <div style={{ marginBottom: 10 }}>

                  {/* Alerta: OT sin activo */}
                  {!ordenDetalle.activo_id && (
                    <div style={{ background: '#2A1A00', border: '1px solid #EF9F2788', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#EF9F27', fontWeight: 700 }}>⚠️ Esta OT no tiene activo asignado. Informá al supervisor.</div>
                      <div style={{ fontSize: 11, color: '#b0c4ce', marginTop: 4 }}>El cierre se registrará sin informe técnico estructurado.</div>
                    </div>
                  )}

                  {/* SECCIÓN: Diagnóstico */}
                  <div style={{ fontSize: 10, color: '#1ABBD6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4, fontWeight: 700 }}>Diagnóstico</div>

                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Estado encontrado</div>
                  <select value={itEstadoEncontrado} onChange={e => setItEstadoEncontrado(e.target.value)}
                    style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: itEstadoEncontrado ? '#e8f4f8' : '#4a8fa0', marginBottom: 8, outline: 'none' }}>
                    <option value=''>Seleccioná...</option>
                    <option value='operativo'>Operativo</option>
                    <option value='falla_parcial'>Falla parcial</option>
                    <option value='falla_total'>Falla total</option>
                    <option value='sin_tension'>Sin tensión</option>
                    <option value='intervenido'>Intervenido / vandalisado</option>
                  </select>

                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Causa probable</div>
                  <select value={itCausaProbable} onChange={e => setItCausaProbable(e.target.value)}
                    style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: itCausaProbable ? '#e8f4f8' : '#4a8fa0', marginBottom: 8, outline: 'none' }}>
                    <option value=''>Seleccioná...</option>
                    <option value='sobrecarga'>Sobrecarga</option>
                    <option value='falla_aislacion'>Falla de aislación</option>
                    <option value='vandalismo'>Vandalismo</option>
                    <option value='desgaste'>Desgaste</option>
                    <option value='desconocida'>Desconocida</option>
                    <option value='otro'>Otro</option>
                  </select>

                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Detalle causa (opcional)</div>
                  <textarea value={itCausaDetalle} onChange={e => setItCausaDetalle(e.target.value)}
                    style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                    rows={2} placeholder="Descripción adicional de la causa..." />

                  {/* SECCIÓN: Trabajo */}
                  <div style={{ fontSize: 10, color: '#1ABBD6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4, fontWeight: 700 }}>Trabajo realizado</div>

                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tipo de trabajo</div>
                  <select value={itTrabajoRealizado} onChange={e => setItTrabajoRealizado(e.target.value)}
                    style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: itTrabajoRealizado ? '#e8f4f8' : '#4a8fa0', marginBottom: 8, outline: 'none' }}>
                    <option value=''>Seleccioná...</option>
                    <option value='reemplazo'>Reemplazo</option>
                    <option value='reparacion'>Reparación</option>
                    <option value='ajuste'>Ajuste</option>
                    <option value='limpieza'>Limpieza</option>
                    <option value='revision'>Revisión</option>
                    <option value='otro'>Otro</option>
                  </select>

                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Detalle del trabajo *</div>
                  <textarea value={itTrabajoDetalle} onChange={e => setItTrabajoDetalle(e.target.value)}
                    style={{ width: '100%', background: '#07131a', border: \`1px solid \${itTrabajoDetalle ? '#1ABBD6' : '#1a3040'}\`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                    rows={3} placeholder="Describí exactamente qué hiciste..." />

                  {/* SECCIÓN: Resultado */}
                  <div style={{ fontSize: 10, color: '#1ABBD6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4, fontWeight: 700 }}>Resultado</div>

                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>¿Quedó operativo? *</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button onClick={() => setItActivoOperativo(true)}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: itActivoOperativo === true ? '#1D9E75' : '#1a3040', color: itActivoOperativo === true ? 'white' : '#4a8fa0' }}>
                      ✅ SÍ
                    </button>
                    <button onClick={() => setItActivoOperativo(false)}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: itActivoOperativo === false ? '#A32D2D' : '#1a3040', color: itActivoOperativo === false ? 'white' : '#4a8fa0' }}>
                      ❌ NO
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <button onClick={() => setItRequiereSeguimiento(!itRequiereSeguimiento)}
                      style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', background: itRequiereSeguimiento ? '#EF9F27' : '#1a3040', color: itRequiereSeguimiento ? '#0D0D0D' : '#4a8fa0' }}>
                      {itRequiereSeguimiento ? '⚠️ SEGUIMIENTO' : 'Sin seguimiento'}
                    </button>
                    <span style={{ fontSize: 11, color: '#4a8fa0' }}>¿Requiere revisión posterior?</span>
                  </div>
                  {itRequiereSeguimiento && (
                    <textarea value={itSeguimientoDetalle} onChange={e => setItSeguimientoDetalle(e.target.value)}
                      style={{ width: '100%', background: '#07131a', border: '1px solid #EF9F2788', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                      rows={2} placeholder="Describí qué requiere seguimiento..." />
                  )}

                  {/* SECCIÓN: Seguridad */}
                  <div style={{ fontSize: 10, color: '#1ABBD6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4, fontWeight: 700 }}>Seguridad</div>

                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Riesgo detectado</div>
                  <select value={itRiesgoTipo} onChange={e => setItRiesgoTipo(e.target.value)}
                    style={{ width: '100%', background: '#07131a', border: \`1px solid \${itRiesgoTipo !== 'ninguno' ? '#EF9F27' : '#1a3040'}\`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', marginBottom: 8, outline: 'none' }}>
                    <option value='ninguno'>Sin riesgo</option>
                    <option value='electrico'>Eléctrico</option>
                    <option value='altura'>Altura</option>
                    <option value='transito'>Tránsito</option>
                    <option value='terceros'>Terceros</option>
                    <option value='mecanico'>Mecánico</option>
                    <option value='ambiental'>Ambiental</option>
                    <option value='estructural'>Estructural</option>
                    <option value='otro'>Otro</option>
                  </select>

                  {itRiesgoTipo !== 'ninguno' && (
                    <>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {[
                          { key: 'itRequiereCorte', label: 'Corte', val: itRequiereCorte, set: setItRequiereCorte },
                          { key: 'itRequiereBalizamiento', label: 'Balizamiento', val: itRequiereBalizamiento, set: setItRequiereBalizamiento },
                          { key: 'itRequiereHidrogrua', label: 'Hidrogrúa', val: itRequiereHidrogrua, set: setItRequiereHidrogrua },
                          { key: 'itRequiereConsignacion', label: 'Consignación', val: itRequiereConsignacion, set: setItRequiereConsignacion },
                        ].map(({ key, label, val, set }) => (
                          <button key={key} onClick={() => set(!val)}
                            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer', background: val ? '#EF9F27' : '#1a3040', color: val ? '#0D0D0D' : '#4a8fa0' }}>
                            {val ? '✅' : '○'} {label}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <button onClick={() => setItRiesgoControlado(!itRiesgoControlado)}
                          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', background: itRiesgoControlado ? '#1D9E75' : '#A32D2D', color: 'white' }}>
                          {itRiesgoControlado ? '✅ Controlado' : '❌ No controlado'}
                        </button>
                        <span style={{ fontSize: 11, color: '#4a8fa0' }}>¿El riesgo quedó controlado?</span>
                      </div>

                      <div style={{ fontSize: 10, color: '#EF9F27', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Observaciones de seguridad *</div>
                      <textarea value={itObservacionesSeguridad} onChange={e => setItObservacionesSeguridad(e.target.value)}
                        style={{ width: '100%', background: '#07131a', border: \`1px solid \${itObservacionesSeguridad ? '#EF9F27' : '#A32D2D'}\`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                        rows={2} placeholder="Describí el riesgo y cómo quedó..." />
                    </>
                  )}

                  {/* SECCIÓN: Mediciones */}
                  <div style={{ fontSize: 10, color: '#1ABBD6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4, fontWeight: 700 }}>Mediciones (opcional)</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#4a8fa0', marginBottom: 4 }}>Entrada (V)</div>
                      <input type='number' value={itTensionEntrada} onChange={e => setItTensionEntrada(e.target.value)}
                        style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', boxSizing: 'border-box' }}
                        placeholder='220' />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#4a8fa0', marginBottom: 4 }}>Salida (V)</div>
                      <input type='number' value={itTensionSalida} onChange={e => setItTensionSalida(e.target.value)}
                        style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', boxSizing: 'border-box' }}
                        placeholder='220' />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#4a8fa0', marginBottom: 4 }}>Corriente (A)</div>
                      <input type='number' value={itCorriente} onChange={e => setItCorriente(e.target.value)}
                        style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', boxSizing: 'border-box' }}
                        placeholder='12' />
                    </div>
                  </div>

                  <textarea value={itMedicionesDetalle} onChange={e => setItMedicionesDetalle(e.target.value)}
                    style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 4 }}
                    rows={2} placeholder="Otras mediciones, aislación, etc..." />

                </div>
              )}`

if (!content.includes(JSX_VIEJO)) {
  console.error('ERROR PATCH 3: No se encontró el bloque JSX de las 3 textareas.')
  process.exit(1)
}
content = content.replace(JSX_VIEJO, JSX_NUEVO)
console.log('✅ PATCH 3: Formulario JSX reemplazado')

// ============================================================
// PATCH 4: Actualizar condición disabled del botón enviar
// ============================================================

const BTN_VIEJO = `                  <button onClick={() => proponerCierre(ordenDetalle.id)} disabled={loading || !trabajosRealizados}
                    style={{ flex: 1, background: loading || !trabajosRealizados ? '#1a3040' : '#1D9E75', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>`

const BTN_NUEVO = `                  <button onClick={() => proponerCierre(ordenDetalle.id)} disabled={loading || !itTrabajoDetalle || itActivoOperativo === null}
                    style={{ flex: 1, background: loading || !itTrabajoDetalle || itActivoOperativo === null ? '#1a3040' : '#1D9E75', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>`

if (!content.includes(BTN_VIEJO)) {
  console.error('ERROR PATCH 4: No se encontró el botón ENVIAR AL SUPERVISOR.')
  process.exit(1)
}
content = content.replace(BTN_VIEJO, BTN_NUEVO)
console.log('✅ PATCH 4: Condición disabled del botón actualizada')

// ============================================================
// Verificación final
// ============================================================

if (content === original) {
  console.error('ERROR: El archivo no cambió.')
  process.exit(1)
}

// Verificar que los dos cambios específicos están presentes
if (!content.includes('if (loading) return')) {
  console.error('ERROR VERIFICACIÓN: Guard "if (loading) return" no encontrado en el resultado.')
  process.exit(1)
}
if (content.includes('version:    1,')) {
  console.error('ERROR VERIFICACIÓN: "version: 1" todavía presente en el resultado.')
  process.exit(1)
}

console.log('✅ VERIFICACIÓN: if (loading) return → presente')
console.log('✅ VERIFICACIÓN: version: 1 → eliminado')

fs.writeFileSync(filePath, content, 'utf8')
console.log('')
console.log('✅ TODOS LOS PATCHES APLICADOS CORRECTAMENTE')
console.log('Archivo modificado:', filePath)
