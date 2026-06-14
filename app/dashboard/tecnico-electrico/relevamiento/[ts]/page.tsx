'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

const ESTADOS = [
  'Prendida',
  'Apagada',
  'Media placa encendida',
  'Titilando',
  'Falta luminaria',
]

const COLUMNAS = Array.from({ length: 25 }, (_, i) =>
  String(i + 1).padStart(2, '0')
)

const POSICIONES = ['1N', '1S', '2N', '2S']

// Mapa de color por estado
const ESTADO_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Prendida:               { bg: '#0d3322', text: '#1D9E75', border: '#1D9E75' },
  Apagada:                { bg: '#1a1a2e', text: '#7b8fa0', border: '#3a4a5a' },
  'Media placa encendida':{ bg: '#2a1f00', text: '#EF9F27', border: '#EF9F27' },
  Titilando:              { bg: '#1a1030', text: '#9b7fda', border: '#9b7fda' },
  'Falta luminaria':      { bg: '#2a0d0d', text: '#e05a5a', border: '#e05a5a' },
}

type EstadoKey = typeof ESTADOS[number]
type MarcaMap = Record<string, Record<string, EstadoKey>> // columna → posicion → estado

export default function RelevamientoTSPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const ts = (params?.ts as string) ?? ''
  const ordenId = searchParams.get('orden') ?? ''

  const [perfil, setPerfil] = useState<any>(null)
  const [orden, setOrden] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Estado de la grilla
  const [marcas, setMarcas] = useState<MarcaMap>({})
  const [selectorAbierto, setSelectorAbierto] = useState<{ col: string; pos: string } | null>(null)

  // Cabecera editable
  const [tramo, setTramo] = useState('')
  const [sector, setSector] = useState('')
  const [kmAproximado, setKmAproximado] = useState('')
  const [ubicacionTexto, setUbicacionTexto] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [ultimoGuardadoCount, setUltimoGuardadoCount] = useState(0)

  useEffect(() => {
    getPerfil().then(async (p) => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'tecnico_electrico' && p.rol !== 'superadmin' && p.rol !== 'jefe') {
        router.push('/')
        return
      }
      setPerfil(p)

      // Validar que vino el orden_id por query param
      if (!ordenId) {
        setError('Falta el parámetro orden. Accedé desde la tarjeta de la OT.')
        setLoading(false)
        return
      }

      // Buscar la OT por id exacto + tipo, sin ilike
      const { data: ot, error: otError } = await supabase
        .from('ordenes_trabajo')
        .select('*')
        .eq('id', ordenId)
        .eq('tipo', 'relevamiento_alumbrado')
        .in('estado', ['pendiente', 'en_curso'])
        .maybeSingle()

      if (otError || !ot) {
        setError(`No se encontró una OT de relevamiento activa para ${ts}.`)
        setLoading(false)
        return
      }

      setOrden(ot)
      setLoading(false)
    })
  }, [ts, ordenId])

  function toggleEstado(col: string, pos: string, estado: EstadoKey) {
    setMarcas(prev => {
      const colData = { ...(prev[col] ?? {}) }
      if (colData[pos] === estado) {
        // Deseleccionar
        delete colData[pos]
      } else {
        colData[pos] = estado
      }
      if (Object.keys(colData).length === 0) {
        const next = { ...prev }
        delete next[col]
        return next
      }
      return { ...prev, [col]: colData }
    })
    setSelectorAbierto(null)
  }

  function abrirSelector(col: string, pos: string) {
    setSelectorAbierto(prev =>
      prev?.col === col && prev?.pos === pos ? null : { col, pos }
    )
  }

  function totalMarcados() {
    return Object.values(marcas).reduce(
      (acc, posMap) => acc + Object.keys(posMap).length,
      0
    )
  }

  async function handleGuardar() {
    if (!orden || !perfil) return
    const filas: any[] = []

    for (const col of COLUMNAS) {
      const posMap = marcas[col]
      if (!posMap) continue
      for (const pos of POSICIONES) {
        const estado = posMap[pos]
        if (!estado) continue
        filas.push({
          orden_id: orden.id,
          tecnico_id: perfil.id,
          ts: ts,
          tramo: tramo || null,
          sector: sector || null,
          km_aproximado: kmAproximado ? parseFloat(kmAproximado) : null,
          numero_visible: col,
          posicion: pos,
          estado_general: estado,
          cantidad_luminarias: 1,
          ubicacion_texto: ubicacionTexto || null,
          observaciones: observaciones || null,
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (filas.length === 0) {
      setError('No marcaste ninguna posición. Marcá al menos una para guardar.')
      return
    }

    setGuardando(true)
    setError('')

    const { error: insertError } = await supabase
      .from('alumbrado_relevamientos_campo')
      .upsert(filas, {
        onConflict: 'orden_id,ts,numero_visible,posicion',
        ignoreDuplicates: false,
      })

    setGuardando(false)

    if (insertError) {
      setError(`Error al guardar: ${insertError.message}`)
      return
    }

    setUltimoGuardadoCount(filas.length)
    setGuardado(true)
    setMarcas({})
    setTramo('')
    setSector('')
    setKmAproximado('')
    setUbicacionTexto('')
    setObservaciones('')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07131a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1ABBD6', fontFamily: 'system-ui' }}>
        Cargando…
      </div>
    )
  }

  if (error && !orden) {
    return (
      <div style={{ minHeight: '100vh', background: '#07131a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, fontFamily: 'system-ui' }}>
        <div style={{ color: '#e05a5a', fontSize: 14, textAlign: 'center' }}>{error}</div>
        <button onClick={() => router.back()} style={{ background: '#1a3040', border: '1px solid #1a3040', borderRadius: 8, color: '#e8f4f8', padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}>
          ← Volver
        </button>
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#07131a', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#e8f4f8', paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: '#0c1c24', borderBottom: '1px solid #1a3040', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#4a8fa0', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>←</button>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1ABBD6' }}>Relevamiento {ts}</div>
            <div style={{ fontSize: 11, color: '#4a8fa0' }}>
              OT-{String(orden?.numero_orden ?? 0).padStart(5, '0')} · {orden?.titulo}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Cabecera de campo */}
        <div style={{ background: '#0c1c24', border: '1px solid #1a3040', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: '#4a8fa0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Datos de campo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input
              value={tramo}
              onChange={e => setTramo(e.target.value)}
              placeholder="Tramo"
              style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, color: '#e8f4f8', padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
            <input
              value={sector}
              onChange={e => setSector(e.target.value)}
              placeholder="Sector"
              style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, color: '#e8f4f8', padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input
              value={kmAproximado}
              onChange={e => setKmAproximado(e.target.value)}
              placeholder="KM aprox."
              type="number"
              step="0.1"
              style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, color: '#e8f4f8', padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
            <input
              value={ubicacionTexto}
              onChange={e => setUbicacionTexto(e.target.value)}
              placeholder="Ubicación puntual"
              style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, color: '#e8f4f8', padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            placeholder="Observaciones generales (opcional)"
            rows={2}
            style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, color: '#e8f4f8', padding: '8px 10px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Leyenda de estados */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ESTADOS.map(est => {
            const c = ESTADO_COLOR[est]
            return (
              <div key={est} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 10, color: c.text, fontWeight: 600 }}>
                {est}
              </div>
            )
          })}
        </div>

        {/* Grilla de columnas */}
        {COLUMNAS.map(col => {
          const colMarcas = marcas[col] ?? {}
          const tieneMarcas = Object.keys(colMarcas).length > 0
          return (
            <div
              key={col}
              style={{
                background: tieneMarcas ? '#0d1e2a' : '#0c1c24',
                border: `1px solid ${tieneMarcas ? '#1ABBD6' : '#1a3040'}`,
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              {/* Número de columna */}
              <div style={{ fontSize: 12, fontWeight: 700, color: tieneMarcas ? '#1ABBD6' : '#4a8fa0', marginBottom: 8 }}>
                Columna {col}
              </div>

              {/* Botones de posición */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                {POSICIONES.map(pos => {
                  const estado = colMarcas[pos]
                  const c = estado ? ESTADO_COLOR[estado] : null
                  const abierto = selectorAbierto?.col === col && selectorAbierto?.pos === pos

                  return (
                    <div key={pos} style={{ position: 'relative' }}>
                      <button
                        onClick={() => abrirSelector(col, pos)}
                        style={{
                          width: '100%',
                          background: c ? c.bg : '#07131a',
                          border: `1px solid ${c ? c.border : '#1a3040'}`,
                          borderRadius: 8,
                          color: c ? c.text : '#4a8fa0',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '10px 4px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          lineHeight: 1.3,
                        }}
                      >
                        <div>{pos}</div>
                        {estado && (
                          <div style={{ fontSize: 9, fontWeight: 400, marginTop: 3, whiteSpace: 'normal' }}>
                            {estado}
                          </div>
                        )}
                      </button>

                      {/* Selector de estado (dropdown inline) */}
                      {abierto && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          zIndex: 30,
                          background: '#0c1c24',
                          border: '1px solid #1ABBD6',
                          borderRadius: 8,
                          overflow: 'hidden',
                          width: 'max-content',
                          minWidth: 160,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        }}>
                          {ESTADOS.map(est => {
                            const ec = ESTADO_COLOR[est]
                            const seleccionado = colMarcas[pos] === est
                            return (
                              <button
                                key={est}
                                onClick={() => toggleEstado(col, pos, est)}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  textAlign: 'left',
                                  background: seleccionado ? ec.bg : 'transparent',
                                  border: 'none',
                                  borderBottom: '1px solid #1a3040',
                                  color: ec.text,
                                  fontSize: 12,
                                  fontWeight: seleccionado ? 700 : 400,
                                  padding: '10px 12px',
                                  cursor: 'pointer',
                                }}
                              >
                                {seleccionado ? '✓ ' : ''}{est}
                              </button>
                            )
                          })}
                          <button
                            onClick={() => setSelectorAbierto(null)}
                            style={{ display: 'block', width: '100%', textAlign: 'center', background: 'none', border: 'none', color: '#4a8fa0', fontSize: 11, padding: '8px', cursor: 'pointer' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer fijo */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0c1c24', borderTop: '1px solid #1a3040', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {error && (
          <div style={{ background: '#2a0d0d', border: '1px solid #e05a5a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#e05a5a' }}>
            {error}
          </div>
        )}
        {guardado && (
          <div style={{ background: '#0d3322', border: '1px solid #1D9E75', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#1D9E75' }}>
            ✓ {ultimoGuardadoCount} posición{ultimoGuardadoCount !== 1 ? 'es' : ''} guardada{ultimoGuardadoCount !== 1 ? 's' : ''} correctamente.
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#4a8fa0' }}>
            {totalMarcados()} posición{totalMarcados() !== 1 ? 'es' : ''} marcada{totalMarcados() !== 1 ? 's' : ''}
          </div>
          <button
            onClick={handleGuardar}
            disabled={guardando || totalMarcados() === 0}
            style={{
              background: totalMarcados() === 0 ? '#1a3040' : '#1D9E75',
              border: 'none',
              borderRadius: 10,
              color: totalMarcados() === 0 ? '#4a8fa0' : 'white',
              fontSize: 14,
              fontWeight: 700,
              padding: '12px 28px',
              cursor: totalMarcados() === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {guardando ? 'Guardando…' : 'Guardar relevamiento'}
          </button>
        </div>
      </div>

      {/* Overlay para cerrar selector al tocar fuera */}
      {selectorAbierto && (
        <div
          onClick={() => setSelectorAbierto(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 25 }}
        />
      )}
    </main>
  )
}