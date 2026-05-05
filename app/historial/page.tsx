'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

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

    let query = supabase
      .from('ordenes_trabajo')
      .select('*, profiles!ordenes_trabajo_asignado_a_fkey(nombre)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (f.sector !== 'todos') query = query.eq('sector', f.sector)
    if (f.estado !== 'todos') query = query.eq('estado', f.estado)
    if (f.desde) query = query.gte('fecha_programada', f.desde)
    if (f.hasta) query = query.lte('fecha_programada', f.hasta)
    if (f.texto) query = query.or(`titulo.ilike.%${f.texto}%,ubicacion.ilike.%${f.texto}%,nomenclatura.ilike.%${f.texto}%`)

    // filtro por sector del rol
    if (perfActual?.rol === 'tecnico_electrico' || perfActual?.rol === 'supervisor_electrico') {
      query = query.eq('sector', 'electrico')
    } else if (perfActual?.rol === 'tecnico_ac' || perfActual?.rol === 'supervisor_ac') {
      query = query.eq('sector', 'ac')
    } else if (perfActual?.rol === 'tecnico_electrico_edificio') {
      query = query.eq('sector', 'edificio')
    }

    const { data } = await query
    setOrdenes(data || [])
    setLoading(false)
  }

  async function abrirDetalle(orden: any) {
    const { data: tecnicos } = await supabase
      .from('orden_tecnicos')
      .select('*, profiles!orden_tecnicos_tecnico_id_fkey(nombre)')
      .eq('orden_id', orden.id)

    const { data: materiales } = await supabase
      .from('orden_materiales')
      .select('*, materiales!orden_materiales_material_id_fkey(nombre, unidad)')
      .eq('orden_id', orden.id)

    const { data: pedidos } = await supabase
      .from('pedidos_material')
      .select('*')
      .eq('orden_trabajo_id', orden.id)

    setOrdenDetalle({ ...orden, tecnicos: tecnicos || [], materiales: materiales || [], pedidos: pedidos || [] })
  }

  function badgeColor(estado: string) {
    if (estado === 'en_curso') return 'bg-[#FAEEDA] text-[#854F0B]'
    if (estado === 'completada') return 'bg-[#D6F4F8] text-[#0F8FAA]'
    if (estado === 'cancelada') return 'bg-[#FCEBEB] text-[#A32D2D]'
    if (estado === 'archivada') return 'bg-[#E8E8E6] text-[#5F5E5A]'
    return 'bg-[#E8E8E6] text-[#5F5E5A]'
  }

  if (!perfil) return (
    <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">
      Cargando...
    </div>
  )

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#7ADCE8] text-sm font-bold">←</button>
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Historial</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Órdenes de trabajo</div>
          </div>
        </div>
      </div>

      {ordenDetalle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase">OT-{String(ordenDetalle.numero_orden).padStart(5, '0')}</div>
                <div className="text-[#0F3A42] font-bold text-sm">{ordenDetalle.titulo}</div>
              </div>
              <button onClick={() => setOrdenDetalle(null)} className="text-[#7A9EA5] text-xs font-bold">CERRAR</button>
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Estado</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5 capitalize">{ordenDetalle.estado}</div>
                </div>
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Sector</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5 capitalize">{ordenDetalle.sector}</div>
                </div>
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Tipo</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5">{ordenDetalle.tipo}</div>
                </div>
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Prioridad</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5 capitalize">{ordenDetalle.prioridad}</div>
                </div>
              </div>
              {ordenDetalle.nomenclatura && (
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2 mb-3">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Nomenclatura</div>
                  <div className="text-[#0F3A42] text-sm font-bold mt-0.5">{ordenDetalle.nomenclatura}</div>
                </div>
              )}
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
              {ordenDetalle.balizamiento_desde && (
                <div className="bg-[#FFF8E8] border border-[#E8C97A] rounded-lg p-2 mb-3">
                  <div className="text-[#854F0B] text-xs font-bold uppercase tracking-widest mb-1">Balizamiento</div>
                  <div className="text-[#0F3A42] text-sm">Km {ordenDetalle.balizamiento_desde} → {ordenDetalle.balizamiento_hasta}</div>
                  <div className="text-[#7A9EA5] text-xs mt-0.5">Ingreso: {ordenDetalle.balizamiento_hora_ingreso} · Egreso probable: {ordenDetalle.balizamiento_hora_egreso}</div>
                  {ordenDetalle.balizamiento_hora_salida && <div className="text-[#0F8FAA] text-xs mt-0.5 font-bold">Salida real: {ordenDetalle.balizamiento_hora_salida}</div>}
                </div>
              )}
              {ordenDetalle.tecnicos?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-1">Técnicos</div>
                  {ordenDetalle.tecnicos.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 mb-1">
                      <span className="text-[#0F3A42] text-sm">{t.profiles?.nombre}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.cerro ? 'bg-[#D6F4F8] text-[#0F8FAA]' : 'bg-[#E8E8E6] text-[#5F5E5A]'}`}>
                        {t.cerro ? 'Cerró' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {ordenDetalle.materiales?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-1">Materiales</div>
                  {ordenDetalle.materiales.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 mb-1">
                      <span className="text-[#0F3A42] text-sm">{m.materiales?.nombre}</span>
                      <span className="text-[#7A9EA5] text-xs">{m.cantidad_solicitada} {m.materiales?.unidad}</span>
                    </div>
                  ))}
                </div>
              )}
              {ordenDetalle.observaciones && (
                <div className="bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg p-2 mb-3">
                  <div className="text-[#7A9EA5] text-xs uppercase tracking-widest">Informe de cierre</div>
                  <div className="text-[#0F3A42] text-sm mt-0.5">{ordenDetalle.observaciones}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-3">
        <input
          className="w-full bg-white border border-[#B2E0E8] rounded-xl px-3 py-2 text-sm text-[#0F3A42] mb-2 outline-none"
          placeholder="Buscar por título, km, ubicación, nomenclatura..."
          value={filtros.texto}
          onChange={e => setFiltros({ ...filtros, texto: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-2 mb-2">
          <select
            className="w-full bg-white border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
            value={filtros.sector}
            onChange={e => setFiltros({ ...filtros, sector: e.target.value })}
          >
            <option value="todos">Todos los sectores</option>
            <option value="electrico">Eléctrico</option>
            <option value="ac">AC</option>
            <option value="edificio">Edificio</option>
          </select>
          <select
            className="w-full bg-white border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
            value={filtros.estado}
            onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_curso">En curso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
            <option value="archivada">Archivada</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="date"
            className="w-full bg-white border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
            value={filtros.desde}
            onChange={e => setFiltros({ ...filtros, desde: e.target.value })}
          />
          <input
            type="date"
            className="w-full bg-white border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
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

        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">
          {ordenes.length} resultado{ordenes.length !== 1 ? 's' : ''}
        </div>

        {ordenes.map(o => (
          <div key={o.id} onClick={() => abrirDetalle(o)} className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 cursor-pointer active:bg-[#F0FAFB]">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-[#7A9EA5] text-xs">OT-{String(o.numero_orden).padStart(5, '0')} · {o.nomenclatura || o.sector}</div>
                <div className="text-[#0F3A42] font-bold text-sm">{o.titulo}</div>
                {o.km && <div className="text-[#7A9EA5] text-xs mt-0.5">Km {o.km}{o.ubicacion ? ` · ${o.ubicacion}` : ''}</div>}
                {o.fecha_programada && <div className="text-[#7A9EA5] text-xs">{o.fecha_programada}</div>}
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${badgeColor(o.estado)}`}>
                {o.estado}
              </span>
            </div>
          </div>
        ))}

        <div className="h-24"></div>
      </div>
    </main>
  )
}