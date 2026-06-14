'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'
import AvatarUpload from '@/app/components/AvatarUpload'
import BibliotecaCard from '@/app/components/BibliotecaCard'
import ComentariosOT from '@/app/components/ComentariosOT'
import FotosOT from '@/app/components/FotosOT'

function DashboardTecnicoElectricoInner() {
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
  const [showDevolucion, setShowDevolucion] = useState<string | null>(null)
  const [devCantidad, setDevCantidad] = useState<number>(0)
  const [devMotivo, setDevMotivo] = useState<string>('devolucion')
  const [devNovedad, setDevNovedad] = useState<string>('')
  const [loadingDevolucion, setLoadingDevolucion] = useState(false)
  const [memoriaActivo, setMemoriaActivo] = useState<any>(null)
  const [loadingMemoria, setLoadingMemoria] = useState(false)
  const [showMemoria, setShowMemoria] = useState(false)
  const [errorMemoria, setErrorMemoria] = useState('')
 

  const [recepcionMarcada, setRecepcionMarcada] = useState<Record<string, boolean>>({})
  const [showConfirmRecepcion, setShowConfirmRecepcion] = useState(false)

  // Informe técnico estructurado
  const [itEstadoEncontrado, setItEstadoEncontrado] = useState('')
  const [itCausaProbable, setItCausaProbable] = useState('')
  const [itCausaDetalle, setItCausaDetalle] = useState('')
  const [itTrabajoRealizado, setItTrabajoRealizado] = useState('')
  const [itTrabajoDetalle, setItTrabajoDetalle] = useState('')
  const [itActivoOperativo, setItActivoOperativo] = useState<boolean | null>(null)
  const [itConformidad, setItConformidad] = useState(false)
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
  const [itMedicionesDetalle, setItMedicionesDetalle] = useState('')

  // Modo auditoría — searchParams no va en deps del useEffect: se lee una sola vez al montar
  const searchParams = useSearchParams()
  const [modoAuditoria, setModoAuditoria] = useState(false)
  const [tecnicosDisponibles, setTecnicosDisponibles] = useState<any[]>([])
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<any>(null)

  // Asistente IA
  const [iaTextoLibre, setIaTextoLibre]   = useState('')
  const [loadingIA, setLoadingIA]         = useState(false)
  const [escuchandoIA, setEscuchandoIA]   = useState(false)
  const [soportaVoz, setSoportaVoz]       = useState(false)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'tecnico_electrico' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }

      if (p.rol === 'jefe' || p.rol === 'superadmin') {
        setModoAuditoria(true)
        setPerfil(p)
        // grupo incluido porque cargarSupervisor lo necesita
        const { data: tecnicos } = await supabase
          .from('profiles')
          .select('id, nombre, apellido, turno, grupo')
          .eq('rol', 'tecnico_electrico')
          .eq('activo', true)
          .order('apellido', { ascending: true })
        setTecnicosDisponibles(tecnicos || [])
        // Si viene ?tecnico_id= en URL, seleccionarlo directo
        const tecId = searchParams.get('tecnico_id')
        if (tecId && tecnicos) {
          const tec = tecnicos.find((t: any) => t.id === tecId)
          if (tec) {
            setTecnicoSeleccionado(tec)
            await Promise.all([cargarOrdenes(tec.id), cargarSupervisor(tec)])
          }
        }
      } else {
        // Técnico normal: sin cambios
        setPerfil(p)
        await Promise.all([cargarOrdenes(p.id), cargarSupervisor(p)])
      }
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

  useEffect(() => {
    setSoportaVoz(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
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

  

  async function proponerDevolucion(ordenMaterialId: string) {
    if (loadingDevolucion) return
    setLoadingDevolucion(true)
    const { error } = await supabase.rpc('proponer_devolucion', {
      p_orden_material_id: ordenMaterialId,
      p_cantidad_devuelta: devCantidad,
      p_motivo_cierre: devMotivo,
      p_novedad: devNovedad || null
    })
    setLoadingDevolucion(false)
    if (error) { alert(error.message || 'Error al proponer devolución'); return }
    setShowDevolucion(null)
    setDevCantidad(0)
    setDevMotivo('devolucion')
    setDevNovedad('')
    if (ordenDetalle) await abrirDetalle(ordenDetalle)
  }

  async function cerrarComoConsumido(ordenMaterialId: string) {
    if (loadingDevolucion) return
    setLoadingDevolucion(true)
    const { error } = await supabase.rpc('proponer_devolucion', {
      p_orden_material_id: ordenMaterialId,
      p_cantidad_devuelta: 0,
      p_motivo_cierre: 'consumido',
      p_novedad: null
    })
    setLoadingDevolucion(false)
    if (error) { alert(error.message || 'Error al cerrar como consumido'); return }
    if (ordenDetalle) await abrirDetalle(ordenDetalle)
  }

  async function confirmarRecepcionLote() {
    if (!ordenDetalle) return
    const entregados = ordenDetalle.materiales.filter((m: any) => m.estado === 'entregado' && recepcionMarcada[m.id])
    const ahora = new Date().toISOString()
    for (const m of entregados) {
      await supabase.from('orden_materiales').update({
        estado: 'recibido',
        recibido_por: perfil.id,
        recibido_at: ahora,
        observacion_tecnico: obsRecepcion[m.id] || null
      }).eq('id', m.id).eq('estado', 'entregado')
    }
    setShowConfirmRecepcion(false)
    setRecepcionMarcada({})
    setObsRecepcion({})
    await abrirDetalle(ordenDetalle)
  }

  async function abrirDetalle(orden: any) {
    const { data: tecnicos } = await supabase.from('orden_tecnicos')
      .select('*, profiles!orden_tecnicos_tecnico_id_fkey(nombre, apellido, rol)').eq('orden_id', orden.id)
    const { data: materiales } = await supabase.from('orden_materiales')
      .select('id, cantidad, cantidad_preparada, estado, entregado_at, recibido_por, recibido_at, observacion_tecnico, materiales!orden_materiales_material_id_fkey(nombre, unidad, tipo)').eq('orden_id', orden.id)
    const { data: pedidos } = await supabase.from('pedidos_material').select('*').eq('orden_trabajo_id', orden.id)
    setOrdenDetalle({ ...orden, tecnicos: tecnicos || [], materiales: materiales || [], pedidos: pedidos || [] })
  }

  async function cargarMemoriaActivo(activo_id: string) {
    if (loadingMemoria) return
    setErrorMemoria('')
    setLoadingMemoria(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setErrorMemoria('Sesion no valida'); setLoadingMemoria(false); return }
      const res = await fetch('/api/memoria-activo', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token }, body: JSON.stringify({ activo_id }) })
      const data = await res.json()
      if (!res.ok) { setErrorMemoria(data?.error || 'Error al cargar el historial'); setMemoriaActivo(null) } else { setMemoriaActivo(data) }
    } catch (e) { setErrorMemoria('No se pudo cargar el historial del activo'); setMemoriaActivo(null) }
    setLoadingMemoria(false)
  }

  async function iniciarOrden(id: string) {
    await supabase.from('ordenes_trabajo').update({ estado: 'en_curso', fecha_inicio: new Date().toISOString() }).eq('id', id)
    await cargarOrdenes(perfil.id)
    setOrdenDetalle(null)
  }

 function iniciarDictadoIA() {
    if (escuchandoIA) return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'es-AR'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => setEscuchandoIA(true)
    rec.onend   = () => setEscuchandoIA(false)
    rec.onerror = () => setEscuchandoIA(false)
    rec.onresult = (e: any) => {
      const texto = e.results[0][0].transcript
      setIaTextoLibre(prev => (prev.trim() ? prev.trim() + ' ' + texto : texto))
    }
    rec.start()
  }

 async function generarBorradorIA() {
    if (loadingIA || iaTextoLibre.trim().length < 10) return
    if (!ordenDetalle) { alert('No hay OT seleccionada.'); return }
    setLoadingIA(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { alert('Sesión no válida. Recargá la página.'); return }

      const res = await fetch('/api/generar-borrador-informe', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({
          textoLibre: iaTextoLibre,
          ot: {
            id:            ordenDetalle.id,
            numero_orden:  ordenDetalle.numero_orden  ?? undefined,
            titulo:        ordenDetalle.titulo        ?? undefined,
            tipo:          ordenDetalle.tipo          ?? undefined,
            descripcion:   ordenDetalle.descripcion   ?? undefined,
            prioridad:     ordenDetalle.prioridad     ?? undefined,
            km:            ordenDetalle.km            ?? undefined,
            ubicacion:     ordenDetalle.ubicacion     ?? undefined,
            activo_nombre: ordenDetalle.activo_nombre ?? undefined,
            activo_tipo:   ordenDetalle.activo_tipo   ?? undefined,
            tecnicos: ordenDetalle.tecnicos
              ? ordenDetalle.tecnicos.map((t: any) => (t.profiles?.apellido && t.profiles?.nombre ? t.profiles.apellido + ', ' + t.profiles.nombre : null)).filter(Boolean)
              : [],
            materiales: ordenDetalle.materiales
              ? ordenDetalle.materiales.filter((m: any) => m.estado === 'entregado').map((m: any) => ({ nombre: m.materiales?.nombre ?? '', cantidad: m.cantidad ?? 0, unidad: m.materiales?.unidad ?? '' }))
              : [],
          },
        }),
      })

      const json = await res.json()

      if (!json.ok) {
        alert('Error al generar borrador: ' + (json.error ?? 'Error desconocido'))
        return
      }

      const b = json.borrador

      // Volcar el borrador en los campos del formulario
      if (b.estado_encontrado)     setItEstadoEncontrado(b.estado_encontrado)
      if (b.causa_probable)        setItCausaProbable(b.causa_probable)
      if (b.causa_detalle)         setItCausaDetalle(b.causa_detalle)
      if (b.trabajo_realizado)     setItTrabajoRealizado(b.trabajo_realizado)
      if (b.trabajo_detalle)       setItTrabajoDetalle(b.trabajo_detalle)
      if (b.activo_operativo !== null) setItActivoOperativo(b.activo_operativo)
      setItRequiereSeguimiento(!!b.requiere_seguimiento)
      if (b.seguimiento_detalle)   setItSeguimientoDetalle(b.seguimiento_detalle)
      if (b.riesgo_tipo)           setItRiesgoTipo(b.riesgo_tipo)
      setItRiesgoControlado(b.riesgo_controlado ?? true)
      if (b.observaciones_seguridad) setItObservacionesSeguridad(b.observaciones_seguridad)
      // tension/corriente vienen como number|null — convertir a string para los inputs
      setItTensionEntrada(b.tension_entrada != null ? String(b.tension_entrada) : '')
      setItTensionSalida(b.tension_salida   != null ? String(b.tension_salida)  : '')
      setItCorriente(b.corriente            != null ? String(b.corriente)        : '')
      if (b.mediciones_detalle)    setItMedicionesDetalle(b.mediciones_detalle)

      // Mostrar advertencias si las hay
      if (json.advertencias?.length > 0) {
        const msgs = json.advertencias.join(' | ')
        alert('Borrador generado con observaciones: ' + msgs)
      }

    } catch (err) {
      console.error('[generarBorradorIA]', err)
      alert('Error de conexión al generar el borrador. Intentá de nuevo.')
    } finally {
      setLoadingIA(false)
    }
  }

 function resetInforme() {
    setTrabajosRealizados('')
    setMediciones('')
    setPendientes('')
    setItEstadoEncontrado('')
    setItCausaProbable('')
    setItCausaDetalle('')
    setItTrabajoRealizado('')
    setItTrabajoDetalle('')
    setItActivoOperativo(null)
    setItConformidad(false)
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
    if (loading) return
    if (!itTrabajoDetalle) return
    if (itActivoOperativo === null) { alert('Indicá si el activo quedó operativo.'); return }
    if (itRiesgoTipo !== 'ninguno' && !itObservacionesSeguridad) {
      alert('Completá las observaciones de seguridad antes de enviar.')
      return
    }

    setLoading(true)

    const fallbackTrabajos = [
      itTrabajoRealizado ? `[${itTrabajoRealizado.toUpperCase()}]` : '',
      itTrabajoDetalle,
    ].filter(Boolean).join(' — ')

    const fallbackMediciones = [
      itTensionEntrada ? `Entrada: ${itTensionEntrada}V` : '',
      itTensionSalida  ? `Salida: ${itTensionSalida}V`  : '',
      itCorriente      ? `Corriente: ${itCorriente}A`   : '',
      itMedicionesDetalle,
    ].filter(Boolean).join(' / ')

    const fallbackPendientes = itRequiereSeguimiento ? itSeguimientoDetalle : ''

    if (!ordenDetalle.activo_id) {
      alert('Esta OT no tiene activo asignado. Informá al supervisor. El cierre se registra sin informe estructurado.')
    } else {
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
    { label: 'Combustible', sub: 'Cargas de flota', key: 'combustible', path: '/cargas-combustible', active: true },
    { label: 'Calculadora', sub: 'Próximamente', key: 'calculadora', path: '', active: false },
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#07131a', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#e8f4f8' }}>

      {/* HEADER */}
      <div style={{ background: '#0c1c24', borderBottom: '1px solid #1a3040', padding: '12px 16px' }}>

        {/* Banner modo auditoría */}
        {modoAuditoria && (
          <div style={{ background: '#3A2A00', border: '1px solid #EF9F27', borderRadius: 8, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#EF9F27', fontWeight: 700 }}>
              👁 MODO AUDITORÍA · {perfil.nombre} {perfil.apellido}
            </span>
            <select
              value={tecnicoSeleccionado?.id || ''}
              onChange={async e => {
                const tec = tecnicosDisponibles.find((t: any) => t.id === e.target.value)
                if (!tec) return
                setTecnicoSeleccionado(tec)
                setOrdenes([])
                setOrdenActiva(null)
                setOrdenDetalle(null)
                setShowCierre(false)
                setShowMemoria(false)
                setMemoriaActivo(null)
                setErrorMemoria('')
                resetInforme()
                await Promise.all([cargarOrdenes(tec.id), cargarSupervisor(tec)])
              }}
              style={{ background: '#07131a', border: '1px solid #EF9F27', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#e8f4f8', outline: 'none' }}
            >
              <option value=''>— Seleccionar técnico —</option>
              {tecnicosDisponibles.map((t: any) => (
                <option key={t.id} value={t.id}>{t.apellido}, {t.nombre} · T{t.turno}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AvatarUpload
              perfil={perfil}
              onUpdatePerfil={updates => setPerfil((prev: any) => ({ ...prev, ...updates }))}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e8f4f8' }}>
                {modoAuditoria && tecnicoSeleccionado
                  ? `${tecnicoSeleccionado.nombre} ${tecnicoSeleccionado.apellido}`
                  : `${perfil.nombre} ${perfil.apellido}`}
              </div>
              <div style={{ fontSize: 11, color: '#4a8fa0', marginTop: 1 }}>
                Técnico Eléctrico · Turno {modoAuditoria && tecnicoSeleccionado ? tecnicoSeleccionado.turno : perfil.turno}
              </div>
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

      {showConfirmRecepcion && ordenDetalle && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0c1c24', borderRadius: 16, padding: 20, width: '100%', maxWidth: 360, border: '1px solid #1D9E75' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e8f4f8', marginBottom: 8 }}>✅ Confirmar recepción</div>
            <div style={{ fontSize: 12, color: '#4a8fa0', marginBottom: 16 }}>
              Vas a confirmar la recepción de {ordenDetalle.materiales.filter((m: any) => m.estado === 'entregado').length} material{ordenDetalle.materiales.filter((m: any) => m.estado === 'entregado').length > 1 ? 'es' : ''}. Esta acción no se puede deshacer.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowConfirmRecepcion(false)}
                style={{ flex: 1, background: 'none', border: '1px solid #1a3040', borderRadius: 10, color: '#4a8fa0', fontWeight: 700, fontSize: 13, padding: '11px 0', cursor: 'pointer' }}>
                CANCELAR
              </button>
              <button onClick={confirmarRecepcionLote}
                style={{ flex: 1, background: '#1D9E75', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '11px 0', cursor: 'pointer' }}>
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {ordenDetalle && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ background: '#0c1c24', borderRadius: '16px 16px 0 0', padding: 16, maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid #1a3040' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#4a8fa0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>OT-{String(ordenDetalle.numero_orden).padStart(5, '0')}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#e8f4f8' }}>{ordenDetalle.titulo}</div>
              </div>
              <button onClick={() => { setOrdenDetalle(null); setShowCierre(false); setItConformidad(false); setTrabajosRealizados(''); setMediciones(''); setPendientes(''); setShowMemoria(false); setMemoriaActivo(null); setErrorMemoria('') }}
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
              {ordenDetalle.activo_id && (
                <div style={{ marginBottom: 10 }}>
                  <button
                    onClick={() => {
                      if (!showMemoria) {
                        setShowMemoria(true)
                        if (!memoriaActivo) cargarMemoriaActivo(ordenDetalle.activo_id)
                      } else {
                        setShowMemoria(false)
                      }
                    }}
                    style={{ width: '100%', background: '#07131a', border: '1px solid #1ABBD6', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showMemoria ? 8 : 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1ABBD6', textTransform: 'uppercase', letterSpacing: 0.5 }}>Historial del activo</span>
                    <span style={{ fontSize: 11, color: '#4a8fa0' }}>{showMemoria ? '▲ Cerrar' : '▼ Ver historial'}</span>
                  </button>
                  {showMemoria && (
                    <div>
                      {loadingMemoria && (
                        <div style={{ fontSize: 12, color: '#4a8fa0', padding: '10px 0', textAlign: 'center' }}>Cargando historial...</div>
                      )}
                      {errorMemoria ? (
                        <div style={{ background: '#2A1A00', border: '1px solid #EF9F2744', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                          <div style={{ fontSize: 12, color: '#EF9F27', fontWeight: 600 }}>Error: {errorMemoria}</div>
                        </div>
                      ) : memoriaActivo && (
                        <div>
                          <div style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                            <div style={{ fontSize: 10, color: '#1ABBD6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Ficha del activo</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>{memoriaActivo.ficha.activo_nombre}</div>
                            <div style={{ fontSize: 11, color: '#4a8fa0', marginTop: 2 }}>{memoriaActivo.ficha.activo_tipo}{memoriaActivo.ficha.activo_subtipo ? ' · ' + memoriaActivo.ficha.activo_subtipo : ''} · {memoriaActivo.ficha.activo_estado}</div>
                            {memoriaActivo.ficha.ramal && <div style={{ fontSize: 11, color: '#4a8fa0' }}>Ramal: {memoriaActivo.ficha.ramal}</div>}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
                              {[
                                ['Intervenciones', memoriaActivo.ficha.total_intervenciones],
                                ['Riesgos activos', memoriaActivo.ficha.riesgos_activos],
                                ['Obs. abiertas', memoriaActivo.ficha.conocimiento_abierto_count],
                              ].map(([label, val]) => (
                                <div key={label as string} style={{ background: '#0c1c24', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1ABBD6' }}>{val}</div>
                                  <div style={{ fontSize: 9, color: '#4a8fa0', marginTop: 2 }}>{label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {memoriaActivo.observaciones?.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <div style={{ fontSize: 10, color: '#EF9F27', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Observaciones abiertas</div>
                              {memoriaActivo.observaciones.map((obs: any) => (
                                <div key={obs.id} style={{ background: '#07131a', border: '1px solid #EF9F2744', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#EF9F27', textTransform: 'uppercase' }}>{obs.tipo}</span>
                                    <span style={{ fontSize: 10, color: obs.prioridad === 'alta' ? '#E24B4A' : '#4a8fa0', fontWeight: 600 }}>{obs.prioridad}</span>
                                  </div>
                                  <div style={{ fontSize: 12, color: '#e8f4f8', fontWeight: 600 }}>{obs.titulo}</div>
                                  {obs.descripcion && <div style={{ fontSize: 11, color: '#4a8fa0', marginTop: 4 }}>{obs.descripcion}</div>}
                                  {obs.fotos?.length > 0 && (
                                    <div style={{ fontSize: 10, color: '#4a8fa0', marginTop: 4 }}>{obs.fotos.length} foto{obs.fotos.length > 1 ? 's' : ''} adjunta{obs.fotos.length > 1 ? 's' : ''}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {memoriaActivo.observaciones?.length === 0 && (
                            <div style={{ fontSize: 11, color: '#4a8fa0', marginBottom: 8, paddingLeft: 4 }}>Sin observaciones abiertas</div>
                          )}
                          <div>
                            <div style={{ fontSize: 10, color: '#4a8fa0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Intervenciones técnicas</div>
                            {(!memoriaActivo.intervenciones || memoriaActivo.intervenciones.length === 0) && (
                              <div style={{ fontSize: 11, color: '#4a8fa0', paddingLeft: 4 }}>Sin intervenciones técnicas registradas.</div>
                            )}
                            {(memoriaActivo.intervenciones ?? []).map((inv: any) => (
                              <div key={inv.informe_id} style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <span style={{ fontSize: 10, color: '#4a8fa0' }}>OT-{String(inv.numero_orden).padStart(5, '0')} · {inv.fecha ? new Date(inv.fecha + 'T12:00:00').toLocaleDateString('es-AR') : 'Sin fecha'}</span>
                                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: inv.estado_informe === 'aprobado' ? '#0F6E56' : inv.estado_informe === 'presentado' ? '#1a3040' : inv.estado_informe === 'observado' ? '#3A2A00' : '#1a3040', color: inv.estado_informe === 'aprobado' ? '#9FE1CB' : inv.estado_informe === 'presentado' ? '#1ABBD6' : inv.estado_informe === 'observado' ? '#EF9F27' : '#4a8fa0' }}>
                                    {inv.estado_informe === 'aprobado' ? 'Aprobado' : inv.estado_informe === 'presentado' ? 'En revisión' : inv.estado_informe === 'observado' ? 'Observado' : inv.estado_informe === 'borrador' ? 'Borrador' : inv.estado_informe}
                                  </span>
                                </div>
                                {inv.tecnico_firmante && (
                                  <div style={{ fontSize: 11, color: '#4a8fa0', marginBottom: 6 }}>{inv.tecnico_firmante.nombre} {inv.tecnico_firmante.apellido}</div>
                                )}
                                {inv.intervencion_resumen?.encontro && (
                                  <div style={{ marginBottom: 4 }}>
                                    <span style={{ fontSize: 9, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Encontró </span>
                                    <span style={{ fontSize: 11, color: '#e8f4f8' }}>{inv.intervencion_resumen.encontro}</span>
                                  </div>
                                )}
                                {inv.intervencion_resumen?.hizo && (
                                  <div style={{ marginBottom: 4 }}>
                                    <span style={{ fontSize: 9, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Hizo </span>
                                    <span style={{ fontSize: 11, color: '#e8f4f8' }}>{inv.intervencion_resumen.hizo}</span>
                                  </div>
                                )}
                                {inv.intervencion_resumen?.resultado && (
                                  <div style={{ marginBottom: 6 }}>
                                    <span style={{ fontSize: 9, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Resultado </span>
                                    <span style={{ fontSize: 11, color: inv.resultado?.activo_operativo === false ? '#E24B4A' : '#1D9E75' }}>{inv.intervencion_resumen.resultado}</span>
                                  </div>
                                )}
                                {inv.materiales?.length > 0 && (
                                  <div style={{ marginBottom: 6 }}>
                                    <div style={{ fontSize: 9, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Materiales</div>
                                    {inv.materiales.map((m: any, i: number) => (
                                      <div key={i} style={{ fontSize: 11, color: '#4a8fa0' }}>· {m.nombre} × {m.cantidad} {m.unidad}</div>
                                    ))}
                                  </div>
                                )}
                                {inv.observaciones_generadas?.length > 0 && (
                                  <div>
                                    <div style={{ fontSize: 9, color: '#EF9F27', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Observaciones generadas</div>
                                    {inv.observaciones_generadas.map((obs: any) => (
                                      <div key={obs.id} style={{ fontSize: 11, color: '#EF9F27' }}>· {obs.titulo}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {ordenDetalle.tecnicos?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#4a8fa0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Técnicos</div>
                  {ordenDetalle.tecnicos.map((t: any) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#e8f4f8' }}>{t.profiles?.nombre} {t.profiles?.apellido}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: t.cerro ? '#0F6E56' : '#1a3040', color: t.cerro ? '#9FE1CB' : '#4a8fa0' }}>
                        {t.cerro ? 'Cerró' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {ordenDetalle.materiales?.length > 0 && (() => {
                const entregados = ordenDetalle.materiales.filter((m: any) => m.estado === 'entregado' && recepcionMarcada[m.id])
                const todosConfirmados = entregados.length > 0 && entregados.every((m: any) => recepcionMarcada[m.id])
                return (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: '#4a8fa0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Materiales</div>
                    {ordenDetalle.materiales.map((m: any) => (
                      <div key={m.id} style={{ background: '#07131a', border: `1px solid ${m.estado === 'recibido' ? '#1D9E75' : recepcionMarcada[m.id] ? '#1ABBD6' : m.estado === 'entregado' ? '#1a3040' : '#1a3040'}`, borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: '#e8f4f8' }}>{m.materiales?.nombre}</span>
                          <span style={{ fontSize: 11, color: '#4a8fa0' }}>{m.cantidad} {m.materiales?.unidad}</span>
                        </div>
                        {m.estado === 'entregado' && (
                          <div style={{ marginTop: 8 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                              <input type="checkbox" checked={recepcionMarcada[m.id] || false}
                                onChange={e => setRecepcionMarcada(prev => ({ ...prev, [m.id]: e.target.checked }))}
                                style={{ width: 16, height: 16, cursor: 'pointer' }} />
                              <span style={{ fontSize: 12, color: recepcionMarcada[m.id] ? '#1D9E75' : '#4a8fa0', fontWeight: 600 }}>
                                {recepcionMarcada[m.id] ? '✅ Recibí este material' : 'Marcar como recibido'}
                              </span>
                            </label>
                            <input
                              placeholder="Observación (opcional)"
                              value={obsRecepcion[m.id] || ''}
                              onChange={e => setObsRecepcion(prev => ({ ...prev, [m.id]: e.target.value }))}
                              style={{ width: '100%', background: '#0c1c24', border: '1px solid #1a3040', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#e8f4f8', outline: 'none', boxSizing: 'border-box' as const }}
                            />
                          </div>
                        )}
                        {m.estado === 'recibido' && (
                          <div style={{ marginTop: 6 }}>
                            <div style={{ fontSize: 11, color: '#1D9E75', marginBottom: 6 }}>
                              ✅ Recibido · {m.recibido_at ? new Date(m.recibido_at).toLocaleString('es-AR') : ''}
                            </div>
                            {m.observacion_tecnico && <div style={{ fontSize: 11, color: '#4a8fa0', marginBottom: 6 }}>{m.observacion_tecnico}</div>}
                            {showDevolucion === m.id ? (
                              <div style={{ background: '#0c1c24', border: '1px solid #1a3040', borderRadius: 8, padding: '10px 12px' }}>
                                <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>Proponer devolución</div>
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 10, color: '#4a8fa0', marginBottom: 3 }}>Cantidad a devolver (máx: {m.cantidad_preparada})</div>
                                  <input type="number" min={0} max={m.cantidad_preparada}
                                    value={devCantidad}
                                    onChange={e => setDevCantidad(Math.min(Math.max(0, parseInt(e.target.value) || 0), m.cantidad_preparada))}
                                    style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#e8f4f8', outline: 'none', boxSizing: 'border-box' as const }} />
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 10, color: '#4a8fa0', marginBottom: 3 }}>Motivo</div>
                                  <select value={devMotivo} onChange={e => setDevMotivo(e.target.value)}
                                    style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#e8f4f8', outline: 'none', boxSizing: 'border-box' as const }}>
                                    <option value="devolucion">Devolución</option>
                                    <option value="roto">Roto</option>
                                    <option value="perdido">Perdido</option>
                                    <option value="usado">Usado</option>
                                  </select>
                                </div>
                                {m.materiales?.tipo === 'herramienta' && devCantidad < m.cantidad_preparada && (
                                  <div style={{ marginBottom: 8 }}>
                                    <div style={{ fontSize: 10, color: '#EF9F27', marginBottom: 3 }}>⚠️ Novedad obligatoria (herramienta con diferencia)</div>
                                    <input placeholder="Describí qué pasó con la herramienta..."
                                      value={devNovedad} onChange={e => setDevNovedad(e.target.value)}
                                      style={{ width: '100%', background: '#07131a', border: '1px solid #EF9F27', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#e8f4f8', outline: 'none', boxSizing: 'border-box' as const }} />
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => { setShowDevolucion(null); setDevCantidad(0); setDevMotivo('devolucion'); setDevNovedad('') }}
                                    style={{ flex: 1, background: 'none', border: '1px solid #1a3040', borderRadius: 8, color: '#4a8fa0', fontWeight: 700, fontSize: 11, padding: '8px 0', cursor: 'pointer' }}>
                                    CANCELAR
                                  </button>
                                  <button
                                    onClick={() => proponerDevolucion(m.id)}
                                    disabled={
                                      loadingDevolucion ||
                                      devCantidad < 0 ||
                                      devCantidad > m.cantidad_preparada ||
                                      !devMotivo.trim() ||
                                      (m.materiales?.tipo === 'herramienta' && devCantidad < m.cantidad_preparada && !devNovedad.trim())
                                    }
                                    style={{ flex: 1, background: (loadingDevolucion || devCantidad < 0 || devCantidad > m.cantidad_preparada || !devMotivo.trim()) ? '#1a3040' : '#1ABBD6', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 11, padding: '8px 0', cursor: 'pointer' }}>
                                    {loadingDevolucion ? '...' : 'PROPONER'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => { setShowDevolucion(m.id); setDevCantidad(m.cantidad_preparada || m.cantidad); setDevMotivo('devolucion'); setDevNovedad('') }}
                                  style={{ flex: 1, background: '#0c1c24', border: '1px solid #1ABBD6', borderRadius: 8, color: '#1ABBD6', fontWeight: 600, fontSize: 10, padding: '6px 0', cursor: 'pointer' }}>
                                  🔄 DEVOLVER
                                </button>
                                {m.materiales?.tipo !== 'herramienta' && (
                                  <button onClick={() => { if (confirm('Vas a cerrar este material como consumido. Esta acción no podrá revertirse fácilmente. ¿Continuar?')) cerrarComoConsumido(m.id) }}
                                    disabled={loadingDevolucion}
                                    style={{ flex: 1, background: '#0c1c24', border: '1px solid #4a8fa0', borderRadius: 8, color: '#4a8fa0', fontWeight: 600, fontSize: 10, padding: '6px 0', cursor: 'pointer' }}>
                                    ✅ CONSUMIDO
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {(m.estado === 'devolucion_pendiente' || m.estado === 'cerrado') && (
                          <div style={{ marginTop: 4, fontSize: 11, color: m.estado === 'cerrado' ? '#1D9E75' : '#EF9F27', fontWeight: 600 }}>
                            {m.estado === 'cerrado' ? '✅ Cerrado' : '⏳ Devolución pendiente verificación pañolero'}
                          </div>
                        )}
                      </div>
                    ))}
                    {entregados.length > 0 && (
                      <button
                        onClick={() => { if (todosConfirmados) setShowConfirmRecepcion(true) }}
                        disabled={!todosConfirmados}
                        style={{ width: '100%', background: todosConfirmados ? '#1D9E75' : '#1a3040', border: 'none', borderRadius: 10, color: todosConfirmados ? 'white' : '#4a8fa0', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: todosConfirmados ? 'pointer' : 'default', marginTop: 8 }}>
                        {todosConfirmados ? `✅ CONFIRMAR RECEPCIÓN DE ${entregados.length} MATERIAL${entregados.length > 1 ? 'ES' : ''}` : `Marcá todos los materiales para confirmar (${entregados.filter((m: any) => recepcionMarcada[m.id]).length}/${entregados.length})`}
                      </button>
                    )}
                  </div>
                )
              })()}
              {ordenDetalle.estado === 'devuelta_supervisor' && ordenDetalle.observacion_supervisor && (
                <div style={{ background: '#2A1A00', border: '1px solid #EF9F2744', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#EF9F27', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>↩️ Observación del supervisor</div>
                  <div style={{ fontSize: 13, color: '#e8f4f8' }}>{ordenDetalle.observacion_supervisor}</div>
                </div>
              )}
              {showCierre && (
                <div style={{ marginBottom: 10 }}>

                  {!ordenDetalle.activo_id && (
                    <div style={{ background: '#2A1A00', border: '1px solid #EF9F2788', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#EF9F27', fontWeight: 700 }}>⚠️ Esta OT no tiene activo asignado. Informá al supervisor.</div>
                      <div style={{ fontSize: 11, color: '#b0c4ce', marginTop: 4 }}>El cierre se registrará sin informe técnico estructurado.</div>
                    </div>
                  )}

                  {/* ── Asistente IA ─────────────────────────────────── */}
                  <div style={{ background: '#071f2e', border: '1px solid #1ABBD655', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#1ABBD6', fontWeight: 700, marginBottom: 4 }}>🤖 Asistente IA para informe técnico</div>
                    <div style={{ fontSize: 11, color: '#4a8fa0', marginBottom: 10 }}>
                      Describí en tus palabras qué encontraste y qué hiciste. La IA va a completar el formulario como borrador. Vos revisás y corregís antes de enviar.
                    </div>
                    <textarea
                      value={iaTextoLibre}
                      onChange={e => setIaTextoLibre(e.target.value)}
                      rows={4}
                      placeholder="Ej: Llegué al SET 12, la lámpara estaba apagada por fusible quemado. Cambié el fusible 6A y quedó funcionando. Medí 220V de entrada."
                      style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginBottom: soportaVoz ? 0 : 6 }}>
                      {soportaVoz && (
                        <button
                          onClick={iniciarDictadoIA}
                          disabled={escuchandoIA || loadingIA}
                          style={{
                            flex: '0 0 38%',
                            padding: '10px 0',
                            borderRadius: 8,
                            border: escuchandoIA ? '1.5px solid #E24B4A' : '1.5px solid #1a3040',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: escuchandoIA || loadingIA ? 'not-allowed' : 'pointer',
                            background: escuchandoIA ? '#2a0a0a' : '#07131a',
                            color: escuchandoIA ? '#E24B4A' : '#4a8fa0',
                          }}
                        >
                          {escuchandoIA ? '🔴 Escuchando...' : '🎤 Dictar'}
                        </button>
                      )}
                      <button
                        onClick={generarBorradorIA}
                        disabled={loadingIA || iaTextoLibre.trim().length < 10}
                        style={{
                          flex: 1,
                          padding: '10px 0',
                          borderRadius: 8,
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: loadingIA || iaTextoLibre.trim().length < 10 ? 'not-allowed' : 'pointer',
                          background: loadingIA || iaTextoLibre.trim().length < 10 ? '#1a3040' : '#1ABBD6',
                          color: loadingIA || iaTextoLibre.trim().length < 10 ? '#4a8fa0' : '#07131a',
                        }}
                      >
                        {loadingIA ? 'Generando...' : '🤖 Generar borrador'}
                      </button>
                    </div>
                    {!soportaVoz && (
                      <div style={{ fontSize: 10, color: '#4a8fa0', marginTop: 4 }}>
                        Dictado por voz disponible en Chrome/Edge.
                      </div>
                    )}
                  </div>
                  {/* ── Fin Asistente IA ─────────────────────────────────── */}

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
                    style={{ width: '100%', background: '#07131a', border: `1px solid ${itTrabajoDetalle ? '#1ABBD6' : '#1a3040'}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                    rows={3} placeholder="Describí exactamente qué hiciste..." />

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

                  <div style={{ fontSize: 10, color: '#1ABBD6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4, fontWeight: 700 }}>Seguridad</div>

                  <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Riesgo detectado</div>
                  <select value={itRiesgoTipo} onChange={e => setItRiesgoTipo(e.target.value)}
                    style={{ width: '100%', background: '#07131a', border: `1px solid ${itRiesgoTipo !== 'ninguno' ? '#EF9F27' : '#1a3040'}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', marginBottom: 8, outline: 'none' }}>
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
                        style={{ width: '100%', background: '#07131a', border: `1px solid ${itObservacionesSeguridad ? '#EF9F27' : '#A32D2D'}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                        rows={2} placeholder="Describí el riesgo y cómo quedó..." />
                    </>
                  )}

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
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <ComentariosOT
                  ordenId={ordenDetalle.id}
                  autorId={perfil.id}
                  autorRol={perfil.rol}
                />
                <FotosOT
                  ordenId={ordenDetalle.id}
                  ordenEstado={ordenDetalle.estado}
                  activoId={ordenDetalle.activo_id || null}
                  autorId={perfil.id}
                  autorRol={perfil.rol}
                />

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
                  <>
                    <div style={{ width: '100%', background: '#0D1B2A', border: `1px solid ${itConformidad ? '#1D9E75' : '#1a3040'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 4, display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
                      onClick={() => setItConformidad(v => !v)}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${itConformidad ? '#1D9E75' : '#4a8fa0'}`, background: itConformidad ? '#1D9E75' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        {itConformidad && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 12, color: itConformidad ? '#9FE1CB' : '#7A9EA5', lineHeight: 1.4 }}>
                        Estoy conforme con el trabajo realizado y los materiales de esta OT
                      </span>
                    </div>
                    <button onClick={() => proponerCierre(ordenDetalle.id)} disabled={loading || !itTrabajoDetalle || itActivoOperativo === null || !itConformidad}
                      style={{ flex: 1, background: loading || !itTrabajoDetalle || itActivoOperativo === null || !itConformidad ? '#1a3040' : '#1D9E75', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                      {loading ? 'Enviando...' : 'ENVIAR AL SUPERVISOR'}
                    </button>
                  </>
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
              {ordenActiva.tipo === 'relevamiento_alumbrado' && (() => {
                const tsMatches = [...(ordenActiva.titulo.matchAll(/TS\d{1,2}|TG\d{1,2}/gi))].map(m => m[0].toUpperCase())
                return tsMatches.length > 0
                  ? (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {tsMatches.map(ts => (
                        <button key={ts}
                          onClick={e => { e.stopPropagation(); router.push(`/dashboard/tecnico-electrico/relevamiento/${ts}?orden=${ordenActiva.id}`) }}
                          style={{ width: '100%', background: '#0d2a3a', border: '1px solid #1ABBD6', borderRadius: 8, color: '#1ABBD6', fontSize: 12, fontWeight: 700, padding: '10px 0', cursor: 'pointer', letterSpacing: 0.5 }}
                        >
                          🔦 Cargar {ts}
                        </button>
                      ))}
                    </div>
                  )
                  : (
                    <div style={{ marginTop: 8, fontSize: 10, color: '#EF9F27' }}>
                      ⚠ Falta TS/TG en el título de la OT
                    </div>
                  )
              })()}
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
        <BibliotecaCard C={{ card: '#0c1c24', border: '#1a3040', text: '#e8f4f8', sub: '#4a8fa0', accent: '#1ABBD6' }} />
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
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#4a8fa0' }}>OT-{String(o.numero_orden).padStart(5, '0')}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>{o.titulo}</div>
                      {!esClickeable && (
                        <div style={{ fontSize: 10, color: '#2a5060', marginTop: 2 }}>En espera</div>
                      )}
                      {o.tipo === 'relevamiento_alumbrado' && (() => {
                        const tsMatches = [...(o.titulo.matchAll(/TS\d{1,2}|TG\d{1,2}/gi))].map(m => m[0].toUpperCase())
                        return tsMatches.length > 0
                          ? (
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {tsMatches.map(ts => (
                                <button key={ts}
                                  onClick={e => { e.stopPropagation(); router.push(`/dashboard/tecnico-electrico/relevamiento/${ts}?orden=${o.id}`) }}
                                  style={{ background: '#0d2a3a', border: '1px solid #1ABBD6', borderRadius: 8, color: '#1ABBD6', fontSize: 11, fontWeight: 700, padding: '7px 12px', cursor: 'pointer', textAlign: 'left' }}
                                >
                                  🔦 Cargar {ts}
                                </button>
                              ))}
                            </div>
                          )
                          : (
                            <div style={{ marginTop: 6, fontSize: 10, color: '#EF9F27' }}>
                              ⚠ Falta TS/TG en el título de la OT
                            </div>
                          )
                      })()}
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

export default function DashboardTecnicoElectrico() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#07131a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1ABBD6', fontFamily: 'system-ui' }}>Cargando...</div>}>
      <DashboardTecnicoElectricoInner />
    </Suspense>
  )
}