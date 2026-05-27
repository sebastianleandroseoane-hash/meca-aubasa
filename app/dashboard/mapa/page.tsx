'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

const ROLES_PERMITIDOS = [
  'superadmin','jefe','gerente','subgerente','administrador',
  'supervisor_electrico','tecnico_electrico','tecnico_electrico_edificio',
  'tallerista_electrico','panolero','tecnico_peaje','administrativo'
]

const KM_MIN = 0, KM_MAX = 52

function pct(km: number) {
  return ((km - KM_MIN) / (KM_MAX - KM_MIN)) * 100
}

const SVG_X1 = 60, SVG_X2 = 940
function kmToX(km: number) {
  return SVG_X1 + ((km - KM_MIN) / (KM_MAX - KM_MIN)) * (SVG_X2 - SVG_X1)
}

const Y_MAIN = 150
const hudsonNode = { x: kmToX(31), y: Y_MAIN }
const rotondaGutierrez = { x: 760, y: 285 }
const rutaNode = { x: 820, y: 430 }

function Label({ x, y, children, color = '#d9f6ff', anchor = 'middle' }: {
  x: number; y: number; children: React.ReactNode; color?: string; anchor?: 'start' | 'middle' | 'end'
}) {
  const str = String(children)
  const w = Math.max(str.length * 5.2, 36)
  const xRect = anchor === 'middle' ? x - w/2 : anchor === 'end' ? x - w : x
  return (
    <g>
      <rect x={xRect} y={y - 11} width={w} height={15} rx={3} fill="rgba(3,12,18,0.88)" stroke="rgba(255,255,255,0.15)" />
      <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={7.5} fontWeight={700}>{children}</text>
    </g>
  )
}

function Toll({ x, y, label, km, size = 1 }: { x: number; y: number; label: string; km: string; size?: number }) {
  const r = 7 * size
  const str = String(label)
  const w = Math.max(str.length * 5.0, 32)
  return (
    <g>
      <polygon points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} fill="#07151d" stroke="#EF9F27" strokeWidth={1.5 * size} />
      <rect x={x - w/2} y={y + 14 * size} width={w} height={13 * size} rx={3} fill="rgba(3,12,18,0.88)" stroke="rgba(239,159,39,0.3)" />
      <text x={x} y={y + 23 * size} textAnchor="middle" fill="#EF9F27" fontSize={7 * size} fontWeight={700}>{label}</text>
      <text x={x} y={y + 34 * size} textAnchor="middle" fill="#b8944d" fontSize={6.5 * size}>KM {km}</text>
    </g>
  )
}

function Distributor({ x, y, label, km }: { x: number; y: number; label: string; km: string }) {
  const str = String(label)
  const w = Math.max(str.length * 5.2, 36)
  return (
    <g>
      <circle cx={x} cy={y} r={12} fill="#07151d" stroke="#1D9E75" strokeWidth={3} />
      <circle cx={x} cy={y} r={5} fill="#1D9E75" opacity={0.65} />
      <rect x={x + 16} y={y - 26} width={w} height={22} rx={3} fill="rgba(3,12,18,0.88)" stroke="rgba(29,158,117,0.4)" />
      <text x={x + 16 + w/2} y={y - 16} textAnchor="middle" fill="#1D9E75" fontSize={7.5} fontWeight={700}>{label}</text>
      <text x={x + 16 + w/2} y={y - 6} textAnchor="middle" fill="#7ce7c0" fontSize={7}>KM {km}</text>
    </g>
  )
}

function TsMarker({ x, y, codigo, km }: { x: number; y: number; codigo: string; km?: string }) {
  return (
    <g>
      <line x1={x} y1={Y_MAIN + 6} x2={x} y2={y - 7} stroke="#1ABBD6" strokeWidth={0.8} opacity={0.2} />
      <circle cx={x} cy={y} r={5} fill="#061923" stroke="#1ABBD6" strokeWidth={1.6} />
      <text x={x} y={y + 15} textAnchor="middle" fill="#1ABBD6" fontSize={7.5} fontWeight={700}>{codigo}</text>
      {km && <text x={x} y={y + 26} textAnchor="middle" fill="#6eb8c8" fontSize={6.8}>KM {km}</text>}
    </g>
  )
}

function TsRamalMarker({ x, y, codigo }: { x: number; y: number; codigo: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={5} fill="#061923" stroke="#1ABBD6" strokeWidth={1.6} />
      <text x={x + 14} y={y + 3} fill="#1ABBD6" fontSize={7.5} fontWeight={700}>{codigo}</text>
      <text x={x + 14} y={y + 14} fill="#6eb8c8" fontSize={6.8}>ramal</text>
    </g>
  )
}

function SetProvisorio({ x, y, label, color = '#1D9E75', anchor = 'middle' }: {
  x: number; y: number; label: string; color?: string; anchor?: 'start' | 'middle' | 'end'
}) {
  const w = Math.max(String(label).length * 5.4, 40)
  const xRect = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2
  const xText = anchor === 'start' ? x + w/2 : anchor === 'end' ? x - w/2 : x
  return (
    <g>
      <rect x={xRect} y={y - 9} width={w} height={15} rx={3} fill={color + '22'} stroke={color} strokeWidth={1.2} />
      <text x={xText} y={y + 3} textAnchor="middle" fill={color} fontSize={7} fontWeight={800}>{label}</text>
    </g>
  )
}

const TRAMOS_DEFAULT: any[] = []

export default function PageMapa() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [cts, setCts] = useState<any[]>([])
  const [tableros, setTableros] = useState<any[]>([])
  const [tramos, setTramos] = useState<any[]>([])
  const [tramosError, setTramosError] = useState<string | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p || !ROLES_PERMITIDOS.includes(p.rol)) {
        router.push('/dashboard')
        return
      }
      setPerfil(p)
     const [{ data: ctData }, { data: tsData }, { data: tramosData, error: tramosErr }] = await Promise.all([
        supabase.from('centros_transformacion').select('*').order('km'),
        supabase.from('tableros_seccionales').select('*').order('km'),
        supabase.from('tramos').select('*').order('km_ini'),
      ])
      setCts(ctData || [])
      setTableros(tsData || [])
      if (tramosErr) setTramosError('Error al cargar tramos: ' + tramosErr.message)
      else if (!tramosData || tramosData.length === 0) setTramosError('No hay tramos cargados')
      else setTramos(tramosData)
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

      {/* MAPA SVG ESQUEMÁTICO */}
      <div style={{ overflowX: 'auto', padding: '16px 8px' }}>
        <svg
         viewBox="0 0 1000 500"
          style={{ width: '100%', minWidth: 800, display: 'block' }}
          aria-label="Esquema vial Autopista Buenos Aires – La Plata"
        >
          {/* TRAMOS — barras de color */}
          {tramosError ? (
            <text x="500" y="30" textAnchor="middle" fill="#EF9F27" fontSize="11">{tramosError}</text>
          ) : (
            tramos.map(t => {
              const x1 = kmToX(t.km_ini), x2 = kmToX(t.km_fin)
              return (
                <g key={t.codigo}>
                  <rect x={x1} y={18} width={x2 - x1 - 1} height={9} fill={t.color_hex} rx={1} opacity={0.9} />
                  <text x={(x1 + x2) / 2} y={16} textAnchor="middle" fill={t.color_hex} fontSize={7} fontWeight="600">{t.codigo}</text>
                </g>
              )
            })
          )}

          {/* KM LABELS */}
          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 52].map(km => (
            <g key={km}>
              <line x1={kmToX(km)} y1={28} x2={kmToX(km)} y2={34} stroke="#2a4a5a" strokeWidth={1} />
              <text x={kmToX(km)} y={44} textAnchor="middle" fill="#4a8fa0" fontSize={8.5}>{km}</text>
            </g>
          ))}

          {/* LÍNEA PRINCIPAL BA → LP */}
          <line x1={kmToX(0)} y1={Y_MAIN} x2={kmToX(52)} y2={Y_MAIN} stroke="#062b36" strokeWidth={14} strokeLinecap="round" />
          <line x1={kmToX(0)} y1={Y_MAIN} x2={kmToX(52)} y2={Y_MAIN} stroke="#1ABBD6" strokeWidth={5} strokeLinecap="round" />

          {/* BA / LP */}
          <text x={44} y={Y_MAIN + 4} textAnchor="middle" fill="#e8f4f8" fontSize={11} fontWeight="700">BA</text>
          <text x={957} y={Y_MAIN + 4} textAnchor="middle" fill="#e8f4f8" fontSize={11} fontWeight="700">LP</text>

          {/* RAMAL GUTIÉRREZ — curva desde Hudson hasta Rotonda */}
          <path d={`M ${hudsonNode.x} ${hudsonNode.y + 4} C ${hudsonNode.x + 90} ${hudsonNode.y + 70}, ${rotondaGutierrez.x - 80} ${rotondaGutierrez.y}, ${rotondaGutierrez.x} ${rotondaGutierrez.y}`} fill="none" stroke="#2c160e" strokeWidth={13} strokeLinecap="round" />
          <path d={`M ${hudsonNode.x} ${hudsonNode.y + 4} C ${hudsonNode.x + 90} ${hudsonNode.y + 70}, ${rotondaGutierrez.x - 80} ${rotondaGutierrez.y}, ${rotondaGutierrez.x} ${rotondaGutierrez.y}`} fill="none" stroke="#EF7D22" strokeWidth={4} strokeLinecap="round" />

          {/* RUTA 36 — desde Rotonda hacia sur */}
          <line x1={rotondaGutierrez.x} y1={rotondaGutierrez.y} x2={rutaNode.x} y2={rutaNode.y} stroke="#1a0e06" strokeWidth={10} strokeLinecap="round" />
          <line x1={rotondaGutierrez.x} y1={rotondaGutierrez.y} x2={rutaNode.x} y2={rutaNode.y} stroke="#A0522D" strokeWidth={3} strokeLinecap="round" />
          <text x={rutaNode.x + 22} y={rutaNode.y + 4} fill="#A0522D" fontSize={9} fontWeight={800}>RUTA 36</text>

          {/* PEAJES */}
          <Toll x={kmToX(7)}    y={Y_MAIN} label="DOCK SUD"    km="7" />
          <Toll x={kmToX(17)}   y={Y_MAIN} label="BERNAL"      km="17" />
          <Toll x={kmToX(20.4)} y={Y_MAIN} label="QUILMES"     km="20.4" />
          <Toll x={kmToX(26.7)} y={Y_MAIN} label="BERAZATEGUI" km="26.7" />
          <Toll x={kmToX(30)}   y={Y_MAIN} label="HUDSON"      km="30" size={1.0} />

          {/* DISTRIBUIDOR HUDSON sobre la traza */}
          <Distributor x={hudsonNode.x} y={hudsonNode.y} label="DIST. HUDSON" km="31" />

         {/* ROTONDA JM GUTIÉRREZ al final del ramal */}
          <g>
            <circle cx={rotondaGutierrez.x} cy={rotondaGutierrez.y} r={12} fill="#07151d" stroke="#1D9E75" strokeWidth={3} />
            <circle cx={rotondaGutierrez.x} cy={rotondaGutierrez.y} r={5} fill="#1D9E75" opacity={0.65} />
            <rect x={rotondaGutierrez.x - 90} y={rotondaGutierrez.y + 16} width={88} height={16} rx={4} fill="rgba(3,12,18,0.88)" stroke="rgba(255,255,255,0.12)" />
            <text x={rotondaGutierrez.x - 46} y={rotondaGutierrez.y + 27} textAnchor="middle" fill="#1D9E75" fontSize={7.5} fontWeight={700}>ROTONDA JM GUTIÉRREZ</text>
            <text x={rotondaGutierrez.x - 46} y={rotondaGutierrez.y + 40} textAnchor="middle" fill="#7ce7c0" fontSize={7}>KM 39</text>
          </g>

         {/* CTs Y SETs — datos reales de Supabase */}
          {cts.map((ct, i) => {
            const x = kmToX(Number(ct.km))
            const col = ct.tipo === 'CT' ? '#EF9F27' : '#1D9E75'
           const yBox = 108 - (i % 2) * 22
            return (
              <g key={ct.codigo} onClick={() => setSelected(ct)} style={{ cursor: 'pointer' }}>
                <line x1={x} y1={yBox + 14} x2={x} y2={Y_MAIN - 6} stroke={col} strokeWidth={1} strokeDasharray="3,2" opacity={0.4} />
                <rect x={x - 28} y={yBox} width={56} height={14} rx={3} fill={col + '22'} stroke={col} strokeWidth={1.2} />
                <text x={x} y={yBox + 10} textAnchor="middle" fill={col} fontSize={7.5} fontWeight="700">{ct.codigo}</text>
              </g>
            )
          })}

          {/* ─── GRUPO A: TS1–TS30 traza principal — datos reales Supabase ─── */}
          {tsNormales.map((ts, i) => {
            const x = kmToX(Number(ts.km))
            const y = 210 + (i % 3) * 38
            return (
              <g key={ts.codigo} onClick={() => setSelected(ts)} style={{ cursor: 'pointer' }}>
                <TsMarker x={x} y={y} codigo={ts.codigo} />
              </g>
            )
          })}

          {/* ─── GRUPO B: TS31–TS36 + TRG ramal Gutiérrez — PROVISORIO ─── */}
          {[
            { codigo: 'TS31', x: 590, y: 180, labelAbajo: true },
            { codigo: 'TS32', x: 606, y: 190, labelAbajo: true },
            { codigo: 'TS33', x: 628, y: 218 },
            { codigo: 'TS34', x: 650, y: 240 },
            { codigo: 'TS35', x: 674, y: 260 },
            { codigo: 'TS36', x: 706, y: 274 },
            { codigo: 'TRG',  x: 742, y: 286 },
          ].map((ts: any) => (
            <g key={ts.codigo}>
              <circle cx={ts.x} cy={ts.y} r={5} fill="#061923" stroke="#1ABBD6" strokeWidth={1.6} />
              {ts.labelAbajo
                ? <text x={ts.x} y={ts.y + 16} textAnchor="middle" fill="#1ABBD6" fontSize={7.5} fontWeight={700}>{ts.codigo}</text>
                : <text x={ts.x - 14} y={ts.y + 3} textAnchor="end" fill="#1ABBD6" fontSize={7.5} fontWeight={700}>{ts.codigo}</text>
              }
            </g>
          ))}

         {/* SET EL CARMEN — a la izquierda arriba de la Rotonda — PROVISORIO */}
          <SetProvisorio x={rotondaGutierrez.x - 130} y={rotondaGutierrez.y + 2} label="SET EL CARMEN" color="#1D9E75" anchor="middle" />

          {/* ─── GRUPO C: TG01–TG09 Ruta 36 — PROVISORIO ─── */}
          {Array.from({ length: 9 }, (_, i) => {
            const t = (i + 1) / 10
            const x = rotondaGutierrez.x + t * (rutaNode.x - rotondaGutierrez.x) + 16
            const y = rotondaGutierrez.y + t * (rutaNode.y - rotondaGutierrez.y)
            return (
              <g key={`TG${String(i + 1).padStart(2, '0')}`}>
                <circle cx={x - 14} cy={y} r={4} fill="#061923" stroke="#A0522D" strokeWidth={1.4} />
                <text x={x} y={y + 4} fill="#A0522D" fontSize={7} fontWeight={700}>TG{String(i + 1).padStart(2, '0')}</text>
              </g>
            )
          })}

         {/* ─── GRUPO D: TS37–TS53 troncal La Plata — PROVISORIO ─── */}
          {Array.from({ length: 17 }, (_, i) => {
            const x = kmToX(37) + (i / 16) * (kmToX(52) - kmToX(37))
            const y = 178 + (i % 3) * 28
            return (
              <TsMarker key={`TS${37 + i}`} x={x} y={y} codigo={`TS${37 + i}`} />
            )
          })}

          {/* SET H3 — inicio troncal La Plata en TS37 — PROVISORIO */}
          <SetProvisorio x={kmToX(37)} y={58} label="SET H3" color="#1D9E75" />

          {/* SET RUTA 19 — después de TS45 — PROVISORIO */}
          <SetProvisorio x={kmToX(45.5)} y={108} label="SET RUTA 19" color="#1D9E75" />

          {/* SET LA PLATA — en TS52 — PROVISORIO */}
          <SetProvisorio x={kmToX(51.5)} y={108} label="SET LA PLATA" color="#1D9E75" anchor="end" />

          {/* Sin activos reales cargados */}
          {cts.length === 0 && tableros.length === 0 && (
            <text x={500} y={400} textAnchor="middle" fill="#2a4a5a" fontSize={11}>No hay activos cargados todavía</text>
          )}

        </svg>
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
