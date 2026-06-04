'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

const ROLES_PERMITIDOS = [
  'tecnico_electrico', 'tecnico_ac',
  'supervisor_electrico', 'supervisor_ac',
  'jefe', 'delegado_gremial', 'superadmin'
]

const C = {
  bg: '#07131a', card: '#0c1c24', border: '#1a3040', text: '#e8f4f8',
  sub: '#4a8fa0', accent: '#1ABBD6', warn: '#EF9F27', err: '#E24B4A', ok: '#1D9E75'
}

const inp = {
  width: '100%', background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text,
  outline: 'none', boxSizing: 'border-box' as const
}

function Label({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>
      {text}
    </div>
  )
}

export default function CargasCombustible() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [moviles, setMoviles] = useState<any[]>([])
  const [cargas, setCargas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [anulando, setAnulando] = useState<string | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    vehiculo_id: '',
    km: '',
    litros: '',
    importe: '',
    estacion: '',
    foto: null as File | null,
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p || !ROLES_PERMITIDOS.includes(p.rol)) {
        router.push('/')
        return
      }
      setPerfil(p)
      await cargarDatos()
      setLoading(false)
    })
  }, [])

  async function cargarDatos() {
    const { data: movs } = await supabase
      .from('moviles')
      .select('id, marca, modelo, patente, estado')
      .in('estado', ['disponible', 'activo'])
      .order('marca')
    setMoviles(movs || [])

    const { data: cargsData } = await supabase
      .from('cargas_combustible')
      .select(`
        *,
        conductor:profiles!cargas_combustible_conductor_id_fkey(nombre, apellido),
        vehiculo:moviles!cargas_combustible_vehiculo_id_fkey(marca, modelo, patente),
        anulador:profiles!cargas_combustible_anulada_por_fkey(nombre, apellido)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    setCargas(cargsData || [])

    // Generar signed URLs para fotos
    if (cargsData && cargsData.length > 0) {
      const urls: Record<string, string> = {}
      for (const c of cargsData) {
        if (c.foto_url) {
          const { data } = await supabase.storage
            .from('combustible-tickets')
            .createSignedUrl(c.foto_url, 3600)
          if (data?.signedUrl) urls[c.id] = data.signedUrl
        }
      }
      setSignedUrls(urls)
    }
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setForm(f => ({ ...f, foto: file }))
    setFotoPreview(URL.createObjectURL(file))
  }

  function resetForm() {
    setForm({ vehiculo_id: '', km: '', litros: '', importe: '', estacion: '', foto: null })
    setFotoPreview(null)
    setFormError('')
    setShowForm(false)
  }

  async function guardarCarga() {
    if (!form.vehiculo_id) { setFormError('Seleccioná un vehículo'); return }
    if (!form.km || isNaN(Number(form.km))) { setFormError('Ingresá el kilometraje'); return }
    if (!form.litros || isNaN(Number(form.litros))) { setFormError('Ingresá los litros'); return }
    if (!form.importe || isNaN(Number(form.importe))) { setFormError('Ingresá el importe'); return }
    if (!form.estacion.trim()) { setFormError('Ingresá la estación de servicio'); return }
    if (!form.foto) { setFormError('La foto del ticket es obligatoria'); return }

    setGuardando(true)
    setFormError('')

    // 1. Subir foto al bucket privado
    const path = `${perfil.id}/${Date.now()}-${form.foto.name}`
    const { error: uploadError } = await supabase.storage
      .from('combustible-tickets')
      .upload(path, form.foto, { contentType: form.foto.type, upsert: false })

    if (uploadError) {
      setFormError('Error al subir la foto: ' + uploadError.message)
      setGuardando(false)
      return
    }

    // 2. Insertar registro — foto_url guarda el path, no URL pública
    const { error: insertError } = await supabase
      .from('cargas_combustible')
      .insert({
        vehiculo_id: form.vehiculo_id,
        conductor_id: perfil.id,
        fecha: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }),
        km: parseInt(form.km),
        litros: parseFloat(form.litros),
        importe: parseFloat(form.importe),
        estacion: form.estacion.trim(),
        foto_url: path,
      })

    if (insertError) {
      // Si falla el insert, eliminar la foto subida
      await supabase.storage.from('combustible-tickets').remove([path])
      setFormError('Error al guardar: ' + insertError.message)
      setGuardando(false)
      return
    }

    setGuardando(false)
    resetForm()
    await cargarDatos()
  }

  async function anularCarga(id: string) {
    const confirma = window.confirm('¿Confirmás anular esta carga? Esta acción no se puede revertir.')
    if (!confirma) return
    setAnulando(id)
    const { error } = await supabase
      .from('cargas_combustible')
      .update({ anulada: true, anulada_por: perfil.id })
      .eq('id', id)
    setAnulando(null)
    if (error) { alert('Error al anular: ' + error.message); return }
    await cargarDatos()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, fontFamily: 'system-ui' }}>
      Cargando...
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif', color: C.text }}>

      {/* HEADER */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: C.accent, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>⛽ Combustible</div>
          <div style={{ fontSize: 11, color: C.sub }}>Registro de cargas</div>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ marginLeft: 'auto', background: C.warn, border: 'none', borderRadius: 10, color: '#07131a', fontWeight: 700, fontSize: 13, padding: '9px 16px', cursor: 'pointer' }}>
          + Nueva carga
        </button>
      </div>

      {/* MODAL FORMULARIO */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: 16, maxHeight: '92vh', display: 'flex', flexDirection: 'column', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>⛽ Nueva carga de combustible</div>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>CANCELAR</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>

              <Label text="Vehículo *" />
              <select value={form.vehiculo_id} onChange={e => setForm(f => ({ ...f, vehiculo_id: e.target.value }))}
                style={{ ...inp, marginBottom: 12 }}>
                <option value="">Seleccioná un vehículo</option>
                {moviles.map(m => (
                  <option key={m.id} value={m.id}>{m.marca} {m.modelo} — {m.patente}</option>
                ))}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <Label text="Km actual *" />
                  <input type="number" style={inp} placeholder="52000" value={form.km}
                    onChange={e => setForm(f => ({ ...f, km: e.target.value }))} />
                </div>
                <div>
                  <Label text="Litros *" />
                  <input type="number" step="0.01" style={inp} placeholder="45.5" value={form.litros}
                    onChange={e => setForm(f => ({ ...f, litros: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <Label text="Importe $ *" />
                  <input type="number" step="0.01" style={inp} placeholder="15000" value={form.importe}
                    onChange={e => setForm(f => ({ ...f, importe: e.target.value }))} />
                </div>
                <div>
                  <Label text="Estación de servicio *" />
                  <input type="text" style={inp} placeholder="YPF Km 38" value={form.estacion}
                    onChange={e => setForm(f => ({ ...f, estacion: e.target.value }))} />
                </div>
              </div>

              <Label text="Foto del ticket *" />
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', width: '100%', background: C.bg, border: `1px dashed ${C.accent}`, borderRadius: 8, padding: '12px', textAlign: 'center' as const, cursor: 'pointer', marginBottom: 8, fontSize: 13, color: C.accent, fontWeight: 600 }}>
                  📎 Seleccionar foto del ticket
                  <input type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
                </label>
                {fotoPreview && (
                  <img src={fotoPreview} alt="Preview ticket"
                    style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, border: `1px solid ${C.border}` }} />
                )}
                {!fotoPreview && (
                  <div style={{ background: C.bg, border: `1px dashed ${C.border}`, borderRadius: 8, padding: 20, textAlign: 'center' as const, color: C.sub, fontSize: 12 }}>
                    📷 Tomá o seleccioná foto del ticket
                  </div>
                )}
              </div>

              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: C.sub }}>
                <div>👤 Conductor: <span style={{ color: C.text, fontWeight: 600 }}>{perfil.apellido}, {perfil.nombre}</span></div>
                <div>📅 Fecha: <span style={{ color: C.text, fontWeight: 600 }}>{new Date().toLocaleDateString('es-AR')}</span></div>
              </div>

              {formError && (
                <div style={{ background: '#2A0F0F', border: `1px solid ${C.err}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: C.err }}>
                  ⚠️ {formError}
                </div>
              )}

              <button onClick={guardarCarga} disabled={guardando}
                style={{ width: '100%', background: guardando ? C.border : C.warn, border: 'none', borderRadius: 10, color: guardando ? C.sub : '#07131a', fontWeight: 700, fontSize: 14, padding: '13px 0', cursor: guardando ? 'default' : 'pointer', marginBottom: 8 }}>
                {guardando ? 'Guardando...' : '⛽ REGISTRAR CARGA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      <div style={{ padding: '14px 16px 80px' }}>
        <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>
          Últimas {cargas.length} cargas
        </div>

        {cargas.length === 0 ? (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: 'center' as const, color: C.sub, fontSize: 13 }}>
            Sin cargas registradas
          </div>
        ) : cargas.map(c => (
          <div key={c.id} style={{
            background: c.anulada ? '#1a1a1a' : C.card,
            border: `1px solid ${c.anulada ? '#333' : C.border}`,
            borderLeft: `3px solid ${c.anulada ? '#444' : C.warn}`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 8,
            opacity: c.anulada ? 0.6 : 1
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.anulada ? C.sub : C.warn }}>
                    ⛽ {c.vehiculo?.marca} {c.vehiculo?.modelo}
                  </span>
                  <span style={{ fontSize: 11, color: C.sub }}>{c.vehiculo?.patente}</span>
                </div>
                <div style={{ fontSize: 11, color: C.sub }}>
                  {c.conductor?.apellido}, {c.conductor?.nombre} · {new Date(c.fecha).toLocaleDateString('es-AR')}
                </div>
              </div>
              {c.anulada ? (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#2A0F0F', color: C.err, whiteSpace: 'nowrap' as const }}>
                  ANULADA
                </span>
              ) : (
                <button onClick={() => anularCarga(c.id)} disabled={anulando === c.id}
                  style={{ background: 'none', border: `1px solid ${C.err}`, borderRadius: 8, color: C.err, fontWeight: 700, fontSize: 11, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                  {anulando === c.id ? '...' : 'Anular'}
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 6 }}>
              {[
                { label: 'Km', value: c.km?.toLocaleString('es-AR') },
                { label: 'Litros', value: c.litros },
                { label: 'Importe', value: `$${Number(c.importe).toLocaleString('es-AR')}` },
                { label: 'Estación', value: c.estacion },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 8px' }}>
                  <div style={{ fontSize: 8, color: C.sub, textTransform: 'uppercase' as const }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginTop: 1 }}>{value}</div>
                </div>
              ))}
            </div>

            {signedUrls[c.id] && (
              <div style={{ marginTop: 6 }}>
                <a href={signedUrls[c.id]} target="_blank" rel="noopener noreferrer">
                  <img src={signedUrls[c.id]} alt="Ticket"
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: `1px solid ${C.border}` }} />
                </a>
              </div>
            )}

            {c.anulada && c.anulador && (
              <div style={{ fontSize: 10, color: C.err, marginTop: 4 }}>
                Anulada por: {c.anulador.apellido}, {c.anulador.nombre}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}