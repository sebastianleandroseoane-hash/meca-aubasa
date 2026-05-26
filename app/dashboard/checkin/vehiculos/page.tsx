'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'

const ITEMS_INSPECCION = [
  'Luces (bajas, altas, guiños, stop)',
  'Frenos',
  'Nivel de aceite',
  'Nivel de agua/refrigerante',
  'Estado de neumáticos',
  'Gomas de auxilio / crique / llave',
  'Limpia parabrisas',
  'Bocina',
  'Cinturones de seguridad',
  'Documentación vigente (seguro/VTV/etc.)',
  'Botiquín, balizas y matafuegos',
  'Limpieza exterior',
  'Limpieza interior',
  'Señalización externa',
  'Aditamentos',
]

const C = {
  bg: '#07131a', card: '#0c1c24', border: '#1a3040', text: '#e8f4f8',
  sub: '#4a8fa0', accent: '#1ABBD6', warn: '#EF9F27', err: '#E24B4A', ok: '#1D9E75'
}
const inp = { width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const }

export default function CheckinVehiculos() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [moviles, setMoviles] = useState<any[]>([])
  const [checkinAbierto, setCheckinAbierto] = useState<any>(null)
  const [modo, setModo] = useState<'cargando' | 'apertura' | 'cierre' | 'enviado'>('cargando')

  // Apertura
  const [movilId, setMovilId] = useState('')
  const [kmInicial, setKmInicial] = useState('')
  const [items, setItems] = useState<Record<string, { estado: 'bien' | 'mal', observacion: string }>>(
    Object.fromEntries(ITEMS_INSPECCION.map(i => [i, { estado: 'bien', observacion: '' }]))
  )
  const [obsApertura, setObsApertura] = useState('')

  // Cierre
  const [kmFinal, setKmFinal] = useState('')
  const [obsCierre, setObsCierre] = useState('')

  const [loading, setLoading] = useState(false)
  const [errKm, setErrKm] = useState(false)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      setPerfil(p)
      const sector = p.sector_trabajo === 'ac' ? 'ac' : 'electrico'

      // Verificar si tiene checkin abierto hoy
      const hoy = new Date().toISOString().split('T')[0]
      const { data: abierto } = await supabase
        .from('checkins_vehiculos')
        .select('*, moviles(marca, modelo, patente)')
        .eq('conductor_id', p.id)
        .eq('estado', 'abierto')
        .eq('fecha', hoy)
        .maybeSingle()

      if (abierto) {
        setCheckinAbierto(abierto)
        setModo('cierre')
        return
      }

      // Cargar móviles para apertura
      const { data } = await supabase
        .from('moviles')
        .select('*')
        .eq('sector', sector)
        .eq('estado', 'disponible')
        .order('marca', { ascending: true })
      setMoviles(data || [])
      setModo('apertura')
    })
  }, [])

  function toggleItem(nombre: string) {
    setItems(prev => ({
      ...prev,
      [nombre]: { ...prev[nombre], estado: prev[nombre].estado === 'bien' ? 'mal' : 'bien' }
    }))
  }

  function setObsItem(nombre: string, obs: string) {
    setItems(prev => ({ ...prev, [nombre]: { ...prev[nombre], observacion: obs } }))
  }

  async function enviarApertura() {
    if (!movilId) return
    if (!kmInicial) { setErrKm(true); return }
    setLoading(true)
    const { data: checkin, error } = await supabase
      .from('checkins_vehiculos')
      .insert({
        movil_id: movilId,
        sector: perfil.sector_trabajo === 'ac' ? 'ac' : 'electrico',
        turno: perfil.turno || 'mañana',
        fecha: new Date().toISOString().split('T')[0],
        conductor_id: perfil.id,
        km_inicial: parseInt(kmInicial),
        observaciones_generales: obsApertura || null,
        estado: 'abierto',
      })
      .select()
      .single()

    if (!error && checkin) {
      await supabase.from('checkins_vehiculos_items').insert(
        ITEMS_INSPECCION.map((nombre, i) => ({
          checkin_id: checkin.id,
          item: nombre,
          orden: i + 1,
          estado: items[nombre].estado,
          observacion: items[nombre].observacion || null,
        }))
      )
      setModo('enviado')
    }
    setLoading(false)
  }

  async function enviarCierre() {
    if (!kmFinal) { setErrKm(true); return }
    setLoading(true)
    await supabase.from('checkins_vehiculos').update({
      km_final: parseInt(kmFinal),
      observaciones_cierre: obsCierre || null,
      cerrado_at: new Date().toISOString(),
      estado: 'pendiente_aprobacion',
    }).eq('id', checkinAbierto.id)
    setLoading(false)
    setModo('enviado')
  }

  const movilSeleccionado = moviles.find(m => m.id === movilId)
  const itemsMal = Object.entries(items).filter(([, v]) => v.estado === 'mal').length

  if (modo === 'cargando') return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, fontFamily: 'system-ui' }}>Verificando checkins...</div>
  )

  if (modo === 'enviado') return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8, textAlign: 'center' }}>
        {checkinAbierto ? 'Checkin cerrado' : 'Checkin abierto'}
      </div>
      <div style={{ fontSize: 13, color: C.sub, textAlign: 'center', marginBottom: 32 }}>
        {checkinAbierto ? 'El supervisor va a revisar y aprobar' : 'Recordá cerrar el checkin al final del turno'}
      </div>
      <button onClick={() => router.push('/dashboard/checkin/vehiculos/historial')}
        style={{ width: '100%', maxWidth: 320, background: C.accent, border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, padding: '13px 0', cursor: 'pointer', marginBottom: 12 }}>
        VER HISTORIAL
      </button>
      <button onClick={() => router.back()}
        style={{ width: '100%', maxWidth: 320, background: C.border, border: 'none', borderRadius: 12, color: C.sub, fontWeight: 700, fontSize: 14, padding: '13px 0', cursor: 'pointer' }}>
        VOLVER
      </button>
    </div>
  )

  if (modo === 'cierre') return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui', color: C.text }}>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Cierre de turno</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{perfil?.nombre} {perfil?.apellido} · {perfil?.turno}</div>
        </div>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>← VOLVER</button>
      </div>

      <div style={{ padding: '16px 16px 110px' }}>
        {/* Alerta checkin abierto */}
        <div style={{ background: '#3A2A00', border: `1px solid ${C.warn}`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.warn, fontWeight: 700, marginBottom: 4 }}>⚠️ Tenés un checkin abierto sin cerrar</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{checkinAbierto?.moviles?.marca} {checkinAbierto?.moviles?.modelo} — {checkinAbierto?.moviles?.patente}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Km inicial: {checkinAbierto?.km_inicial ?? '—'} · Abierto el {checkinAbierto?.fecha}</div>
        </div>

        {/* Km final */}
        <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>
          Km / Horómetro Final *
        </div>
        <input
          type="number"
          style={{ ...inp, marginBottom: 4, border: `1px solid ${errKm && !kmFinal ? C.err : C.border}` }}
          placeholder="Ej: 123456"
          value={kmFinal}
          onChange={e => { setKmFinal(e.target.value); setErrKm(false) }}
          autoFocus
        />
        {errKm && !kmFinal && <div style={{ fontSize: 11, color: C.err, marginBottom: 8 }}>El km final es obligatorio</div>}
        {kmFinal && kmInicial && parseInt(kmFinal) > 0 && (
          <div style={{ fontSize: 11, color: C.accent, marginBottom: 12 }}>
            Recorrido: {parseInt(kmFinal) - (checkinAbierto?.km_inicial || 0)} km
          </div>
        )}
        {!kmFinal && <div style={{ height: 12 }} />}

        {/* Observaciones de cierre */}
        <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>
          Novedades del turno
        </div>
        <textarea
          style={{ ...inp, resize: 'none', marginBottom: 20 } as any}
          rows={3}
          placeholder="Daños, incidentes, faltantes, novedades..."
          value={obsCierre}
          onChange={e => setObsCierre(e.target.value)}
        />

        <button
          onClick={enviarCierre}
          disabled={loading}
          style={{ width: '100%', background: loading ? C.border : C.ok, border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, padding: '14px 0', cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Cerrando...' : '🔒 CERRAR TURNO'}
        </button>
      </div>
    </main>
  )

  // MODO APERTURA
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui', color: C.text }}>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Checkin Vehículo</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{perfil?.nombre} {perfil?.apellido} · {perfil?.turno}</div>
        </div>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>← VOLVER</button>
      </div>

      <div style={{ padding: '16px 16px 110px' }}>

        {/* VEHÍCULO */}
        <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Vehículo *</div>
        <select
          style={{ ...inp, marginBottom: movilSeleccionado ? 8 : 12 }}
          value={movilId}
          onChange={e => setMovilId(e.target.value)}
        >
          <option value="">Seleccioná un vehículo</option>
          {moviles.map(m => (
            <option key={m.id} value={m.id}>{m.marca} {m.modelo} — {m.patente}</option>
          ))}
        </select>
        {movilSeleccionado && (
          <div style={{ background: '#0F2A35', border: `1px solid ${C.accent}`, borderRadius: 8, padding: '6px 12px', marginBottom: 12, fontSize: 11, color: C.accent }}>
            {movilSeleccionado.patente} · {movilSeleccionado.sector}
          </div>
        )}

        {/* KM INICIAL */}
        <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>
          Km / Horómetro Inicial *
        </div>
        <input
          type="number"
          style={{ ...inp, marginBottom: 4, border: `1px solid ${errKm && !kmInicial ? C.err : C.border}` }}
          placeholder="Ej: 123456"
          value={kmInicial}
          onChange={e => { setKmInicial(e.target.value); setErrKm(false) }}
        />
        {errKm && !kmInicial && <div style={{ fontSize: 11, color: C.err, marginBottom: 4 }}>El km inicial es obligatorio</div>}
        <div style={{ height: 12 }} />

        {/* INSPECCIÓN */}
        <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>
          Inspección {itemsMal > 0 && <span style={{ color: C.err }}>· {itemsMal} MAL</span>}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          {ITEMS_INSPECCION.map((nombre, i) => (
            <div key={nombre} style={{ borderBottom: i < ITEMS_INSPECCION.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                <span style={{ fontSize: 12, color: C.text, flex: 1, paddingRight: 8 }}>{nombre}</span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => items[nombre].estado !== 'bien' && toggleItem(nombre)}
                    style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: items[nombre].estado === 'bien' ? C.accent : C.border, color: items[nombre].estado === 'bien' ? 'white' : C.sub }}>
                    BIEN
                  </button>
                  <button
                    onClick={() => items[nombre].estado !== 'mal' && toggleItem(nombre)}
                    style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: items[nombre].estado === 'mal' ? C.err : C.border, color: items[nombre].estado === 'mal' ? 'white' : C.sub }}>
                    MAL
                  </button>
                </div>
              </div>
              {items[nombre].estado === 'mal' && (
                <div style={{ padding: '0 14px 10px' }}>
                  <input
                    style={{ ...inp, background: '#2A0F0F', border: `1px solid ${C.err}44` }}
                    placeholder="Observación obligatoria..."
                    value={items[nombre].observacion}
                    onChange={e => setObsItem(nombre, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* OBSERVACIONES APERTURA */}
        <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>Observaciones generales</div>
        <textarea
          style={{ ...inp, resize: 'none', marginBottom: 20 } as any}
          rows={3}
          placeholder="Novedades al inicio del turno..."
          value={obsApertura}
          onChange={e => setObsApertura(e.target.value)}
        />

        <button
          onClick={enviarApertura}
          disabled={loading || !movilId}
          style={{ width: '100%', background: loading || !movilId ? C.border : C.accent, border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, padding: '14px 0', cursor: loading || !movilId ? 'default' : 'pointer' }}>
          {loading ? 'Abriendo...' : '🚗 ABRIR CHECKIN'}
        </button>
      </div>
    </main>
  )
}
