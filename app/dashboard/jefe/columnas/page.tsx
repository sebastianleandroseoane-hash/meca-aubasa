'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'

const POSICIONES = ['1_SUR', '2_SUR', '1_NORTE', '2_NORTE']
const TRONCALES = ['capital', 'la_plata', 'ramal']

function emptyForm() {
  return {
    id: null as string | null,
    codigo: '',
    ts: '',
    km_desde: '',
    km_hasta: '',
    troncal: '',
    orden: '',
    posiciones: ['1_SUR', '2_SUR', '1_NORTE', '2_NORTE'] as string[],
    tipo_artefacto: 'LED SCENE 270W',
    observaciones: '',
  }
}

export default function AdminColumnas() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [columnas, setColumnas] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroTs, setFiltroTs] = useState('todos')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const puedeEditar = perfil && ['jefe', 'superadmin'].includes(perfil.rol)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      if (!['jefe', 'delegado', 'superadmin', 'supervisor_electrico', 'supervisor_ac'].includes(p.rol)) { router.push('/'); return }
      setPerfil(p)
      await cargarColumnas()
      setLoading(false)
    })
  }, [])

  async function cargarColumnas() {
    const { data } = await supabase
      .from('alumbrado_columnas')
      .select('*')
      .is('deleted_at', null)
      .order('ts', { ascending: true })
      .order('orden', { ascending: true })
    setColumnas(data || [])
  }

  function abrirNueva() {
    setForm(emptyForm())
    setMsg(null)
    setShowForm(true)
  }

  function abrirEditar(c: any) {
    setForm({
      id: c.id,
      codigo: c.codigo || '',
      ts: c.ts || '',
      km_desde: c.km_desde ?? '',
      km_hasta: c.km_hasta ?? '',
      troncal: c.troncal || '',
      orden: c.orden ?? '',
      posiciones: Array.isArray(c.posiciones) ? c.posiciones : [],
      tipo_artefacto: c.tipo_artefacto || '',
      observaciones: c.observaciones || '',
    })
    setMsg(null)
    setShowForm(true)
  }

  function togglePosicion(pos: string) {
    setForm(f => ({
      ...f,
      posiciones: f.posiciones.includes(pos)
        ? f.posiciones.filter(x => x !== pos)
        : [...f.posiciones, pos],
    }))
  }

  async function guardar() {
    if (!puedeEditar) return
    if (!form.codigo.trim()) { setMsg({ ok: false, text: 'El código es obligatorio' }); return }
    if (!form.ts.trim()) { setMsg({ ok: false, text: 'El TS es obligatorio' }); return }
    if (form.posiciones.length === 0) { setMsg({ ok: false, text: 'Seleccioná al menos una posición' }); return }

    setGuardando(true)
    setMsg(null)

    const payload: any = {
      codigo: form.codigo.trim(),
      ts: form.ts.trim(),
      km_desde: form.km_desde === '' ? null : Number(form.km_desde),
      km_hasta: form.km_hasta === '' ? null : Number(form.km_hasta),
      troncal: form.troncal || null,
      orden: form.orden === '' ? 0 : Number(form.orden),
      posiciones: form.posiciones,
      tipo_artefacto: form.tipo_artefacto.trim() || null,
      observaciones: form.observaciones.trim() || null,
    }

    let error
    if (form.id) {
      ({ error } = await supabase.from('alumbrado_columnas').update(payload).eq('id', form.id))
    } else {
      ({ error } = await supabase.from('alumbrado_columnas').insert(payload))
    }

    setGuardando(false)
    if (error) {
      const dup = error.message?.includes('duplicate') || error.code === '23505'
      setMsg({ ok: false, text: dup ? 'Ya existe una columna con ese código' : (error.message || 'Error al guardar') })
      return
    }
    setShowForm(false)
    await cargarColumnas()
  }

  async function eliminar(c: any) {
    if (!puedeEditar) return
    if (!confirm(`¿Eliminar la columna ${c.codigo}?\n\nQueda archivada (no se borra de forma definitiva).`)) return
    await supabase.from('alumbrado_columnas').update({ deleted_at: new Date().toISOString() }).eq('id', c.id)
    await cargarColumnas()
  }

  const listaTs = ['todos', ...Array.from(new Set(columnas.map(c => c.ts))).sort()]
  const filtradas = columnas.filter(c => {
    const okTs = filtroTs === 'todos' || c.ts === filtroTs
    const q = busqueda.trim().toLowerCase()
    const okBusqueda = !q || c.codigo?.toLowerCase().includes(q)
    return okTs && okBusqueda
  })

  if (!perfil || loading) return (
    <div className="min-h-screen bg-[#061418] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-cyan-300/70 text-sm tracking-widest uppercase">Cargando</span>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#061418] text-white pb-20">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <header className="bg-linear-to-br from-[#092b34] via-[#071c24] to-[#061418] border-b border-cyan-400/20 px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <button onClick={() => router.push('/dashboard/jefe')}
                className="text-[#8ecbd8] text-xs border border-cyan-400/20 px-3 py-1.5 rounded-lg hover:border-cyan-400/40">← Volver</button>
              <div>
                <span className="text-white font-black text-xl tracking-wide uppercase leading-none">Administrar columnas</span>
                <div className="text-[#8ecbd8] text-xs mt-1 tracking-wide">Catálogo de alumbrado</div>
              </div>
            </div>
            {puedeEditar && (
              <button onClick={abrirNueva}
                className="bg-cyan-400 text-[#062027] text-xs font-black px-3 py-1.5 rounded-lg shadow-[0_0_16px_rgba(34,211,238,0.35)] hover:bg-cyan-300 active:scale-95 transition-all tracking-wide">
                + NUEVA COLUMNA
              </button>
            )}
          </div>
        </header>

        <div className="px-4 pt-4 space-y-4">

          {/* FILTROS */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 bg-[#071c24]/90 border border-cyan-400/20 rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none placeholder:text-[#4a8fa0]"
              placeholder="Buscar por código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <select
              className="bg-[#071c24]/90 border border-cyan-400/20 rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none"
              value={filtroTs}
              onChange={e => setFiltroTs(e.target.value)}>
              {listaTs.map(ts => (
                <option key={ts} value={ts}>{ts === 'todos' ? 'Todos los TS' : ts}</option>
              ))}
            </select>
          </div>

          <div className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase">
            {filtradas.length} columna{filtradas.length !== 1 ? 's' : ''}
          </div>

          {/* LISTA */}
          <div className="flex flex-col gap-2">
            {filtradas.length === 0 ? (
              <div className="rounded-xl bg-[#071c24]/90 border border-cyan-400/15 p-4 text-center text-[#8ecbd8] text-xs">
                Sin columnas cargadas
              </div>
            ) : filtradas.map((c: any) => (
              <div key={c.id} className="rounded-xl bg-[#071c24]/90 border border-cyan-400/15 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-black text-sm tracking-wide">{c.codigo}</span>
                    <span className="text-cyan-300 text-[10px] font-bold bg-cyan-400/10 border border-cyan-400/25 px-2 py-0.5 rounded-full">{c.ts}</span>
                    {c.troncal && <span className="text-[#8ecbd8] text-[10px]">{c.troncal}</span>}
                  </div>
                  <div className="text-[#8ecbd8] text-[11px] mt-1">
                    {(c.km_desde != null || c.km_hasta != null) && <span>Km {c.km_desde ?? '—'}–{c.km_hasta ?? '—'} · </span>}
                    {(Array.isArray(c.posiciones) ? c.posiciones : []).map((p: string) => p.replace('_', ' ')).join(', ') || 'sin posiciones'}
                    {c.tipo_artefacto && <span> · {c.tipo_artefacto}</span>}
                  </div>
                </div>
                {puedeEditar && (
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => abrirEditar(c)}
                      className="bg-[#07131a] border border-cyan-400/40 text-cyan-300 text-[10px] font-black px-3 py-1.5 rounded-lg">EDITAR</button>
                    <button onClick={() => eliminar(c)}
                      className="bg-red-900 border border-red-500 text-red-200 text-[10px] font-black px-3 py-1.5 rounded-lg">ELIMINAR</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setShowForm(false)}>
          <div className="bg-[#0c1c24] border border-[#1a3040] rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 pb-8 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="text-[#e8f4f8] font-bold text-sm">{form.id ? 'Editar columna' : 'Nueva columna'}</div>
              <button onClick={() => setShowForm(false)} className="text-[#7ab3c8] text-xs px-3 py-1 border border-[#1a3040] rounded-lg">CERRAR</button>
            </div>

            {msg && (
              <div style={{ background: msg.ok ? '#0F2A1A' : '#2A0F0F', border: `1px solid ${msg.ok ? '#1D9E75' : '#E24B4A'}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: msg.ok ? '#1D9E75' : '#E24B4A' }}>
                {msg.ok ? '✅' : '❌'} {msg.text}
              </div>
            )}

            <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Código *</div>
            <input
              className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] mb-3 outline-none"
              placeholder="Ej: 01-01-NJ"
              value={form.codigo}
              onChange={e => setForm({ ...form, codigo: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">TS *</div>
                <input
                  className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none"
                  placeholder="Ej: TS-1"
                  value={form.ts}
                  onChange={e => setForm({ ...form, ts: e.target.value })}
                />
              </div>
              <div>
                <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Orden</div>
                <input type="number"
                  className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none"
                  placeholder="0"
                  value={form.orden}
                  onChange={e => setForm({ ...form, orden: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Km desde</div>
                <input type="number" step="0.001"
                  className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none"
                  value={form.km_desde}
                  onChange={e => setForm({ ...form, km_desde: e.target.value })}
                />
              </div>
              <div>
                <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Km hasta</div>
                <input type="number" step="0.001"
                  className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] outline-none"
                  value={form.km_hasta}
                  onChange={e => setForm({ ...form, km_hasta: e.target.value })}
                />
              </div>
            </div>

            <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Troncal</div>
            <select className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] mb-3 outline-none"
              value={form.troncal} onChange={e => setForm({ ...form, troncal: e.target.value })}>
              <option value="">— Sin definir —</option>
              {TRONCALES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-2">
              Posiciones *{form.posiciones.length === 0 && <span className="text-[#E24B4A]"> (ninguna)</span>}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {POSICIONES.map(pos => (
                <button key={pos} onClick={() => togglePosicion(pos)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid',
                    background: form.posiciones.includes(pos) ? '#1ABBD6' : '#07131a',
                    color: form.posiciones.includes(pos) ? 'white' : '#4a8fa0',
                    borderColor: form.posiciones.includes(pos) ? '#1ABBD6' : '#1a3040',
                  }}>
                  {form.posiciones.includes(pos) ? '✓ ' : ''}{pos.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Tipo de artefacto</div>
            <input
              className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] mb-3 outline-none"
              placeholder="LED SCENE 270W"
              value={form.tipo_artefacto}
              onChange={e => setForm({ ...form, tipo_artefacto: e.target.value })}
            />

            <div className="text-[#4a8fa0] text-xs font-bold uppercase tracking-widest mb-1">Observaciones</div>
            <textarea
              className="w-full bg-[#07131a] border border-[#1a3040] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] mb-4 outline-none resize-none"
              rows={2}
              value={form.observaciones}
              onChange={e => setForm({ ...form, observaciones: e.target.value })}
            />

            <button onClick={guardar} disabled={guardando}
              style={{ width: '100%', background: guardando ? '#1a3040' : '#1ABBD6', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, padding: '13px 0', cursor: guardando ? 'default' : 'pointer' }}>
              {guardando ? 'GUARDANDO...' : (form.id ? 'GUARDAR CAMBIOS' : 'CREAR COLUMNA')}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}