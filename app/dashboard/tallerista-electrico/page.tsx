'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

export default function DashboardTalleristaElectrico() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [propuestas, setPropuestas] = useState<any[]>([])
  const [showPropuesta, setShowPropuesta] = useState(false)
  const [showLuminaria, setShowLuminaria] = useState(false)
  const [luminarias, setLuminarias] = useState<any[]>([])
  const [lumForm, setLumForm] = useState({
    tipo: 'led',
    descripcion_falla: '',
    observaciones: ''
  })
  const [loading, setLoading] = useState(false)
  const [propuestaForm, setPropuestaForm] = useState({
    descripcion: '',
    materiales_descripcion: ''
  })

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'tallerista_electrico' && p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
      await cargarDatos(p.id)
      await cargarLuminarias()
    })
  }, [])

  async function cargarDatos(userId: string) {
    const { data: ords } = await supabase
      .from('ordenes_trabajo')
      .select('*')
      .eq('asignado_a', userId)
      .order('created_at', { ascending: false })
    setOrdenes(ords || [])

    const { data: props } = await supabase
      .from('propuestas_taller')
      .select('*')
      .eq('tallerista_id', userId)
      .order('created_at', { ascending: false })
    setPropuestas(props || [])
  }
async function cargarLuminarias() {
    const { data } = await supabase
      .from('luminarias_taller')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setLuminarias(data || [])
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
    if (estado === 'reparada' || estado === 'irreparable') {
      update.fecha_egreso = new Date().toISOString()
    }
    await supabase.from('luminarias_taller').update(update).eq('id', id)
    await cargarLuminarias()
  }
  async function enviarPropuesta() {
    if (!propuestaForm.descripcion) return
    setLoading(true)
    await supabase.from('propuestas_taller').insert({
      tallerista_id: perfil.id,
      sector: 'electrico',
      descripcion: propuestaForm.descripcion,
      materiales_descripcion: propuestaForm.materiales_descripcion || null,
      estado: 'pendiente'
    })
    setLoading(false)
    setShowPropuesta(false)
    setPropuestaForm({ descripcion: '', materiales_descripcion: '' })
    await cargarDatos(perfil.id)
  }

  function badgeColor(estado: string) {
    if (estado === 'en_curso') return 'bg-[#FAEEDA] text-[#854F0B]'
    if (estado === 'completada') return 'bg-[#D6F4F8] text-[#0F8FAA]'
    if (estado === 'cancelada') return 'bg-[#FCEBEB] text-[#A32D2D]'
    return 'bg-[#E8E8E6] text-[#5F5E5A]'
  }

  function propuestaColor(estado: string) {
    if (estado === 'aprobada') return 'bg-[#D6F4F8] text-[#0F8FAA]'
    if (estado === 'rechazada') return 'bg-[#FCEBEB] text-[#A32D2D]'
    return 'bg-[#FAEEDA] text-[#854F0B]'
  }

  if (!perfil) return (
    <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">
      Cargando...
    </div>
  )

  const ordenesActivas = ordenes.filter(o => o.estado === 'pendiente' || o.estado === 'en_curso')
  const ordenesCompletadas = ordenes.filter(o => o.estado === 'completada')

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Buen día, {perfil.nombre?.split(' ')[0]}</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">Tallerista Eléctrico</div>
          </div>
          <div className="bg-[#1ABBD6] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">TALL·E</div>
        </div>
      </div>

      <div className="px-4 pt-3">

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#B87C0F] font-bold text-2xl">{ordenesActivas.length}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Órdenes activas</div>
          </div>
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-3">
            <div className="text-[#1ABBD6] font-bold text-2xl">{ordenesCompletadas.length}</div>
            <div className="text-[#7A9EA5] text-xs uppercase tracking-wide mt-0.5">Completadas</div>
          </div>
        </div>

        <button
          onClick={() => setShowPropuesta(true)}
          className="w-full bg-[#1ABBD6] text-white font-bold text-sm tracking-widest rounded-xl py-3 mb-3"
        >
          + PROPONER TAREA AL SUPERVISOR
        </button>

        {showPropuesta && (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 mb-3">
            <div className="text-[#0F3A42] font-bold text-sm mb-3">Nueva propuesta de tarea</div>

            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Descripción de la tarea *</div>
            <textarea
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
              placeholder="Describí qué necesitás hacer y por qué"
              rows={3}
              value={propuestaForm.descripcion}
              onChange={e => setPropuestaForm({ ...propuestaForm, descripcion: e.target.value })}
            />

            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Materiales necesarios</div>
            <textarea
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-4 outline-none"
              placeholder="Ej: 2 drivers LED, 1 balasto, cable 2.5mm"
              rows={2}
              value={propuestaForm.materiales_descripcion}
              onChange={e => setPropuestaForm({ ...propuestaForm, materiales_descripcion: e.target.value })}
            />

            <div className="flex gap-2">
              <button
                onClick={enviarPropuesta}
                disabled={loading || !propuestaForm.descripcion}
                className="flex-1 bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'ENVIAR AL SUPERVISOR'}
              </button>
              <button
                onClick={() => setShowPropuesta(false)}
                className="flex-1 bg-[#E8E8E6] text-[#5F5E5A] font-bold text-sm py-3 rounded-xl"
              >
                CANCELAR
              </button>
            </div>
          </div>
        )}
<button
          onClick={() => setShowLuminaria(true)}
          className="w-full bg-[#0F3A42] text-white font-bold text-sm tracking-widest rounded-xl py-3 mb-3"
        >
          + INGRESAR LUMINARIA ROTA
        </button>

        {showLuminaria && (
          <div className="bg-white border border-[#B2E0E8] rounded-xl p-4 mb-3">
            <div className="text-[#0F3A42] font-bold text-sm mb-3">Ingreso de luminaria</div>

            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Tipo</div>
            <select
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
              value={lumForm.tipo}
              onChange={e => setLumForm({ ...lumForm, tipo: e.target.value })}
            >
              <option value="led">LED</option>
              <option value="sodio">Sodio</option>
              <option value="mercurio">Mercurio</option>
            </select>

            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Descripción de la falla *</div>
            <textarea
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
              placeholder="Describí la falla o el motivo del ingreso"
              rows={3}
              value={lumForm.descripcion_falla}
              onChange={e => setLumForm({ ...lumForm, descripcion_falla: e.target.value })}
            />

            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Observaciones</div>
            <input
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-4 outline-none"
              placeholder="Ej: viene de Km 38, TS-7"
              value={lumForm.observaciones}
              onChange={e => setLumForm({ ...lumForm, observaciones: e.target.value })}
            />

            <div className="flex gap-2">
              <button
                onClick={ingresarLuminaria}
                disabled={loading || !lumForm.descripcion_falla}
                className="flex-1 bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'INGRESAR'}
              </button>
              <button
                onClick={() => setShowLuminaria(false)}
                className="flex-1 bg-[#E8E8E6] text-[#5F5E5A] font-bold text-sm py-3 rounded-xl"
              >
                CANCELAR
              </button>
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
                    'bg-[#E8E8E6] text-[#5F5E5A]'
                  }`}>
                    {l.estado}
                  </span>
                </div>
                {(l.estado === 'ingresada' || l.estado === 'en_reparacion') && (
                  <div className="flex gap-2">
                    {l.estado === 'ingresada' && (
                      <button
                        onClick={() => cambiarEstadoLuminaria(l.id, 'en_reparacion')}
                        className="flex-1 bg-[#FAEEDA] text-[#854F0B] font-bold text-xs py-1.5 rounded-lg"
                      >
                        INICIAR REPARACIÓN
                      </button>
                    )}
                    {l.estado === 'en_reparacion' && (
                      <>
                        <button
                          onClick={() => cambiarEstadoLuminaria(l.id, 'reparada')}
                          className="flex-1 bg-[#D6F4F8] text-[#0F8FAA] font-bold text-xs py-1.5 rounded-lg"
                        >
                          REPARADA
                        </button>
                        <button
                          onClick={() => cambiarEstadoLuminaria(l.id, 'irreparable')}
                          className="flex-1 bg-[#FCEBEB] text-[#A32D2D] font-bold text-xs py-1.5 rounded-lg"
                        >
                          IRREPARABLE
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        {propuestas.length > 0 && (
          <>
            <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2">Mis propuestas</div>
            {propuestas.map(p => (
              <div key={p.id} className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-[#7A9EA5] text-xs">PT-{String(p.numero_propuesta).padStart(4, '0')}</div>
                    <div className="text-[#0F3A42] text-sm font-medium">{p.descripcion}</div>
                    {p.observaciones_supervisor && (
                      <div className="text-[#7A9EA5] text-xs mt-1">Supervisor: {p.observaciones_supervisor}</div>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${propuestaColor(p.estado)}`}>
                    {p.estado}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

        {ordenesActivas.length > 0 && (
          <>
            <div className="text-[#7A9EA5] text-xs font-bold tracking-widest uppercase mb-2 mt-1">Órdenes asignadas</div>
            {ordenesActivas.map(o => (
              <div key={o.id} className="bg-white border border-[#B2E0E8] rounded-xl p-3 mb-2 flex justify-between items-center">
                <div>
                  <div className="text-[#7A9EA5] text-xs">OT-{String(o.numero_orden).padStart(5, '0')}</div>
                  <div className="text-[#0F3A42] font-bold text-sm">{o.titulo}</div>
                  {o.descripcion && <div className="text-[#7A9EA5] text-xs mt-0.5">{o.descripcion}</div>}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${badgeColor(o.estado)}`}>
                  {o.estado === 'en_curso' ? 'En curso' : 'Pendiente'}
                </span>
              </div>
            ))}
          </>
        )}

        <div className="h-24"></div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span className="text-[#1ABBD6] text-xs">Inicio</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span className="text-[#7ADCE8] text-xs">Órdenes</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span className="text-[#7ADCE8] text-xs">Informe</span>
        </div>
        <div onClick={() => router.push('/historial')} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="text-[#7ADCE8] text-xs">Historial</span>
        </div>
      </div>
    </main>
  )
}