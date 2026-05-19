'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'

const PIN_CRITICO = '2006'

export default function DashboardPanolero() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [materiales, setMateriales] = useState<any[]>([])
  const [herramientas, setHerramientas] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [subcategoria, setSubcategoria] = useState<string | null>(null)
  const [vista, setVista] = useState<'stock' | 'herramientas' | 'pedidos' | 'checkins'>('stock')
  const [loading, setLoading] = useState(true)

  // checkins con faltantes
  const [checkinsFaltantes, setCheckinsFaltantes] = useState<any[]>([])
const [checkinsHistorial, setCheckinsHistorial] = useState<any[]>([])
const [checkinDetalle, setCheckinDetalle] = useState<any>(null)
const [checkinsSubvista, setCheckinsSubvista] = useState<'pendientes' | 'historial'>('pendientes')

  // pedidos al jefe
  const [pedidos, setPedidos] = useState<any[]>([])
  const [showNuevoPedido, setShowNuevoPedido] = useState(false)
  const [pedidoForm, setPedidoForm] = useState({ tipo: 'materiales_electrico', descripcion: '' })
  const [loadingPedido, setLoadingPedido] = useState(false)

  // solicitudes insumos autorizadas
  const [solicitudes, setSolicitudes] = useState<any[]>([])

  // edicion inline
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editValor, setEditValor] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [accionPin, setAccionPin] = useState<'editar' | 'borrar' | 'nuevo' | null>(null)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [pinError, setPinError] = useState(false)

  // nuevo item
  const [showNuevoItem, setShowNuevoItem] = useState(false)
  const [nuevoItem, setNuevoItem] = useState({ nombre: '', codigo: '', unidad: '', stock_actual: '0', stock_minimo: '0', ubicacion_panol: '' })

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'panolero' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
      await cargarTodo()
      setLoading(false)
    })
  }, [])

  async function cargarTodo() {
    const { data: mats } = await supabase.from('materiales').select('*').order('nombre', { ascending: true })
    setMateriales(mats || [])
    const { data: herrs } = await supabase.from('herramientas').select('*').order('nombre', { ascending: true })
    setHerramientas(herrs || [])
    const { data: peds } = await supabase.from('pedidos_jefe').select('*').order('created_at', { ascending: false })
    setPedidos(peds || [])
    const { data: chks } = await supabase
      .from('checkins_herramientas')
      .select('*, profiles!checkins_herramientas_tecnico_id_fkey(nombre)')
      .eq('tiene_faltantes', true)
      .eq('estado', 'con_faltantes')
      .order('created_at', { ascending: false })
    setCheckinsFaltantes(chks || [])

    const { data: historial } = await supabase
      .from('checkins_herramientas')
      .select('*, profiles!checkins_herramientas_tecnico_id_fkey(nombre)')
      .order('created_at', { ascending: false })
      .limit(50)
    setCheckinsHistorial(historial || [])

    const { data: sols } = await supabase
      .from('solicitudes_insumos')
      .select('*, materiales!solicitudes_insumos_material_id_fkey(nombre, unidad), profiles!solicitudes_insumos_tallerista_id_fkey(nombre), ordenes_trabajo!solicitudes_insumos_orden_trabajo_id_fkey(titulo, numero_orden)')
      .eq('estado', 'autorizada')
      .order('created_at', { ascending: false })
    setSolicitudes(sols || [])
  }

  function pedirPin(accion: 'editar' | 'borrar' | 'nuevo', id?: string) {
    setAccionPin(accion)
    setTargetId(id || null)
    setPinInput('')
    setPinError(false)
    setShowPin(true)
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
    const payload: any = {
      nombre: nuevoItem.nombre,
      codigo: nuevoItem.codigo || null,
      unidad: nuevoItem.unidad,
      stock_actual: parseInt(nuevoItem.stock_actual) || 0,
      stock_minimo: parseInt(nuevoItem.stock_minimo) || 0,
      ubicacion_panol: nuevoItem.ubicacion_panol || null,
    }
    if (tabla === 'materiales') payload.categoria = categoria
    else payload.categoria = categoria
    await supabase.from(tabla).insert(payload)
    setShowNuevoItem(false)
    setNuevoItem({ nombre: '', codigo: '', unidad: '', stock_actual: '0', stock_minimo: '0', ubicacion_panol: '' })
    await cargarTodo()
  }

  async function enviarPedido() {
    if (!pedidoForm.descripcion.trim()) return
    setLoadingPedido(true)
    await supabase.from('pedidos_jefe').insert({
      panolero_id: perfil.id,
      tipo: pedidoForm.tipo,
      descripcion: pedidoForm.descripcion,
      estado: 'pendiente'
    })
    setLoadingPedido(false)
    setShowNuevoPedido(false)
    setPedidoForm({ tipo: 'materiales_electrico', descripcion: '' })
    await cargarTodo()
  }

  async function recibirCheckin(id: string) {
    await supabase
      .from('checkins_herramientas')
      .update({ recibido_por: perfil.id, recibido_at: new Date().toISOString(), estado: 'completado' })
      .eq('id', id)
    await cargarTodo()
    setCheckinDetalle(null)
  }

  async function cargarItemsCheckin(checkinId: string) {
    const { data } = await supabase
      .from('checkin_items')
      .select('*')
      .eq('checkin_id', checkinId)
      .order('created_at')
    return data || []
  }

  async function abrirCheckin(checkin: any) {
    const items = await cargarItemsCheckin(checkin.id)
    setCheckinDetalle({ ...checkin, items })
  }

  async function entregarSolicitud(id: string) {
    await supabase.from('solicitudes_insumos').update({ estado: 'entregada' }).eq('id', id)
    await cargarTodo()
  }

  function imprimirStock() {
    const tabla = vista === 'herramientas' ? herramientas : materiales
    const items = tabla.filter(m => m.categoria === categoria)
    const titulo = categoria === 'electrico' ? 'Pañol Eléctrico' : categoria === 'ac' ? 'Pañol AC' : categoria === 'general' ? 'Pañol General' : 'Pañol Edificios'
    const html = `
      <html><head><title>${titulo}</title>
      <style>body{font-family:Arial;font-size:12px;padding:20px}
      table{width:100%;border-collapse:collapse}
      th{background:#0F3A42;color:white;padding:6px;text-align:left}
      td{padding:6px;border-bottom:1px solid #ddd}
      h2{color:#0F3A42}</style></head>
      <body><h2>MECA Aubasa · ${titulo}</h2>
      <p>Fecha: ${new Date().toLocaleDateString('es-AR')}</p>
      <table><tr><th>Material</th><th>Código</th><th>Unidad</th><th>Stock</th><th>Mínimo</th><th>Estado</th></tr>
      ${items.map(m => `<tr>
        <td>${m.nombre}</td><td>${m.codigo || '-'}</td><td>${m.unidad || '-'}</td>
        <td>${m.stock_actual}</td><td>${m.stock_minimo}</td>
        <td>${m.stock_actual <= m.stock_minimo ? 'CRÍTICO' : m.stock_actual <= m.stock_minimo * 2 ? 'BAJO' : 'OK'}</td>
      </tr>`).join('')}
      </table></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
  }

  const tablaActiva = vista === 'herramientas' ? herramientas : materiales
 const itemsFiltrados = tablaActiva.filter(m =>
  m.categoria === categoria &&
  (!subcategoria || m.subcategoria === subcategoria) &&
  (m.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
)
const subcategoriasDisponibles = [...new Set(tablaActiva.filter(m => m.categoria === categoria).map(m => m.subcategoria).filter(Boolean))] as string[]
  const criticos = tablaActiva.filter(m => m.categoria === categoria && m.stock_minimo > 0 && m.stock_actual <= m.stock_minimo)
  const bajos = tablaActiva.filter(m => m.categoria === categoria && m.stock_minimo > 0 && m.stock_actual > m.stock_minimo && m.stock_actual <= m.stock_minimo * 2)

  const labelCategoria = (c: string | null) => c === 'electrico' ? 'Eléctrico' : c === 'ac' ? 'AC' : c === 'general' ? 'General' : 'Edificios'

  if (!perfil || loading) return <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Pañol</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">{perfil.nombre}</div>
          </div>
          <div className="bg-[#0A2830] text-[#7ADCE8] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">PAÑOL</div>
        </div>
      </div>

      {/* PIN MODAL */}
      {showPin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs">
            <div className="text-[#0F3A42] font-bold text-sm mb-1">PIN requerido</div>
            <div className="text-[#7A9EA5] text-xs mb-3">Ingresá tu PIN para continuar</div>
            <input
              type="password"
              className={`w-full bg-[#F0FAFB] border rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none mb-2 ${pinError ? 'border-[#E24B4A]' : 'border-[#B2E0E8]'}`}
              placeholder="PIN"
              value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(false) }}
              autoFocus
            />
            {pinError && <div className="text-[#E24B4A] text-xs mb-2">PIN incorrecto</div>}
            <div className="flex gap-2">
              <button onClick={confirmarPin} className="flex-1 bg-[#1ABBD6] text-white font-bold text-sm py-2 rounded-xl">CONFIRMAR</button>
              <button onClick={() => setShowPin(false)} className="flex-1 bg-[#E8E8E6] text-[#5F5E5A] font-bold text-sm py-2 rounded-xl">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* NUEVO ITEM MODAL */}
      {showNuevoItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-4">
            <div className="text-[#0F3A42] font-bold text-sm mb-3">Nuevo {vista === 'herramientas' ? 'herramienta' : 'material'} · {labelCategoria(categoria)}</div>
            {[
              { label: 'Nombre *', key: 'nombre', placeholder: 'Nombre del ítem' },
              { label: 'Código', key: 'codigo', placeholder: 'Ej: EL-001' },
              { label: 'Unidad', key: 'unidad', placeholder: 'Ej: unidad, kg, m' },
              { label: 'Stock inicial', key: 'stock_actual', placeholder: '0' },
              { label: 'Stock mínimo', key: 'stock_minimo', placeholder: '0' },
              { label: 'Ubicación pañol', key: 'ubicacion_panol', placeholder: 'Ej: Estante A3' },
            ].map(f => (
              <div key={f.key} className="mb-2">
                <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-0.5">{f.label}</div>
                <input
                  className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
                  placeholder={f.placeholder}
                  value={(nuevoItem as any)[f.key]}
                  onChange={e => setNuevoItem({ ...nuevoItem, [f.key]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button onClick={crearItem} disabled={!nuevoItem.nombre} className="flex-1 bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50">GUARDAR</button>
              <button onClick={() => setShowNuevoItem(false)} className="flex-1 bg-[#E8E8E6] text-[#5F5E5A] font-bold text-sm py-3 rounded-xl">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-3">

        {/* TABS */}
        <div className="flex gap-2 mb-3">
          {(['stock', 'herramientas', 'pedidos', 'checkins'] as const).map(t => (
            <button key={t} onClick={() => { setVista(t); setCategoria(null); setBusqueda('') }}
              className={`flex-1 text-xs font-bold py-2 rounded-lg ${vista === t ? 'bg-[#1ABBD6] text-white' : 'bg-white border border-[#B2E0E8] text-[#7A9EA5]'}`}>
              {t === 'stock' ? 'STOCK' : t === 'herramientas' ? 'HERRAM.' : t === 'pedidos' ? 'PEDIDOS' : `CHECK${checkinsFaltantes.length > 0 ? ` (${checkinsFaltantes.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* SOLICITUDES AUTORIZADAS */}
        {solicitudes.length > 0 && (
          <div className="bg-[#D6F4F8] border border-[#1ABBD6] rounded-xl p-3 mb-3">
            <div className="text-[#0F3A42] text-xs font-bold uppercase tracking-widest mb-2">📦 Solicitudes autorizadas · {solicitudes.length}</div>
            {solicitudes.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-white border border-[#B2E0E8] rounded-lg px-3 py-2 mb-1">
                <div>
                  <div className="text-[#0F3A42] text-xs font-bold">{s.materiales?.nombre}</div>
                  <div className="text-[#7A9EA5] text-xs">{s.profiles?.nombre} · ×{s.cantidad} {s.materiales?.unidad}</div>
                </div>
                <button onClick={() => entregarSolicitud(s.id)}
                  className="bg-[#3B6D11] text-white text-xs font-bold px-3 py-1.5 rounded-lg">ENTREGAR</button>
              </div>
            ))}
          </div>
        )}

        {/* VISTA CHECKINS */}
        {vista === 'checkins' && (
          <>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setCheckinsSubvista('pendientes')}
                className={`flex-1 text-xs font-bold py-2 rounded-lg ${checkinsSubvista === 'pendientes' ? 'bg-[#1ABBD6] text-white' : 'bg-white border border-[#B2E0E8] text-[#7A9EA5]'}`}>
                PENDIENTES {checkinsFaltantes.length > 0 ? `(${checkinsFaltantes.length})` : ''}
              </button>
              <button onClick={() => setCheckinsSubvista('historial')}
                className={`flex-1 text-xs font-bold py-2 rounded-lg ${checkinsSubvista === 'historial' ? 'bg-[#1ABBD6] text-white' : 'bg-white border border-[#B2E0E8] text-[#7A9EA5]'}`}>
                HISTORIAL
              </button>
            </div>

            {checkinsSubvista === 'historial' && (
              <div>
                {checkinsHistorial.length === 0 ? (
                  <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 text-center text-[#7A9EA5] text-sm">Sin checkins registrados</div>
                ) : checkinsHistorial.map(c => (
                  <div key={c.id} onClick={() => abrirCheckin(c)}
                    className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 cursor-pointer active:bg-[#F0FAFB]">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[#0F3A42] font-bold text-sm">Caja {c.caja?.toUpperCase()}</div>
                        <div className="text-[#7A9EA5] text-xs">{c.profiles?.nombre}</div>
                        <div className="text-[#7A9EA5] text-xs">{new Date(c.created_at).toLocaleString('es-AR')}</div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.estado === 'con_faltantes' ? 'bg-[#FCEBEB] text-[#A32D2D]' : c.estado === 'completado' ? 'bg-[#D6F4F8] text-[#0F8FAA]' : 'bg-[#E8E8E6] text-[#5F5E5A]'}`}>
                        {c.estado === 'con_faltantes' ? '⚠️ FALTANTE' : c.estado === 'completado' ? '✅ OK' : c.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {checkinsSubvista === 'pendientes' && (
            <>
            {checkinDetalle && (
              <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
                <div className="bg-white rounded-t-2xl p-4 max-h-[85vh] flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase">Checkin · Caja {checkinDetalle.caja?.toUpperCase()}</div>
                      <div className="text-[#0F3A42] font-bold text-sm">{checkinDetalle.profiles?.nombre}</div>
                      <div className="text-[#7A9EA5] text-xs">{new Date(checkinDetalle.hora_inicio).toLocaleString('es-AR')}</div>
                    </div>
                    <button onClick={() => setCheckinDetalle(null)} className="text-[#7A9EA5] text-xs font-bold">CERRAR</button>
                  </div>
                  <div className="overflow-y-auto flex-1 mb-3">
                    {checkinDetalle.items?.filter((i: any) => i.estado !== 'ok').map((item: any, idx: number) => (
                      <div key={idx} className={`rounded-lg p-3 mb-2 border ${item.estado === 'faltante' ? 'bg-[#FFF8F8] border-[#F5C6CB]' : 'bg-[#FFFBF2] border-[#FFE69C]'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.estado === 'faltante' ? 'bg-[#FCEBEB] text-[#A32D2D]' : 'bg-[#FAEEDA] text-[#854F0B]'}`}>
                            {item.estado === 'faltante' ? '❌ FALTANTE' : '🔄 REEMPLAZO'}
                          </span>
                          <span className="text-[#7A9EA5] text-xs">×{item.cantidad}</span>
                        </div>
                        <div className="text-[#0F3A42] text-sm font-medium">{item.detalle}</div>
                        {item.observacion && <div className="text-[#7A9EA5] text-xs mt-1">Obs: {item.observacion}</div>}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => recibirCheckin(checkinDetalle.id)}
                    className="w-full bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl"
                  >
                    ✅ MARCAR COMO RECIBIDO
                  </button>
                </div>
              </div>
            )}

            <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">
              Checkins con faltantes · {checkinsFaltantes.length}
            </div>
            {checkinsFaltantes.length === 0 ? (
              <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 text-center text-[#7A9EA5] text-sm">
                Sin faltantes pendientes ✅
              </div>
            ) : checkinsFaltantes.map(c => (
              <div key={c.id} onClick={() => abrirCheckin(c)}
                className="bg-white border border-[#F5C6CB] rounded-xl p-3 mb-2 cursor-pointer active:bg-[#FFF8F8]">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[#0F3A42] font-bold text-sm">Caja {c.caja?.toUpperCase()}</div>
                    <div className="text-[#7A9EA5] text-xs">{c.profiles?.nombre}</div>
                    <div className="text-[#7A9EA5] text-xs">{new Date(c.hora_inicio).toLocaleString('es-AR')}</div>
                  </div>
                  <span className="bg-[#FCEBEB] text-[#A32D2D] text-xs font-bold px-2 py-0.5 rounded-full">⚠️ FALTANTE</span>
                </div>
              </div>
            ))}
            </>
            )}
          </>
        )}

        {/* VISTA PEDIDOS */}
        {vista === 'pedidos' && (
          <>
            <button onClick={() => setShowNuevoPedido(!showNuevoPedido)}
              className="w-full bg-[#1ABBD6] text-white font-bold text-sm tracking-widest rounded-xl py-3 mb-3">
              + NUEVO PEDIDO AL JEFE
            </button>
            {showNuevoPedido && (
              <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 mb-3">
                <div className="text-[#0F3A42] font-bold text-sm mb-3">Nuevo pedido</div>
                <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Tipo</div>
                <select className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
                  value={pedidoForm.tipo} onChange={e => setPedidoForm({ ...pedidoForm, tipo: e.target.value })}>
                  <option value="materiales_electrico">Materiales Eléctricos</option>
                  <option value="materiales_ac">Materiales AC</option>
                  <option value="herramientas_electrico">Herramientas Eléctricas</option>
                  <option value="herramientas_ac">Herramientas AC</option>
                  <option value="general">General</option>
                </select>
                <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Descripción *</div>
                <textarea className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-4 outline-none"
                  rows={4} placeholder="Pegá o escribí el detalle del pedido..."
                  value={pedidoForm.descripcion} onChange={e => setPedidoForm({ ...pedidoForm, descripcion: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={enviarPedido} disabled={loadingPedido || !pedidoForm.descripcion.trim()}
                    className="flex-1 bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50">
                    {loadingPedido ? 'Enviando...' : 'ENVIAR AL JEFE'}
                  </button>
                  <button onClick={() => setShowNuevoPedido(false)}
                    className="flex-1 bg-[#E8E8E6] text-[#5F5E5A] font-bold text-sm py-3 rounded-xl">CANCELAR</button>
                </div>
              </div>
            )}
            <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Mis pedidos · {pedidos.length}</div>
            {pedidos.length === 0 ? (
              <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 text-center text-[#7A9EA5] text-sm">Sin pedidos</div>
            ) : pedidos.map(p => (
              <div key={p.id} className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-[#7A9EA5] text-xs">PJ-{String(p.numero_pedido).padStart(4, '0')} · {p.tipo.replace('_', ' ')}</div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.estado === 'aprobado' ? 'bg-[#D6F4F8] text-[#0F8FAA]' : p.estado === 'rechazado' ? 'bg-[#FCEBEB] text-[#A32D2D]' : p.estado === 'visto' ? 'bg-[#FAEEDA] text-[#854F0B]' : 'bg-[#E8E8E6] text-[#5F5E5A]'}`}>
                    {p.estado}
                  </span>
                </div>
                <div className="text-[#0F3A42] text-sm">{p.descripcion.slice(0, 80)}{p.descripcion.length > 80 ? '...' : ''}</div>
                {p.observaciones_jefe && <div className="text-[#7A9EA5] text-xs mt-1">Jefe: {p.observaciones_jefe}</div>}
              </div>
            ))}
          </>
        )}

        {/* VISTA STOCK / HERRAMIENTAS */}
        {(vista === 'stock' || vista === 'herramientas') && (
          <>
            {!categoria ? (
              <>
                <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-3">Seleccioná un pañol</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { key: 'electrico', emoji: '⚡', label: 'Eléctrico' },
                    { key: 'ac', emoji: '❄️', label: 'AC' },
                    { key: 'general', emoji: '🔧', label: 'General' },
                    { key: 'edificio', emoji: '🏢', label: 'Edificios' },
                  ].map(cat => (
                    <button key={cat.key} onClick={() => setCategoria(cat.key)}
                      className="bg-white border border-[#B2E0E8] rounded-xl p-4 text-left active:bg-[#F0FAFB]">
                      <div className="text-2xl mb-1">{cat.emoji}</div>
                      <div className="text-[#0F3A42] font-bold text-sm">Pañol {cat.label}</div>
                      <div className="text-[#7A9EA5] text-xs mt-0.5">
                        {tablaActiva.filter(m => m.categoria === cat.key).length} ítems
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setCategoria(null); setSubcategoria(null); setBusqueda('') }}
                      className="text-[#1ABBD6] text-xs font-bold">← Volver</button>
                    <div className="text-[#0F3A42] font-bold text-sm">
                      {vista === 'herramientas' ? 'Herramientas' : 'Stock'} · {labelCategoria(categoria)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={imprimirStock}
                      className="bg-[#F0FAFB] border border-[#B2E0E8] text-[#0F3A42] text-xs font-bold px-2 py-1.5 rounded-lg">🖨️</button>
                    <button onClick={() => pedirPin('nuevo')}
                      className="bg-[#1ABBD6] text-white text-xs font-bold px-2 py-1.5 rounded-lg">+ NUEVO</button>
                  </div>
                </div>

                {subcategoriasDisponibles.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                    <button
                      onClick={() => setSubcategoria(null)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${!subcategoria ? 'bg-[#1ABBD6] text-white' : 'bg-white border border-[#B2E0E8] text-[#7A9EA5]'}`}>
                      Todos
                    </button>
                    {subcategoriasDisponibles.map(s => (
                      <button key={s}
                        onClick={() => setSubcategoria(s)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${subcategoria === s ? 'bg-[#1ABBD6] text-white' : 'bg-white border border-[#B2E0E8] text-[#7A9EA5]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
                    <div className="text-[#1ABBD6] font-bold text-xl">{itemsFiltrados.length}</div>
                    <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Ítems</div>
                  </div>
                  <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
                    <div className="text-[#E24B4A] font-bold text-xl">{criticos.length}</div>
                    <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Crítico</div>
                  </div>
                  <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
                    <div className="text-[#B87C0F] font-bold text-xl">{bajos.length}</div>
                    <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Bajo</div>
                  </div>
                </div>

                <input
                  className="w-full bg-white border border-[#B2E0E8] rounded-xl px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                />

                {itemsFiltrados.length === 0 ? (
                  <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 text-center text-[#7A9EA5] text-sm mb-3">Sin resultados</div>
                ) : (
                  <div className="bg-white border border-[#B2E0E8] rounded-xl overflow-hidden mb-3">
                    <div className="grid grid-cols-12 px-3 py-1.5 border-b border-[#E8F4F7] bg-[#F0FAFB]">
                      <div className="col-span-5 text-[#7A9EA5] text-xs font-bold uppercase tracking-widest">Material</div>
                      <div className="col-span-2 text-[#7A9EA5] text-xs font-bold uppercase tracking-widest text-right">Stock</div>
                      <div className="col-span-2 text-[#7A9EA5] text-xs font-bold uppercase tracking-widest text-right">Mín</div>
                      <div className="col-span-1 text-[#7A9EA5] text-xs font-bold uppercase tracking-widest text-right">Est</div>
                      <div className="col-span-2 text-[#7A9EA5] text-xs font-bold uppercase tracking-widest text-right">Acc</div>
                    </div>
                    {itemsFiltrados.map((m, i) => {
                      const critico = m.stock_minimo > 0 && m.stock_actual <= m.stock_minimo
                      const bajo = m.stock_minimo > 0 && m.stock_actual > m.stock_minimo && m.stock_actual <= m.stock_minimo * 2
                      return (
                        <div key={m.id} className={`grid grid-cols-12 px-3 py-2 items-center ${i < itemsFiltrados.length - 1 ? 'border-b border-[#E8F4F7]' : ''} ${critico ? 'bg-[#FFF8F8]' : bajo ? 'bg-[#FFFBF2]' : ''}`}>
                          <div className="col-span-5">
                            <div className="text-[#0F3A42] text-xs font-medium leading-tight">{m.nombre}</div>
                            <div className="text-[#7A9EA5] text-xs">{m.unidad}</div>
                          </div>
                          <div className="col-span-2 text-right">
                            {editandoId === m.id ? (
                              <input
                                type="number"
                                value={editValor}
                                onChange={e => setEditValor(e.target.value)}
                                onBlur={() => guardarEdicion(m.id)}
                                onKeyDown={e => e.key === 'Enter' && guardarEdicion(m.id)}
                                className="w-12 bg-white border border-[#1ABBD6] rounded px-1 py-0.5 text-xs text-center text-[#0F3A42] outline-none"
                                autoFocus
                              />
                            ) : (
                              <span className={`text-xs font-bold ${critico ? 'text-[#A32D2D]' : bajo ? 'text-[#854F0B]' : 'text-[#0F8FAA]'}`}>
                                {m.stock_actual}
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 text-xs text-[#7A9EA5] text-right">{m.stock_minimo}</div>
                          <div className="col-span-1 text-right">
                            {critico && <span className="bg-[#FCEBEB] text-[#A32D2D] text-xs font-bold px-1 py-0.5 rounded-full">!</span>}
                            {bajo && <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-1 py-0.5 rounded-full">↓</span>}
                            {!critico && !bajo && <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-1 py-0.5 rounded-full">✓</span>}
                          </div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <button onClick={() => pedirPin('editar', m.id)}
                              className="text-[#1ABBD6] text-xs font-bold">✏️</button>
                            <button onClick={() => pedirPin('borrar', m.id)}
                              className="text-[#E24B4A] text-xs font-bold">🗑</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="h-24"></div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div onClick={() => { setVista('stock'); setCategoria(null) }} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={vista === 'stock' ? '#1ABBD6' : '#7ADCE8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          <span className={`text-xs ${vista === 'stock' ? 'text-[#1ABBD6]' : 'text-[#7ADCE8]'}`}>Stock</span>
        </div>
        <div onClick={() => { setVista('herramientas'); setCategoria(null) }} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={vista === 'herramientas' ? '#1ABBD6' : '#7ADCE8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          <span className={`text-xs ${vista === 'herramientas' ? 'text-[#1ABBD6]' : 'text-[#7ADCE8]'}`}>Herram.</span>
        </div>
        <div onClick={() => setVista('pedidos')} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={vista === 'pedidos' ? '#1ABBD6' : '#7ADCE8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span className={`text-xs ${vista === 'pedidos' ? 'text-[#1ABBD6]' : 'text-[#7ADCE8]'}`}>Pedidos</span>
        </div>
        <div onClick={() => { setVista('checkins'); setCategoria(null) }} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={vista === 'checkins' ? '#1ABBD6' : '#7ADCE8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span className={`text-xs ${vista === 'checkins' ? 'text-[#1ABBD6]' : 'text-[#7ADCE8]'}`}>Checkin</span>
        </div>
        <div onClick={() => router.push('/historial')} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="text-[#7ADCE8] text-xs">Historial</span>
        </div>
      </div>
    </main>
  )
}