'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

export default function DashboardSupervisorElectrico() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [tecnicos, setTecnicos] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    km: '',
    ubicacion: '',
    prioridad: 'normal',
    asignado_a: '',
    fecha_programada: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'supervisor_electrico') { router.push('/'); return }
      setPerfil(p)
      await cargarDatos(p.id)
    })
  }, [])

  async function cargarDatos(supervisorId: string) {
    const { data: ords } = await supabase
      .from('ordenes_trabajo')
      .select('*, profiles!ordenes_trabajo_asignado_a_fkey(nombre)')
      .eq('sector', 'electrico')
      .order('created_at', { ascending: false })
    setOrdenes(ords || [])

    const { data: tecs } = await supabase
      .from('profiles')
      .select('id, nombre')
      .in('rol', ['tecnico_electrico', 'tecnico_electrico_edificio'])
    setTecnicos(tecs || [])
  }

  async function crearOrden() {
    if (!form.titulo || !form.asignado_a) return
    setLoading(true)
    const { error } = await supabase.from('ordenes_trabajo').insert({
      titulo: form.titulo,
      descripcion: form.descripcion,
      sector: 'electrico',
      estado: 'pendiente',
      prioridad: form.prioridad,
      km: form.km ? parseFloat(form.km) : null,
      ubicacion: form.ubicacion,
      asignado_a: form.asignado_a,
      creado_por: perfil.id,
      turno: perfil.turno,
      fecha_programada: form.fecha_programada
    })
    setLoading(false)
    if (!error) {
      setShowForm(false)
      setForm({ titulo: '', descripcion: '', km: '', ubicacion: '', prioridad: 'normal', asignado_a: '', fecha_programada: new Date().toISOString().split('T')[0] })
      await cargarDatos(perfil.id)
    }
  }

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
            <div className="text-white font-bold text-lg tracking-wide">Supervisor Eléctrico</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">{perfil.nombre} · Turno {perfil.turno}</div>
          </div>
          <div className="bg-[#0A2830] text-[#7ADCE8] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">SUP·E</div>
        </div>
      </div>

      <div className="px-4 pt-3">

        {/* NUEVA ORDEN */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-[#1ABBD6] text-white font-bold text-sm tracking-widest rounded-xl py-3 mb-3"
          >
            + NUEVA ORDEN DE TRABAJO
          </button>
        ) : (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 mb-3">
            <div className="text-[#0F3A42] font-bold text-sm mb-3">Nueva orden de trabajo</div>

            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Título *</div>
            <input
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
              placeholder="Ej: Reemplazo luminaria LED"
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
            />

            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Descripción</div>
            <textarea
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
              placeholder="Detalle de la tarea"
              rows={3}
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Km</div>
                <input
                  className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
                  placeholder="38.4"
                  value={form.km}
                  onChange={e => setForm({ ...form, km: e.target.value })}
                />
              </div>
              <div>
                <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Prioridad</div>
                <select
                  className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
                  value={form.prioridad}
                  onChange={e => setForm({ ...form, prioridad: e.target.value })}
                >
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Ubicación</div>
            <input
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
              placeholder="Ej: Shoulder externo"
              value={form.ubicacion}
              onChange={e => setForm({ ...form, ubicacion: e.target.value })}
            />

            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Asignar a *</div>
            <select
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
              value={form.asignado_a}
              onChange={e => setForm({ ...form, asignado_a: e.target.value })}
            >
              <option value="">Seleccioná un técnico</option>
              {tecnicos.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>

            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Fecha programada</div>
            <input
              type="date"
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-4 outline-none"
              value={form.fecha_programada}
              onChange={e => setForm({ ...form, fecha_programada: e.target.value })}
            />

            <div className="flex gap-2">
              <button
                onClick={crearOrden}
                disabled={loading}
                className="flex-1 bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'CREAR ORDEN'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-[#E8E8E6] text-[#5F5E5A] font-bold text-sm py-3 rounded-xl"
              >
                CANCELAR
              </button>
            </div>
          </div>
        )}

        {/* ORDENES */}
        <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">
          Órdenes de trabajo · {ordenes.length} total
        </div>

        {ordenes.length === 0 ? (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 text-center text-[#7A9EA5] text-sm mb-3">
            No hay órdenes de trabajo
          </div>
        ) : (
          ordenes.map(o => (
            <div key={o.id} className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2">
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1">
                  <div className="text-[#0F3A42] font-bold text-sm">{o.titulo}</div>
                  {o.km && <div className="text-[#7A9EA5] text-xs mt-0.5">Km {o.km} {o.ubicacion ? `· ${o.ubicacion}` : ''}</div>}
                  {o.profiles && <div className="text-[#7A9EA5] text-xs">Asignado: {o.profiles.nombre}</div>}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${badgeColor(o.estado)}`}>
                  {badgeLabel(o.estado)}
                </span>
              </div>
              {o.prioridad === 'urgente' && <span className="bg-[#FCEBEB] text-[#A32D2D] text-xs font-bold px-2 py-0.5 rounded-full">Urgente</span>}
              {o.prioridad === 'critica' && <span className="bg-[#E24B4A] text-white text-xs font-bold px-2 py-0.5 rounded-full">Crítica</span>}
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span className="text-[#7ADCE8] text-xs">Personal</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Órdenes</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>
          <span className="text-[#7ADCE8] text-xs">Flota</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Informe</span>
        </div>
      </div>
    </main>
  )
}