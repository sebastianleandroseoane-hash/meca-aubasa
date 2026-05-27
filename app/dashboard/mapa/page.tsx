'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

const ROLES_PERMITIDOS = [
  'superadmin','jefe','gerente','subgerente','administrador',
  'supervisor_electrico','tecnico_electrico','tecnico_electrico_edificio',
  'tallerista_electrico','panolero','tecnico_peaje','administrativo'
]

const KM_MIN = 0, KM_MAX = 32

function pct(km: number) {
  return ((km - KM_MIN) / (KM_MAX - KM_MIN)) * 100
}

const TRAMOS = [
  { codigo: 'VAC', nombre: 'Viaducto Acceso Capital', km_ini: 0, km_fin: 5, color: '#185FA5' },
  { codigo: 'VSE', nombre: 'Viaducto Sudeste', km_ini: 5, km_fin: 11, color: '#0C447C' },
  { codigo: 'HSE', nombre: 'Hudson Sudeste', km_ini: 11, km_fin: 30.5, color: '#085041' },
  { codigo: 'HG', nombre: 'Hudson - Rotonda Gutiérrez', km_ini: 30.5, km_fin: 32, color: '#3B6D11' },
]

export default function PageMapa() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [cts, setCts] = useState<any[]>([])
  const [tableros, setTableros] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p || !ROLES_PERMITIDOS.includes(p.rol)) {
        router.push('/dashboard')
        return
      }
      setPerfil(p)
      const [{ data: ctData }, { data: tsData }] = await Promise.all([
        supabase.from('centros_transformacion').select('*').order('km'),
        supabase.from('tableros_seccionales').select('*').order('km'),
      ])
      setCts(ctData || [])
      setTableros(tsData || [])
      setLoading(false)
    })
  }, [])

  if (!perfil || loading) return (
    <div style={{ minHeight: '100vh', background: '#07131a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1ABBD6', fontFamily: 'system-ui' }}>
      Cargando mapa...
    </div>
  )

  const tsNormales = tableros.filter(t => t.numero && t.numero <= 30)
  const tsEspeciales = tableros.filter(t => !t.numero || t.numero > 30)

  return (
    <main style={{ minHeight: '100vh', background: '#07131a', fontFamily: 'system-ui', color: '#e8f4f8' }}>

      {/* HEADER */}
      <div style={{ background: '#0c1c24', borderBottom: '1px solid #1a3040', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Traza Autopista BA – LP</div>
          <div style={{ fontSize: 11, color: '#4a8fa0' }}>
            {cts.length} centros · {tableros.length} tableros
          </div>
        </div>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#4a8fa0', fontSize: 12, cursor: 'pointer' }}>← Volver</button>
      </div>

      {/* LEYENDA */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid #1a3040' }}>
        {[
          { color: '#EF9F27', label: 'CT (centro transformación)' },
          { color: '#1D9E75', label: 'SET (subestación)' },
          { color: '#1ABBD6', label: 'TS principal' },
          { color: '#4a8fa0', label: 'TS especial' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#4a8fa0' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* MAPA HORIZONTAL */}
      <div style={{ overflowX: 'auto', padding: '16px 0' }}>
        <div style={{ minWidth: 900, position: 'relative', padding: '0 60px' }}>

          {/* TRAMOS */}
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
            {TRAMOS.map(t => (
              <div key={t.codigo}
                style={{ width: `${pct(t.km_fin) - pct(t.km_ini)}%`, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={t.nombre}>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{t.codigo}</span>
              </div>
            ))}
          </div>

          {/* KM LABELS */}
          <div style={{ position: 'relative', height: 16 }}>
            {[0, 5, 10, 15, 20, 25, 30, 32].map(km => (
              <div key={km} style={{ position: 'absolute', left: `${pct(km)}%`, transform: 'translateX(-50%)', fontSize: 9, color: '#4a8fa0' }}>
                {km}
              </div>
            ))}
          </div>

          {/* LÍNEA DE RUTA */}
          <div style={{ height: 5, background: 'linear-gradient(90deg,#1ABBD6,#0F6E56)', borderRadius: 3, margin: '4px 0' }} />

          {/* CTs Y SETs — arriba */}
          <div style={{ position: 'relative', height: 80 }}>
            {cts.map((ct, i) => {
              const isCT = ct.tipo === 'CT'
              const col = isCT ? '#EF9F27' : '#1D9E75'
              const row = isCT ? 0 : 1
              return (
                <div key={ct.codigo}
                  onClick={() => setSelected(ct)}
                  style={{
                    position: 'absolute',
                    left: `${pct(Number(ct.km))}%`,
                    top: row * 36,
                    transform: 'translateX(-50%)',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}>
                  <div style={{
                    padding: '3px 6px', borderRadius: 5, fontSize: 9, fontWeight: 700,
                    background: col + '22', border: `1.5px solid ${col}`, color: col,
                    whiteSpace: 'nowrap',
                  }}>
                    {ct.codigo}
                  </div>
                  <div style={{ width: 1.5, height: 28, background: col + '66', margin: '0 auto' }} />
                </div>
              )
            })}
          </div>

          {/* TS — abajo */}
          <div style={{ position: 'relative', height: 110 }}>
            {tsNormales.map((ts, i) => (
              <div key={ts.codigo}
                onClick={() => setSelected(ts)}
                style={{
                  position: 'absolute',
                  left: `${pct(Number(ts.km))}%`,
                  top: (i % 3) * 34,
                  transform: 'translateX(-50%)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1ABBD633', border: '2px solid #1ABBD6', margin: '0 auto' }} />
                <div style={{ fontSize: 8, color: '#1ABBD6', marginTop: 2, whiteSpace: 'nowrap' }}>{ts.codigo}</div>
              </div>
            ))}
            {tsEspeciales.map((ts, i) => (
              <div key={ts.codigo}
                onClick={() => setSelected(ts)}
                style={{
                  position: 'absolute',
                  left: `${pct(Number(ts.km))}%`,
                  top: 75 + (i % 2) * 20,
                  transform: 'translateX(-50%)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4a8fa033', border: '1.5px solid #4a8fa0', margin: '0 auto' }} />
                <div style={{ fontSize: 7, color: '#4a8fa0', marginTop: 2, whiteSpace: 'nowrap' }}>{ts.codigo}</div>
              </div>
            ))}

            {/* BA / LP */}
            <div style={{ position: 'absolute', left: -40, top: 40, fontSize: 11, fontWeight: 700, color: '#4a8fa0' }}>BA</div>
            <div style={{ position: 'absolute', right: -40, top: 40, fontSize: 11, fontWeight: 700, color: '#4a8fa0' }}>LP</div>
          </div>

        </div>
      </div>

      {/* PANEL DETALLE */}
      {selected && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#0c1c24', borderTop: '1px solid #1a3040',
          padding: '14px 16px', zIndex: 50,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1ABBD6' }}>
              {selected.codigo}
            </div>
            <div style={{ fontSize: 12, color: '#4a8fa0', marginTop: 2 }}>
              {selected.nombre || selected.descripcion_ubicacion}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#0F2A35', color: '#1ABBD6' }}>
                Km {Number(selected.km).toFixed(1)}
              </span>
              {selected.potencia_kva && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#1A2A10', color: '#1D9E75' }}>
                  {selected.potencia_kva} KVA
                </span>
              )}
              {selected.tension_salida && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#1a3040', color: '#4a8fa0' }}>
                  {selected.tension_salida}
                </span>
              )}
              {selected.calibre_interruptor_1kv && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#1a3040', color: '#4a8fa0' }}>
                  Interr. {selected.calibre_interruptor_1kv}A
                </span>
              )}
              {selected.cant_columnas_circuito_ne && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#1a3040', color: '#4a8fa0' }}>
                  {selected.cant_columnas_circuito_ne * 2} columnas
                </span>
              )}
            </div>
            {selected.observaciones && (
              <div style={{ fontSize: 10, color: '#4a8fa0', marginTop: 4 }}>
                {selected.observaciones}
              </div>
            )}
          </div>
          <button onClick={() => setSelected(null)}
            style={{ background: 'none', border: '1px solid #1a3040', borderRadius: 8, color: '#4a8fa0', fontSize: 11, padding: '6px 10px', cursor: 'pointer', marginLeft: 12 }}>
            ✕
          </button>
        </div>
      )}
    </main>
  )
}
