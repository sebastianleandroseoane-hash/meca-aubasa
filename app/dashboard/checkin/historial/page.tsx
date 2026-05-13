'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

export default function HistorialCheckins() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [checkins, setCheckins] = useState<any[]>([])
  const [detalle, setDetalle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filtroCaja, setFiltroCaja] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      const rolesPermitidos = ['jefe', 'supervisor_electrico', 'supervisor_ac', 'superadmin']
      if (!rolesPermitidos.includes(p.rol)) { router.push('/'); return }
      setPerfil(p)
      await cargarCheckins()
      setLoading(false)
    })
  }, [])

  async function cargarCheckins() {
    const { data } = await supabase
      .from('checkins_herramientas')
      .select('*, profiles!checkins_herramientas_tecnico_id_fkey(nombre, turno, modalidad), recibido:profiles!checkins_herramientas_recibido_por_fkey(nombre)')
      .order('created_at', { ascending: false })
      .limit(100)
    setCheckins(data || [])
  }

  async function abrirDetalle(checkin: any) {
    const { data } = await supabase
      .from('checkin_items')
      .select('*')
      .eq('checkin_id', checkin.id)
      .order('created_at')
    setDetalle({ ...checkin, items: data || [] })
  }

  const checkinsFiltrados = checkins.filter(c => {
    if (filtroCaja !== 'todas' && c.caja !== filtroCaja) return false
    if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false
    return true
  })

  const totalOk = checkinsFiltrados.filter(c => c.estado === 'completado').length
  const totalFaltantes = checkinsFiltrados.filter(c => c.estado === 'con_faltantes').length

  if (!perfil || loading) return (
    <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>
  )

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      {/* Header */}
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[#7ADCE8] text-xs font-bold tracking-widest uppercase">Historial</div>
            <div className="text-white font-bold text-base">Checkins de Herramientas</div>
          </div>
          <button onClick={() => router.back()}
            className="text-[#7ADCE8] text-xs font-bold">← Volver</button>
        </div>
      </div>

      {/* Detalle modal */}
      {detalle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase">Caja {detalle.caja?.toUpperCase()}</div>
                <div className="text-[#0F3A42] font-bold text-sm">{detalle.profiles?.nombre}</div>
                <div className="text-[#7A9EA5] text-xs">{new Date(detalle.hora_inicio).toLocaleString('es-AR')}</div>
              </div>
              <button onClick={() => setDetalle(null)} className="text-[#7A9EA5] text-xs font-bold">CERRAR</button>
            </div>

            {/* Stats del checkin */}
            <div className="flex gap-3 mb-3">
              <div className="flex-1 bg-[#D6F4F8] border border-[#1ABBD6] rounded-lg p-2 text-center">
                <div className="text-[#0F8FAA] font-bold text-lg">{detalle.items.filter((i: any) => i.estado === 'ok').length}</div>
                <div className="text-[#7A9EA5] text-xs">OK</div>
              </div>
              <div className="flex-1 bg-[#FCEBEB] border border-[#F09595] rounded-lg p-2 text-center">
                <div className="text-[#A32D2D] font-bold text-lg">{detalle.items.filter((i: any) => i.estado === 'faltante').length}</div>
                <div className="text-[#7A9EA5] text-xs">Faltante</div>
              </div>
              <div className="flex-1 bg-[#FAEEDA] border border-[#E8C97A] rounded-lg p-2 text-center">
                <div className="text-[#854F0B] font-bold text-lg">{detalle.items.filter((i: any) => i.estado === 'reemplazo').length}</div>
                <div className="text-[#7A9EA5] text-xs">Reemplazo</div>
              </div>
            </div>

            {detalle.recibido?.nombre && (
              <div className="bg-[#D6F4F8] border border-[#1ABBD6] rounded-lg px-3 py-2 mb-3 text-xs text-[#0F3A42]">
                ✅ Recibido por <strong>{detalle.recibido.nombre}</strong> · {new Date(detalle.recibido_at).toLocaleString('es-AR')}
              </div>
            )}

            <div className="overflow-y-auto flex-1">
              {detalle.items.map((item: any, idx: number) => (
                <div key={idx} className={`rounded-lg p-2 mb-1.5 border ${item.estado === 'faltante' ? 'bg-[#FFF8F8] border-[#F5C6CB]' : item.estado === 'reemplazo' ? 'bg-[#FFFBF2] border-[#FFE69C]' : 'bg-[#F0FAFB] border-[#B2E0E8]'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.estado === 'ok' ? '✅' : item.estado === 'faltante' ? '❌' : '🔄'}</span>
                    <span className="text-[#0F3A42] text-xs font-medium flex-1">{item.detalle}</span>
                    <span className="text-[#7A9EA5] text-xs">×{item.cantidad}</span>
                  </div>
                  {item.observacion && (
                    <div className="text-[#7A9EA5] text-xs mt-1 ml-6">Obs: {item.observacion}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
            <div className="text-[#1ABBD6] font-bold text-xl">{totalOk}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Sin faltantes</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3 text-center">
            <div className="text-[#E24B4A] font-bold text-xl">{totalFaltantes}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Con faltantes</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-3">
          <select
            className="flex-1 bg-white border border-[#B2E0E8] rounded-lg px-2 py-2 text-xs text-[#0F3A42] outline-none"
            value={filtroCaja}
            onChange={e => setFiltroCaja(e.target.value)}
          >
            <option value="todas">Todas las cajas</option>
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
            <option value="guardia">Guardia</option>
          </select>
          <select
            className="flex-1 bg-white border border-[#B2E0E8] rounded-lg px-2 py-2 text-xs text-[#0F3A42] outline-none"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="completado">Sin faltantes</option>
            <option value="con_faltantes">Con faltantes</option>
          </select>
        </div>

        {/* Lista */}
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">
          {checkinsFiltrados.length} registros
        </div>

        {checkinsFiltrados.length === 0 ? (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 text-center text-[#7A9EA5] text-sm">
            Sin checkins registrados
          </div>
        ) : checkinsFiltrados.map(c => (
          <div key={c.id} onClick={() => abrirDetalle(c)}
            className={`bg-white rounded-xl p-3 mb-2 cursor-pointer border ${c.estado === 'con_faltantes' ? 'border-[#F5C6CB]' : 'border-[#B2E0E8]'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[#0F3A42] font-bold text-sm">Caja {c.caja?.toUpperCase()}</div>
                <div className="text-[#7A9EA5] text-xs">{c.profiles?.nombre}</div>
                <div className="text-[#7A9EA5] text-xs">{new Date(c.hora_inicio).toLocaleString('es-AR')}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.estado === 'con_faltantes' ? 'bg-[#FCEBEB] text-[#A32D2D]' : 'bg-[#D6F4F8] text-[#0F8FAA]'}`}>
                  {c.estado === 'con_faltantes' ? '⚠️ Faltante' : '✅ OK'}
                </span>
                {c.recibido_por && (
                  <span className="text-xs text-[#7A9EA5]">Recibido ✓</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-8"></div>
    </main>
  )
}