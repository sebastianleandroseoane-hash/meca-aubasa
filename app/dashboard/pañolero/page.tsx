'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'

export default function DashboardPanolero() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [materiales, setMateriales] = useState<any[]>([])
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('electrico')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'panolero' && p.rol !== 'superadmin') { router.push('/'); return }
      setPerfil(p)
      await cargarDatos()
      setLoading(false)
    })
  }, [])

  async function cargarDatos() {
    const { data: mats } = await supabase
      .from('materiales')
      .select('*')
      .order('nombre', { ascending: true })
    setMateriales(mats || [])

    const { data: movs } = await supabase
      .from('movimientos_stock')
      .select('*, material:material_id(nombre), usuario:usuario_id(nombre, apellido)')
      .order('created_at', { ascending: false })
      .limit(10)
    setMovimientos(movs || [])
  }

  const materialesFiltrados = materiales.filter(m =>
    m.categoria === categoria &&
    m.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const stockCritico = materiales.filter(m =>
    m.categoria === categoria && m.stock_actual <= m.stock_minimo && m.stock_minimo > 0
  )

  const stockBajo = materiales.filter(m =>
    m.categoria === categoria && m.stock_actual > m.stock_minimo && m.stock_actual <= m.stock_minimo * 2 && m.stock_minimo > 0
  )

  if (!perfil || loading) return (
    <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">
      Cargando...
    </div>
  )

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Pañol · Stock</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">{perfil.nombre}</div>
          </div>
          <div className="bg-[#0A2830] text-[#7ADCE8] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">PAÑOL</div>
        </div>
      </div>

      <div className="px-4 pt-3">

        {/* SELECTOR CATEGORIA */}
        <div className="flex gap-2 mb-3">
          {['electrico', 'ac', 'general'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`flex-1 text-xs font-bold py-2 rounded-lg uppercase tracking-wide ${categoria === cat ? 'bg-[#1ABBD6] text-white' : 'bg-white border border-[#B2E0E8] text-[#7A9EA5]'}`}
            >
              {cat === 'electrico' ? 'Elec.' : cat === 'ac' ? 'AC' : 'General'}
            </button>
          ))}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
            <div className="text-[#1ABBD6] font-bold text-xl">{materialesFiltrados.length}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Ítems</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
            <div className="text-[#E24B4A] font-bold text-xl">{stockCritico.length}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Crítico</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
            <div className="text-[#B87C0F] font-bold text-xl">{stockBajo.length}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Bajo</div>
          </div>
        </div>

        {/* BUSCADOR */}
        <input
          className="w-full bg-white border border-[#B2E0E8] rounded-xl px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
          placeholder="Buscar material..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />

        {/* LISTA MATERIALES */}
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">
          Stock · {materialesFiltrados.length} ítems
        </div>

        {materialesFiltrados.length === 0 ? (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 text-center text-[#7A9EA5] text-sm mb-3">
            Sin resultados
          </div>
        ) : (
          materialesFiltrados.map(m => {
            const critico = m.stock_minimo > 0 && m.stock_actual <= m.stock_minimo
            const bajo = m.stock_minimo > 0 && m.stock_actual > m.stock_minimo && m.stock_actual <= m.stock_minimo * 2
            return (
              <div key={m.id} className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-[#0F3A42] font-bold text-sm">{m.nombre}</div>
                  <div className="text-[#7A9EA5] text-xs mt-0.5">
                    {m.stock_actual} {m.unidad}
                  </div>
                </div>
                {critico && <span className="bg-[#FCEBEB] text-[#A32D2D] text-xs font-bold px-2 py-0.5 rounded-full ml-2">Crítico</span>}
                {bajo && <span className="bg-[#FAEEDA] text-[#854F0B] text-xs font-bold px-2 py-0.5 rounded-full ml-2">Bajo</span>}
                {!critico && !bajo && <span className="bg-[#D6F4F8] text-[#0F8FAA] text-xs font-bold px-2 py-0.5 rounded-full ml-2">OK</span>}
              </div>
            )
          })
        )}

        {/* ULTIMOS MOVIMIENTOS */}
        {movimientos.length > 0 && (
          <>
            <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2 mt-2">Últimos movimientos</div>
            {movimientos.slice(0, 5).map(mov => (
              <div key={mov.id} className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
                <div>
                  <div className="text-[#0F3A42] font-bold text-sm">{mov.material?.nombre}</div>
                  <div className="text-[#7A9EA5] text-xs mt-0.5">
                    {mov.usuario?.nombre} · {mov.cantidad} {mov.tipo}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${mov.tipo === 'egreso' ? 'bg-[#FCEBEB] text-[#A32D2D]' : mov.tipo === 'devolucion' ? 'bg-[#D6F4F8] text-[#0F8FAA]' : 'bg-[#E8F4E8] text-[#3B6D11]'}`}>
                  {mov.tipo}
                </span>
              </div>
            ))}
          </>
        )}

        <div className="h-24"></div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          <span className="text-[#1ABBD6] text-xs">Stock</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span className="text-[#7ADCE8] text-xs">Egreso</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 19 4 14"/><path d="M20 9H7.5a4 4 0 1 0 0 8H9"/></svg>
          <span className="text-[#7ADCE8] text-xs">Devoluc.</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span className="text-[#7ADCE8] text-xs">Pedidos</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span className="text-[#7ADCE8] text-xs">Historial</span>
        </div>
      </div>
    </main>
  )
}