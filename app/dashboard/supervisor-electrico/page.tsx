'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'
import AvatarUpload from '@/app/components/AvatarUpload'
import { getKitBySubtipo } from '@/lib/kits-correctivo'
import { fechaHoyAR, formatFechaAR } from '@/lib/fecha-local'
import ComentariosOT from '@/app/components/ComentariosOT'
import FotosOT from '@/app/components/FotosOT'
import BibliotecaCard from '@/app/components/BibliotecaCard'

function SolicitudItem({ s, onResolver }: { s: any, onResolver: (id: string, decision: 'autorizada' | 'rechazada', obs: string) => void }) {
  const [obs, setObs] = useState('')
  const [open, setOpen] = useState(false)
  const C2 = { bg: '#07131a', border: '#1a3040', text: '#e8f4f8', sub: '#4a8fa0', accent: '#1ABBD6', warn: '#EF9F27', ok: '#1D9E75', err: '#E24B4A' }
  const input2 = { width: '100%', background: C2.bg, border: `1px solid ${C2.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C2.text, outline: 'none', boxSizing: 'border-box' as const }
  return (
    <div style={{ background: C2.bg, border: `1px solid ${C2.warn}33`, borderRadius: 10, padding: '10px 12px', marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div>
          <div style={{ fontSize: 11, color: C2.sub }}>{s.profiles?.apellido}, {s.profiles?.nombre} · OT-{String(s.ordenes_trabajo?.numero_orden || 0).padStart(5, '0')}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C2.text }}>{s.materiales?.nombre}</div>
          <div style={{ fontSize: 11, color: C2.sub }}>×{s.cantidad} {s.materiales?.unidad}</div>
        </div>
        <span style={{ fontSize: 11, color: C2.warn }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 8 }}>
          <input style={{ ...input2, marginBottom: 8 }} placeholder="Observación (opcional)" value={obs} onChange={e => setObs(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onResolver(s.id, 'autorizada', obs)} style={{ flex: 1, background: C2.ok, border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 12, padding: '10px 0', cursor: 'pointer' }}>AUTORIZAR</button>
            <button onClick={() => onResolver(s.id, 'rechazada', obs)} style={{ flex: 1, background: '#7B1E1E', border: 'none', borderRadius: 8, color: '#F09595', fontWeight: 700, fontSize: 12, padding: '10px 0', cursor: 'pointer' }}>RECHAZAR</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardSupervisorElectrico() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [tecnicos, setTecnicos] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showOrdenes, setShowOrdenes] = useState(false)
  const [showInsumos, setShowInsumos] = useState(false)
  const [showVehiculos, setShowVehiculos] = useState(false)
  const [ordenDetalle, setOrdenDetalle] = useState<any>(null)
  const [checkinDetalle, setCheckinDetalle] = useState<any>(null)
  const [showStock, setShowStock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aprobando, setAprobando] = useState(false)
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState<string[]>([])
  const [materiales, setMateriales] = useState<any[]>([])
  const [materialesFiltrados, setMaterialesFiltrados] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [materialesOrden, setMaterialesOrden] = useState<{id: string, nombre: string, unidad: string, cantidad: number, stock: number, tipo: string}[]>([])

  const [form, setForm] = useState({
    titulo: '', descripcion: '', km: '', ubicacion: '',
    prioridad: 'normal', tipo: 'correctivo_programado', origen: 'supervisor',
    nomenclatura: '', fecha_programada: fechaHoyAR(),
    balizamiento_desde: '', balizamiento_hasta: '',
    balizamiento_hora_ingreso: '', balizamiento_hora_egreso: '', campo_libre: '',
    activo_id: '', subtipo_correctivo: ''
  })
  const [activos, setActivos] = useState<any[]>([])
  const [tipoActivoSeleccionado, setTipoActivoSeleccionado] = useState<string>('')
  const [activoSeleccionado, setActivoSeleccionado] = useState<any>(null)
  const [subtipoCorrectivo, setSubtipoCorrectivo] = useState<string>('')
  const [subtipoOtroTexto, setSubtipoOtroTexto] = useState<string>('')
  const [tipoActivoOtroTexto, setTipoActivoOtroTexto] = useState<string>('')
  const [kitSugerido, setKitSugerido] = useState<ReturnType<typeof getKitBySubtipo>>(null)

  const [nomenclaturas, setNomenclaturas] = useState<any[]>([])
  const [busquedaOrden, setBusquedaOrden] = useState('')
  const [verTodosTecnicos, setVerTodosTecnicos] = useState(false)
  const [todosLosTecnicos, setTodosLosTecnicos] = useState<any[]>([])
  const [errores, setErrores] = useState<string[]>([])
  const [hora, setHora] = useState('')
  const [fechaDisplay, setFechaDisplay] = useState('')
  const [checkinsVehiculos, setCheckinsVehiculos] = useState<any[]>([])
  const [ordenesRebotadas, setOrdenesRebotadas] = useState<any[]>([])
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroTurno, setFiltroTurno] = useState('todos')
  const [obsDevolucion, setObsDevolucion] = useState('')
  const [showDevolucion, setShowDevolucion] = useState(false)
  const [showCancelar, setShowCancelar] = useState(false)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [loadingAccion, setLoadingAccion] = useState(false)
  const [showReprogramar, setShowReprogramar] = useState(false)
const [nuevaFecha, setNuevaFecha] = useState('')
const [showReasignar, setShowReasignar] = useState(false)
const [tecnicosReasignados, setTecnicosReasignados] = useState<string[]>([])
const [showTecnicos, setShowTecnicos] = useState(false)
const [showEditarOT, setShowEditarOT] = useState(false)
const [formEditar, setFormEditar] = useState<any>(null)
const [loadingDecision, setLoadingDecision] = useState(false)
  const [informeDetalle, setInformeDetalle] = useState<any>(null)
  const [showFormOTHija, setShowFormOTHija] = useState(false)
  const [otHijaCreada, setOtHijaCreada] = useState(false)
  const [otHijaActiva, setOtHijaActiva] = useState(false)
  const [loadingOTHija, setLoadingOTHija] = useState(false)
  const [suprasPendientes, setSuprasPendientes] = useState<any[]>([])
  const [supraDetalle, setSupraDetalle] = useState<any>(null)
  const [supraIdParaOT, setSupraIdParaOT] = useState<string | null>(null)
  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'supervisor_electrico' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      const turnoEfectivo = (p.rol === 'superadmin' || p.rol === 'jefe') ? null : p.turno
      setPerfil(p)
      await Promise.all([cargarDatos(turnoEfectivo), cargarSolicitudes(), cargarCheckinsVehiculos(), cargarOrdenesRebotadas(), cargarSuprasPendientes()])
    })
    const tick = () => {
      const now = new Date()
      setHora(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
      setFechaDisplay(now.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }))
    }
    tick()
    const iv = setInterval(tick, 60000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (busqueda.trim().length < 2) { setMaterialesFiltrados([]); return }
    const q = busqueda.toLowerCase()
    setMaterialesFiltrados(materiales.filter((m: any) => m.nombre.toLowerCase().includes(q)))
  }, [busqueda, materiales])

  async function cargarDatos(turno: string | null) {
    const { data: ords } = await supabase.from('ordenes_trabajo')
      .select('*, profiles!ordenes_trabajo_asignado_a_fkey(nombre, apellido)')
      .eq('sector', 'electrico').order('created_at', { ascending: false })
    setOrdenes(ords || [])
    const [tecsPorTurno, { data: acts }, { data: todos }] = await Promise.all([
      turno
        ? supabase.rpc('get_tecnicos_activos', { p_sector: 'electrico', p_turno: turno })
        : Promise.resolve({ data: [] }),
      supabase.from('activos')
        .select('id, codigo, nombre, tipo, ramal, sentido_operativo, subtipo, estado, observaciones, reemplazado_por_id')
        .is('deleted_at', null)
        .order('nombre', { ascending: true }),
      supabase.from('profiles')
        .select('id, nombre, apellido, rol, turno, sector_trabajo, grupo')
        .eq('activo', true)
        .eq('sector_trabajo', 'electrico')
        .in('rol', ['tecnico_electrico', 'tallerista_electrico', 'panolero'])
        .order('apellido', { ascending: true }),
    ])
    setActivos(acts || [])
    setTecnicos(tecsPorTurno.data || [])
    setTodosLosTecnicos(todos || [])
  }

  async function cargarSolicitudes() {
    const { data } = await supabase.from('solicitudes_insumos')
      .select('*, materiales!solicitudes_insumos_material_id_fkey(nombre, unidad), profiles!solicitudes_insumos_tallerista_id_fkey(nombre, apellido, sector_trabajo), ordenes_trabajo!solicitudes_insumos_orden_trabajo_id_fkey(titulo, numero_orden)')
      .eq('estado', 'pendiente').order('created_at', { ascending: false })
    setSolicitudes((data || []).filter((s: any) => s.profiles?.sector_trabajo === 'electrico'))
  }

  async function cargarSuprasPendientes() {
    const { data } = await supabase
      .from('ots_supra')
      .select(`
        id, numero_supra, titulo, descripcion, tipo, prioridad, plazo_estimado, created_at,
        ots_supra_sectores(sector)
      `)
      .eq('estado', 'pendiente_planificacion')
      .order('created_at', { ascending: false })
    setSuprasPendientes(data || [])
  }

  async function cargarOrdenesRebotadas() {
    const { data } = await supabase.from('ordenes_trabajo')
      .select('id, numero_orden, titulo, observacion_panol, rebotada_at, rebotada_por, sector')
      .eq('estado', 'rebotada')
      .eq('sector', 'electrico')
      .order('rebotada_at', { ascending: false })
    setOrdenesRebotadas(data || [])
  }

  async function cargarCheckinsVehiculos() {
    const { data } = await supabase.from('checkins_vehiculos')
      .select('*, moviles(marca, modelo, patente), conductor:conductor_id(nombre, apellido), aprobador:aprobado_por(nombre, apellido)')
      .eq('sector', 'electrico').order('created_at', { ascending: false }).limit(60)
    setCheckinsVehiculos(data || [])
  }

  async function resolverSolicitud(id: string, decision: 'autorizada' | 'rechazada', obs: string) {
    await supabase.from('solicitudes_insumos')
      .update({ estado: decision, supervisor_id: perfil.id, observaciones: obs, resuelta_at: new Date().toISOString(), aprobador_nombre_display: [perfil.apellido, perfil.nombre].filter(Boolean).join(', ') })
      .eq('id', id)
    await cargarSolicitudes()
  }

  async function abrirDetalle(orden: any) {
    setShowOrdenes(false)
    const { data: tecs } = await supabase.from('orden_tecnicos')
      .select('*, profiles!orden_tecnicos_tecnico_id_fkey(nombre, apellido, rol)').eq('orden_id', orden.id)
    const { data: mats } = await supabase.from('orden_materiales')
      .select('*, materiales!orden_materiales_material_id_fkey(nombre, unidad)').eq('orden_id', orden.id)
    const { data: peds } = await supabase.from('pedidos_material').select('*').eq('orden_trabajo_id', orden.id)
    const { data: informe } = await supabase.from('informes_tecnicos')
      .select('id, requiere_seguimiento, activo_operativo, riesgo_tipo, riesgo_controlado, seguimiento_detalle, estado_informe, version')
      .eq('orden_id', orden.id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    setInformeDetalle(informe ?? null)
    const { data: hijas } = await supabase.from('ordenes_trabajo')
      .select('id, estado')
      .eq('madre_id', orden.id)
    const hijasArr = hijas || []
    setOtHijaCreada(hijasArr.length > 0)
    setOtHijaActiva(hijasArr.some((h: any) => ['pendiente', 'en_curso', 'cierre_propuesto', 'devuelta_supervisor'].includes(h.estado)))
    setOrdenDetalle({ ...orden, tecnicos: tecs || [], materiales: mats || [], pedidos: peds || [] })
  }
function necesitaDerivada() {
    if (!informeDetalle) return false
    if (informeDetalle.requiere_seguimiento === true) return true
    if (informeDetalle.activo_operativo === false) return true
    if (informeDetalle.riesgo_tipo && informeDetalle.riesgo_tipo !== 'ninguno' && informeDetalle.riesgo_controlado === false) return true
    return false
  }

  async function crearOTHija() {
    if (!ordenDetalle) return
    setLoadingOTHija(true)
    const titulo = `Seguimiento — ${ordenDetalle.activo_id ? (ordenDetalle.titulo || 'Activo') : ordenDetalle.titulo}`
    const { error } = await supabase.from('ordenes_trabajo').insert({
      titulo: `Seguimiento — ${ordenDetalle.titulo}`,
      descripcion: informeDetalle.seguimiento_detalle || `OT derivada de OT-${String(ordenDetalle.numero_orden).padStart(5, '0')}`,
      sector: ordenDetalle.sector,
      estado: 'pendiente',
      prioridad: ordenDetalle.prioridad,
      tipo: 'correctivo_programado',
      origen: 'supervisor',
      km: ordenDetalle.km ?? null,
      ubicacion: ordenDetalle.ubicacion ?? null,
      activo_id: ordenDetalle.activo_id ?? null,
      madre_id: ordenDetalle.id,
      creado_por: perfil.id,
      turno: perfil.turno,
    })
    setLoadingOTHija(false)
    if (error) { alert('Error al crear OT hija: ' + error.message); return }
    setOtHijaCreada(true)
  }

  async function aprobarCierre(id: string) {
    if (necesitaDerivada() && !otHijaActiva) {
      alert('Este informe requiere una OT derivada activa antes de aprobar el cierre.')
      return
    }
    if (otHijaActiva) {
      const confirma = window.confirm('Esta OT tiene una derivada activa. ¿Confirmás cerrar la OT madre igualmente?')
      if (!confirma) return
    }
    setLoadingDecision(true)
    await supabase.from('ordenes_trabajo').update({
      estado: 'cerrada',
      fecha_cierre: new Date().toISOString(),
      aprobado_por: perfil.id,
      aprobado_at: new Date().toISOString(),
    }).eq('id', id).eq('estado', 'cierre_propuesto')
    setLoadingDecision(false)
    setOrdenDetalle(null)
    await cargarDatos(perfil.turno)
  }

  async function derivarOT(id: string) {
    setLoadingDecision(true)
    await supabase.from('ordenes_trabajo').update({
      estado: 'derivada',
      fecha_cierre: new Date().toISOString(),
      aprobado_por: perfil.id,
      aprobado_at: new Date().toISOString(),
    }).eq('id', id).eq('estado', 'cierre_propuesto')
    setLoadingDecision(false)
    setOrdenDetalle(null)
    await cargarDatos(perfil.turno)
  }

  async function devolverAlTecnico(id: string) {
    if (!obsDevolucion.trim()) return
    setLoadingDecision(true)
    await supabase.from('ordenes_trabajo').update({
      estado: 'devuelta_supervisor',
      observacion_supervisor: obsDevolucion,
      devuelto_por: perfil.id,
      devuelto_at: new Date().toISOString(),
      fecha_cierre: null,
      aprobado_por: null,
      aprobado_at: null,
    }).eq('id', id).eq('estado', 'cierre_propuesto')
    setLoadingDecision(false)
    setShowDevolucion(false)
    setObsDevolucion('')
    setOrdenDetalle(null)
    await cargarDatos(perfil.turno)
    await cargarDatos(perfil.turno)
  }
  async function editarOrden(id: string) {
    if (!formEditar) return
    setLoadingAccion(true)
    const { error } = await supabase
      .from('ordenes_trabajo')
      .update({
        titulo: formEditar.titulo,
        descripcion: formEditar.descripcion,
        km: formEditar.km ? parseFloat(formEditar.km) : null,
        ubicacion: formEditar.ubicacion,
        prioridad: formEditar.prioridad,
        tipo: formEditar.tipo,
        origen: formEditar.origen,
        nomenclatura: formEditar.nomenclatura || null,
        balizamiento_desde: formEditar.balizamiento_desde ? parseFloat(formEditar.balizamiento_desde) : null,
        balizamiento_hasta: formEditar.balizamiento_hasta ? parseFloat(formEditar.balizamiento_hasta) : null,
        balizamiento_hora_ingreso: formEditar.balizamiento_hora_ingreso || null,
        balizamiento_hora_egreso: formEditar.balizamiento_hora_egreso || null,
        campo_libre: formEditar.campo_libre || null,
        fecha_programada: formEditar.fecha_programada,
      })
      .eq('id', id)
      .eq('estado', 'pendiente')
    setLoadingAccion(false)
    if (error) {
      alert('Error al guardar los cambios. Intentá de nuevo.')
      return
    }
    setShowEditarOT(false)
    setFormEditar(null)
    await abrirDetalle({ id })
    await cargarDatos(perfil.turno)
  }
async function reasignarTecnicos(id: string) {
    if (tecnicosReasignados.length === 0) return
    setLoadingAccion(true)
    const { data: actuales, error: errorLectura } = await supabase
      .from('orden_tecnicos')
      .select('tecnico_id')
      .eq('orden_id', id)
    if (errorLectura) {
      setLoadingAccion(false)
      alert('Error al leer técnicos actuales. Intentá de nuevo.')
      return
    }
    const idsActuales = (actuales || []).map((t: any) => t.tecnico_id)
    const idsNuevos = tecnicosReasignados
    const aInsertar = idsNuevos.filter(tid => !idsActuales.includes(tid))
    const aBorrar = idsActuales.filter(tid => !idsNuevos.includes(tid))
    if (aInsertar.length > 0) {
      const { error } = await supabase.from('orden_tecnicos')
        .insert(aInsertar.map(tid => ({ orden_id: id, tecnico_id: tid, cerro: false })))
      if (error) {
        setLoadingAccion(false)
        alert('Error al agregar técnicos. No se modificó nada.')
        return
      }
    }
    if (aBorrar.length > 0) {
      const { error } = await supabase.from('orden_tecnicos')
        .delete().eq('orden_id', id).in('tecnico_id', aBorrar)
      if (error) {
        setLoadingAccion(false)
        alert('Error al quitar técnicos. Revisá manualmente la OT.')
        return
      }
    }
    const { error } = await supabase.from('ordenes_trabajo')
      .update({ asignado_a: idsNuevos[0] })
      .eq('id', id).eq('estado', 'pendiente')
    if (error) {
      setLoadingAccion(false)
      alert('Técnicos actualizados pero falló el asignado_a. Revisá la OT.')
      return
    }
    setLoadingAccion(false)
    setShowReasignar(false)
    setTecnicosReasignados([])
    await abrirDetalle({ id, ...ordenDetalle })
    await cargarDatos(perfil.turno)
  }
  async function reprogramarOrden(id: string) {
    if (!nuevaFecha) return
    setLoadingAccion(true)
    const { error } = await supabase
      .from('ordenes_trabajo')
      .update({ fecha_programada: nuevaFecha })
      .eq('id', id)
      .eq('estado', 'pendiente')
    setLoadingAccion(false)
    if (error) {
      alert('Error al reprogramar la orden. Intentá de nuevo.')
      return
    }
    setShowReprogramar(false)
    setNuevaFecha('')
    setOrdenDetalle((prev: any) => prev ? { ...prev, fecha_programada: nuevaFecha } : prev)
    await cargarDatos(perfil.turno)
  }

  async function solicitarEliminacionOrden(id: string) {
    if (!motivoCancelacion.trim()) return
    setLoadingAccion(true)
    const { error } = await supabase
      .from('ordenes_trabajo')
      .update({
        estado: 'eliminacion_solicitada',
        observacion_supervisor: motivoCancelacion.trim(),
      })
      .eq('id', id)
    setLoadingAccion(false)
    if (error) {
      alert('Error al solicitar eliminación. Intentá de nuevo.')
      return
    }
    setShowCancelar(false)
    setMotivoCancelacion('')
    setOrdenDetalle(null)
    await cargarDatos(perfil.turno)
  }
  async function abrirCheckinDetalle(ch: any) {
    const { data: items } = await supabase.from('checkins_vehiculos_items')
      .select('*').eq('checkin_id', ch.id).order('orden', { ascending: true })
    setCheckinDetalle({ ...ch, items: items || [] })
  }

  async function aprobarCheckin(id: string, conObs: boolean) {
    setAprobando(true)
    await supabase.from('checkins_vehiculos').update({
      estado: conObs ? 'aprobado_con_observaciones' : 'aprobado',
      aprobado_por: perfil.id,
      aprobado_at: new Date().toISOString(),
      aprobador_nombre_display: [perfil.apellido, perfil.nombre].filter(Boolean).join(', '),
    }).eq('id', id)
    setCheckinDetalle(null)
    await cargarCheckinsVehiculos()
    setAprobando(false)
  }

  async function abrirForm(desdeSupra = false) {
    if (!desdeSupra) setSupraIdParaOT(null)
    if (nomenclaturas.length === 0) {
      const { data } = await supabase.from('nomenclaturas').select('*').eq('sector', 'electrico').order('codigo', { ascending: true })
      setNomenclaturas(data || [])
    }
    setShowForm(true)
  }

  async function abrirStock() {
    if (materiales.length === 0) {
      const { data } = await supabase.from('materiales').select('*').eq('sector', 'electrico').order('nombre', { ascending: true })
      setMateriales(data || [])
      setMaterialesFiltrados(data || [])
    }
    setShowStock(true)
  }

  function agregarMaterial(m: any) {
    if (materialesOrden.find(x => x.id === m.id)) { quitarMaterial(m.id); return }
    setMaterialesOrden(prev => [...prev, { id: m.id, nombre: m.nombre, unidad: m.unidad, cantidad: 1, stock: m.stock_actual, tipo: m.tipo ?? 'material' }])
  }
  function quitarMaterial(id: string) { setMaterialesOrden(prev => prev.filter(m => m.id !== id)) }
  function cambiarCantidad(id: string, valor: number) { setMaterialesOrden(prev => prev.map(m => m.id === id ? { ...m, cantidad: Math.max(1, valor) } : m)) }
  function toggleTecnico(id: string) { setTecnicosSeleccionados(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]) }

  async function crearOrden() {
    const errs: string[] = []
    if (!form.titulo) errs.push('titulo')
    if (!form.tipo) errs.push('tipo')
    if (!form.origen) errs.push('origen')
    if (!form.nomenclatura) errs.push('nomenclatura')
    if (tecnicosSeleccionados.length === 0) errs.push('tecnicos')
    setErrores(errs)
    if (errs.length > 0) return
    setLoading(true)
    const { data: nuevaOrden, error } = await supabase.from('ordenes_trabajo').insert({
      titulo: form.titulo, descripcion: form.descripcion, sector: 'electrico', estado: 'pendiente', subtipo_correctivo: form.subtipo_correctivo || null,
      prioridad: form.prioridad, tipo: form.tipo, origen: form.origen, nomenclatura: form.nomenclatura || null,
      balizamiento_desde: form.balizamiento_desde ? parseFloat(form.balizamiento_desde) : null,
      balizamiento_hasta: form.balizamiento_hasta ? parseFloat(form.balizamiento_hasta) : null,
      balizamiento_hora_ingreso: form.balizamiento_hora_ingreso || null,
      balizamiento_hora_egreso: form.balizamiento_hora_egreso || null,
      km: form.km ? parseFloat(form.km) : null, ubicacion: form.ubicacion,
      activo_id: form.activo_id || null,
      asignado_a: tecnicosSeleccionados[0], creado_por: perfil.id,
      turno: perfil.turno, fecha_programada: form.fecha_programada, campo_libre: form.campo_libre || null,
      supra_id: supraIdParaOT || null
    }).select().single()
    if (!error && nuevaOrden) {
      await supabase.from('orden_tecnicos').insert(tecnicosSeleccionados.map(tid => ({ orden_id: nuevaOrden.id, tecnico_id: tid, cerro: false })))

      // Items del formulario (seleccionados manualmente por el supervisor)
      for (const m of materialesOrden) {
        if (m.stock >= m.cantidad) {
          await supabase.from('orden_materiales').insert({ orden_id: nuevaOrden.id, material_id: m.id, cantidad: m.cantidad, estado: 'solicitado' })
        } else {
          await supabase.from('pedidos_material').insert({ orden_trabajo_id: nuevaOrden.id, solicitado_por: perfil.id, material_nombre: m.nombre, cantidad: m.cantidad, estado: 'pendiente', no_catalogado: false })
        }
      }

      // Items del kit sugerido — se omite cualquier item que el supervisor ya cargó manualmente
      if (kitSugerido) {
        const idsYaCargados = new Set(materialesOrden.map(m => m.id))
        const nombresYaCargados = new Set(materialesOrden.map(m => m.nombre.toLowerCase().trim()))

        for (const item of kitSugerido.items) {
          if (item.material_id) {
            if (idsYaCargados.has(item.material_id)) continue
            await supabase.from('orden_materiales').insert({
              orden_id: nuevaOrden.id,
              material_id: item.material_id,
              cantidad: item.cantidad,
              estado: 'solicitado',
            })
          } else {
            if (nombresYaCargados.has(item.nombre.toLowerCase().trim())) continue
            await supabase.from('pedidos_material').insert({
              orden_trabajo_id: nuevaOrden.id,
              solicitado_por: perfil.id,
              material_nombre: item.nombre,
              cantidad: item.cantidad,
              estado: 'pendiente',
              no_catalogado: true,
              categoria_solicitada: item.categoria,
              observaciones: `Kit ${kitSugerido.label} — subtipo: ${form.subtipo_correctivo}`,
            })
          }
        }
      }
      setLoading(false)
      setShowForm(false)
      setTecnicosSeleccionados([])
      setMaterialesOrden([])
      setForm({ titulo: '', descripcion: '', km: '', ubicacion: '', prioridad: 'normal', tipo: 'correctivo_programado', origen: 'supervisor', nomenclatura: '', fecha_programada: fechaHoyAR(), balizamiento_desde: '', balizamiento_hasta: '', balizamiento_hora_ingreso: '', balizamiento_hora_egreso: '', campo_libre: '', activo_id: '', subtipo_correctivo: '' })
      setActivoSeleccionado(null)
      setTipoActivoSeleccionado('')
      setSubtipoCorrectivo('')
      setSubtipoOtroTexto('')
      setTipoActivoOtroTexto('')
      setSupraIdParaOT(null)
      await Promise.all([cargarDatos(perfil.turno), cargarSuprasPendientes()])

    } else { setLoading(false) }
  }

  function badgeLabel(estado: string) {
    if (estado === 'en_curso') return 'En curso'
    if (estado === 'completada') return 'Completada'
    if (estado === 'cierre_propuesto') return '⏳ En revisión'
    if (estado === 'cerrada') return '✅ Cerrada'
    if (estado === 'derivada') return '🔀 Derivada'
    if (estado === 'devuelta_supervisor') return '↩️ Devuelta'
    if (estado === 'cancelada') return 'Cancelada'
    return 'Pendiente'
  }
  function tipoLabel(tipo: string) {
    if (tipo === 'preventivo_programado') return 'Prev. Prog.'
    if (tipo === 'correctivo_programado') return 'Corr. Prog.'
    if (tipo === 'correctivo_critico') return 'Corr. Crítico'
    if (tipo === 'emergencia') return '🔴 Emergencia'
    return tipo
  }

  const activas = ordenes.filter(o => o.estado === 'pendiente' || o.estado === 'en_curso').length
  const pendientesCheckin = checkinsVehiculos.filter(c => c.estado === 'pendiente_aprobacion').length
  const checkinsFiltrados = checkinsVehiculos.filter(c => {
    if (filtroFecha && c.fecha !== filtroFecha) return false
    if (filtroTurno !== 'todos' && c.turno !== filtroTurno) return false
    return true
  })

  const C = {
    bg: '#07131a', card: '#0c1c24', border: '#1a3040', text: '#e8f4f8',
    sub: '#4a8fa0', accent: '#1ABBD6', warn: '#EF9F27', err: '#E24B4A', ok: '#1D9E75'
  }
  const input = { width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const }
  const inputErr = { ...input, border: `1px solid ${C.err}` }
  const sel = { ...input }
  const selErr = { ...inputErr }

  if (!perfil) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, fontFamily: 'system-ui' }}>Cargando...</div>
  )

  const iconos = {
    ot: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    ordenes: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    vehiculos: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5"/><circle cx="16" cy="19" r="2"/><circle cx="7" cy="19" r="2"/><path d="M13 17H9"/></svg>,
    insumos: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
    historial: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    cronograma: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  }

  const cards = [
    { key: 'ot', label: 'Nueva OT', sub: 'Crear orden de trabajo', icon: iconos.ot, action: () => abrirForm(), badge: null },
    { key: 'ordenes', label: 'Órdenes', sub: `${activas} activas · ${ordenes.length} total`, icon: iconos.ordenes, action: () => setShowOrdenes(true), badge: activas > 0 ? activas : null },
    { key: 'vehiculos', label: 'Vehículos', sub: 'Checkin · Combustible', icon: iconos.vehiculos, action: () => setShowVehiculos(true), badge: pendientesCheckin > 0 ? pendientesCheckin : null },
    { key: 'insumos', label: 'Insumos', sub: `${solicitudes.length} pendientes`, icon: iconos.insumos, action: () => setShowInsumos(true), badge: solicitudes.length > 0 ? solicitudes.length : null },
    { key: 'historial', label: 'Historial', sub: 'Órdenes cerradas', icon: iconos.historial, action: () => router.push('/historial'), badge: null },
    { key: 'cronograma', label: 'Cronograma', sub: `Turno ${perfil.turno}`, icon: iconos.cronograma, action: () => router.push('/dashboard/cronograma'), badge: null },
    { key: 'mapa', label: 'Mapa traza', sub: 'BA–LP · TS y CT', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>, action: () => router.push('/dashboard/mapa'), badge: null },

  ]

  const modal = (content: React.ReactNode, onClose: () => void) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: 16, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: `1px solid ${C.border}` }}>
        {content}
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif', color: C.text }}>

      {/* HEADER */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AvatarUpload
              perfil={perfil}
              onUpdatePerfil={updates => setPerfil((prev: any) => ({ ...prev, ...updates }))}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{perfil.apellido}, {perfil.nombre}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>Supervisor Eléctrico · Turno {perfil.turno}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.accent }}>{hora}</div>
            <div style={{ fontSize: 10, color: C.sub, textTransform: 'capitalize' }}>{fechaDisplay}</div>
          </div>
        </div>
      </div>

      {/* MODAL NUEVA OT */}
      {showForm && modal(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Nueva orden de trabajo</div>
            <button onClick={() => { setShowForm(false); setTecnicosSeleccionados([]); setMaterialesOrden([]); setSupraIdParaOT(null) }}
              style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CANCELAR</button>
          </div>
          {supraIdParaOT && suprasPendientes.find(s => s.id === supraIdParaOT) && (
            <div style={{ background: '#071f2e', border: '1px solid #1ABBD6', borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 9, color: '#1ABBD6', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Vinculada a OT Supra</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e8f4f8', marginTop: 2 }}>
                  S-{String(suprasPendientes.find(s => s.id === supraIdParaOT)?.numero_supra).padStart(4,'0')} · {suprasPendientes.find(s => s.id === supraIdParaOT)?.titulo}
                </div>
              </div>
              <span style={{ fontSize: 10, color: '#1ABBD6', background: '#0F2A35', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>AUTO</span>
            </div>
          )}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Título *</div>
            <input style={errores.includes('titulo') ? { ...inputErr, marginBottom: 12 } : { ...input, marginBottom: 12 }}
              placeholder="Ej: Reemplazo luminaria LED" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Tipo *</div>
                <select style={errores.includes('tipo') ? selErr : sel} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="preventivo_programado">Prev. Programado</option>
                  <option value="correctivo_programado">Corr. Programado</option>
                  <option value="correctivo_critico">Corr. Crítico</option>
                  <option value="emergencia">🔴 Emergencia</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Origen *</div>
                <select style={errores.includes('origen') ? selErr : sel} value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value })}>
                  <option value="gerencia">Gerencia</option>
                  <option value="jefe">Jefe</option>
                  <option value="patrimonial">Patrimonial</option>
                  <option value="monitoreo">Monitoreo</option>
                  <option value="cae">CAE</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="tecnico">Técnico</option>
                </select>
              </div>
            </div>

            {['correctivo_programado', 'correctivo_critico', 'emergencia'].includes(form.tipo) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Tipo de correctivo</div>
                <select style={{ ...sel, marginBottom: subtipoCorrectivo === 'otros' ? 8 : 0 }}
                  value={subtipoCorrectivo}
                  onChange={e => {
                    const v = e.target.value
                    setSubtipoCorrectivo(v)
                    setSubtipoOtroTexto('')
                    setForm(prev => ({ ...prev, subtipo_correctivo: v === 'otros' ? '' : v }))
                    setKitSugerido(v && v !== 'otros' ? getKitBySubtipo(v) : null)
                  }}>
                  <option value="">— Seleccioná tipo de correctivo —</option>
                  <option value="traza_luminarias">Correctivo traza luminarias</option>
                  <option value="empalmes_380">Correctivo empalmes 380 V</option>
                  <option value="empalmes_1kv">Correctivo empalmes 1 kV</option>
                  <option value="otros">Otros</option>
                </select>
                {subtipoCorrectivo === 'otros' && (
                  <input style={{ ...input, marginBottom: 0 }}
                    placeholder="Describí el tipo de correctivo..."
                    value={subtipoOtroTexto}
                    onChange={e => {
                      setSubtipoOtroTexto(e.target.value)
                      setForm(prev => ({ ...prev, subtipo_correctivo: e.target.value }))
                    }}
                  />
                )}
              </div>
            )}

            {kitSugerido && (
              <div style={{ background: '#071f2e', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: C.accent, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>
                  Kit sugerido · {kitSugerido.label}
                </div>
                {(['epp', 'material', 'herramienta'] as const).map(cat => {
                  const items = kitSugerido.items.filter(i => i.categoria === cat)
                  if (items.length === 0) return null
                  const catLabel = cat === 'epp' ? '🦺 EPP' : cat === 'material' ? '📦 Materiales' : '🔧 Herramientas'
                  return (
                    <div key={cat} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 9, color: C.sub, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>{catLabel}</div>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 12, color: item.material_id ? C.text : C.warn }}>{item.nombre}</span>
                            {!item.material_id && (
                              <span style={{ fontSize: 9, color: C.warn, fontWeight: 700, marginLeft: 6, background: '#3A2A00', padding: '1px 5px', borderRadius: 4 }}>NO CATALOGADO</span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: C.sub, marginLeft: 8 }}>{item.cantidad} {item.unidad}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Descripción</div>

            <textarea style={{ ...input, marginBottom: 12, resize: 'none' } as any} rows={2}
              placeholder="Detalle de la tarea" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Km</div>
                <input style={input} placeholder="38.4" value={form.km} onChange={e => setForm({ ...form, km: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Prioridad</div>
                <select style={sel} value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Activo / Nomenclatura *</div>
            <select style={{ ...sel, marginBottom: 8 }}
              value={tipoActivoSeleccionado}
              onChange={e => { setTipoActivoSeleccionado(e.target.value); setActivoSeleccionado(null); setForm(prev => ({ ...prev, activo_id: '', nomenclatura: '' })) }}>
              <option value="">Tipo de activo</option>
              <option value="TS">TS — Tablero Seccional</option>
              <option value="TG">TG — Tablero General Ruta 36</option>
              <option value="TRG">TRG — Tablero Ramal Gutiérrez</option>
              <option value="SET">SET — Subestación</option>
              <option value="PLAZA_PEAJE">Plaza de Peaje</option>
              <option value="BAJO_PUENTE">Bajo Puente</option>
              <option value="OTROS">Otros</option>
            </select>
            {tipoActivoSeleccionado === 'OTROS' && (
              <input style={{ ...input, marginBottom: 8 }}
                placeholder="Describí el activo (cámara, semáforo, barrera, etc.)"
                value={tipoActivoOtroTexto}
                onChange={e => {
                  setTipoActivoOtroTexto(e.target.value)
                  setActivoSeleccionado(null)
                  setForm(prev => ({ ...prev, activo_id: '', nomenclatura: e.target.value }))
                }}
              />
            )}
            {tipoActivoSeleccionado && tipoActivoSeleccionado !== 'OTROS' && (
              <select style={{ ...sel, marginBottom: 8 }}
                value={form.activo_id}
                onChange={e => {
                  const a = activos.find(x => x.id === e.target.value)
                  if (!a || a.estado === 'fuera_servicio') return
                  setActivoSeleccionado(a)
                  setForm(prev => ({ ...prev, activo_id: a.id }))
                }}>
                <option value="">Seleccioná activo</option>
                {activos
                  .filter(a => a.tipo === tipoActivoSeleccionado)
                  .sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }))
                  .map(a => {
                    const fueraServicio = a.estado === 'fuera_servicio'
                    const reemplazadoPor = fueraServicio && a.reemplazado_por_id ? activos.find(x => x.id === a.reemplazado_por_id) : null
                    return (
                      <option key={a.id} value={a.id} disabled={fueraServicio}>
                        {a.codigo} - {a.nombre}{fueraServicio ? ` — fuera de servicio${reemplazadoPor ? ` — usar ${reemplazadoPor.codigo}` : ''}` : ''}
                      </option>
                    )
                  })}
              </select>
            )}
            {activoSeleccionado && (
              <div style={{ fontSize: 10, color: C.accent, marginBottom: 8, marginTop: -8 }}>
                ✓ {activoSeleccionado.tipo} · {activoSeleccionado.ramal}{activoSeleccionado.sentido_operativo ? ` · ${activoSeleccionado.sentido_operativo}` : ''}
              </div>
            )}

            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Tipo de intervención *</div>
            <select style={errores.includes('nomenclatura') ? { ...selErr, marginBottom: 12 } : { ...sel, marginBottom: 12 }}
              value={form.nomenclatura}
              onChange={e => setForm(prev => ({ ...prev, nomenclatura: e.target.value }))}>
              <option value="">Seleccioná tipo de intervención</option>
              {nomenclaturas.map(n => (
                <option key={n.id} value={n.codigo}>{n.codigo} · {n.descripcion}</option>
              ))}
            </select>

            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Ubicación (referencia libre)</div>
            <input style={{ ...input, marginBottom: 12 }} placeholder="Ej: Shoulder externo" value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} />

            {/* TÉCNICOS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                Técnicos * {tecnicosSeleccionados.length > 0 && <span style={{ color: C.accent }}>({tecnicosSeleccionados.length})</span>}
                {errores.includes('tecnicos') && <span style={{ color: C.err, marginLeft: 6 }}>— Seleccioná al menos uno</span>}
              </div>
              <button onClick={() => setVerTodosTecnicos(v => !v)}
                style={{ background: verTodosTecnicos ? '#3A2A00' : C.bg, border: `1px solid ${C.border}`, borderRadius: 6, color: verTodosTecnicos ? C.warn : C.sub, fontSize: 11, fontWeight: 600, padding: '3px 8px', cursor: 'pointer' }}>
                {verTodosTecnicos ? '← Mi grupo' : 'Ver todos'}
              </button>
            </div>
            <div style={{ background: C.bg, border: `1px solid ${errores.includes('tecnicos') ? C.err : C.border}`, borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
              {(() => {
                const esJefeOAdmin = perfil?.rol === 'jefe' || perfil?.rol === 'superadmin'
                const lista = (verTodosTecnicos || esJefeOAdmin)
                  ? todosLosTecnicos
                  : tecnicos.filter((t: any) => t.grupo === perfil?.grupo)
                if (lista.length === 0) return (
                  <div style={{ padding: '10px 12px', fontSize: 12, color: C.sub }}>
                    {verTodosTecnicos || esJefeOAdmin ? 'No hay técnicos disponibles' : 'No hay técnicos de tu grupo disponibles'}
                  </div>
                )
                return lista.map((t: any, i: number) => (
                  <div key={t.id} onClick={() => toggleTecnico(t.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderBottom: i < lista.length - 1 ? `1px solid ${C.border}` : 'none', background: tecnicosSeleccionados.includes(t.id) ? '#0F2A35' : 'transparent' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${tecnicosSeleccionados.includes(t.id) ? C.accent : '#2a4050'}`, background: tecnicosSeleccionados.includes(t.id) ? C.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {tecnicosSeleccionados.includes(t.id) && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{t.apellido}, {t.nombre}</span>
                    {(verTodosTecnicos || esJefeOAdmin) && t.grupo !== perfil?.grupo && (
                      <span style={{ fontSize: 10, background: '#3A2A00', color: C.warn, padding: '2px 6px', borderRadius: 10, marginLeft: 'auto' }}>Gr.{t.grupo}</span>
                    )}
                  </div>
                ))
              })()}
            </div>

            {/* MATERIALES */}
            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>
              Materiales / Insumos / Herramientas
              {materialesOrden.filter(m => (m as any).tipo !== 'herramienta').length > 0 && <span style={{ color: C.accent }}> · 📦 {materialesOrden.filter(m => (m as any).tipo !== 'herramienta').length}</span>}
              {materialesOrden.filter(m => (m as any).tipo === 'herramienta').length > 0 && <span style={{ color: C.warn }}> · 🔧 {materialesOrden.filter(m => (m as any).tipo === 'herramienta').length}</span>}
            </div>
            <button onClick={abrirStock} style={{ width: '100%', background: C.bg, border: `1px solid ${C.accent}`, borderRadius: 10, color: C.accent, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer', marginBottom: 8 }}>
              📦 Agregar materiales / herramientas
            </button>
            {materialesOrden.length > 0 && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                {materialesOrden.map((m, i) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < materialesOrden.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: C.text }}>{m.nombre}</div>
                      <div style={{ fontSize: 10, color: m.stock >= m.cantidad ? C.ok : C.err }}>{m.stock >= m.cantidad ? `Stock: ${m.stock}` : 'Sin stock — pedido al pañol'}</div>
                    </div>
                    <input type="number" min={1} value={m.cantidad} onChange={e => cambiarCantidad(m.id, parseInt(e.target.value) || 1)}
                      style={{ width: 50, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 6px', fontSize: 12, color: C.text, outline: 'none', textAlign: 'center' }} />
                    <span style={{ fontSize: 10, color: C.sub }}>{m.unidad}</span>
                    <button onClick={() => quitarMaterial(m.id)} style={{ background: 'none', border: 'none', color: C.err, fontSize: 14, cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* CAMPO LIBRE CONDICIONAL */}
            {nomenclaturas.find((n: any) => n.codigo === form.nomenclatura)?.pide_campo_libre && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>📋 Detalle de inspección</div>
                <textarea style={{ ...input, resize: 'none' } as any} rows={3} placeholder="Describí lo relevado..." value={form.campo_libre} onChange={e => setForm({ ...form, campo_libre: e.target.value })} />
              </div>
            )}

            {/* BALIZAMIENTO CONDICIONAL */}
            {nomenclaturas.find((n: any) => n.codigo === form.nomenclatura)?.pide_balizamiento && (
              <div style={{ background: '#3A2A00', border: `1px solid ${C.warn}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: C.warn, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>⚠️ Balizamiento requerido</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Desde km', 'balizamiento_desde', '38.0'], ['Hasta km', 'balizamiento_hasta', '38.5']].map(([label, key, ph]) => (
                    <div key={key}>
                      <div style={{ fontSize: 9, color: C.sub, marginBottom: 3 }}>{label}</div>
                      <input style={input} placeholder={ph} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                    </div>
                  ))}
                  {[['Hora ingreso', 'balizamiento_hora_ingreso'], ['Hora egreso', 'balizamiento_hora_egreso']].map(([label, key]) => (
                    <div key={key}>
                      <div style={{ fontSize: 9, color: C.sub, marginBottom: 3 }}>{label}</div>
                      <input type="time" style={input} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Fecha programada</div>
            <input type="date" style={{ ...input, marginBottom: 16 }} value={form.fecha_programada} onChange={e => setForm({ ...form, fecha_programada: e.target.value })} />

            <button onClick={crearOrden} disabled={loading}
              style={{ width: '100%', background: loading ? C.border : C.accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, padding: '13px 0', cursor: loading ? 'default' : 'pointer' }}>
              {loading ? 'Creando...' : 'CREAR ORDEN'}
            </button>
          </div>
        </>,
        () => { setShowForm(false); setTecnicosSeleccionados([]); setMaterialesOrden([]) }
      )}

      {/* MODAL STOCK */}
      {showStock && modal(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Seleccionar ítems</div>
            <button onClick={() => { setShowStock(false); setBusqueda('') }} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <input style={{ ...input, marginBottom: 10 }} placeholder="Escribí 2 letras para buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} autoFocus />
          {materialesOrden.length > 0 && (
            <div style={{ background: C.bg, border: `1px solid ${C.accent}`, borderRadius: 8, padding: '6px 10px', marginBottom: 8, fontSize: 11, color: C.accent }}>
              {materialesOrden.map(m => `${m.nombre} ×${m.cantidad}`).join(' · ')}
            </div>
          )}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {busqueda.trim().length < 2 ? (
              <div style={{ textAlign: 'center' as const, color: C.sub, fontSize: 12, padding: '24px 0' }}>Escribí al menos 2 letras para buscar</div>
            ) : (
              <>
                {/* Sección: Materiales / Insumos / Repuestos */}
                {materialesFiltrados.filter((m: any) => m.tipo !== 'herramienta').length > 0 && (
                  <>
                    <div style={{ fontSize: 9, color: C.sub, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, padding: '8px 0 4px' }}>📦 Materiales / Insumos / Repuestos</div>
                    {materialesFiltrados.filter((m: any) => m.tipo !== 'herramienta').map((m: any, i: number, arr: any[]) => (
                      <div key={m.id} onClick={() => agregarMaterial(m)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}>
                        <div>
                          <div style={{ fontSize: 13, color: C.text }}>{m.nombre}</div>
                          <div style={{ fontSize: 10, color: C.sub }}>{m.unidad} · {m.tipo}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {materialesOrden.find(x => x.id === m.id) && <span style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>✓</span>}
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: m.stock_actual > 0 ? '#0F2A35' : '#2A0F0F', color: m.stock_actual > 0 ? C.accent : C.err }}>
                            {m.stock_actual > 0 ? `${m.stock_actual} ${m.unidad}` : 'Sin stock'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {/* Sección: Herramientas */}
                {materialesFiltrados.filter((m: any) => m.tipo === 'herramienta').length > 0 && (
                  <>
                    <div style={{ fontSize: 9, color: C.warn, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, padding: '12px 0 4px' }}>🔧 Herramientas</div>
                    {materialesFiltrados.filter((m: any) => m.tipo === 'herramienta').map((m: any, i: number, arr: any[]) => (
                      <div key={m.id} onClick={() => agregarMaterial(m)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}>
                        <div>
                          <div style={{ fontSize: 13, color: C.text }}>{m.nombre}</div>
                          <div style={{ fontSize: 10, color: C.sub }}>{m.unidad}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {materialesOrden.find(x => x.id === m.id) && <span style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>✓</span>}
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: m.stock_actual > 0 ? '#0F2A35' : '#2A0F0F', color: m.stock_actual > 0 ? C.accent : C.err }}>
                            {m.stock_actual > 0 ? `${m.stock_actual} ${m.unidad}` : 'Sin stock'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {materialesFiltrados.length === 0 && (
                  <div style={{ textAlign: 'center' as const, color: C.sub, fontSize: 12, padding: '24px 0' }}>Sin resultados</div>
                )}
              </>
            )}
          </div>
        </>,
        () => setShowStock(false)
      )}

     

      {/* MODAL DETALLE ORDEN */}
      {ordenDetalle && modal(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const }}>OT-{String(ordenDetalle.numero_orden).padStart(5, '0')}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{ordenDetalle.titulo}</div>
            </div>
            <button onClick={() => setOrdenDetalle(null)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[['Estado', badgeLabel(ordenDetalle.estado)], ['Prioridad', ordenDetalle.prioridad], ['Tipo', tipoLabel(ordenDetalle.tipo)], ['Origen', ordenDetalle.origen]].map(([k, v]) => (
                <div key={k} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{k}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
            {(ordenDetalle.km || ordenDetalle.ubicacion) && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const }}>Ubicación</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 2 }}>{ordenDetalle.km ? `Km ${ordenDetalle.km}` : ''}{ordenDetalle.ubicacion ? ` · ${ordenDetalle.ubicacion}` : ''}</div>
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
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const }}>Descripción</div>
                <div style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{ordenDetalle.descripcion}</div>
              </div>
            )}
            {ordenDetalle.tecnicos?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>Técnicos</div>
                {ordenDetalle.tecnicos.map((t: any) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: C.text }}>{[t.profiles?.apellido, t.profiles?.nombre].filter(Boolean).join(', ')}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: t.cerro ? '#0F6E56' : C.bg, color: t.cerro ? '#9FE1CB' : C.sub }}>{t.cerro ? 'Cerró' : 'Pendiente'}</span>
                  </div>
                ))}
              </div>
            )}
            {ordenDetalle.materiales?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>Materiales</div>
                {ordenDetalle.materiales.map((m: any) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: C.text }}>{m.materiales?.nombre}</span>
                    <span style={{ fontSize: 11, color: C.sub }}>{m.cantidad_solicitada} {m.materiales?.unidad}</span>
                  </div>
                ))}
              </div>
            )}
            {ordenDetalle.pedidos?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>Pedidos a pañol</div>
                {ordenDetalle.pedidos.map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2A0F0F', border: `1px solid ${C.err}44`, borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#F09595' }}>{p.material_nombre}</span>
                    <span style={{ fontSize: 11, color: '#F09595', fontWeight: 600 }}>{p.estado}</span>
                  </div>
                ))}
              </div>
            )}
          {(ordenDetalle.trabajos_realizados || ordenDetalle.mediciones || ordenDetalle.pendientes_descripcion) && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <div style={{ fontSize: 9, color: C.accent, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>Informe del técnico</div>
                {ordenDetalle.trabajos_realizados && (
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Trabajos realizados</div>
                    <div style={{ fontSize: 13, color: C.text }}>{ordenDetalle.trabajos_realizados}</div>
                  </div>
                )}
                {ordenDetalle.mediciones && (
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Mediciones</div>
                    <div style={{ fontSize: 13, color: C.text }}>{ordenDetalle.mediciones}</div>
                  </div>
                )}
                {ordenDetalle.pendientes_descripcion && (
                  <div style={{ background: '#1A1000', border: `1px solid ${C.warn}44`, borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: C.warn, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>⚠️ Trabajos pendientes</div>
                    <div style={{ fontSize: 13, color: C.text }}>{ordenDetalle.pendientes_descripcion}</div>
                  </div>
                )}
              </div>
            )}
            {ordenDetalle.estado === 'pendiente' && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10 }}>Acciones</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => setShowReprogramar(true)}
                    style={{ background: 'none', border: `1px solid ${C.accent}`, borderRadius: 10, color: C.accent, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    📅 REPROGRAMAR
                  </button>
                  <button
                    onClick={() => {
                      setTecnicosReasignados(ordenDetalle.tecnicos?.map((t: any) => t.tecnico_id) || [])
                      setShowReasignar(true)
                    }}
                    style={{ background: 'none', border: `1px solid ${C.accent}`, borderRadius: 10, color: C.accent, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    👷 REASIGNAR TÉCNICOS
                  </button>
                  <button
                    onClick={async () => {
                      if (nomenclaturas.length === 0) {
                        const { data, error } = await supabase
                          .from('nomenclaturas')
                          .select('*')
                          .eq('sector', 'electrico')
                          .order('codigo', { ascending: true })
                        if (error || !data) {
                          alert('Error al cargar nomenclaturas. Intentá de nuevo.')
                          return
                        }
                        setNomenclaturas(data)
                      }
                      setFormEditar({
                        titulo: ordenDetalle.titulo,
                        descripcion: ordenDetalle.descripcion || '',
                        km: ordenDetalle.km ? String(ordenDetalle.km) : '',
                        ubicacion: ordenDetalle.ubicacion || '',
                        prioridad: ordenDetalle.prioridad,
                        tipo: ordenDetalle.tipo,
                        origen: ordenDetalle.origen,
                        nomenclatura: ordenDetalle.nomenclatura || '',
                        fecha_programada: ordenDetalle.fecha_programada || '',
                        balizamiento_desde: ordenDetalle.balizamiento_desde ? String(ordenDetalle.balizamiento_desde) : '',
                        balizamiento_hasta: ordenDetalle.balizamiento_hasta ? String(ordenDetalle.balizamiento_hasta) : '',
                        balizamiento_hora_ingreso: ordenDetalle.balizamiento_hora_ingreso || '',
                        balizamiento_hora_egreso: ordenDetalle.balizamiento_hora_egreso || '',
                        campo_libre: ordenDetalle.campo_libre || '',
                      })
                      setShowEditarOT(true)
                    }}
                    style={{ background: 'none', border: `1px solid ${C.accent}`, borderRadius: 10, color: C.accent, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    ✏️ EDITAR ORDEN
                  </button>
                  <button
                    onClick={() => setShowCancelar(true)}
                    style={{ background: 'none', border: `1px solid ${C.err}`, borderRadius: 10, color: C.err, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    🗑 SOLICITAR ELIMINACIÓN
                  </button>

                </div>
              </div>
            )}
          {ordenDetalle.estado === 'cierre_propuesto' && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10 }}>Decisión del supervisor</div>
                {!showDevolucion ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {!otHijaCreada && (
                      <div style={{ background: '#2A1A00', border: '1px solid #EF9F2744', borderRadius: 8, padding: '10px 12px', marginBottom: 4 }}>
                        {necesitaDerivada() && (
                          <>
                            <div style={{ fontSize: 12, color: '#EF9F27', fontWeight: 700, marginBottom: 4 }}>⚠️ Este informe requiere OT derivada</div>
                            <div style={{ fontSize: 11, color: '#b0c4ce', marginBottom: 8 }}>
                              {informeDetalle?.requiere_seguimiento && <div>· Requiere seguimiento: {informeDetalle?.seguimiento_detalle || 'sí'}</div>}
                              {informeDetalle?.activo_operativo === false && <div>· Activo no operativo</div>}
                              {informeDetalle?.riesgo_tipo !== 'ninguno' && informeDetalle?.riesgo_controlado === false && <div>· Riesgo no controlado: {informeDetalle.riesgo_tipo}</div>}
                            </div>
                          </>
                        )}
                        <button onClick={crearOTHija} disabled={loadingOTHija}
                          style={{ width: '100%', background: loadingOTHija ? '#1a3040' : '#EF9F27', border: 'none', borderRadius: 8, color: '#0D0D0D', fontWeight: 700, fontSize: 12, padding: '10px 0', cursor: 'pointer' }}>
                          {loadingOTHija ? 'Creando...' : '➕ CREAR OT DERIVADA'}
                        </button>
                      </div>
                    )}
                    {otHijaActiva && (
                      <div style={{ background: '#0F2A1F', border: '1px solid #1D9E75', borderRadius: 8, padding: '8px 12px', marginBottom: 4 }}>
                        <div style={{ fontSize: 12, color: '#1D9E75', fontWeight: 700 }}>✅ OT derivada activa</div>
                      </div>
                    )}
                    <button onClick={() => aprobarCierre(ordenDetalle.id)} disabled={loadingDecision || (necesitaDerivada() && !otHijaActiva)}
                      style={{ background: loadingDecision || (necesitaDerivada() && !otHijaActiva) ? '#1a3040' : '#1D9E75', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: loadingDecision || (necesitaDerivada() && !otHijaActiva) ? 'default' : 'pointer' }}>
                      ✅ APROBAR CIERRE
                    </button>
                    <button onClick={() => setShowDevolucion(true)} disabled={loadingDecision}
                      style={{ background: 'none', border: `1px solid ${C.warn}`, borderRadius: 10, color: C.warn, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                      ↩️ DEVOLVER AL TÉCNICO
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea placeholder="Observación para el técnico..." rows={3}
                      style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', resize: 'none', boxSizing: 'border-box' as const } as any}
                      value={obsDevolucion} onChange={e => setObsDevolucion(e.target.value)} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setShowDevolucion(false); setObsDevolucion('') }}
                        style={{ flex: 1, background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontWeight: 700, fontSize: 13, padding: '10px 0', cursor: 'pointer' }}>
                        CANCELAR
                      </button>
                      <button onClick={() => devolverAlTecnico(ordenDetalle.id)} disabled={loadingDecision || !obsDevolucion.trim()}
                        style={{ flex: 1, background: loadingDecision || !obsDevolucion.trim() ? '#1a3040' : C.warn, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '10px 0', cursor: 'pointer' }}>
                        {loadingDecision ? 'Enviando...' : 'CONFIRMAR'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
          </div>
        </>,
        () => { setOrdenDetalle(null); setShowDevolucion(false); setObsDevolucion('') }
        
      )}
      {showEditarOT && formEditar && modal(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>✏️ Editar orden</div>
            <button onClick={() => { setShowEditarOT(false); setFormEditar(null) }}
              style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 14 }}>
              OT-{ordenDetalle ? String(ordenDetalle.numero_orden).padStart(5, '0') : ''}
            </div>

            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Título *</div>
            <input style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 12 }}
              value={formEditar.titulo} onChange={e => setFormEditar({ ...formEditar, titulo: e.target.value })} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Tipo *</div>
                <select style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const }}
                  value={formEditar.tipo} onChange={e => setFormEditar({ ...formEditar, tipo: e.target.value })}>
                  <option value="preventivo_programado">Prev. Programado</option>
                  <option value="correctivo_programado">Corr. Programado</option>
                  <option value="correctivo_critico">Corr. Crítico</option>
                  <option value="emergencia">🔴 Emergencia</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Origen *</div>
                <select style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const }}
                  value={formEditar.origen} onChange={e => setFormEditar({ ...formEditar, origen: e.target.value })}>
                  <option value="gerencia">Gerencia</option>
                  <option value="jefe">Jefe</option>
                  <option value="patrimonial">Patrimonial</option>
                  <option value="monitoreo">Monitoreo</option>
                  <option value="cae">CAE</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="tecnico">Técnico</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Nomenclatura *</div>
            <select style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 12 }}
              value={formEditar.nomenclatura} onChange={e => setFormEditar({ ...formEditar, nomenclatura: e.target.value })}>
              <option value="">Seleccioná una categoría</option>
              {nomenclaturas.map(n => <option key={n.id} value={n.codigo}>{n.codigo} · {n.descripcion}</option>)}
            </select>

            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Descripción</div>
            <textarea style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', resize: 'none', boxSizing: 'border-box' as const, marginBottom: 12 } as any}
              rows={3} value={formEditar.descripcion} onChange={e => setFormEditar({ ...formEditar, descripcion: e.target.value })} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Km</div>
                <input style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const }}
                  placeholder="38.4" value={formEditar.km} onChange={e => setFormEditar({ ...formEditar, km: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Prioridad</div>
                <select style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const }}
                  value={formEditar.prioridad} onChange={e => setFormEditar({ ...formEditar, prioridad: e.target.value })}>
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Ubicación</div>
            <input style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 12 }}
              placeholder="Ej: Shoulder externo" value={formEditar.ubicacion} onChange={e => setFormEditar({ ...formEditar, ubicacion: e.target.value })} />

            {nomenclaturas.find((n: any) => n.codigo === formEditar.nomenclatura)?.pide_campo_libre && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>📋 Detalle de inspección</div>
                <textarea style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', resize: 'none', boxSizing: 'border-box' as const } as any}
                  rows={3} placeholder="Describí lo relevado..." value={formEditar.campo_libre} onChange={e => setFormEditar({ ...formEditar, campo_libre: e.target.value })} />
              </div>
            )}

            {nomenclaturas.find((n: any) => n.codigo === formEditar.nomenclatura)?.pide_balizamiento && (
              <div style={{ background: '#3A2A00', border: `1px solid ${C.warn}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: C.warn, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>⚠️ Balizamiento requerido</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Desde km', 'balizamiento_desde', '38.0'], ['Hasta km', 'balizamiento_hasta', '38.5']].map(([label, key, ph]) => (
                    <div key={key}>
                      <div style={{ fontSize: 9, color: C.sub, marginBottom: 3 }}>{label}</div>
                      <input style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const }}
                        placeholder={ph} value={(formEditar as any)[key]} onChange={e => setFormEditar({ ...formEditar, [key]: e.target.value })} />
                    </div>
                  ))}
                  {[['Hora ingreso', 'balizamiento_hora_ingreso'], ['Hora egreso', 'balizamiento_hora_egreso']].map(([label, key]) => (
                    <div key={key}>
                      <div style={{ fontSize: 9, color: C.sub, marginBottom: 3 }}>{label}</div>
                      <input type="time" style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const }}
                        value={(formEditar as any)[key]} onChange={e => setFormEditar({ ...formEditar, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Fecha programada</div>
            <input type="date" style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 16 }}
              value={formEditar.fecha_programada} onChange={e => setFormEditar({ ...formEditar, fecha_programada: e.target.value })} />

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowEditarOT(false); setFormEditar(null) }}
                style={{ flex: 1, background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                VOLVER
              </button>
              <button onClick={() => ordenDetalle && editarOrden(ordenDetalle.id)}
                disabled={loadingAccion || !formEditar.titulo.trim()}
                style={{ flex: 1, background: loadingAccion || !formEditar.titulo.trim() ? '#1a3040' : C.accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: loadingAccion || !formEditar.titulo.trim() ? 'default' : 'pointer' }}>
                {loadingAccion ? 'Guardando...' : 'GUARDAR CAMBIOS'}
              </button>
            </div>
          </div>
        </>,
        () => { setShowEditarOT(false); setFormEditar(null) }
      )}
      {showReasignar && modal(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>👷 Reasignar técnicos</div>
            <button onClick={() => { setShowReasignar(false); setTecnicosReasignados([]) }}
              style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 14 }}>
              OT-{ordenDetalle ? String(ordenDetalle.numero_orden).padStart(5, '0') : ''} · {ordenDetalle?.titulo}
            </div>
            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>
              Técnicos {tecnicosReasignados.length > 0 && <span style={{ color: C.accent }}>({tecnicosReasignados.length})</span>}
            </div>
            <div style={{ background: C.bg, border: `1px solid ${tecnicosReasignados.length === 0 ? C.err : C.border}`, borderRadius: 10, marginBottom: 14, overflow: 'hidden' }}>
              {todosLosTecnicos.length === 0
                ? <div style={{ padding: '10px 12px', fontSize: 12, color: C.sub }}>No hay técnicos disponibles</div>
                : todosLosTecnicos.map((t: any, i: number) => (
                  <div key={t.id} onClick={() => setTecnicosReasignados(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderBottom: i < todosLosTecnicos.length - 1 ? `1px solid ${C.border}` : 'none', background: tecnicosReasignados.includes(t.id) ? '#0F2A35' : 'transparent' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${tecnicosReasignados.includes(t.id) ? C.accent : '#2a4050'}`, background: tecnicosReasignados.includes(t.id) ? C.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {tecnicosReasignados.includes(t.id) && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{t.apellido}, {t.nombre}</span>
                  </div>
                ))
              }
            </div>
            {tecnicosReasignados.length > 0 && (
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 14 }}>
                Asignado principal: <span style={{ color: C.accent, fontWeight: 600 }}>
                  {(() => {
                    const t = todosLosTecnicos.find((t: any) => t.id === tecnicosReasignados[0])
                    return t ? `${t.apellido}, ${t.nombre}` : '—'
                  })()}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowReasignar(false); setTecnicosReasignados([]) }}
                style={{ flex: 1, background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                VOLVER
              </button>
              <button
                onClick={() => ordenDetalle && reasignarTecnicos(ordenDetalle.id)}
                disabled={loadingAccion || tecnicosReasignados.length === 0}
                style={{ flex: 1, background: loadingAccion || tecnicosReasignados.length === 0 ? '#1a3040' : C.accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: loadingAccion || tecnicosReasignados.length === 0 ? 'default' : 'pointer' }}>
                {loadingAccion ? 'Guardando...' : 'CONFIRMAR'}
              </button>
            </div>
          </div>
        </>,
        () => { setShowReasignar(false); setTecnicosReasignados([]) }
      )}
      {showReprogramar && modal(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>📅 Reprogramar orden</div>
            <button onClick={() => { setShowReprogramar(false); setNuevaFecha('') }}
              style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 14 }}>
              OT-{ordenDetalle ? String(ordenDetalle.numero_orden).padStart(5, '0') : ''} · {ordenDetalle?.titulo}
            </div>
            {ordenDetalle?.fecha_programada && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 2 }}>Fecha actual</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.warn }}>
                  {ordenDetalle.fecha_programada.slice(0, 10).split('-').reverse().join('/')}
                </div>
              </div>
            )}
            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>Nueva fecha *</div>
            <input
              type="date"
              style={{ width: '100%', background: C.bg, border: `1px solid ${nuevaFecha ? C.accent : C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 14 }}
              value={nuevaFecha}
              onChange={e => setNuevaFecha(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowReprogramar(false); setNuevaFecha('') }}
                style={{ flex: 1, background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                VOLVER
              </button>
              <button
                onClick={() => ordenDetalle && reprogramarOrden(ordenDetalle.id)}
                disabled={loadingAccion || !nuevaFecha}
                style={{ flex: 1, background: loadingAccion || !nuevaFecha ? '#1a3040' : C.accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: loadingAccion || !nuevaFecha ? 'default' : 'pointer' }}>
                {loadingAccion ? 'Guardando...' : 'CONFIRMAR'}
              </button>
            </div>
          </div>
        </>,
        () => { setShowReprogramar(false); setNuevaFecha('') }
      )}
{showCancelar && modal(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.err }}>🗑 Solicitar eliminación</div>
            <button onClick={() => { setShowCancelar(false); setMotivoCancelacion('') }}
              style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ background: '#2A0F0F', border: `1px solid ${C.err}44`, borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#F09595' }}>
                Estás solicitando al jefe la eliminación de <strong>OT-{ordenDetalle ? String(ordenDetalle.numero_orden).padStart(5, '0') : ''}</strong>. El jefe decidirá si procede o rechaza.
              </div>
            </div>
            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>Motivo *</div>
            <textarea
              style={{ width: '100%', background: C.bg, border: `1px solid ${motivoCancelacion.trim() ? C.err : C.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: C.text, outline: 'none', resize: 'none', boxSizing: 'border-box' as const, marginBottom: 14 }}
              rows={3}
              placeholder="Explicá por qué debe eliminarse esta orden..."
              value={motivoCancelacion}
              onChange={e => setMotivoCancelacion(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowCancelar(false); setMotivoCancelacion('') }}
                style={{ flex: 1, background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                VOLVER
              </button>
              <button
                onClick={() => ordenDetalle && solicitarEliminacionOrden(ordenDetalle.id)}
                disabled={loadingAccion || !motivoCancelacion.trim()}
                style={{ flex: 1, background: loadingAccion || !motivoCancelacion.trim() ? '#1a3040' : '#7B1E1E', border: 'none', borderRadius: 10, color: loadingAccion || !motivoCancelacion.trim() ? C.sub : '#F09595', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: loadingAccion || !motivoCancelacion.trim() ? 'default' : 'pointer' }}>
                {loadingAccion ? 'Enviando...' : 'SOLICITAR ELIMINACIÓN'}
              </button>
            </div>
          </div>
        </>,
        () => { setShowCancelar(false); setMotivoCancelacion('') }
      )}
      {/* MODAL LISTA ORDENES */}
      {showOrdenes && modal(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Órdenes de trabajo · {ordenes.length}</div>
            <button onClick={() => setShowOrdenes(false)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <input style={{ ...input, marginBottom: 10 }} placeholder="Buscar por número o fecha..."
            value={busquedaOrden} onChange={e => setBusquedaOrden(e.target.value)} />
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {ordenes.filter(o => {
              if (!busquedaOrden.trim()) return true
              const q = busquedaOrden.toLowerCase()
              return String(o.numero_orden).padStart(5, '0').includes(q) || o.titulo?.toLowerCase().includes(q)
            }).map(o => (
              <div key={o.id} onClick={() => abrirDetalle(o)}
                style={{ background: C.bg, border: `1px solid ${o.estado === 'en_curso' ? C.warn : C.border}`, borderLeft: `3px solid ${o.estado === 'en_curso' ? C.warn : C.accent}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>OT-{String(o.numero_orden || 0).padStart(5, '0')} {o.fecha_programada && <span style={{ color: C.sub, fontWeight: 400 }}>· {formatFechaAR(o.fecha_programada)}</span>}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{o.titulo}</div>
                    {o.km && <div style={{ fontSize: 11, color: C.sub }}>Km {o.km}{o.ubicacion ? ` · ${o.ubicacion}` : ''}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', marginLeft: 8 }}>
                   <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: o.estado === 'en_curso' ? '#FAEEDA' : o.estado === 'cierre_propuesto' ? '#FFF3CD' : o.estado === 'completada' ? '#0F2A35' : C.bg, color: o.estado === 'en_curso' ? '#854F0B' : o.estado === 'cierre_propuesto' ? '#856404' : o.estado === 'completada' ? C.accent : C.sub, whiteSpace: 'nowrap' as const }}>{badgeLabel(o.estado)}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#1a3040', color: C.sub, whiteSpace: 'nowrap' as const }}>{tipoLabel(o.tipo)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>,
        () => setShowOrdenes(false)
      )}

      {/* MODAL INSUMOS */}
      {showInsumos && modal(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Solicitudes de insumos · {solicitudes.length}</div>
            <button onClick={() => setShowInsumos(false)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {solicitudes.length === 0
              ? <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: 20 }}>Sin solicitudes pendientes</div>
              : solicitudes.map(s => <SolicitudItem key={s.id} s={s} onResolver={resolverSolicitud} />)
            }
          </div>
        </>,
        () => setShowInsumos(false)
      )}

      {/* MODAL VEHÍCULOS */}
      {showVehiculos && modal(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Vehículos</div>
            <button onClick={() => setShowVehiculos(false)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => router.push('/dashboard/checkin/vehiculos')}
              style={{ flex: 1, background: C.accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '11px 0', cursor: 'pointer' }}>
              ✅ Nuevo checkin
            </button>
            <button onClick={() => router.push('/cargas-combustible')}
              style={{ flex: 1, background: '#3A2A00', border: `1px solid ${C.warn}`, borderRadius: 10, color: C.warn, fontWeight: 700, fontSize: 13, padding: '11px 0', cursor: 'pointer' }}>
              ⛽ Cargar combustible
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
              style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 12, color: C.text, outline: 'none' }} />
            <select value={filtroTurno} onChange={e => setFiltroTurno(e.target.value)}
              style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 12, color: C.text, outline: 'none' }}>
              <option value="todos">Todos los turnos</option>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="noche">Noche</option>
            </select>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {checkinsFiltrados.length === 0
              ? <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: 20 }}>Sin checkins para este filtro</div>
              : checkinsFiltrados.map(c => (
                <div key={c.id} onClick={() => abrirCheckinDetalle(c)}
                  style={{ background: C.bg, border: `1px solid ${c.estado === 'pendiente_aprobacion' ? C.warn : C.border}`, borderLeft: `3px solid ${c.estado === 'pendiente_aprobacion' ? C.warn : C.ok}`, borderRadius: 10, padding: '10px 12px', marginBottom: 6, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.moviles?.marca} {c.moviles?.modelo} — {c.moviles?.patente}</div>
                      <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{c.conductor?.nombre} {c.conductor?.apellido} · {c.turno}{c.km_inicial ? ` · Km ${c.km_inicial}` : ''}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' as const, background: c.estado === 'pendiente_aprobacion' ? '#3A2A00' : '#0F2A35', color: c.estado === 'pendiente_aprobacion' ? C.warn : C.accent }}>
                      {c.estado === 'pendiente_aprobacion' ? '⏳ Pendiente' : c.estado === 'aprobado' ? '✅ Aprobado' : '⚠️ Con obs'}
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        </>,
        () => setShowVehiculos(false)
      )}

      {/* MODAL DETALLE CHECKIN */}
      {checkinDetalle && modal(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const }}>CHK-{String(checkinDetalle.numero_checkin).padStart(4, '0')}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{checkinDetalle.moviles?.marca} {checkinDetalle.moviles?.modelo} — {checkinDetalle.moviles?.patente}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{checkinDetalle.conductor?.nombre} {checkinDetalle.conductor?.apellido} · {checkinDetalle.turno} · {checkinDetalle.fecha}</div>
            </div>
            <button onClick={() => setCheckinDetalle(null)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const }}>Km Inicial</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.accent, marginTop: 2 }}>{checkinDetalle.km_inicial ?? '—'}</div>
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const }}>Km Final</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.accent, marginTop: 2 }}>{checkinDetalle.km_final ?? '—'}</div>
              </div>
            </div>
            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>Inspección</div>
            {(checkinDetalle.items || []).map((it: any) => (
              <div key={it.id} style={{ background: it.estado === 'mal' ? '#2A0F0F' : C.bg, border: `1px solid ${it.estado === 'mal' ? '#7B1E1E' : C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{it.item}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: it.estado === 'bien' ? '#0F3A42' : '#7B1E1E', color: it.estado === 'bien' ? C.accent : '#F09595', marginLeft: 8 }}>{it.estado.toUpperCase()}</span>
                </div>
                {it.observacion && (
                  <div style={{ fontSize: 11, color: '#F09595', marginTop: 3 }}>↳ {it.observacion}</div>
                )}
              </div>
            ))}
            {checkinDetalle.observaciones_generales && (
              <div style={{ background: '#3A2A00', border: `1px solid ${C.warn}`, borderRadius: 8, padding: '8px 10px', marginTop: 8 }}>
                <div style={{ fontSize: 9, color: C.warn, textTransform: 'uppercase' as const, marginBottom: 2 }}>Observaciones</div>
                <div style={{ fontSize: 12, color: C.text }}>{checkinDetalle.observaciones_generales}</div>
              </div>
            )}
            {checkinDetalle.estado === 'pendiente_aprobacion' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => aprobarCheckin(checkinDetalle.id, false)} disabled={aprobando}
                  style={{ flex: 1, background: aprobando ? C.border : C.ok, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>✅ Aprobar</button>
                <button onClick={() => aprobarCheckin(checkinDetalle.id, true)} disabled={aprobando}
                  style={{ flex: 1, background: '#3A2A00', border: `1px solid ${C.warn}`, borderRadius: 10, color: C.warn, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>⚠️ Con obs</button>
              </div>
            )}
          </div>
        </>,
        () => setCheckinDetalle(null)
      )}

      {/* BODY */}
      <div style={{ padding: '14px 16px 110px' }}>

        {/* BANDEJA OTs SUPRA */}
        {suprasPendientes.length > 0 && (
          <div style={{ background: '#071f2e', border: `1px solid #1ABBD6`, borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: '#1ABBD6', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>
              📋 {suprasPendientes.length} OT{suprasPendientes.length > 1 ? 's' : ''} Supra pendiente{suprasPendientes.length > 1 ? 's' : ''} de planificación
            </div>
            {suprasPendientes.map(s => {
              const prioridadColor: Record<string,string> = {
                critica: '#E24B4A', alta: '#EF9F27', normal: '#4a8fa0', baja: '#4a8fa0'
              }
              const sectores = (s.ots_supra_sectores || []).map((x: any) => x.sector).join(', ')
              return (
                <div key={s.id} onClick={() => setSupraDetalle(s)}
                  style={{ background: '#07131a', border: '1px solid #1a3040', borderLeft: `3px solid #1ABBD6`, borderRadius: 10, padding: '10px 12px', marginBottom: 6, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#1ABBD6', fontWeight: 700 }}>S-{String(s.numero_supra).padStart(4,'0')}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4f8' }}>{s.titulo}</div>
                      <div style={{ fontSize: 11, color: '#4a8fa0', marginTop: 2 }}>{s.tipo?.replace(/_/g,' ')} · {sectores || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginLeft: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: prioridadColor[s.prioridad] || '#4a8fa0' }}>{s.prioridad}</span>
                      {s.plazo_estimado && (
                        <span style={{ fontSize: 10, color: '#4a8fa0' }}>📅 {new Date(s.plazo_estimado).toLocaleDateString('es-AR')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* MODAL DETALLE SUPRA */}
        {supraDetalle && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ background: '#0c1c24', borderRadius: '16px 16px 0 0', padding: 16, maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid #1a3040' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#1ABBD6', fontWeight: 700, letterSpacing: 1 }}>S-{String(supraDetalle.numero_supra).padStart(4,'0')} · OT SUPRA</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e8f4f8' }}>{supraDetalle.titulo}</div>
                </div>
                <button onClick={() => setSupraDetalle(null)} style={{ background: 'none', border: 'none', color: '#4a8fa0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[['Tipo', supraDetalle.tipo?.replace(/_/g,' ')], ['Prioridad', supraDetalle.prioridad], ['Estado', 'Pendiente de planificación'], ['Plazo', supraDetalle.plazo_estimado ? new Date(supraDetalle.plazo_estimado).toLocaleDateString('es-AR') : '—']].map(([k, v]) => (
                    <div key={k} style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 9, color: '#4a8fa0', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{k}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e8f4f8', marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {(supraDetalle.ots_supra_sectores || []).length > 0 && (
                  <div style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: '#4a8fa0', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Sectores involucrados</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                      {supraDetalle.ots_supra_sectores.map((x: any) => (
                        <span key={x.sector} style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: '#0F2A35', color: '#1ABBD6' }}>{x.sector}</span>
                      ))}
                    </div>
                  </div>
                )}
                {supraDetalle.descripcion && (
                  <div style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: '#4a8fa0', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Descripción / Alcance</div>
                    <div style={{ fontSize: 13, color: '#e8f4f8', lineHeight: 1.5 }}>{supraDetalle.descripcion}</div>
                  </div>
                )}
                <div style={{ background: '#071f2e', border: '1px solid #1ABBD644', borderRadius: 8, padding: '10px 12px', marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: '#4a8fa0', marginBottom: 10 }}>Creá una OT operativa vinculada a esta Supra. El vínculo queda registrado automáticamente.</div>
                  <button
                    onClick={() => {
                      setSupraIdParaOT(supraDetalle.id)
                      setSupraDetalle(null)
                      abrirForm(true)
                    }}
                    style={{ width: '100%', background: '#1ABBD6', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    + CREAR OT OPERATIVA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ALERTA OTs REBOTADAS */}
        {ordenesRebotadas.length > 0 && (
          <div style={{ background: '#2A0F0F', border: `1px solid ${C.err}`, borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: C.err, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>
              🔄 {ordenesRebotadas.length} orden{ordenesRebotadas.length > 1 ? 'es' : ''} rebotada{ordenesRebotadas.length > 1 ? 's' : ''} por pañolero
            </div>
            {ordenesRebotadas.map(o => (
              <div key={o.id} style={{ background: C.bg, border: `1px solid ${C.err}44`, borderRadius: 10, padding: '8px 12px', marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>OT-{String(o.numero_orden).padStart(5, '0')}</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{o.titulo}</div>
                    {o.observacion_panol && <div style={{ fontSize: 11, color: C.err, marginTop: 3 }}>⚠️ {o.observacion_panol}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showTecnicos && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: 16, maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>👷 Técnicos disponibles · {tecnicos.length}</div>
                <button onClick={() => setShowTecnicos(false)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {tecnicos.length === 0
                  ? <div style={{ fontSize: 12, color: C.sub, textAlign: 'center' as const, padding: 20 }}>Sin técnicos disponibles este turno</div>
                  : tecnicos.map((t: any, i: number) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: i < tecnicos.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <div>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{t.apellido}, {t.nombre}</div>
                        <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>Gr.{t.grupo} · {t.turno} · {t.sector_trabajo}</div>
                      </div>
                      {t.grupo !== perfil?.grupo && (
                        <span style={{ fontSize: 10, background: '#3A2A00', color: C.warn, padding: '2px 6px', borderRadius: 10 }}>Otro grupo</span>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
          <div onClick={() => setShowOrdenes(true)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' as const, cursor: 'pointer' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: activas > 0 ? C.accent : C.sub }}>{activas}</div>
            <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 2 }}>Activas</div>
          </div>
          <div onClick={() => setShowTecnicos(true)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' as const, cursor: 'pointer' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: tecnicos.length > 0 ? C.ok : C.sub }}>{tecnicos.length}</div>
            <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 2 }}>Técnicos</div>
          </div>
          <div onClick={() => setShowVehiculos(true)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' as const, cursor: 'pointer' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: pendientesCheckin > 0 ? C.warn : C.sub }}>{pendientesCheckin}</div>
            <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 2 }}>Checkins pend.</div>
          </div>
        </div>

        {/* GRID DE CARDS */}
        <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 8 }}>Accesos rápidos</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {cards.map(card => (
            <div key={card.key} onClick={card.action}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' as const }}>
              {card.badge !== null && (
                <div style={{ position: 'absolute' as const, top: 10, right: 10, background: card.key === 'vehiculos' ? C.warn : C.err, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>
                  {card.badge}
                </div>
              )}
              {card.icon}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{card.label}</div>
                <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>{card.sub}</div>
              </div>
            </div>
          ))}
          <BibliotecaCard C={C} />
        </div>
      </div>

      {/* NAVBAR */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(12,28,36,0.97)', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 14px', zIndex: 30 }}>
        {[
          { label: 'Panel', active: true, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>, action: () => {} },
          { label: 'Órdenes', active: false, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, action: () => setShowOrdenes(true) },
          { label: 'Vehículos', active: false, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5"/><circle cx="16" cy="19" r="2"/><circle cx="7" cy="19" r="2"/><path d="M13 17H9"/></svg>, action: () => setShowVehiculos(true) },
          { label: 'Historial', active: false, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, action: () => router.push('/historial') },
          { label: 'Cronograma', active: false, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, action: () => router.push('/dashboard/cronograma') },
        ].map((item, i) => (
          <div key={i} onClick={item.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', minWidth: 44 }}>
            {item.svg}
            <span style={{ fontSize: 10, color: item.active ? C.accent : C.sub, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
          </div>
        ))}
      </div>

    </main>
  )
}