'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'
import AvatarUpload from '@/app/components/AvatarUpload'

const PIN_CRITICO = '2006'
const C = {
  bg: '#07131a', card: '#0c1c24', border: '#1a3040', text: '#e8f4f8',
  sub: '#4a8fa0', accent: '#1ABBD6', warn: '#EF9F27', err: '#E24B4A', ok: '#1D9E75'
}
const inp = { width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const }

export default function DashboardPanolero() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [materiales, setMateriales] = useState<any[]>([])
  const [herramientas, setHerramientas] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [subcategoria, setSubcategoria] = useState<string | null>(null)
  const [vista, setVista] = useState<'stock' | 'herramientas' | 'ordenes' | 'pedidos' | 'checkins'>('stock')
  const [loading, setLoading] = useState(true)
  const [checkinsFaltantes, setCheckinsFaltantes] = useState<any[]>([])
  const [checkinsHistorial, setCheckinsHistorial] = useState<any[]>([])
  const [checkinDetalle, setCheckinDetalle] = useState<any>(null)
  const [checkinsSubvista, setCheckinsSubvista] = useState<'pendientes' | 'historial' | 'vehiculos'>('pendientes')
  const [checkinsVehiculos, setCheckinsVehiculos] = useState<any[]>([])
  const [checkinVehDetalle, setCheckinVehDetalle] = useState<any>(null)
  const [pedidos, setPedidos] = useState<any[]>([])
  const [showNuevoPedido, setShowNuevoPedido] = useState(false)
  const [loadingPedido, setLoadingPedido] = useState(false)
  const [alertasStock, setAlertasStock] = useState<any[]>([])
  const [pedidoItems, setPedidoItems] = useState<any[]>([])
  const [pedidoObs, setPedidoObs] = useState('')
  const [pedidoBusqueda, setPedidoBusqueda] = useState('')
  const [busquedaResultados, setBusquedaResultados] = useState<any[]>([])
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [ordenesPanol, setOrdenesPanol] = useState<any[]>([])
  const [ordenPanolDetalle, setOrdenPanolDetalle] = useState<any>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editValor, setEditValor] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [accionPin, setAccionPin] = useState<'editar' | 'borrar' | 'nuevo' | null>(null)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [pinError, setPinError] = useState(false)
  const [showNuevoItem, setShowNuevoItem] = useState(false)
  const [nuevoItem, setNuevoItem] = useState({ nombre: '', codigo: '', unidad: '', stock_actual: '0', stock_minimo: '0', ubicacion_panol: '' })
  const [hora, setHora] = useState('')
  const [fechaDisplay, setFechaDisplay] = useState('')
  const [showRebote, setShowRebote] = useState(false)
  const [ordenRebote, setOrdenRebote] = useState<any>(null)
  const [obsRebote, setObsRebote] = useState('')
  const [loadingRebote, setLoadingRebote] = useState(false)
  const [filtroEstadoOT, setFiltroEstadoOT] = useState<string>('todas')
  const [showEntregarItem, setShowEntregarItem] = useState(false)
  const [itemEntregando, setItemEntregando] = useState<any>(null)
  const [cantidadEntrega, setCantidadEntrega] = useState<number>(1)
  const [loadingEntrega, setLoadingEntrega] = useState(false)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'panolero' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
      await cargarTodo()
      setLoading(false)
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

  async function cargarTodo() {
    const { data: mats } = await supabase.from('materiales').select('*').order('nombre', { ascending: true })
    setMateriales(mats || [])
    const { data: herrs } = await supabase.from('herramientas').select('*').order('nombre', { ascending: true })
    setHerramientas(herrs || [])
    const { data: peds } = await supabase.from('pedidos_jefe').select('*, pedidos_jefe_items(*)').order('created_at', { ascending: false })
    setPedidos(peds || [])
    const matsAlerta = (mats || []).filter((m: any) => m.stock_minimo > 0 && m.stock_actual <= m.stock_minimo).map((m: any) => ({ ...m, tipo_item: 'material' }))
    const herrsAlerta = (herrs || []).filter((h: any) => h.stock_minimo > 0 && h.stock_actual <= h.stock_minimo).map((h: any) => ({ ...h, tipo_item: 'herramienta' }))
    setAlertasStock([...matsAlerta, ...herrsAlerta])
    const { data: chks } = await supabase.from('checkins_herramientas')
      .select('*, profiles!checkins_herramientas_tecnico_id_fkey(nombre, apellido)')
      .eq('tiene_faltantes', true).eq('estado', 'con_faltantes').order('created_at', { ascending: false })
    setCheckinsFaltantes(chks || [])
    const { data: historial } = await supabase.from('checkins_herramientas')
      .select('*, profiles!checkins_herramientas_tecnico_id_fkey(nombre, apellido)')
      .order('created_at', { ascending: false }).limit(50)
      
    setCheckinsHistorial(historial || [])
    const { data: chkVeh } = await supabase.from('checkins_vehiculos')
      .select('*, moviles(marca, modelo, patente, sector), conductor:conductor_id(nombre, apellido)')
      .order('created_at', { ascending: false }).limit(50)
    setCheckinsVehiculos(chkVeh || [])
    const { data: sols } = await supabase.from('solicitudes_insumos')
      .select('*, materiales!solicitudes_insumos_material_id_fkey(nombre, unidad), profiles!solicitudes_insumos_tallerista_id_fkey(nombre), ordenes_trabajo!solicitudes_insumos_orden_trabajo_id_fkey(titulo, numero_orden)')
      .eq('estado', 'autorizada').order('created_at', { ascending: false })
    setSolicitudes(sols || [])
    const { data: ords } = await supabase.from('ordenes_trabajo')
      .select('*, orden_materiales(id, cantidad, estado, material_id, cantidad_preparada, entregado_por, entregado_at, materiales(id, nombre, unidad, tipo, stock_actual)), profiles!ordenes_trabajo_creado_por_fkey(nombre, apellido)')
      .not('estado', 'eq', 'cancelada').order('created_at', { ascending: false })
    setOrdenesPanol(ords || [])
  }

  function pedirPin(accion: 'editar' | 'borrar' | 'nuevo', id?: string) {
    setAccionPin(accion); setTargetId(id || null); setPinInput(''); setPinError(false); setShowPin(true)
  }

  async function confirmarPin() {
    if (pinInput !== PIN_CRITICO) { setPinError(true); return }
    setShowPin(false)
    if (accionPin === 'editar' && targetId) {
      setEditandoId(targetId)
      const tabla = vista === 'herramientas' ? herramientas : materiales
      const item = tabla.find(m => m.id === targetId)
      setEditValor(String(item?.stock_actual || 0))
    }
    if (accionPin === 'borrar' && targetId) {
      const tabla = vista === 'herramientas' ? 'herramientas' : 'materiales'
      await supabase.from(tabla).delete().eq('id', targetId)
      await cargarTodo()
    }
    if (accionPin === 'nuevo') setShowNuevoItem(true)
  }

  async function guardarEdicion(id: string) {
    const tabla = vista === 'herramientas' ? 'herramientas' : 'materiales'
    await supabase.from(tabla).update({ stock_actual: parseInt(editValor) || 0 }).eq('id', id)
    setEditandoId(null)
    await cargarTodo()
  }

  async function crearItem() {
    const tabla = vista === 'herramientas' ? 'herramientas' : 'materiales'
    const payload: any = { nombre: nuevoItem.nombre, codigo: nuevoItem.codigo || null, unidad: nuevoItem.unidad, stock_actual: parseInt(nuevoItem.stock_actual) || 0, stock_minimo: parseInt(nuevoItem.stock_minimo) || 0, ubicacion_panol: nuevoItem.ubicacion_panol || null }
    payload.categoria = categoria
    await supabase.from(tabla).insert(payload)
    setShowNuevoItem(false)
    setNuevoItem({ nombre: '', codigo: '', unidad: '', stock_actual: '0', stock_minimo: '0', ubicacion_panol: '' })
    await cargarTodo()
  }

  function buscarItemsStock(q: string) {
    setPedidoBusqueda(q)
    if (!q.trim()) { setBusquedaResultados([]); return }
    const q2 = q.toLowerCase()
    const mats = materiales.filter(m => m.nombre.toLowerCase().includes(q2) || (m.codigo || '').toLowerCase().includes(q2)).map(m => ({ ...m, tipo_item: 'material' }))
    const herrs = herramientas.filter(h => h.nombre.toLowerCase().includes(q2) || (h.codigo || '').toLowerCase().includes(q2)).map(h => ({ ...h, tipo_item: 'herramienta' }))
    setBusquedaResultados([...mats, ...herrs].slice(0, 6))
  }

  function agregarItemPedido(item: any) {
    if (pedidoItems.find((i: any) => i.id === item.id)) return
    setPedidoItems((prev: any[]) => [...prev, { ...item, cantidad: 1, url_externa: '', observacion: '' }])
    setPedidoBusqueda(''); setBusquedaResultados([])
  }

  function quitarItemPedido(id: string) { setPedidoItems((prev: any[]) => prev.filter((i: any) => i.id !== id)) }
  function actualizarItemPedido(id: string, campo: string, valor: any) { setPedidoItems((prev: any[]) => prev.map((i: any) => i.id === id ? { ...i, [campo]: valor } : i)) }

  function abrirNuevoPedido() {
    const preItems = alertasStock.map((a: any) => ({ ...a, cantidad: Math.max(1, (a.stock_minimo || 0) - (a.stock_actual || 0) + 5), url_externa: '', observacion: '' }))
    setPedidoItems(preItems); setPedidoObs(''); setPedidoBusqueda(''); setBusquedaResultados([]); setShowNuevoPedido(true)
  }

  async function enviarPedido() {
    if (pedidoItems.length === 0) return
    setLoadingPedido(true)
    const cats = [...new Set(pedidoItems.map((i: any) => i.categoria || 'general'))]
    const sector = cats.length === 1 ? cats[0] : 'general'
    const tipo = pedidoItems[0].tipo_item === 'herramienta' ? `herramientas_${sector}` : `materiales_${sector}`
    const { data: pedido } = await supabase.from('pedidos_jefe').insert({ panolero_id: perfil.id, tipo, descripcion: pedidoObs || `Solicitud de ${pedidoItems.length} ítem${pedidoItems.length > 1 ? 's' : ''}`, estado: 'pendiente', sector, observaciones_panolero: pedidoObs || null }).select().single()
    if (pedido) {
      await supabase.from('pedidos_jefe_items').insert(pedidoItems.map((i: any) => ({ pedido_id: pedido.id, tipo_item: i.tipo_item, material_id: i.tipo_item === 'material' ? i.id : null, herramienta_id: i.tipo_item === 'herramienta' ? i.id : null, nombre: i.nombre, codigo: i.codigo || null, cantidad: i.cantidad, unidad: i.unidad || null, url_externa: i.url_externa || null, observacion: i.observacion || null })))
    }
    setLoadingPedido(false); setShowNuevoPedido(false); setPedidoItems([]); setPedidoObs('')
    await cargarTodo()
  }

  async function recibirCheckin(id: string) {
    await supabase.from('checkins_herramientas').update({ recibido_por: perfil.id, recibido_at: new Date().toISOString(), estado: 'completado' }).eq('id', id)
    await cargarTodo(); setCheckinDetalle(null)
  }

  async function abrirCheckin(checkin: any) {
    const { data } = await supabase.from('checkin_items').select('*').eq('checkin_id', checkin.id).order('created_at')
    setCheckinDetalle({ ...checkin, items: data || [] })
  }

  async function abrirCheckinVeh(ch: any) {
    const { data } = await supabase.from('checkins_vehiculos_items').select('*').eq('checkin_id', ch.id).order('orden', { ascending: true })
    setCheckinVehDetalle({ ...ch, items: data || [] })
  }

  async function entregarSolicitud(id: string) {
    await supabase.from('solicitudes_insumos').update({ estado: 'entregada' }).eq('id', id)
    await cargarTodo()
  }
async function entregarItem(item: any) {
    if (item.estado === 'entregado') return
    if (cantidadEntrega <= 0 || cantidadEntrega > item.cantidad) return
    setLoadingEntrega(true)

    const { error: errorUpdate } = await supabase
      .from('orden_materiales')
      .update({
        estado: 'entregado',
        cantidad_preparada: cantidadEntrega,
        entregado_por: perfil.id,
        entregado_at: new Date().toISOString(),
      })
      .eq('id', item.id)
      .eq('estado', 'solicitado')

    if (errorUpdate) {
      setLoadingEntrega(false)
      alert('Error al registrar entrega. Intentá de nuevo.')
      return
    }

    const { error: errorStock } = await supabase
      .from('materiales')
      .update({ stock_actual: item.materiales.stock_actual - cantidadEntrega })
      .eq('id', item.material_id)

    if (errorStock) {
      setLoadingEntrega(false)
      alert('Entrega registrada pero falló el descuento de stock. Avisá al supervisor.')
      return
    }

    setLoadingEntrega(false)
    setShowEntregarItem(false)
    setItemEntregando(null)
    await cargarTodo()
    const ordenActualizada = ordenesPanol.find((o: any) => o.id === ordenPanolDetalle?.id)
    if (ordenActualizada) await abrirOrdenDetalle(ordenActualizada)
  }
  async function abrirOrdenDetalle(orden: any) {
    setOrdenPanolDetalle(orden)
  }

  function abrirRebote(orden: any) {
    setOrdenRebote(orden)
    setObsRebote('')
    setShowRebote(true)
  }

  async function confirmarRebote() {
    if (!obsRebote.trim()) return
    setLoadingRebote(true)
    await supabase.from('ordenes_trabajo').update({
      estado: 'rebotada',
      observacion_panol: obsRebote,
      rebotada_at: new Date().toISOString(),
      rebotada_por: perfil.id
    }).eq('id', ordenRebote.id)
    setLoadingRebote(false)
    setShowRebote(false)
    setOrdenRebote(null)
    setOrdenPanolDetalle(null)
    await cargarTodo()
  }

  function imprimirStock() {
    const tabla = vista === 'herramientas' ? herramientas : materiales
    const items = tabla.filter(m => m.categoria === categoria)
    const titulo = categoria === 'electrico' ? 'Pañol Eléctrico' : categoria === 'ac' ? 'Pañol AC' : categoria === 'general' ? 'Pañol General' : 'Pañol Edificios'
    const html = `<html><head><title>${titulo}</title><style>body{font-family:Arial;font-size:12px;padding:20px}table{width:100%;border-collapse:collapse}th{background:#0F3A42;color:white;padding:6px;text-align:left}td{padding:6px;border-bottom:1px solid #ddd}h2{color:#0F3A42}</style></head><body><h2>MECA Aubasa · ${titulo}</h2><p>Fecha: ${new Date().toLocaleDateString('es-AR')}</p><table><tr><th>Material</th><th>Código</th><th>Unidad</th><th>Stock</th><th>Mínimo</th><th>Estado</th></tr>${items.map(m => `<tr><td>${m.nombre}</td><td>${m.codigo || '-'}</td><td>${m.unidad || '-'}</td><td>${m.stock_actual}</td><td>${m.stock_minimo}</td><td>${m.stock_actual <= m.stock_minimo ? 'CRÍTICO' : m.stock_actual <= m.stock_minimo * 2 ? 'BAJO' : 'OK'}</td></tr>`).join('')}</table></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
  }

  const tablaActiva = vista === 'herramientas' ? herramientas : materiales
  const itemsFiltrados = tablaActiva.filter(m => m.categoria === categoria && (!subcategoria || m.subcategoria === subcategoria) && (m.nombre || '').toLowerCase().includes(busqueda.toLowerCase()))
  const subcategoriasDisponibles = [...new Set(tablaActiva.filter(m => m.categoria === categoria).map(m => m.subcategoria).filter(Boolean))] as string[]
  const criticos = tablaActiva.filter(m => m.categoria === categoria && m.stock_minimo > 0 && m.stock_actual <= m.stock_minimo)
  const bajos = tablaActiva.filter(m => m.categoria === categoria && m.stock_minimo > 0 && m.stock_actual > m.stock_minimo && m.stock_actual <= m.stock_minimo * 2)

  if (!perfil || loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, fontFamily: 'system-ui' }}>Cargando...</div>
  )

  const modalWrap = (content: React.ReactNode, onClose: () => void) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: 16, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: `1px solid ${C.border}` }}>
        {content}
      </div>
    </div>
  )

  const navItems = [
    { key: 'stock', label: 'Stock', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={vista === 'stock' ? C.accent : C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
    { key: 'herramientas', label: 'Herram.', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={vista === 'herramientas' ? C.accent : C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
    { key: 'ordenes', label: 'OT', badge: ordenesPanol.length, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={vista === 'ordenes' ? C.accent : C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { key: 'pedidos', label: 'Pedidos', badge: alertasStock.length, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={vista === 'pedidos' ? C.accent : C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
    { key: 'checkins', label: 'Checkins', badge: checkinsFaltantes.length, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={vista === 'checkins' ? C.accent : C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  ]

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
              <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>Pañolero
                {alertasStock.length > 0 && <span style={{ marginLeft: 8, background: C.err, color: 'white', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>⚠️ {alertasStock.length} alertas</span>}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.accent }}>{hora}</div>
            <div style={{ fontSize: 10, color: C.sub, textTransform: 'capitalize' }}>{fechaDisplay}</div>
          </div>
        </div>
      </div>

      {/* MODAL PIN */}
      {showPin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: C.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 320, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>PIN requerido</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 16 }}>Ingresá tu PIN para continuar</div>
            <input type="password" style={{ ...inp, marginBottom: 8, border: `1px solid ${pinError ? C.err : C.border}` }}
              placeholder="PIN" value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(false) }} autoFocus />
            {pinError && <div style={{ fontSize: 11, color: C.err, marginBottom: 8 }}>PIN incorrecto</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={confirmarPin} style={{ flex: 1, background: C.accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '11px 0', cursor: 'pointer' }}>CONFIRMAR</button>
              <button onClick={() => setShowPin(false)} style={{ flex: 1, background: C.border, border: 'none', borderRadius: 10, color: C.sub, fontWeight: 700, fontSize: 13, padding: '11px 0', cursor: 'pointer' }}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO ITEM */}
      {showNuevoItem && modalWrap(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Nuevo {vista === 'herramientas' ? 'herramienta' : 'material'}</div>
            <button onClick={() => setShowNuevoItem(false)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CANCELAR</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {[{ label: 'Nombre *', key: 'nombre', ph: 'Nombre del ítem' }, { label: 'Código', key: 'codigo', ph: 'Ej: EL-001' }, { label: 'Unidad', key: 'unidad', ph: 'unidad, kg, m...' }, { label: 'Stock inicial', key: 'stock_actual', ph: '0' }, { label: 'Stock mínimo', key: 'stock_minimo', ph: '0' }, { label: 'Ubicación pañol', key: 'ubicacion_panol', ph: 'Estante A3' }].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>{f.label}</div>
                <input style={inp} placeholder={f.ph} value={(nuevoItem as any)[f.key]} onChange={e => setNuevoItem({ ...nuevoItem, [f.key]: e.target.value })} />
              </div>
            ))}
            <button onClick={crearItem} disabled={!nuevoItem.nombre}
              style={{ width: '100%', background: nuevoItem.nombre ? C.accent : C.border, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, padding: '13px 0', cursor: nuevoItem.nombre ? 'pointer' : 'default', marginTop: 8 }}>
              GUARDAR
            </button>
          </div>
        </>,
        () => setShowNuevoItem(false)
      )}

      {/* MODAL DETALLE OT */}
      {ordenPanolDetalle && modalWrap(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const }}>OT-{String(ordenPanolDetalle.numero_orden).padStart(5, '0')}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{ordenPanolDetalle.titulo}</div>
              <div style={{ fontSize: 11, color: C.sub }}>Creado por: {ordenPanolDetalle.profiles?.nombre} {ordenPanolDetalle.profiles?.apellido}</div>
            </div>
            <button onClick={() => setOrdenPanolDetalle(null)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[['Sector', ordenPanolDetalle.sector], ['Estado', ordenPanolDetalle.estado], ['Prioridad', ordenPanolDetalle.prioridad], ['Tipo', ordenPanolDetalle.tipo?.replace(/_/g, ' ')]].map(([k, v]) => (
                <div key={k} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const }}>{k}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 2, textTransform: 'capitalize' as const }}>{v}</div>
                </div>
              ))}
            </div>
            {(ordenPanolDetalle.km || ordenPanolDetalle.ubicacion) && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const }}>Ubicación</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 2 }}>{ordenPanolDetalle.km ? `Km ${ordenPanolDetalle.km}` : ''}{ordenPanolDetalle.ubicacion ? ` · ${ordenPanolDetalle.ubicacion}` : ''}</div>
              </div>
            )}
            {!ordenPanolDetalle.orden_materiales?.length ? (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: C.sub, textAlign: 'center' as const }}>Sin materiales cargados en esta orden</div>
            ) : (
              <>
                {ordenPanolDetalle.orden_materiales.filter((om: any) => om.materiales?.tipo !== 'herramienta').length > 0 && (
                  <>
                    <div style={{ fontSize: 9, color: C.sub, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }}>📦 Materiales / Insumos / Repuestos</div>
                    {ordenPanolDetalle.orden_materiales.filter((om: any) => om.materiales?.tipo !== 'herramienta').map((om: any) => (
                      <div key={om.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                        <div>
                          <span style={{ fontSize: 13, color: C.text }}>{om.materiales?.nombre}</span>
                          <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>{om.materiales?.tipo}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>×{om.cantidad} {om.materiales?.unidad}</span>
                          {om.estado === 'recibido'
                            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#0F2A35', color: C.ok }}>✅ Recibido por técnico</span>
                            : om.estado === 'entregado'
                            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#0F3A42', color: C.accent }}>📦 Entregado · pdte. recepción</span>
                            : om.estado === 'solicitado'
                            ? <button onClick={() => { setItemEntregando({ ...om, material_id: om.material_id }); setCantidadEntrega(om.cantidad); setShowEntregarItem(true) }}
                                style={{ background: C.ok, border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 11, padding: '5px 10px', cursor: 'pointer' }}>
                                ENTREGAR
                              </button>
                            : <span style={{ fontSize: 10, color: C.sub }}>Sin estado / revisar</span>
                          }
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {ordenPanolDetalle.orden_materiales.filter((om: any) => om.materiales?.tipo === 'herramienta').length > 0 && (
                  <>
                    <div style={{ fontSize: 9, color: C.warn, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6, marginTop: 10 }}>🔧 Herramientas</div>
                    {ordenPanolDetalle.orden_materiales.filter((om: any) => om.materiales?.tipo === 'herramienta').map((om: any) => (
                      <div key={om.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg, border: `1px solid ${C.warn}44`, borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: C.text }}>{om.materiales?.nombre}</span>
                        <span style={{ fontSize: 11, color: C.warn, fontWeight: 600 }}>×{om.cantidad} {om.materiales?.unidad}</span>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </>,
        () => setOrdenPanolDetalle(null)
      )}

      {/* MODAL CHECKIN HERRAMIENTA DETALLE */}
      {checkinDetalle && modalWrap(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const }}>Checkin · Caja {checkinDetalle.caja?.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{checkinDetalle.profiles?.nombre} {checkinDetalle.profiles?.apellido}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{new Date(checkinDetalle.hora_inicio || checkinDetalle.created_at).toLocaleString('es-AR')}</div>
            </div>
            <button onClick={() => setCheckinDetalle(null)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {checkinDetalle.items?.map((item: any, idx: number) => (
              <div key={idx} style={{ background: item.estado === 'faltante' ? '#2A0F0F' : item.estado === 'reemplazo' ? '#3A2A00' : C.bg, border: `1px solid ${item.estado === 'faltante' ? C.err : item.estado === 'reemplazo' ? C.warn : C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: item.estado === 'faltante' ? '#7B1E1E' : item.estado === 'reemplazo' ? '#3A2A00' : '#0F3A42', color: item.estado === 'faltante' ? '#F09595' : item.estado === 'reemplazo' ? C.warn : C.accent }}>
                    {item.estado === 'faltante' ? '❌ FALTANTE' : item.estado === 'reemplazo' ? '🔄 REEMPLAZO' : '✅ OK'}
                  </span>
                  <span style={{ fontSize: 11, color: C.sub }}>×{item.cantidad}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 4 }}>{item.detalle}</div>
                {item.observacion && <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Obs: {item.observacion}</div>}
              </div>
            ))}
            {checkinDetalle.estado !== 'completado' && (
              <button onClick={() => recibirCheckin(checkinDetalle.id)}
                style={{ width: '100%', background: C.accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, padding: '13px 0', cursor: 'pointer', marginTop: 8 }}>
                ✅ MARCAR COMO RECIBIDO
              </button>
            )}
          </div>
        </>,
        () => setCheckinDetalle(null)
      )}

      {/* MODAL CHECKIN VEHICULO DETALLE */}
      {checkinVehDetalle && modalWrap(
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const }}>CHK-{String(checkinVehDetalle.numero_checkin).padStart(4, '0')}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{checkinVehDetalle.moviles?.marca} {checkinVehDetalle.moviles?.modelo} — {checkinVehDetalle.moviles?.patente}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{checkinVehDetalle.conductor?.nombre} {checkinVehDetalle.conductor?.apellido} · {checkinVehDetalle.turno} · {checkinVehDetalle.fecha}</div>
            </div>
            <button onClick={() => setCheckinVehDetalle(null)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CERRAR</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const }}>Km Inicial</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.accent, marginTop: 4 }}>{checkinVehDetalle.km_inicial ?? '—'}</div>
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const }}>Km Final</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.accent, marginTop: 4 }}>{checkinVehDetalle.km_final ?? '—'}</div>
              </div>
            </div>
            {checkinVehDetalle.observaciones_generales && (
              <div style={{ background: '#3A2A00', border: `1px solid ${C.warn}`, borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.warn, textTransform: 'uppercase' as const, marginBottom: 2 }}>Observaciones</div>
                <div style={{ fontSize: 12, color: C.text }}>{checkinVehDetalle.observaciones_generales}</div>
              </div>
            )}
            {checkinVehDetalle.items?.map((it: any) => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: it.estado === 'mal' ? '#2A0F0F' : C.bg, border: `1px solid ${it.estado === 'mal' ? C.err : C.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{it.item}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: it.estado === 'bien' ? '#0F3A42' : '#7B1E1E', color: it.estado === 'bien' ? C.accent : '#F09595', marginLeft: 8 }}>{it.estado.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </>,
        () => setCheckinVehDetalle(null)
      )}
{showEntregarItem && itemEntregando && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: C.card, borderRadius: 16, padding: 20, width: '100%', maxWidth: 360, border: `1px solid ${C.accent}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>📦 Confirmar entrega</div>
            <div style={{ fontSize: 13, color: C.accent, fontWeight: 600, marginBottom: 2 }}>{itemEntregando.materiales?.nombre}</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 16 }}>Solicitado: {itemEntregando.cantidad} {itemEntregando.materiales?.unidad}</div>
            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Cantidad a entregar *</div>
            <input
              type="number"
              min={1}
              max={itemEntregando.cantidad}
              value={cantidadEntrega}
              onChange={e => {
                const v = parseInt(e.target.value) || 1
                setCantidadEntrega(Math.min(Math.max(1, v), itemEntregando.cantidad))
              }}
              style={{ ...inp, marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowEntregarItem(false); setItemEntregando(null) }}
                style={{ flex: 1, background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontWeight: 700, fontSize: 13, padding: '11px 0', cursor: 'pointer' }}>
                CANCELAR
              </button>
              <button onClick={() => entregarItem(itemEntregando)}
                disabled={loadingEntrega}
                style={{ flex: 1, background: loadingEntrega ? C.border : C.ok, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '11px 0', cursor: loadingEntrega ? 'default' : 'pointer' }}>
                {loadingEntrega ? 'Entregando...' : 'CONFIRMAR ENTREGA'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL REBOTE OT */}
      {showRebote && ordenRebote && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: C.card, borderRadius: 16, padding: 20, width: '100%', maxWidth: 360, border: `1px solid ${C.err}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>🔄 Rebotar OT</div>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>OT-{String(ordenRebote.numero_orden).padStart(5,'0')} · {ordenRebote.titulo}</div>
            <div style={{ fontSize: 11, color: C.warn, marginBottom: 12 }}>La orden vuelve al supervisor con estado "rebotada"</div>
            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Motivo *</div>
            <textarea
              style={{ ...inp, resize: 'none', marginBottom: 12, border: `1px solid ${obsRebote.trim() ? C.border : C.err}` } as any}
              rows={3} placeholder="Ej: No hay cable TPR 3x2.5 en stock..."
              value={obsRebote} onChange={e => setObsRebote(e.target.value)} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={confirmarRebote} disabled={loadingRebote || !obsRebote.trim()}
                style={{ flex: 1, background: loadingRebote || !obsRebote.trim() ? C.border : C.err, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '11px 0', cursor: 'pointer' }}>
                {loadingRebote ? 'Rebotando...' : '🔄 REBOTAR'}
              </button>
              <button onClick={() => setShowRebote(false)}
                style={{ flex: 1, background: C.border, border: 'none', borderRadius: 10, color: C.sub, fontWeight: 700, fontSize: 13, padding: '11px 0', cursor: 'pointer' }}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* BODY */}
      <div style={{ padding: '14px 16px 110px' }}>

        {/* SOLICITUDES AUTORIZADAS — siempre visibles arriba */}
        {solicitudes.length > 0 && (() => {
          const solicsFiltradas = categoria ? solicitudes.filter((s: any) => s.materiales?.categoria === categoria) : solicitudes
          if (solicsFiltradas.length === 0) return null
          const badgeC = (cat: string) => cat === 'electrico' ? { bg: '#3A2A00', color: C.warn } : cat === 'ac' ? { bg: '#0F2A35', color: C.accent } : { bg: C.border, color: C.sub }
          const badgeL = (cat: string) => cat === 'electrico' ? '⚡ Eléc' : cat === 'ac' ? '❄️ AC' : cat === 'edificio' ? '🏢 Edif' : '🔧 Gral'
          return (
            <div style={{ background: '#0F2A35', border: `1px solid ${C.accent}`, borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: C.accent, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>
                📦 Solicitudes autorizadas · {solicsFiltradas.length}
                {categoria && solicitudes.length > solicsFiltradas.length && <span style={{ color: C.sub, fontWeight: 400, marginLeft: 4 }}>(de {solicitudes.length} totales)</span>}
              </div>
              {solicsFiltradas.map((s: any) => {
                const bc = badgeC(s.materiales?.categoria)
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', marginBottom: 6 }}>
                    <div style={{ flex: 1, marginRight: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: bc.bg, color: bc.color }}>{badgeL(s.materiales?.categoria)}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.materiales?.nombre}</div>
                      <div style={{ fontSize: 11, color: C.sub }}>{s.profiles?.nombre} · ×{s.cantidad} {s.materiales?.unidad}</div>
                    </div>
                    <button onClick={() => entregarSolicitud(s.id)}
                      style={{ background: C.ok, border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 11, padding: '8px 12px', cursor: 'pointer', flexShrink: 0 }}>
                      ENTREGAR
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* VISTA ORDENES */}
        {vista === 'ordenes' && (
          <div>
            {/* Filtro por estado */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' as const }}>
              {[{ k: 'todas', l: 'Todas' }, { k: 'pendiente', l: 'Pendiente' }, { k: 'en_curso', l: 'En curso' }, { k: 'rebotada', l: '🔄 Rebotadas' }, { k: 'completada', l: 'Completadas' }].map(f => (
                <button key={f.k} onClick={() => setFiltroEstadoOT(f.k)}
                  style={{ background: filtroEstadoOT === f.k ? C.accent : C.card, border: `1px solid ${filtroEstadoOT === f.k ? C.accent : C.border}`, borderRadius: 20, color: filtroEstadoOT === f.k ? 'white' : C.sub, fontWeight: 600, fontSize: 11, padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                  {f.l}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>
              {ordenesPanol.filter(o => filtroEstadoOT === 'todas' || o.estado === filtroEstadoOT).length} órdenes
            </div>
            {ordenesPanol.filter(o => filtroEstadoOT === 'todas' || o.estado === filtroEstadoOT).length === 0 ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, textAlign: 'center' as const, fontSize: 13, color: C.sub }}>Sin órdenes</div>
            ) : ordenesPanol.filter(o => filtroEstadoOT === 'todas' || o.estado === filtroEstadoOT).map(o => {
              const borderColor = o.estado === 'en_curso' ? C.warn : o.estado === 'rebotada' ? C.err : o.estado === 'completada' ? C.ok : C.accent
              const badgeBg = o.estado === 'en_curso' ? '#3A2A00' : o.estado === 'rebotada' ? '#2A0F0F' : o.estado === 'completada' ? '#0F2A35' : C.border
              const badgeColor = o.estado === 'en_curso' ? C.warn : o.estado === 'rebotada' ? C.err : o.estado === 'completada' ? C.ok : C.sub
              const badgeLabel = o.estado === 'en_curso' ? 'En curso' : o.estado === 'rebotada' ? '🔄 Rebotada' : o.estado === 'completada' ? '✅ Completada' : 'Pendiente'
              return (
                <div key={o.id}
                  style={{ background: C.card, border: `1px solid ${borderColor}44`, borderLeft: `3px solid ${borderColor}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }} onClick={() => abrirOrdenDetalle(o)}>
                    <div style={{ flex: 1, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>OT-{String(o.numero_orden).padStart(5, '0')}</span>
                        <span style={{ fontSize: 10, color: C.sub }}>{o.sector?.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{o.titulo}</div>
                      {o.km && <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Km {o.km}{o.ubicacion ? ` · ${o.ubicacion}` : ''}</div>}
                      {o.orden_materiales?.length > 0 && (
                        <div style={{ fontSize: 11, color: C.accent, marginTop: 4 }}>
                          📦 {o.orden_materiales.slice(0, 2).map((om: any) => om.materiales?.nombre).join(', ')}{o.orden_materiales.length > 2 ? '...' : ''}
                        </div>
                      )}
                      {o.estado === 'rebotada' && o.observacion_panol && (
                        <div style={{ fontSize: 11, color: C.err, marginTop: 4, background: '#2A0F0F', padding: '4px 8px', borderRadius: 6 }}>
                          ⚠️ {o.observacion_panol}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' as const, background: badgeBg, color: badgeColor, marginLeft: 8 }}>
                      {badgeLabel}
                    </span>
                  </div>
                  
                </div>
              )
            })}
          </div>
        )}

        {/* VISTA CHECKINS */}
        {vista === 'checkins' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[{ key: 'pendientes', label: `Faltantes${checkinsFaltantes.length > 0 ? ` (${checkinsFaltantes.length})` : ''}` }, { key: 'historial', label: 'Herramientas' }, { key: 'vehiculos', label: 'Vehículos' }].map(t => (
                <button key={t.key} onClick={() => setCheckinsSubvista(t.key as any)}
                  style={{ flex: 1, background: checkinsSubvista === t.key ? C.accent : C.card, border: `1px solid ${checkinsSubvista === t.key ? C.accent : C.border}`, borderRadius: 8, color: checkinsSubvista === t.key ? 'white' : C.sub, fontWeight: 600, fontSize: 11, padding: '8px 4px', cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {checkinsSubvista === 'pendientes' && (
              checkinsFaltantes.length === 0
                ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, textAlign: 'center' as const, fontSize: 13, color: C.sub }}>✅ Sin faltantes pendientes</div>
                : checkinsFaltantes.map(c => (
                  <div key={c.id} onClick={() => abrirCheckin(c)}
                    style={{ background: C.card, border: `1px solid ${C.err}`, borderLeft: `3px solid ${C.err}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Caja {c.caja?.toUpperCase()}</div>
                        <div style={{ fontSize: 11, color: C.sub }}>{c.profiles?.nombre} {c.profiles?.apellido}</div>
                        <div style={{ fontSize: 11, color: C.sub }}>{new Date(c.created_at).toLocaleString('es-AR')}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#7B1E1E', color: '#F09595' }}>⚠️ FALTANTE</span>
                    </div>
                  </div>
                ))
            )}

            {checkinsSubvista === 'historial' && (
              checkinsHistorial.length === 0
                ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, textAlign: 'center' as const, fontSize: 13, color: C.sub }}>Sin checkins registrados</div>
                : checkinsHistorial.map(c => (
                  <div key={c.id} onClick={() => abrirCheckin(c)}
                    style={{ background: C.card, border: `1px solid ${c.estado === 'con_faltantes' ? C.err : C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Caja {c.caja?.toUpperCase()}</div>
                        <div style={{ fontSize: 11, color: C.sub }}>{c.profiles?.nombre} {c.profiles?.apellido} · {new Date(c.created_at).toLocaleString('es-AR')}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: c.estado === 'con_faltantes' ? '#7B1E1E' : '#0F2A35', color: c.estado === 'con_faltantes' ? '#F09595' : C.accent }}>
                        {c.estado === 'con_faltantes' ? '⚠️ FALTANTE' : c.estado === 'completado' ? '✅ OK' : c.estado}
                      </span>
                    </div>
                  </div>
                ))
            )}

            {checkinsSubvista === 'vehiculos' && (
              checkinsVehiculos.length === 0
                ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, textAlign: 'center' as const, fontSize: 13, color: C.sub }}>Sin checkins de vehículos</div>
                : checkinsVehiculos.map(c => (
                  <div key={c.id} onClick={() => abrirCheckinVeh(c)}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.moviles?.marca} {c.moviles?.modelo} — {c.moviles?.patente}</div>
                        <div style={{ fontSize: 11, color: C.sub }}>{c.conductor?.nombre} {c.conductor?.apellido} · {c.turno} · {c.fecha}</div>
                        {c.km_inicial && <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, marginTop: 2 }}>Km: {c.km_inicial}{c.km_final ? ` → ${c.km_final}` : ''}</div>}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: c.estado === 'pendiente_aprobacion' ? '#3A2A00' : '#0F2A35', color: c.estado === 'pendiente_aprobacion' ? C.warn : C.accent, whiteSpace: 'nowrap' as const }}>
                        {c.estado === 'pendiente_aprobacion' ? '⏳' : '✅'}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* VISTA PEDIDOS */}
        {vista === 'pedidos' && (
          <div>
            {alertasStock.length > 0 && !showNuevoPedido && (
              <div style={{ background: '#3A2A00', border: `1px solid ${C.warn}`, borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.warn, marginBottom: 6 }}>⚠️ {alertasStock.length} ítem{alertasStock.length > 1 ? 's' : ''} con stock bajo</div>
                {alertasStock.slice(0, 3).map((a: any) => (
                  <div key={a.id} style={{ fontSize: 11, color: C.warn }}>· {a.nombre} — stock: {a.stock_actual} / mín: {a.stock_minimo}</div>
                ))}
                {alertasStock.length > 3 && <div style={{ fontSize: 11, color: C.warn }}>· y {alertasStock.length - 3} más...</div>}
              </div>
            )}

            {!showNuevoPedido && (
              <button onClick={abrirNuevoPedido}
                style={{ width: '100%', background: C.accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, padding: '13px 0', cursor: 'pointer', marginBottom: 14 }}>
                {alertasStock.length > 0 ? `📋 NUEVO PEDIDO (${alertasStock.length} alertas pre-cargadas)` : '+ NUEVO PEDIDO AL JEFE'}
              </button>
            )}

            {showNuevoPedido && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px', marginBottom: 14 }}>
                <div style={{ background: C.bg, borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>📧 Nuevo pedido al jefe</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>De: {perfil.nombre} {perfil.apellido} · {new Date().toLocaleDateString('es-AR')}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>Para: Jefe de Sector</div>
                </div>

                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Buscar ítem del stock</div>
                <input style={{ ...inp, marginBottom: 8 }} placeholder="Nombre o código..." value={pedidoBusqueda} onChange={e => buscarItemsStock(e.target.value)} />
                {busquedaResultados.length > 0 && (
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
                    {busquedaResultados.map((r: any) => (
                      <button key={r.id} onClick={() => agregarItemPedido(r)}
                        style={{ width: '100%', background: 'none', border: 'none', borderBottom: `1px solid ${C.border}`, padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{r.nombre}</span>
                        <span style={{ fontSize: 11, color: C.sub }}>{r.codigo || ''} · stock: {r.stock_actual}</span>
                      </button>
                    ))}
                  </div>
                )}

                {pedidoItems.length === 0 ? (
                  <div style={{ textAlign: 'center' as const, color: C.sub, fontSize: 12, padding: '16px', border: `1px dashed ${C.border}`, borderRadius: 8, marginBottom: 12 }}>Buscá ítems o se pre-cargan los de stock bajo</div>
                ) : pedidoItems.map((item: any) => (
                  <div key={item.id} style={{ background: C.bg, border: `1px solid ${item.stock_actual <= item.stock_minimo && item.stock_minimo > 0 ? C.warn : C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.nombre}</div>
                        <div style={{ fontSize: 11, color: C.sub }}>{item.tipo_item === 'material' ? '📦' : '🔧'} · stock actual: {item.stock_actual}</div>
                      </div>
                      <button onClick={() => quitarItemPedido(item.id)} style={{ background: 'none', border: 'none', color: C.err, fontSize: 16, cursor: 'pointer' }}>×</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 9, color: C.sub, marginBottom: 3 }}>Cantidad ({item.unidad || 'u'})</div>
                        <input type="number" min="1" style={inp} value={item.cantidad} onChange={e => actualizarItemPedido(item.id, 'cantidad', parseInt(e.target.value) || 1)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: C.sub, marginBottom: 3 }}>Link (ML, etc.)</div>
                        <input type="url" style={inp} placeholder="https://..." value={item.url_externa} onChange={e => actualizarItemPedido(item.id, 'url_externa', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <input style={inp} placeholder="Observación del ítem..." value={item.observacion} onChange={e => actualizarItemPedido(item.id, 'observacion', e.target.value)} />
                    </div>
                  </div>
                ))}

                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4, marginTop: 4 }}>Observaciones generales</div>
                <textarea style={{ ...inp, resize: 'none', marginBottom: 12 } as any} rows={2} placeholder="Urgencia, turno, contexto..." value={pedidoObs} onChange={e => setPedidoObs(e.target.value)} />

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={enviarPedido} disabled={loadingPedido || pedidoItems.length === 0}
                    style={{ flex: 1, background: loadingPedido || pedidoItems.length === 0 ? C.border : C.accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>
                    {loadingPedido ? 'Enviando...' : '📤 ENVIAR AL JEFE'}
                  </button>
                  <button onClick={() => setShowNuevoPedido(false)}
                    style={{ flex: 1, background: C.border, border: 'none', borderRadius: 10, color: C.sub, fontWeight: 700, fontSize: 13, padding: '12px 0', cursor: 'pointer' }}>CANCELAR</button>
                </div>
              </div>
            )}

            <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>Mis pedidos · {pedidos.length}</div>
            {pedidos.length === 0
              ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, textAlign: 'center' as const, fontSize: 13, color: C.sub }}>Sin pedidos enviados</div>
              : pedidos.map((p: any) => (
                <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
                  <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>📧 PJ-{String(p.numero_pedido).padStart(4, '0')}</div>
                      <div style={{ fontSize: 11, color: C.sub }}>{new Date(p.created_at).toLocaleDateString('es-AR')} · {p.tipo?.replace(/_/g, ' ')}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: p.estado === 'aprobado' ? '#0F2A35' : p.estado === 'rechazado' ? '#2A0F0F' : C.border, color: p.estado === 'aprobado' ? C.accent : p.estado === 'rechazado' ? C.err : C.sub }}>
                      {p.estado}
                    </span>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    {(p.pedidos_jefe_items || []).length > 0
                      ? (p.pedidos_jefe_items || []).map((it: any) => (
                        <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.text, paddingBottom: 2 }}>
                          <span>· {it.nombre}</span>
                          <span style={{ color: C.sub }}>{it.cantidad} {it.unidad || 'u'}</span>
                        </div>
                      ))
                      : <div style={{ fontSize: 12, color: C.sub }}>{p.descripcion?.slice(0, 60)}</div>
                    }
                    {p.observaciones_jefe && (
                      <div style={{ fontSize: 11, color: C.warn, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.border}` }}>💬 Jefe: {p.observaciones_jefe}</div>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* VISTA STOCK / HERRAMIENTAS */}
        {(vista === 'stock' || vista === 'herramientas') && (
          !categoria ? (
            <div>
              <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>Seleccioná un pañol</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[{ key: 'electrico', emoji: '⚡', label: 'Eléctrico' }, { key: 'ac', emoji: '❄️', label: 'AC' }, { key: 'general', emoji: '🔧', label: 'General' }, { key: 'edificio', emoji: '🏢', label: 'Edificios' }].map(cat => (
                  <div key={cat.key} onClick={() => setCategoria(cat.key)}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 14px', cursor: 'pointer' }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.emoji}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Pañol {cat.label}</div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{tablaActiva.filter(m => m.categoria === cat.key).length} ítems</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => { setCategoria(null); setSubcategoria(null); setBusqueda('') }}
                    style={{ background: 'none', border: 'none', color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>← Volver</button>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    {vista === 'herramientas' ? 'Herramientas' : 'Stock'} · {categoria}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={imprimirStock} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.sub, fontSize: 12, padding: '6px 10px', cursor: 'pointer' }}>🖨️</button>
                  <button onClick={() => pedirPin('nuevo')} style={{ background: C.accent, border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 12, padding: '6px 12px', cursor: 'pointer' }}>+ NUEVO</button>
                </div>
              </div>

              {subcategoriasDisponibles.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
                  {[{ key: null, label: 'Todos' }, ...subcategoriasDisponibles.map(s => ({ key: s, label: s }))].map(s => (
                    <button key={String(s.key)} onClick={() => setSubcategoria(s.key)}
                      style={{ background: subcategoria === s.key ? C.accent : C.card, border: `1px solid ${subcategoria === s.key ? C.accent : C.border}`, borderRadius: 20, color: subcategoria === s.key ? 'white' : C.sub, fontWeight: 600, fontSize: 11, padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                {[{ v: itemsFiltrados.length, label: 'Ítems', color: C.accent }, { v: criticos.length, label: 'Crítico', color: C.err }, { v: bajos.length, label: 'Bajo', color: C.warn }].map(s => (
                  <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.v}</div>
                    <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase' as const, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <input style={{ ...inp, marginBottom: 12 }} placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />

              {itemsFiltrados.length === 0
                ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, textAlign: 'center' as const, fontSize: 13, color: C.sub }}>Sin resultados</div>
                : (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 1fr 2fr', padding: '8px 14px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                      {['Material', 'Stock', 'Mín', 'Est', 'Acc'].map(h => (
                        <div key={h} style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, textAlign: h !== 'Material' ? 'right' as const : 'left' as const }}>{h}</div>
                      ))}
                    </div>
                    {itemsFiltrados.map((m, i) => {
                      const critico = m.stock_minimo > 0 && m.stock_actual <= m.stock_minimo
                      const bajo = m.stock_minimo > 0 && m.stock_actual > m.stock_minimo && m.stock_actual <= m.stock_minimo * 2
                      return (
                        <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 1fr 2fr', padding: '10px 14px', alignItems: 'center', borderBottom: i < itemsFiltrados.length - 1 ? `1px solid ${C.border}` : 'none', background: critico ? '#2A0F0F22' : bajo ? '#3A2A0022' : 'transparent' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.nombre}</div>
                            <div style={{ fontSize: 10, color: C.sub }}>{m.unidad}</div>
                          </div>
                          <div style={{ textAlign: 'right' as const }}>
                            {editandoId === m.id ? (
                              <input type="number" value={editValor} onChange={e => setEditValor(e.target.value)}
                                onBlur={() => guardarEdicion(m.id)} onKeyDown={e => e.key === 'Enter' && guardarEdicion(m.id)}
                                style={{ width: 48, background: C.bg, border: `1px solid ${C.accent}`, borderRadius: 6, padding: '2px 4px', fontSize: 12, color: C.text, outline: 'none', textAlign: 'center' as const }}
                                autoFocus />
                            ) : (
                              <span style={{ fontSize: 13, fontWeight: 700, color: critico ? C.err : bajo ? C.warn : C.ok }}>{m.stock_actual}</span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' as const, fontSize: 12, color: C.sub }}>{m.stock_minimo}</div>
                          <div style={{ textAlign: 'right' as const }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 6, background: critico ? '#7B1E1E' : bajo ? '#3A2A00' : '#0F3A42', color: critico ? '#F09595' : bajo ? C.warn : C.accent }}>
                              {critico ? '!' : bajo ? '↓' : '✓'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => pedirPin('editar', m.id)} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => pedirPin('borrar', m.id)} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer' }}>🗑</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }
            </div>
          )
        )}
      </div>

      {/* NAVBAR */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(12,28,36,0.97)', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 14px', zIndex: 30 }}>
        {navItems.map(item => (
          <div key={item.key} onClick={() => { setVista(item.key as any); setCategoria(null); setBusqueda('') }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', minWidth: 44, position: 'relative' as const }}>
            {item.svg}
            <span style={{ fontSize: 10, color: vista === item.key ? C.accent : C.sub, fontWeight: vista === item.key ? 600 : 400 }}>{item.label}</span>
            {(item as any).badge > 0 && (
              <div style={{ position: 'absolute' as const, top: -2, right: 4, background: C.err, color: 'white', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 8, minWidth: 14, textAlign: 'center' as const }}>
                {(item as any).badge}
              </div>
            )}
          </div>
        ))}
        <div onClick={() => router.push('/dashboard/mapa')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', minWidth: 44 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a8fa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
          <span style={{ fontSize: 10, color: '#4a8fa0', fontWeight: 400 }}>Mapa</span>
        </div>
      </div>

    </main>
  )
}
