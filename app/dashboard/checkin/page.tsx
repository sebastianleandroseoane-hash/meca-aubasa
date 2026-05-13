'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type PlantillaItem = {
  id: string
  orden: number
  cantidad: number
  detalle: string
}

type ItemEstado = {
  plantilla_id: string
  detalle: string
  cantidad: number
  estado: 'ok' | 'faltante' | 'reemplazo'
  observacion: string
}

export default function CheckinPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [perfil, setPerfil] = useState<{ id: string; full_name: string } | null>(null)
  const [caja, setCaja] = useState<string>('')
  const [plantilla, setPlantilla] = useState<PlantillaItem[]>([])
  const [items, setItems] = useState<ItemEstado[]>([])
  const [horaInicio] = useState(new Date())
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const getPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('id, full_name').eq('id', user.id).single()
      if (data) setPerfil(data)
    }
    getPerfil()
  }, [])

  useEffect(() => {
    if (!caja) return
    const cargarPlantilla = async () => {
      const { data } = await supabase
        .from('checkin_plantillas')
        .select('id, orden, cantidad, detalle')
        .eq('caja', caja)
        .order('orden')
      if (data) {
        setPlantilla(data)
        setItems(data.map(i => ({
          plantilla_id: i.id,
          detalle: i.detalle,
          cantidad: i.cantidad,
          estado: 'ok',
          observacion: ''
        })))
      }
    }
    cargarPlantilla()
  }, [caja])

  const setEstado = (idx: number, estado: 'ok' | 'faltante' | 'reemplazo') => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, estado } : item))
  }

  const setObservacion = (idx: number, observacion: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, observacion } : item))
  }

  const handleSubmit = async () => {
    if (!perfil || !caja || items.length === 0) return
    setEnviando(true)
    setError('')

    const tieneFaltantes = items.some(i => i.estado !== 'ok')
    const estado = tieneFaltantes ? 'con_faltantes' : 'completado'

    const { data: checkin, error: errCheckin } = await supabase
      .from('checkins_herramientas')
      .insert({
        tecnico_id: perfil.id,
        caja,
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: horaInicio.toISOString(),
        estado,
        tiene_faltantes: tieneFaltantes
      })
      .select('id')
      .single()

    if (errCheckin || !checkin) {
      setError('Error al guardar el checkin.')
      setEnviando(false)
      return
    }

    const { error: errItems } = await supabase
      .from('checkin_items')
      .insert(items.map(i => ({
        checkin_id: checkin.id,
        plantilla_id: i.plantilla_id,
        detalle: i.detalle,
        cantidad: i.cantidad,
        estado: i.estado,
        observacion: i.observacion || null
      })))

    if (errItems) {
      setError('Error al guardar los ítems.')
      setEnviando(false)
      return
    }

    setEnviado(true)
    setEnviando(false)
  }

  const formatHora = (d: Date) =>
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  const formatFecha = (d: Date) =>
    d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  if (enviado) return (
    <main style={{ minHeight: '100vh', background: '#F0FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', maxWidth: 400, width: '100%', border: '1px solid #B2E0E8' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ color: '#0F3A42', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Checkin registrado</h2>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 4 }}><strong>{perfil?.full_name}</strong></p>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 4 }}>Caja: <strong>{caja.toUpperCase()}</strong></p>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 24 }}>{formatFecha(horaInicio)} — {formatHora(horaInicio)}</p>
        {items.some(i => i.estado !== 'ok') && (
          <div style={{ background: '#FFF3CD', border: '1px solid #FFECB5', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: '#856404' }}>
            ⚠️ Se registraron faltantes. El pañolero fue notificado.
          </div>
        )}
        <button
          onClick={() => router.back()}
          style={{ background: '#1ABBD6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
        >
          Volver al dashboard
        </button>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#F0FAFB', padding: '16px' }}>
      {/* Header */}
      <div style={{ background: '#0F3A42', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#7ADCE8', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Checkin de Herramientas</div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginTop: 2 }}>{perfil?.full_name || '...'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#1ABBD6', fontSize: 20, fontWeight: 700 }}>{formatHora(horaInicio)}</div>
          <div style={{ color: '#7ADCE8', fontSize: 11 }}>{formatFecha(horaInicio)}</div>
        </div>
      </div>

      {/* Selector de caja */}
      {!caja && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #B2E0E8', marginBottom: 16 }}>
          <p style={{ color: '#0F3A42', fontWeight: 700, fontSize: 15, marginBottom: 16, textAlign: 'center' }}>Seleccioná tu caja</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['mañana', 'tarde', 'noche', 'guardia'].map(c => (
              <button
                key={c}
                onClick={() => setCaja(c)}
                style={{ background: '#0F3A42', color: '#fff', border: 'none', borderRadius: 10, padding: '16px 8px', fontSize: 15, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}
              >
                {c === 'mañana' ? '🌅 Mañana' : c === 'tarde' ? '🌇 Tarde' : c === 'noche' ? '🌙 Noche' : '🛡️ Guardia'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de herramientas */}
      {caja && items.length > 0 && (
        <>
          <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid #B2E0E8', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#0F3A42', fontWeight: 700, fontSize: 14 }}>CAJA {caja.toUpperCase()} — {items.length} ítems</span>
            <button onClick={() => { setCaja(''); setItems([]) }} style={{ background: 'none', border: 'none', color: '#1ABBD6', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>Cambiar</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: '12px 14px',
                  border: `1px solid ${item.estado === 'faltante' ? '#F5C6CB' : item.estado === 'reemplazo' ? '#FFE69C' : '#B2E0E8'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>#{idx + 1} · Cant: {item.cantidad}</span>
                    <div style={{ color: '#0F3A42', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{item.detalle}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => setEstado(idx, 'ok')}
                      style={{ background: item.estado === 'ok' ? '#1ABBD6' : '#F0FAFB', color: item.estado === 'ok' ? '#fff' : '#555', border: '1px solid #B2E0E8', borderRadius: 6, padding: '5px 8px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >✅</button>
                    <button
                      onClick={() => setEstado(idx, 'faltante')}
                      style={{ background: item.estado === 'faltante' ? '#DC3545' : '#F0FAFB', color: item.estado === 'faltante' ? '#fff' : '#555', border: '1px solid #B2E0E8', borderRadius: 6, padding: '5px 8px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >❌</button>
                    <button
                      onClick={() => setEstado(idx, 'reemplazo')}
                      style={{ background: item.estado === 'reemplazo' ? '#FFC107' : '#F0FAFB', color: item.estado === 'reemplazo' ? '#000' : '#555', border: '1px solid #B2E0E8', borderRadius: 6, padding: '5px 8px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >🔄</button>
                  </div>
                </div>
                {(item.estado === 'faltante' || item.estado === 'reemplazo') && (
                  <input
                    type="text"
                    placeholder="Observación (obligatoria)"
                    value={item.observacion}
                    onChange={e => setObservacion(idx, e.target.value)}
                    style={{ marginTop: 8, width: '100%', border: '1px solid #ccc', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', border: '1px solid #B2E0E8', marginBottom: 16, display: 'flex', gap: 16, justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: '#1ABBD6', fontWeight: 700 }}>✅ OK: {items.filter(i => i.estado === 'ok').length}</span>
            <span style={{ fontSize: 13, color: '#DC3545', fontWeight: 700 }}>❌ Faltante: {items.filter(i => i.estado === 'faltante').length}</span>
            <span style={{ fontSize: 13, color: '#FFC107', fontWeight: 700 }}>🔄 Reemplazo: {items.filter(i => i.estado === 'reemplazo').length}</span>
          </div>

          {error && <div style={{ color: '#DC3545', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={enviando || items.some(i => i.estado !== 'ok' && !i.observacion)}
            style={{
              width: '100%', background: enviando ? '#ccc' : '#1ABBD6', color: '#fff',
              border: 'none', borderRadius: 10, padding: '14px', fontSize: 16,
              fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer'
            }}
          >
            {enviando ? 'Guardando...' : 'Confirmar Checkin'}
          </button>
          {items.some(i => i.estado !== 'ok' && !i.observacion) && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 8 }}>
              Completá la observación de cada faltante o reemplazo para continuar.
            </p>
          )}
        </>
      )}
    </main>
  )
}