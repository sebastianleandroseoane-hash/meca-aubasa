'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

export default function DashboardTalleristaElectrico() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [ordenActiva, setOrdenActiva] = useState<any>(null)
  const [ordenDetalle, setOrdenDetalle] = useState<any>(null)
  const [obscierre, setObsCierre] = useState('')
  const [showCierre, setShowCierre] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filtroNomenclatura, setFiltroNomenclatura] = useState('todos')
  const [nomenclaturas, setNomenclaturas] = useState<any[]>([])

  // luminarias
  const [luminarias, setLuminarias] = useState<any[]>([])
  const [showLuminaria, setShowLuminaria] = useState(false)
  const [lumForm, setLumForm] = useState({ tipo: 'led', descripcion_falla: '', observaciones: '' })

  // solicitudes insumos
  const [showSolicitud, setShowSolicitud] = useState(false)
  const [materiales, setMateriales] = useState<any[]>([])
  const [materialesFiltrados, setMaterialesFiltrados] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos')
  const [itemsSolicitud, setItemsSolicitud] = useState<{id: string, nombre: string, unidad: string, cantidad: number, stock: number}[]>([])
  const [loadingSolicitud, setLoadingSolicitud] = useState(false)
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<any[]>([])

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'tallerista_electrico' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
      await cargarOrdenes(p.id)
      await cargarLuminarias()
      await cargarSolicitudes(p.id)
    })
  }, [])

  useEffect(() => {
    let lista = materiales
    if (categoriaFiltro !== 'todos') lista = lista.filter(m => m.categoria === categoriaFiltro)
    if (busqueda.trim()) lista = lista.filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    setMaterialesFiltrados(lista)
  }, [busqueda, categoriaFiltro, materiales])

  async function cargarOrdenes(userId: string) {
    const { data: ords1 } = await supabase
      .from('ordenes_trabajo').select('*')
      .eq('asignado_a', userId)
      .eq('sector', 'electrico')
      .in('estado', ['pendiente', 'en_curso'])

    const { data: ots } = await supabase
      .from('orden_tecnicos').select('orden_id').eq('tecnico_id', userId)

    const ids = (ots || []).map((o: any) => o.orden_id)
    let ords2: any[] = []
    if (ids.length > 0) {
      const { data } = await supabase
        .from('ordenes_trabajo').select('*')
        .in('id', ids)
        .eq('sector', 'electrico')
        .in('estado', ['pendiente', 'en_curso'])
      ords2 = data || []
    }

    const todas = [...(ords1 || []), ...ords2]
    const unicas = todas.filter((o, i, arr) => arr.findIndex(x => x.id === o.id) === i)
    const ordenadas = unicas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setOrdenes(ordenadas)
    const activa = ordenadas.find((o: any) => o.estado === 'en_curso')
    setOrdenActiva(activa || ordenadas[0] || null)
    const noms = [...new Set(ordenadas.map((o: any) => o.nomenclatura).filter(Boolean))]
    setNomenclaturas(noms)
  }

  async function cargarLuminarias() {
    const { data } = await supabase
      .from('luminarias_taller').select('*')
      .order('created_at', { ascending: false }).limit(20)
    setLuminarias(data || [])
  }

  async function cargarSolicitudes(userId: string) {
    const { data } = await supabase
      .from('solicitudes_insumos')
      .select('*, materiales!solicitudes_insumos_material_id_fkey(nombre, unidad)')
      .eq('tallerista_id', userId)
      .eq('estado', 'pendiente')
    setSolicitudesPendientes(data || [])
  }

  async function abrirDetalle(orden: any) {
    const { data: tecnicos } = await supabase
      .from('orden_tecnicos')
      .select('*, profiles!orden_tecnicos_tecnico_id_fkey(nombre, rol)')
      .eq('orden_id', orden.id)
    const { data: mats } = await supabase
      .from('orden_materiales')
      .select('*, materiales!orden_materiales_material_id_fkey(nombre, unidad)')
      .eq('orden_id', orden.id)
    const { data: pedidos } = await supabase
      .from('pedidos_material').select('*').eq('orden_trabajo_id', orden.id)
    setOrdenDetalle({ ...orden, tecnicos: tecnicos || [], materiales: mats || [], pedidos: pedidos || [] })
  }

  async function iniciarOrden(id: string) {
    await supabase.from('ordenes_trabajo').update({ estado: 'en_curso', fecha_inicio: new Date().toISOString() }).eq('id', id)
    await cargarOrdenes(perfil.id)
    setOrdenDetalle(null)
  }

  async function cerrarOrden(id: string) {
    setLoading(true)
    await supabase.from('ordenes_trabajo').update({
      estado: 'completada',
      fecha_cierre: new Date().toISOString(),
      observaciones: obscierre
    }).eq('id', id)
    await supabase.from('orden_tecnicos').update({ cerro: true }).eq('orden_id', id).eq('tecnico_id', perfil.id)
    setLoading(false)
    setShowCierre(false)
    setObsCierre('')
    setOrdenDetalle(null)
    await cargarOrdenes(perfil.id)
  }

  async function ingresarLuminaria() {
    if (!lumForm.descripcion_falla) return
    setLoading(true)
    await supabase.from('luminarias_taller').insert({
      tipo: lumForm.tipo,
      descripcion_falla: lumForm.descripcion_falla,
      observaciones: lumForm.observaciones || null,
      tallerista_id: perfil.id,
      estado: 'ingresada'
    })
    setLoading(false)
    setShowLuminaria(false)
    setLumForm({ tipo: 'led', descripcion_falla: '', observaciones: '' })
    await cargarLuminarias()
  }

  async function cambiarEstadoLuminaria(id: string, estado: string) {
    const update: any = { estado }
    if (estado === 'reparada' || estado === 'irreparable') update.fecha_egreso = new Date().toISOString()
    await supabase.from('luminarias_taller').update(update).eq('id', id)
    await cargarLuminarias()
  }

  async function abrirStock() {
    if (materiales.length === 0) {
      const { data } = await supabase.from('materiales').select('*').order('nombre', { ascending: true })
      setMateriales(data || [])
      setMaterialesFiltrados(data || [])
    }
    setShowSolicitud(true)
  }

  function agregarItem(m: any) {
    if (itemsSolicitud.find(x => x.id === m.id)) return
    setItemsSolicitud(prev => [...prev, { id: m.id, nombre: m.nombre, unidad: m.unidad, cantidad: 1, stock: m.stock_actual }])
  }

  function quitarItem(id: string) {
    setItemsSolicitud(prev => prev.filter(m => m.id !== id))
  }

  function cambiarCantidad(id: string, valor: number) {
    setItemsSolicitud(prev => prev.map(m => m.id === id ? { ...m, cantidad: Math.max(1, valor) } : m))
  }

  async function enviarSolicitud() {
    if (!ordenActiva || itemsSolicitud.length === 0) return
    setLoadingSolicitud(true)
    for (const item of itemsSolicitud) {
      await supabase.from('solicitudes_insumos').insert({
        tallerista_id: perfil.id,
        orden_trabajo_id: ordenActiva.id,
        material_id: item.id,
        cantidad: item.cantidad,
        estado: 'pendiente'
      })
    }
    setLoadingSolicitud(false)
    setShowSolicitud(false)
    setItemsSolicitud([])
    setBusqueda('')
    setCategoriaFiltro('todos')
    await cargarSolicitudes(perfil.id)
  }

  const ordenesFiltradas = filtroNomenclatura === 'todos'
    ? ordenes
    : ordenes.filter(o => o.nomenclatura === filtroNomenclatura)

  function badgeColor(estado: string) {
    if (estado === 'en_curso') return 'bg-[#FAEEDA] text-[#854F0B]'
    if (estado === 'completada') return 'bg-[#D6F4F8] text-[#0F8FAA]'
    if (estado === 'cancelada') return 'bg-[#FCEBEB] text-[#A32D2D]'
    return 'bg-[#E8E8E6] text-[#5F5E5A]'
  }

  function badgeLabel(estado: string) {
    if (estado === 'en_curso') return 'En curso'
    if (estado === 'completada') return 'Completada'
    if (estado === 'cancelada') return 'Cancelada'
    return 'Pendiente'
  }

  if (!perfil) return <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Tallerista Eléctrico</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">{perfil.nombre} · Turno {perfil.turno}</div>
          </div>
          <div className="bg-[#0A2830] text-[#7ADCE8] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">TALL·E</div>
        </div>
      </div>

      {/* PANEL SOLICITUD INSUMOS */}
      {showSolicitud && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <div className="text-[#0F3A42] font-bold text-sm">Solicitar insumos</div>
              <button onClick={() => { setShowSolicitud(false); setItemsSolicitud([]); setBusqueda(''); setCategoriaFiltro('todos') }}
                className="text-[#7A9EA5] text-xs font-bold">CERRAR</button>
            </div>

            {ordenActiva && (
              <div className="bg-[#D6F4F8] border border-[#1ABBD6] rounded-lg px-3 py-2 mb-3">
                <div className="text-[#0F3A42] text-xs font-bold">Orden: OT-{String(ordenActiva.numero_orden).padStart(5, '0')} · {ordenActiva.titulo}</div>
              </div>
            )}

            <select
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-2 outline-none"
              value={categoriaFiltro}
              onChange={e => setCategoriaFiltro(e.target.value)}
            >
              <option value="todos">Todas las categorías</option>
              <option value="electrico">Eléctrico</option>
              <option value="ac">Aire Acondicionado</option>
              <option value="general">General</option>
            </select>

            <input
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-2 outline-none"
              placeholder="Buscar material..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              autoFocus
            />

            {itemsSolicitud.length > 0 && (
              <div className="bg-[#D6F4F8] border border-[#1ABBD6] rounded-lg px-3 py-2 mb-2">
                <div className="text-[#0F3A42] text-xs font-bold mb-1">Seleccionados ({itemsSolicitud.length})</div>
                <div className="flex flex-wrap gap-1">
                  {itemsSolicitud.map(m => (
                    <span key={m.id} className="text-xs bg-white border border-[#B2E0E8] text-[#0F3A42] px-2 py-0.5 rounded-full">{m.nombre} ×{m.cantidad}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-y-auto flex-1">
              {materialesFiltrados.map((m, i) => (
                <div key={m.id} onClick={() => agregarItem(m)}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer ${i < materialesFiltrados.length - 1 ? 'border-b border-[#E8F4F7]' : ''}`}>
                  <div>
                    <div className="text-[#0F3A42] text-sm font-medium">{m.nombre}</div>
                    <div className="text-[#7A9EA5] text-xs">{m.codigo} · {m.unidad}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${m.stock_actual > 0 ? 'bg-[#D6F4F8] text-[#0F8FAA]' : 'bg-[#FCEBEB] text-[#A32D2D]'}`}>
                    {m.stock_actual > 0 ? `${m.stock_actual} ${m.unidad}` : 'Sin stock'}
                  </span>
                </div>
              ))}
            </div>

            {itemsSolicitud.length > 0 && (
              <div className="mt-3 border-t border-[#E8F4F7] pt-3">
                {itemsSolicitud.map(m => (
                  <div key={m.id} className="flex items-center gap-2 mb-2">
                    <span className="flex-1 text-[#0F3A42] text-xs font-medium">{m.nombre}</span>
                    <input type="number" min={1} value={m.cantidad}
                      onChange={e => cambiarCantidad(m.id, parseInt(e.target.value) || 1)}
                      className="w-14 bg-white border border-[#B2E0E8] rounded px-2 py-1 text-sm text-center text-[#0F3A42] outline-none" />
                    <span className="text-xs text-[#7A9EA5]">{m.unidad}</span>
                    <button onClick={() => quitarItem(m.id)} className="text-[#A32D2D] text-xs font-bold">✕</button>
                  </div>
                ))}
                <button onClick={enviarSolicitud} disabled={loadingSolicitud || !ordenActiva}
                  className="w-full bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl mt-2 disabled:opacity-50">
                  {loadingSolicitud ? 'Enviando...' : 'ENVIAR SOLICITUD AL SUPERVISOR'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETALLE ORDEN */}
      {ordenDetalle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase">OT-{String(ordenDetalle.numero_orden).padStart(5, '0')}</div>
                <div className="text-[#0F3A42] font-bold text-sm">{ordenDetalle.titulo}</div>
              </div>
              <button onClick={() => { setOrdenDetalle(null); setShowCierre(false); setObsCierre('') }} className="text-[#7A9EA5] text-xs font-bold">CERRAR</button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Estado</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5 capitalize">{ordenDetalle.estado}</div>
                </div>
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Prioridad</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5 capitalize">{ordenDetalle.prioridad}</div>
                </div>
              </div>

              {(ordenDetalle.km || ordenDetalle.ubicacion) && (
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2 mb-3">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Ubicación</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5">
                    {ordenDetalle.km ? `Km ${ordenDetalle.km}` : ''}{ordenDetalle.ubicacion ? ` · ${ordenDetalle.ubicacion}` : ''}
                  </div>
                </div>
              )}

              {ordenDetalle.descripcion && (
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2 mb-3">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Descripción</div>
                  <div className="text-[#0F3A42] text-sm mt-0.5">{ordenDetalle.descripcion}</div>
                </div>
              )}

              {ordenDetalle.materiales.length > 0 && (
                <div className="mb-3">
                  <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-1">Materiales asignados</div>
                  {ordenDetalle.materiales.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 mb-1">
                      <span className="text-[#0F3A42] text-sm">{m.materiales?.nombre}</span>
                      <span className="text-[#7A9EA5] text-xs">{m.cantidad_solicitada} {m.materiales?.unidad}</span>
                    </div>
                  ))}
                </div>
              )}

              {showCierre && (
                <div className="mb-3">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest mb-1">Observaciones de cierre</div>
                  <textarea
                    className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
                    rows={3} placeholder="Detallá lo realizado..."
                    value={obscierre} onChange={e => setObsCierre(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-2 mt-2">
                {ordenDetalle.estado === 'pendiente' && (
                  <button onClick={() => iniciarOrden(ordenDetalle.id)} className="flex-1 bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl">INICIAR</button>
                )}
                {ordenDetalle.estado === 'en_curso' && !showCierre && (
                  <>
                    <button onClick={abrirStock} className="flex-1 bg-[#F0FAFB] border border-[#B2E0E8] text-[#0F3A42] font-bold text-sm py-3 rounded-xl">+ INSUMOS</button>
                    <button onClick={() => setShowCierre(true)} className="flex-1 bg-[#3B6D11] text-white font-bold text-sm py-3 rounded-xl">CERRAR</button>
                  </>
                )}
                {ordenDetalle.estado === 'en_curso' && showCierre && (
                  <button onClick={() => cerrarOrden(ordenDetalle.id)} disabled={loading} className="flex-1 bg-[#3B6D11] text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50">
                    {loading ? 'Cerrando...' : 'CONFIRMAR CIERRE'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-3">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#B87C0F] font-bold text-2xl">{ordenes.length}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Asignadas</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#1ABBD6] font-bold text-2xl">{ordenes.filter(o => o.estado === 'en_curso').length}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">En curso</div>
          </div>
        </div>

        {solicitudesPendientes.length > 0 && (
          <div className="bg-[#FAEEDA] border border-[#E8C97A] rounded-xl p-3 mb-3">
            <div className="text-[#854F0B] text-xs font-bold uppercase tracking-widest mb-1">⏳ Solicitudes pendientes · {solicitudesPendientes.length}</div>
            {solicitudesPendientes.map(s => (
              <div key={s.id} className="flex justify-between items-center bg-white border border-[#E8C97A] rounded-lg px-3 py-2 mb-1">
                <span className="text-[#0F3A42] text-xs font-medium">{s.materiales?.nombre}</span>
                <span className="text-[#854F0B] text-xs">×{s.cantidad} · esperando supervisor</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setShowLuminaria(!showLuminaria)}
          className="w-full bg-[#0F3A42] text-white font-bold text-sm tracking-widest rounded-xl py-3 mb-3">
          + INGRESAR LUMINARIA ROTA
        </button>

        {showLuminaria && (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 mb-3">
            <div className="text-[#0F3A42] font-bold text-sm mb-3">Ingreso de luminaria</div>
            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Tipo</div>
            <select className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
              value={lumForm.tipo} onChange={e => setLumForm({ ...lumForm, tipo: e.target.value })}>
              <option value="led">LED</option>
              <option value="sodio">Sodio</option>
              <option value="mercurio">Mercurio</option>
            </select>
            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Descripción de la falla *</div>
            <textarea className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
              rows={3} placeholder="Describí la falla"
              value={lumForm.descripcion_falla} onChange={e => setLumForm({ ...lumForm, descripcion_falla: e.target.value })} />
            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Observaciones</div>
            <input className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-4 outline-none"
              placeholder="Ej: viene de Km 38, TS-7"
              value={lumForm.observaciones} onChange={e => setLumForm({ ...lumForm, observaciones: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={ingresarLuminaria} disabled={loading || !lumForm.descripcion_falla}
                className="flex-1 bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50">
                {loading ? 'Ingresando...' : 'INGRESAR'}
              </button>
              <button onClick={() => setShowLuminaria(false)}
                className="flex-1 bg-[#E8E8E6] text-[#5F5E5A] font-bold text-sm py-3 rounded-xl">CANCELAR</button>
            </div>
          </div>
        )}

        {luminarias.length > 0 && (
          <>
            <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Luminarias en taller</div>
            {luminarias.map(l => (
              <div key={l.id} className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[#7A9EA5] text-xs">REF-{String(l.numero_referencia).padStart(4, '0')} · {l.tipo.toUpperCase()}</div>
                    <div className="text-[#0F3A42] text-sm font-medium">{l.descripcion_falla}</div>
                    {l.observaciones && <div className="text-[#7A9EA5] text-xs">{l.observaciones}</div>}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${
                    l.estado === 'reparada' ? 'bg-[#D6F4F8] text-[#0F8FAA]' :
                    l.estado === 'irreparable' ? 'bg-[#FCEBEB] text-[#A32D2D]' :
                    l.estado === 'en_reparacion' ? 'bg-[#FAEEDA] text-[#854F0B]' :
                    'bg-[#E8E8E6] text-[#5F5E5A]'}`}>
                    {l.estado}
                  </span>
                </div>
                {(l.estado === 'ingresada' || l.estado === 'en_reparacion') && (
                  <div className="flex gap-2">
                    {l.estado === 'ingresada' && (
                      <button onClick={() => cambiarEstadoLuminaria(l.id, 'en_reparacion')}
                        className="flex-1 bg-[#FAEEDA] text-[#854F0B] font-bold text-xs py-1.5 rounded-lg">INICIAR REPARACIÓN</button>
                    )}
                    {l.estado === 'en_reparacion' && (
                      <>
                        <button onClick={() => cambiarEstadoLuminaria(l.id, 'reparada')}
                          className="flex-1 bg-[#D6F4F8] text-[#0F8FAA] font-bold text-xs py-1.5 rounded-lg">REPARADA</button>
                        <button onClick={() => cambiarEstadoLuminaria(l.id, 'irreparable')}
                          className="flex-1 bg-[#FCEBEB] text-[#A32D2D] font-bold text-xs py-1.5 rounded-lg">IRREPARABLE</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {nomenclaturas.length > 1 && (
          <div className="mb-3">
            <select className="w-full bg-white border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
              value={filtroNomenclatura} onChange={e => setFiltroNomenclatura(e.target.value)}>
              <option value="todos">Todas las nomenclaturas</option>
              {nomenclaturas.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">
          Mis órdenes · {ordenesFiltradas.length} total
        </div>

        {ordenesFiltradas.length === 0 ? (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 text-center text-[#7A9EA5] text-sm mb-3">
            No tenés órdenes asignadas
          </div>
        ) : (
          ordenesFiltradas.map(o => (
            <div key={o.id} onClick={() => abrirDetalle(o)} className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 cursor-pointer active:bg-[#F0FAFB]">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-[#7A9EA5] text-xs">OT-{String(o.numero_orden).padStart(5, '0')}{o.nomenclatura ? ` · ${o.nomenclatura}` : ''}</div>
                  <div className="text-[#0F3A42] font-bold text-sm">{o.titulo}</div>
                  {o.ubicacion && <div className="text-[#7A9EA5] text-xs mt-0.5">{o.ubicacion}</div>}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${badgeColor(o.estado)}`}>
                  {badgeLabel(o.estado)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="h-24"></div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span className="text-[#1ABBD6] text-xs">Panel</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Órdenes</span>
        </div>
        <div onClick={() => router.push('/historial')} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="text-[#7ADCE8] text-xs">Historial</span>
        </div>
      </div>
    </main>
  )
}