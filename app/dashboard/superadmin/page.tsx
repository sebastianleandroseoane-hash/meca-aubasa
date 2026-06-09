'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number | string
  color: 'cyan' | 'yellow' | 'red' | 'green'
  icon: ReactNode
}) {
  const colorMap = {
    cyan:   { val: 'text-cyan-300',   border: 'border-cyan-400/30',   glow: 'shadow-[0_0_18px_rgba(34,211,238,0.12)]' },
    yellow: { val: 'text-yellow-400', border: 'border-yellow-400/30', glow: 'shadow-[0_0_18px_rgba(251,191,36,0.12)]' },
    red:    { val: 'text-red-400',    border: 'border-red-400/30',    glow: 'shadow-[0_0_18px_rgba(239,68,68,0.12)]' },
    green:  { val: 'text-green-400',  border: 'border-green-400/30',  glow: 'shadow-[0_0_18px_rgba(34,197,94,0.12)]' },
  }
  const c = colorMap[color]
  return (
    <div className={`rounded-2xl bg-[#071c24]/90 border ${c.border} ${c.glow} p-3 flex flex-col gap-1`}>
      <div className="flex items-center justify-between">
        <span className="text-[#8ecbd8] text-[10px] font-bold tracking-[0.18em] uppercase leading-tight">{label}</span>
        <span className={`${c.val} opacity-70`}>{icon}</span>
      </div>
      <div className={`${c.val} text-3xl font-black tracking-tight leading-none`}>{value}</div>
    </div>
  )
}

// ─── ROLE CARD ────────────────────────────────────────────────────────────────
function RoleCard({
  label,
  sub,
  icon,
  onClick,
}: {
  label: string
  sub: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-[#071c24]/90 border border-cyan-400/20 shadow-[0_0_16px_rgba(34,211,238,0.06)] p-3 text-left flex flex-col gap-1.5 active:scale-[0.97] hover:border-cyan-300/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.18)] transition-all duration-150"
    >
      <span className="text-cyan-400 opacity-80">{icon}</span>
      <div className="text-white font-bold text-sm leading-tight">{label}</div>
      <div className="text-[#8ecbd8] text-[11px] leading-tight">{sub}</div>
    </button>
  )
}

// ─── SYSTEM CARD ──────────────────────────────────────────────────────────────
function SystemCard({
  label,
  sub,
  icon,
  onClick,
}: {
  label: string
  sub: string
  icon: ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl bg-[#071c24]/90 border border-cyan-400/15 p-3 flex items-center gap-3 ${onClick ? 'cursor-pointer active:scale-[0.98] hover:border-cyan-400/40 transition-all' : 'opacity-50'}`}
    >
      <span className="text-cyan-400 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-white font-bold text-sm leading-tight">{label}</div>
        <div className="text-[#8ecbd8] text-[11px] mt-0.5 leading-tight">{sub}</div>
      </div>
      {onClick && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </div>
  )
}

// ─── SUPRA CARD ───────────────────────────────────────────────────────────────
function SupraCard({
  id,
  titulo,
  tipo,
  sector,
  estado,
  plazo,
  responsable,
  prioridad,
}: {
  id: string
  titulo: string
  tipo: string
  sector: string
  estado: string
  plazo: string
  responsable: string
  prioridad: 'alta' | 'critica' | 'media' | 'baja'
}) {
  const prioMap = {
    alta:    { label: 'ALTA',    cls: 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30' },
    critica: { label: 'CRÍTICA', cls: 'bg-red-500/15 text-red-400 border border-red-400/30' },
    media:   { label: 'MEDIA',   cls: 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30' },
    baja:    { label: 'BAJA',    cls: 'bg-[#8ecbd8]/10 text-[#8ecbd8] border border-[#8ecbd8]/20' },
  }
  const estadoMap: Record<string, string> = {
    'pendiente planificación': 'text-yellow-400',
    'en ejecucion':            'text-cyan-300',
    'en ejecución':            'text-cyan-300',
    cerrada:                   'text-green-400',
  }
  const p = prioMap[prioridad]
  const estadoCls = estadoMap[estado] ?? 'text-[#8ecbd8]'

  return (
    <div className="rounded-xl bg-[#071c24]/90 border-l-4 border-l-cyan-400/60 border border-cyan-400/15 p-3.5 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-white font-black text-sm tracking-wide">{id}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.cls}`}>{p.label}</span>
      </div>
      <div className="text-white font-semibold text-sm leading-tight">{titulo}</div>
      <div className="text-[#8ecbd8] text-[11px]">{tipo} · {sector}</div>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-semibold ${estadoCls}`}>{estado}</span>
        <span className="text-[#8ecbd8] text-[10px]">Plazo: {plazo}</span>
      </div>
      <div className="text-[#8ecbd8] text-[10px] text-right">{responsable}</div>
    </div>
  )
}

// ─── OT CARD ──────────────────────────────────────────────────────────────────
function OTCard({
  id,
  titulo,
  estado,
  fecha,
  sector,
  tipo,
}: {
  id: string
  titulo: string
  estado: string
  fecha: string
  sector: string
  tipo: string
}) {
  const estadoMap: Record<string, string> = {
    pendiente:        'text-yellow-400',
    en_curso:         'text-cyan-300',
    cierre_propuesto: 'text-blue-400',
    cerrada:          'text-green-400',
    cancelada:        'text-red-400',
  }
  const sectorMap: Record<string, string> = {
    electrico: 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/25',
    ac:        'bg-blue-400/10 text-blue-300 border border-blue-400/25',
    edificio:  'bg-purple-400/10 text-purple-300 border border-purple-400/25',
  }
  const estadoCls = estadoMap[estado] ?? 'text-[#8ecbd8]'
  const sectorCls = sectorMap[sector] ?? 'bg-[#8ecbd8]/10 text-[#8ecbd8] border border-[#8ecbd8]/20'

  return (
    <div className="rounded-xl bg-[#071c24]/90 border border-cyan-400/12 p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-white font-black text-sm tracking-wide">{id}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sectorCls}`}>{sector}</span>
      </div>
      <div className="text-[#8ecbd8] text-xs leading-tight">{titulo}</div>
      <div className="text-[10px] text-[#8ecbd8]/60">{tipo}</div>
      <div className="flex items-center justify-between mt-0.5">
        <span className={`text-[11px] font-semibold ${estadoCls}`}>{estado}</span>
        <span className="text-[#8ecbd8]/50 text-[10px]">{fecha}</span>
      </div>
    </div>
  )
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconBolt = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)
const IconUsers = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconBriefcase = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
)
const IconMap = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
)
const IconDB = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
)
const IconSettings = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
  </svg>
)
const IconGrid = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
)
const IconBell = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
const IconBox = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
)
const IconPerson = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconHistory = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/>
  </svg>
)
const IconCheckin = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
)
const IconWrench = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
)
const IconAC = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="8" rx="2"/><path d="M7 11v8m4-8v8m4-8v8M2 19h20"/>
  </svg>
)
const IconBuilding = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22V12h6v10M9 7h1m4 0h1M9 12h1"/>
  </svg>
)
const IconStar = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconChevron = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DashboardSuperAdmin() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [filtroOT, setFiltroOT] = useState<'todos' | 'electrico' | 'ac' | 'edificio'>('todos')
  const [supraDetalle, setSupraDetalle] = useState<any>(null)
  const [otDetalle, setOtDetalle] = useState<any>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  async function abrirOtDetalle(ot: any) {
    setOtDetalle(ot)
    setLoadingDetalle(true)
    try {
      const { data } = await supabase
        .from('ordenes_trabajo')
        .select(`
          id, numero_orden, titulo, descripcion, sector, estado, prioridad,
          tipo, km, ubicacion, nomenclatura,
          fecha_programada, created_at,
          observaciones, trabajos_realizados, campo_libre, pendientes_descripcion,
          creado_por_perfil:profiles!ordenes_trabajo_creado_por_fkey(nombre, apellido),
          asignado_a_perfil:profiles!ordenes_trabajo_asignado_a_fkey(nombre, apellido),
          orden_tecnicos(tecnico_id, tecnico_perfil:profiles!orden_tecnicos_tecnico_id_fkey(nombre, apellido)),
          orden_materiales(cantidad, estado, materiales(nombre, unidad))
        `)
        .eq('id', ot.id)
        .single()
      if (data) setOtDetalle(data)
    } catch (e) {
      // error de red o Supabase — mantiene el objeto liviano del listado
    } finally {
      setLoadingDetalle(false)
    }
  }
  const [loadingDatos, setLoadingDatos] = useState(true)
  const [stats, setStats] = useState({ otsActivas: 0, cierresPendientes: 0, criticas: 0, tecnicosActivos: 0 })
  const [otsSupra, setOtsSupra] = useState<any[]>([])
  const [ordenes, setOrdenes] = useState<any[]>([])

  async function cargarDatosDashboard() {
    // Stats
    const { data: statsOT } = await supabase
      .from('ordenes_trabajo')
      .select('estado, prioridad')
    if (statsOT) {
      const otsActivas = statsOT.filter(o => !['cancelada','cerrada'].includes(o.estado)).length
      const cierresPendientes = statsOT.filter(o => o.estado === 'cierre_propuesto').length
      const criticas = statsOT.filter(o => o.prioridad === 'critica' && !['cancelada','cerrada'].includes(o.estado)).length
      setStats(prev => ({ ...prev, otsActivas, cierresPendientes, criticas }))
    }
    const { data: tecnicos } = await supabase
      .from('profiles')
      .select('id')
      .eq('activo', true)
      .in('rol', ['tecnico_electrico','tecnico_ac','tecnico_electrico_edificio','tecnico_peaje'])
    if (tecnicos) setStats(prev => ({ ...prev, tecnicosActivos: tecnicos.length }))

    // OTs Supra
    const { data: supras } = await supabase
      .from('ots_supra')
      .select('id, numero_supra, titulo, tipo, prioridad, estado, plazo_estimado, creado_por_perfil:profiles!ots_supra_creado_por_fkey(nombre, apellido)')
      .order('created_at', { ascending: false })
      .limit(5)
    if (supras) setOtsSupra(supras)

    // Órdenes operativas activas
    const { data: ots } = await supabase
      .from('ordenes_trabajo')
      .select('id, numero_orden, titulo, estado, sector, tipo, created_at')
      .not('estado', 'in', '(cancelada,cerrada)')
      .order('created_at', { ascending: false })
      .limit(10)
    if (ots) setOrdenes(ots)

    setLoadingDatos(false)
  }

  // ── OT Supra: estados (portados desde jefe/page.tsx) ─────────────────
  const SECTORES_SUPRA = ['electrico', 'ac', 'edificios', 'peaje', 'general']
  const emptyFormSupra = {
    titulo: '', descripcion: '', tipo: 'correctiva',
    prioridad: 'normal', plazo_estimado: '',
    sectores: [] as string[], supervisores: [] as string[],
  }
  const [showFormSupra, setShowFormSupra] = useState(false)
  const [loadingSupra, setLoadingSupra] = useState(false)
  const [msgSupra, setMsgSupra] = useState<{ ok: boolean; text: string } | null>(null)
  const [formSupra, setFormSupra] = useState(emptyFormSupra)
  const [supervisoresDisponibles, setSupervisoresDisponibles] = useState<any[]>([])

  function toggleItem(lista: string[], valor: string): string[] {
    return lista.includes(valor) ? lista.filter(x => x !== valor) : [...lista, valor]
  }

  async function cargarSupervisores() {
    const { data } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, rol')
      .in('rol', ['supervisor_electrico', 'supervisor_ac'])
      .eq('activo', true)
      .order('apellido', { ascending: true })
    setSupervisoresDisponibles(data || [])
  }

  async function crearSupra() {
    if (!formSupra.titulo.trim()) { setMsgSupra({ ok: false, text: 'El título es obligatorio' }); return }
    if (formSupra.sectores.length === 0) { setMsgSupra({ ok: false, text: 'Seleccioná al menos un sector' }); return }
    if (formSupra.supervisores.length === 0) { setMsgSupra({ ok: false, text: 'Seleccioná al menos un supervisor' }); return }
    setLoadingSupra(true)
    setMsgSupra(null)
    try {
      const { error } = await supabase.rpc('crear_ot_supra', {
        p_titulo: formSupra.titulo.trim(),
        p_descripcion: formSupra.descripcion.trim() || null,
        p_tipo: formSupra.tipo,
        p_prioridad: formSupra.prioridad,
        p_plazo_estimado: formSupra.plazo_estimado || null,
        p_sectores: formSupra.sectores,
        p_supervisores: formSupra.supervisores,
      })
      if (error) throw error
      setMsgSupra({ ok: true, text: 'OT Supra creada correctamente' })
      setFormSupra(emptyFormSupra)
    } catch (e: any) {
      setMsgSupra({ ok: false, text: e.message || 'Error al crear la OT Supra' })
    }
    setLoadingSupra(false)
  }

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) { router.push('/'); return }
      if (p.rol !== 'superadmin' && p.rol !== 'jefe') { router.push('/'); return }
      setPerfil(p)
      cargarSupervisores()
      cargarDatosDashboard()
    })
  }, [])

  if (!perfil) return (
    <div className="min-h-screen bg-[#061418] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-cyan-300/70 text-sm tracking-widest uppercase">Cargando</span>
      </div>
    </div>
  )

  // ── Datos computados ────────────────────────────────────────────────────
  const ordenesFiltradas = filtroOT === 'todos'
    ? ordenes
    : ordenes.filter((o: any) => o.sector === filtroOT)

  const roles = [
    { label: 'Gerente',           sub: 'Vista ejecutiva',  icon: <IconStar size={16} />,    path: '/dashboard/gerente' },
    { label: 'Subgerente',        sub: 'Vista ejecutiva',  icon: <IconStar size={16} />,    path: '/dashboard/Sub-gerente' },
    { label: 'Jefe de sector',    sub: 'Vista global',     icon: <IconBriefcase size={16}/>, path: '/dashboard/jefe' },
    { label: 'Supervisor Elec.',  sub: 'Turno eléctrico',  icon: <IconBolt size={16} />,    path: '/dashboard/supervisor-electrico' },
    { label: 'Supervisor AC',     sub: 'Turno AC',         icon: <IconAC size={16} />,      path: '/dashboard/supervisor-aire-acondicionado' },
    { label: 'Técnico Elec.',     sub: 'Campo eléctrico',  icon: <IconBolt size={16} />,    path: '/dashboard/tecnico-electrico' },
    { label: 'Técnico AC',        sub: 'Campo AC',         icon: <IconAC size={16} />,      path: '/dashboard/tecnico-aire-acondicionado' },
    { label: 'Técnico Edificios', sub: 'Cabinas peaje',    icon: <IconBuilding size={16}/>, path: '/dashboard/tecnico-electrico-edificios' },
    { label: 'Tallerista Elec.',  sub: 'Taller eléctrico', icon: <IconWrench size={16} />,  path: '/dashboard/tallerista-electrico' },
    { label: 'Tallerista AC',     sub: 'Taller AC',        icon: <IconWrench size={16} />,  path: '/dashboard/tallerista-aire-acondicionado' },
    { label: 'Pañolero',          sub: 'Stock',            icon: <IconBox size={16} />,     path: '/dashboard/panolero' },
    { label: 'Otros roles',       sub: 'Ver todos',        icon: <span className="text-cyan-400 font-black text-base leading-none">+</span>, path: '/dashboard/superadmin/usuarios' },
  ]

  return (
    <main className="min-h-screen bg-[#061418] text-white pb-40">
      <div className="max-w-6xl mx-auto">

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <header className="bg-gradient-to-br from-[#092b34] via-[#071c24] to-[#061418] border-b border-cyan-400/20 px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {/* icono circular */}
              <div className="w-11 h-11 rounded-full bg-[#071c24] border-2 border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.35)] flex items-center justify-center text-cyan-300 shrink-0">
                <IconBolt size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-xl tracking-wide uppercase leading-none">SÚPER ADMIN</span>
                  <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase shadow-[0_0_12px_rgba(239,68,68,0.4)]">ROOT</span>
                </div>
                <div className="text-[#8ecbd8] text-xs mt-1 tracking-wide">{perfil.nombre} · Acceso total</div>
              </div>
            </div>
            {/* iconos derecha */}
            <div className="flex items-center gap-3 text-[#8ecbd8]">
              <button className="hover:text-cyan-300 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
              <button className="hover:text-cyan-300 transition-colors relative">
                <IconBell size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-[#0b2f3a] border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold text-sm">
                {perfil.nombre?.charAt(0)?.toUpperCase() ?? 'S'}
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 pt-4 space-y-6">

          {/* ── STATS SUPERIORES ────────────────────────────────────────── */}
          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <StatCard
                label="OTs activas"
                value={stats.otsActivas}
                color="cyan"
                icon={<IconBolt size={16} />}
              />
              <StatCard
                label="Cierres pendientes"
                value={stats.cierresPendientes}
                color="yellow"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                }
              />
              <StatCard
                label="Críticas / Emergencias"
                value={stats.criticas}
                color="red"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                }
              />
              <StatCard
                label="Técnicos activos"
                value={stats.tecnicosActivos}
                color="green"
                icon={<IconUsers size={16} />}
              />
            </div>
          </section>

          {/* ── ACCESO RÁPIDO POR ROL ───────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase">Acceso rápido por rol</span>
              <button
                onClick={() => router.push('/dashboard/superadmin/usuarios')}
                className="text-cyan-300 text-[11px] font-bold tracking-wide flex items-center gap-1 hover:text-cyan-200 transition-colors"
              >
                Ver todos <IconChevron size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {roles.map(r => (
                <RoleCard
                  key={r.label}
                  label={r.label}
                  sub={r.sub}
                  icon={r.icon}
                  onClick={() => router.push(r.path)}
                />
              ))}
            </div>
          </section>

          {/* ── BLOQUE PRINCIPAL: SUPRA + ÓRDENES ──────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* OTS SUPRA */}
            <div className="rounded-2xl bg-[#071c24]/90 border border-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.07)] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase">OTs Supra</span>
                  {otsSupra.filter((s: any) => s.estado === 'pendiente_planificacion').length > 0 && (
                    <span className="ml-2 text-yellow-400 text-[11px] font-bold bg-yellow-400/10 border border-yellow-400/25 px-2 py-0.5 rounded-full">
                      {otsSupra.filter((s: any) => s.estado === 'pendiente_planificacion').length} sin planificar
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setShowFormSupra(true); setMsgSupra(null) }}
                  className="bg-cyan-400 text-[#062027] text-xs font-black px-3 py-1.5 rounded-lg shadow-[0_0_16px_rgba(34,211,238,0.35)] hover:bg-cyan-300 active:scale-95 transition-all tracking-wide">
                  + NUEVA SUPRA
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {loadingDatos ? (
                  <div className="text-[#8ecbd8] text-xs text-center py-4">Cargando...</div>
                ) : otsSupra.length === 0 ? (
                  <div className="text-[#8ecbd8] text-xs text-center py-4">Sin OTs Supra activas</div>
                ) : otsSupra.map((s: any) => (
                  <div key={s.id} onClick={() => setSupraDetalle(s)} className="cursor-pointer active:opacity-70">
                    <SupraCard
                      id={`S-${String(s.numero_supra).padStart(4,'0')}`}
                      titulo={s.titulo}
                      tipo={s.tipo ?? '—'}
                      sector={s.ots_supra_sectores?.[0]?.sector ?? '—'}
                      estado={s.estado?.replace(/_/g,' ') ?? '—'}
                      plazo={s.plazo_estimado ? new Date(s.plazo_estimado).toLocaleDateString('es-AR') : '—'}
                      responsable={s.creado_por_perfil ? `${s.creado_por_perfil.nombre ?? ''} ${s.creado_por_perfil.apellido ?? ''}`.trim() : '—'}
                      prioridad={(s.prioridad === 'critica' ? 'critica' : s.prioridad === 'alta' ? 'alta' : s.prioridad === 'baja' ? 'baja' : 'media') as 'alta'|'critica'|'media'|'baja'}
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/dashboard/jefe')} className="w-full py-2.5 rounded-xl border border-cyan-400/20 text-[#8ecbd8] text-xs font-bold tracking-widest uppercase hover:border-cyan-400/40 hover:text-cyan-300 transition-all flex items-center justify-center gap-2">
                Ver todas las OTs Supra <IconChevron size={12} />
              </button>
            </div>

            {/* ÓRDENES OPERATIVAS */}
            <div className="rounded-2xl bg-[#071c24]/90 border border-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.07)] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase">Órdenes operativas</span>
                <span className="text-cyan-300 text-xs font-bold">{stats.otsActivas} activas</span>
              </div>
              {/* Filtros */}
              <div className="flex gap-1.5 flex-wrap">
                {(['todos', 'electrico', 'ac', 'edificio'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFiltroOT(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                      filtroOT === f
                        ? 'bg-cyan-400 text-[#062027] shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                        : 'bg-[#0b2630] text-[#8ecbd8] border border-cyan-400/15 hover:border-cyan-400/35'
                    }`}
                  >
                    {f === 'todos' ? 'Todos' : f === 'electrico' ? 'Eléctrico' : f === 'ac' ? 'AC' : 'Edificio'}
                  </button>
                ))}
              </div>
              {/* Cards OT */}
              <div className="flex flex-col gap-2">
                {loadingDatos ? (
                  <div className="text-[#8ecbd8] text-xs text-center py-4">Cargando...</div>
                ) : ordenesFiltradas.length === 0 ? (
                  <div className="text-[#8ecbd8] text-xs text-center py-4">Sin órdenes activas</div>
                ) : ordenesFiltradas.map((o: any) => (
                  <div key={o.id} onClick={() => abrirOtDetalle(o)} className="cursor-pointer active:opacity-70">
                    <OTCard
                      id={`OT-${String(o.numero_orden).padStart(4,'0')}`}
                      titulo={o.titulo}
                      estado={o.estado}
                      fecha={o.created_at ? new Date(o.created_at).toLocaleDateString('es-AR') : '—'}
                      sector={o.sector ?? '—'}
                      tipo={o.tipo ?? '—'}
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/dashboard/jefe')} className="w-full py-2.5 rounded-xl border border-cyan-400/20 text-[#8ecbd8] text-xs font-bold tracking-widest uppercase hover:border-cyan-400/40 hover:text-cyan-300 transition-all flex items-center justify-center gap-2">
                Ver todas las OT <IconChevron size={12} />
              </button>
            </div>
          </section>

          {/* ── MAPA + ESTADO GLOBAL ────────────────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Mapa traza */}
            <div
              onClick={() => router.push('/dashboard/mapa')}
              className="rounded-2xl bg-[#071c24]/90 border border-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.07)] p-4 cursor-pointer hover:border-cyan-400/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase">Mapa traza</span>
                  <div className="text-white font-semibold text-sm mt-0.5">BA–LP · TS y CT</div>
                </div>
                <span className="text-[#8ecbd8]"><IconMap size={18} /></span>
              </div>
              {/* Representación visual de la traza */}
              <div className="rounded-xl bg-[#051015] border border-cyan-400/10 h-28 relative overflow-hidden flex items-center px-4">
                {/* línea traza */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-cyan-400/20 via-cyan-400/70 to-cyan-400/20 rounded-full" />
                {/* nodos */}
                {[10, 28, 46, 64, 82].map((pos, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] border-2 border-cyan-300"
                    style={{ left: `${pos}%` }}
                  />
                ))}
                {/* nodo activo */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_14px_rgba(251,191,36,0.9)] border-2 border-yellow-200 flex items-center justify-center"
                  style={{ left: '45%' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                {/* labels extremos */}
                <span className="absolute left-4 bottom-2 text-[#8ecbd8]/50 text-[9px] font-bold tracking-widest">KM 0</span>
                <span className="absolute right-4 bottom-2 text-[#8ecbd8]/50 text-[9px] font-bold tracking-widest">KM 52</span>
              </div>
              <div className="flex items-center justify-end mt-2 gap-1 text-[#8ecbd8] text-xs font-bold tracking-widest uppercase">
                Ver mapa completo <IconChevron size={12} />
              </div>
            </div>

            {/* Estado global */}
            <div className="rounded-2xl bg-[#071c24]/90 border border-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.07)] p-4">
              <span className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase block mb-3">Estado global</span>
              <div className="flex items-center gap-5">
                {/* Círculo CSS */}
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
                    <circle cx="45" cy="45" r="36" fill="none" stroke="#0b2630" strokeWidth="8" />
                    <circle
                      cx="45" cy="45" r="36" fill="none"
                      stroke="#22d3ee" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${226.19 * 0.85} 226.19`}
                      className="drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white font-black text-2xl leading-none">{stats.otsActivas}</span>
                    <span className="text-[#8ecbd8] text-[9px] font-bold tracking-widest uppercase mt-0.5">Total OTs</span>
                  </div>
                </div>
                {/* leyenda */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                    <span className="text-white font-bold text-sm">{stats.otsActivas}</span>
                    <span className="text-[#8ecbd8] text-xs">OTs activas</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />
                    <span className="text-white font-bold text-sm">{stats.cierresPendientes}</span>
                    <span className="text-[#8ecbd8] text-xs">Cierres pend.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                    <span className="text-white font-bold text-sm">{stats.criticas}</span>
                    <span className="text-[#8ecbd8] text-xs">Críticas</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
                    <span className="text-white font-bold text-sm">{stats.tecnicosActivos}</span>
                    <span className="text-[#8ecbd8] text-xs">Técnicos activos</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/jefe')}
                className="w-full mt-3 py-2.5 rounded-xl border border-cyan-400/20 text-[#8ecbd8] text-xs font-bold tracking-widest uppercase hover:border-cyan-400/40 hover:text-cyan-300 transition-all flex items-center justify-center gap-2"
              >
                Ver dashboard completo <IconChevron size={12} />
              </button>
            </div>
          </section>

          {/* ── SISTEMA ─────────────────────────────────────────────────── */}
          <section>
            <span className="text-[#8ecbd8] text-[11px] font-black tracking-[0.22em] uppercase block mb-3">Sistema</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <SystemCard
                label="Usuarios registrados"
                sub="Gestión de accesos"
                icon={<IconUsers size={18} />}
                onClick={() => router.push('/dashboard/superadmin/usuarios')}
              />
              <SystemCard
                label="Mapa traza"
                sub="BA–LP · TS y CT"
                icon={<IconMap size={18} />}
                onClick={() => router.push('/dashboard/mapa')}
              />
              <SystemCard
                label="Historial"
                sub="Registro de actividad"
                icon={<IconHistory size={18} />}
                onClick={() => router.push('/historial')}
              />
              <SystemCard
                label="Base de datos"
                sub="Supabase · meca-aubasa"
                icon={<IconDB size={18} />}
                // Sin ruta — no existe página interna
              />
              <SystemCard
                label="Datos / Métricas"
                sub="Métricas operativas"
                icon={<IconSettings size={18} />}
                // Sin ruta — no existe página interna
              />
              <SystemCard
                label="Check-ins"
                sub="Herramientas y vehículos"
                icon={<IconCheckin size={18} />}
                onClick={() => router.push('/dashboard/checkin/hub')}
              />
            </div>
          </section>

        </div>{/* /px-4 */}
      </div>{/* /max-w-6xl */}

      {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#061418]/95 backdrop-blur-sm border-t border-cyan-400/20 z-50">
        <div className="max-w-6xl mx-auto flex justify-around py-2 px-2">

          {/* Global — activo */}
          <button
            onClick={() => router.push('/dashboard/superadmin')}
            className="flex flex-col items-center gap-0.5 min-w-[44px]"
          >
            <span className="text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]">
              <IconGrid size={20} />
            </span>
            <span className="text-cyan-300 text-[10px] font-bold">Global</span>
          </button>

          {/* Alertas — sin ruta, deshabilitado visualmente */}
          <button disabled className="flex flex-col items-center gap-0.5 min-w-[44px] opacity-30 cursor-not-allowed">
            <span className="text-[#8ecbd8]"><IconBell size={20} /></span>
            <span className="text-[#8ecbd8] text-[10px]">Alertas</span>
          </button>

          {/* Stock — sin ruta, deshabilitado */}
          <button disabled className="flex flex-col items-center gap-0.5 min-w-[44px] opacity-30 cursor-not-allowed">
            <span className="text-[#8ecbd8]"><IconBox size={20} /></span>
            <span className="text-[#8ecbd8] text-[10px]">Stock</span>
          </button>

          {/* Personal — sin ruta, deshabilitado */}
          <button disabled className="flex flex-col items-center gap-0.5 min-w-[44px] opacity-30 cursor-not-allowed">
            <span className="text-[#8ecbd8]"><IconPerson size={20} /></span>
            <span className="text-[#8ecbd8] text-[10px]">Personal</span>
          </button>

          {/* Historial — tiene ruta */}
          <button
            onClick={() => router.push('/historial')}
            className="flex flex-col items-center gap-0.5 min-w-[44px]"
          >
            <span className="text-[#8ecbd8] hover:text-cyan-300 transition-colors"><IconHistory size={20} /></span>
            <span className="text-[#8ecbd8] text-[10px]">Historial</span>
          </button>

          {/* Checkins — tiene ruta */}
          <button
            onClick={() => router.push('/dashboard/checkin/hub')}
            className="flex flex-col items-center gap-0.5 min-w-[44px]"
          >
            <span className="text-[#8ecbd8] hover:text-cyan-300 transition-colors"><IconCheckin size={20} /></span>
            <span className="text-[#8ecbd8] text-[10px]">Checkins</span>
          </button>

        </div>
      </nav>

      {/* ── MODAL NUEVA SUPRA ─────────────────────────────────────────── */}
      {showFormSupra && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowFormSupra(false)}
        >
          <div
            className="w-full sm:max-w-lg bg-[#071c24] border border-cyan-400/25 rounded-t-2xl sm:rounded-2xl p-5 shadow-[0_0_40px_rgba(34,211,238,0.15)] max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-black text-sm tracking-wide uppercase">Nueva OT Supra</span>
              <button
                onClick={() => setShowFormSupra(false)}
                className="text-[#8ecbd8] text-xs px-3 py-1.5 border border-cyan-400/20 rounded-lg hover:border-cyan-400/50 transition-colors"
              >
                CERRAR
              </button>
            </div>

            {/* Mensaje */}
            {msgSupra && (
              <div className={`rounded-xl px-3 py-2 mb-4 text-xs font-semibold border ${
                msgSupra.ok
                  ? 'bg-green-400/10 border-green-400/30 text-green-400'
                  : 'bg-red-400/10 border-red-400/30 text-red-400'
              }`}>
                {msgSupra.ok ? '✅' : '❌'} {msgSupra.text}
              </div>
            )}

            {/* Título */}
            <div className="mb-3">
              <label className="text-[#8ecbd8] text-[11px] font-bold tracking-widest uppercase block mb-1.5">Título *</label>
              <input
                type="text"
                value={formSupra.titulo}
                onChange={e => setFormSupra({ ...formSupra, titulo: e.target.value })}
                placeholder="Título de la OT Supra"
                className="w-full bg-[#051015] border border-cyan-400/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-[#8ecbd8]/40 focus:outline-none focus:border-cyan-400/60 transition-colors"
              />
            </div>

            {/* Descripción */}
            <div className="mb-3">
              <label className="text-[#8ecbd8] text-[11px] font-bold tracking-widest uppercase block mb-1.5">Descripción</label>
              <textarea
                value={formSupra.descripcion}
                onChange={e => setFormSupra({ ...formSupra, descripcion: e.target.value })}
                placeholder="Descripción opcional"
                rows={2}
                className="w-full bg-[#051015] border border-cyan-400/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-[#8ecbd8]/40 focus:outline-none focus:border-cyan-400/60 transition-colors resize-none"
              />
            </div>

            {/* Tipo + Prioridad */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[#8ecbd8] text-[11px] font-bold tracking-widest uppercase block mb-1.5">Tipo</label>
                <select
                  value={formSupra.tipo}
                  onChange={e => setFormSupra({ ...formSupra, tipo: e.target.value })}
                  className="w-full bg-[#051015] border border-cyan-400/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400/60 transition-colors"
                >
                  <option value="correctiva">Correctiva</option>
                  <option value="preventiva">Preventiva</option>
                  <option value="mejora">Mejora</option>
                  <option value="emergencia">Emergencia</option>
                </select>
              </div>
              <div>
                <label className="text-[#8ecbd8] text-[11px] font-bold tracking-widest uppercase block mb-1.5">Prioridad</label>
                <select
                  value={formSupra.prioridad}
                  onChange={e => setFormSupra({ ...formSupra, prioridad: e.target.value })}
                  className="w-full bg-[#051015] border border-cyan-400/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400/60 transition-colors"
                >
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
            </div>

            {/* Plazo */}
            <div className="mb-4">
              <label className="text-[#8ecbd8] text-[11px] font-bold tracking-widest uppercase block mb-1.5">Plazo estimado</label>
              <input
                type="date"
                value={formSupra.plazo_estimado}
                onChange={e => setFormSupra({ ...formSupra, plazo_estimado: e.target.value })}
                className="w-full bg-[#051015] border border-cyan-400/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400/60 transition-colors"
              />
            </div>

            {/* Sectores */}
            <div className="mb-4">
              <label className="text-[#8ecbd8] text-[11px] font-bold tracking-widest uppercase block mb-2">
                Sectores *{formSupra.sectores.length === 0 && <span className="text-red-400 ml-1">(ninguno)</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {SECTORES_SUPRA.map(s => (
                  <button
                    key={s}
                    onClick={() => setFormSupra({ ...formSupra, sectores: toggleItem(formSupra.sectores, s) })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      formSupra.sectores.includes(s)
                        ? 'bg-cyan-400 text-[#062027] border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.35)]'
                        : 'bg-[#051015] text-[#8ecbd8] border-cyan-400/20 hover:border-cyan-400/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Supervisores */}
            <div className="mb-5">
              <label className="text-[#8ecbd8] text-[11px] font-bold tracking-widest uppercase block mb-2">
                Supervisores *{formSupra.supervisores.length === 0 && <span className="text-red-400 ml-1">(ninguno)</span>}
              </label>
              {supervisoresDisponibles.length === 0 ? (
                <div className="text-[#8ecbd8]/50 text-xs py-2">No hay supervisores activos disponibles</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {supervisoresDisponibles.map((sv: any) => (
                    <button
                      key={sv.id}
                      onClick={() => setFormSupra({ ...formSupra, supervisores: toggleItem(formSupra.supervisores, sv.id) })}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        formSupra.supervisores.includes(sv.id)
                          ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/40'
                          : 'bg-[#051015] text-[#8ecbd8] border-cyan-400/15 hover:border-cyan-400/35'
                      }`}
                    >
                      {formSupra.supervisores.includes(sv.id) ? '✓ ' : ''}{sv.apellido}, {sv.nombre}
                      <span className="opacity-60 ml-1">· {sv.rol.replace(/_/g, ' ')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botón crear */}
            <button
              onClick={crearSupra}
              disabled={loadingSupra}
              className={`w-full py-3 rounded-xl font-black text-sm tracking-wide transition-all ${
                loadingSupra
                  ? 'bg-[#0b2630] text-[#8ecbd8] cursor-default'
                  : 'bg-cyan-400 text-[#062027] shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:bg-cyan-300 active:scale-[0.98]'
              }`}
            >
              {loadingSupra ? 'CREANDO...' : 'CREAR OT SUPRA'}
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE SUPRA ─────────────────────────────────────── */}
      {supraDetalle && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSupraDetalle(null)}
        >
          <div
            className="w-full sm:max-w-lg bg-[#071c24] border border-cyan-400/25 rounded-t-2xl sm:rounded-2xl p-5 shadow-[0_0_40px_rgba(34,211,238,0.15)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-black text-sm tracking-wide uppercase">Detalle OT Supra</span>
              <button
                onClick={() => setSupraDetalle(null)}
                className="text-[#8ecbd8] text-xs px-3 py-1.5 border border-cyan-400/20 rounded-lg hover:border-cyan-400/50 transition-colors"
              >CERRAR</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-black text-lg tracking-wide">S-{String(supraDetalle.numero_supra).padStart(4,'0')}</span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  supraDetalle.prioridad === 'critica' ? 'bg-red-500/15 text-red-400 border-red-400/30' :
                  supraDetalle.prioridad === 'alta' ? 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30' :
                  'bg-cyan-400/15 text-cyan-300 border-cyan-400/30'
                }`}>{supraDetalle.prioridad?.toUpperCase()}</span>
              </div>
              <div className="text-white font-semibold text-base">{supraDetalle.titulo}</div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  ['Tipo', supraDetalle.tipo],
                  ['Sector', supraDetalle.ots_supra_sectores?.[0]?.sector ?? '—'],
                  ['Plazo', supraDetalle.plazo_estimado ? new Date(supraDetalle.plazo_estimado).toLocaleDateString('es-AR') : '—'],
                  ['Responsable', supraDetalle.creado_por_perfil ? `${supraDetalle.creado_por_perfil.nombre ?? ''} ${supraDetalle.creado_por_perfil.apellido ?? ''}`.trim() : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2">
                    <div className="text-[#8ecbd8] text-[9px] font-bold tracking-widest uppercase mb-0.5">{k}</div>
                    <div className="text-white text-sm font-semibold capitalize">{v}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2">
                <div className="text-[#8ecbd8] text-[9px] font-bold tracking-widest uppercase mb-0.5">Estado</div>
                <div className={`text-sm font-semibold ${
                  supraDetalle.estado === 'pendiente_planificacion' ? 'text-yellow-400' :
                  supraDetalle.estado?.includes('ejecucion') ? 'text-cyan-300' :
                  'text-green-400'
                }`}>{supraDetalle.estado?.replace(/_/g, ' ') ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE OT ────────────────────────────────────────── */}
      {otDetalle && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOtDetalle(null)}
        >
          <div
            className="w-full sm:max-w-lg bg-[#071c24] border border-cyan-400/25 rounded-t-2xl sm:rounded-2xl p-5 shadow-[0_0_40px_rgba(34,211,238,0.15)] max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-base tracking-wide">OT-{String(otDetalle.numero_orden).padStart(4,'0')}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  otDetalle.sector === 'electrico' ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/25' :
                  otDetalle.sector === 'ac' ? 'bg-blue-400/10 text-blue-300 border-blue-400/25' :
                  'bg-purple-400/10 text-purple-300 border-purple-400/25'
                }`}>{otDetalle.sector}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  otDetalle.estado === 'pendiente' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/25' :
                  otDetalle.estado === 'en_curso' ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/25' :
                  otDetalle.estado === 'cerrada' ? 'bg-green-400/10 text-green-400 border-green-400/25' :
                  'bg-[#8ecbd8]/10 text-[#8ecbd8] border-[#8ecbd8]/20'
                }`}>{otDetalle.estado}</span>
              </div>
              <button onClick={() => setOtDetalle(null)} className="text-[#8ecbd8] text-xs px-3 py-1.5 border border-cyan-400/20 rounded-lg hover:border-cyan-400/50 transition-colors">
                CERRAR
              </button>
            </div>

            {loadingDetalle ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">

                {/* Título y descripción */}
                <div>
                  <div className="text-white font-bold text-sm leading-snug mb-1">{otDetalle.titulo}</div>
                  {otDetalle.descripcion && (
                    <div className="text-[#8ecbd8] text-xs leading-relaxed">{otDetalle.descripcion}</div>
                  )}
                </div>

                {/* Ubicación */}
                {(otDetalle.km || otDetalle.ubicacion || otDetalle.nomenclatura) && (
                  <div>
                    <div className="text-[#8ecbd8] text-[10px] font-black tracking-[0.2em] uppercase mb-2">Ubicación</div>
                    <div className="grid grid-cols-3 gap-2">
                      {otDetalle.km && (
                        <div className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2">
                          <div className="text-[#8ecbd8] text-[9px] font-bold tracking-widest uppercase mb-0.5">KM</div>
                          <div className="text-white text-sm font-semibold">{otDetalle.km}</div>
                        </div>
                      )}
                      {otDetalle.ubicacion && (
                        <div className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2">
                          <div className="text-[#8ecbd8] text-[9px] font-bold tracking-widest uppercase mb-0.5">Ubicación</div>
                          <div className="text-white text-sm font-semibold">{otDetalle.ubicacion}</div>
                        </div>
                      )}
                      {otDetalle.nomenclatura && (
                        <div className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2">
                          <div className="text-[#8ecbd8] text-[9px] font-bold tracking-widest uppercase mb-0.5">Nomenclatura</div>
                          <div className="text-white text-sm font-semibold">{otDetalle.nomenclatura}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Asignación */}
                <div>
                  <div className="text-[#8ecbd8] text-[10px] font-black tracking-[0.2em] uppercase mb-2">Asignación</div>
                  <div className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
                    {otDetalle.creado_por_perfil && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#8ecbd8] w-16 shrink-0">Creó</span>
                        <span className="text-white font-semibold">{otDetalle.creado_por_perfil.nombre} {otDetalle.creado_por_perfil.apellido}</span>
                      </div>
                    )}
                    {otDetalle.orden_tecnicos?.length > 0 ? (
                      otDetalle.orden_tecnicos.map((t: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-[#8ecbd8] w-16 shrink-0">{i === 0 ? 'Técnico' : 'Adicional'}</span>
                          <span className="text-white font-semibold">{t.tecnico_perfil?.nombre} {t.tecnico_perfil?.apellido}</span>
                        </div>
                      ))
                    ) : otDetalle.asignado_a_perfil ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#8ecbd8] w-16 shrink-0">Técnico</span>
                        <span className="text-white font-semibold">{otDetalle.asignado_a_perfil.nombre} {otDetalle.asignado_a_perfil.apellido}</span>
                      </div>
                    ) : (
                      <div className="text-[#8ecbd8]/50 text-xs">Sin técnico asignado</div>
                    )}
                  </div>
                </div>

                {/* Planificación */}
                <div>
                  <div className="text-[#8ecbd8] text-[10px] font-black tracking-[0.2em] uppercase mb-2">Planificación</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2">
                      <div className="text-[#8ecbd8] text-[9px] font-bold tracking-widest uppercase mb-0.5">Prioridad</div>
                      <div className={`text-sm font-semibold ${otDetalle.prioridad === 'critica' ? 'text-red-400' : otDetalle.prioridad === 'alta' ? 'text-yellow-400' : 'text-[#8ecbd8]'}`}>
                        {otDetalle.prioridad ?? '—'}
                      </div>
                    </div>
                    <div className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2">
                      <div className="text-[#8ecbd8] text-[9px] font-bold tracking-widest uppercase mb-0.5">Programada</div>
                      <div className="text-white text-sm font-semibold">
                        {otDetalle.fecha_programada ? new Date(otDetalle.fecha_programada).toLocaleDateString('es-AR') : '—'}
                      </div>
                    </div>
                    <div className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2">
                      <div className="text-[#8ecbd8] text-[9px] font-bold tracking-widest uppercase mb-0.5">Creada</div>
                      <div className="text-white text-sm font-semibold">
                        {otDetalle.created_at ? new Date(otDetalle.created_at).toLocaleDateString('es-AR') : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trabajo */}
                {(otDetalle.campo_libre) && (
                  <div>
                    <div className="text-[#8ecbd8] text-[10px] font-black tracking-[0.2em] uppercase mb-2">Trabajo</div>
                    <div className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2.5">
                      <div className="text-[#8ecbd8] text-[9px] font-bold tracking-widest uppercase mb-1">Campo libre</div>
                      <div className="text-white text-xs leading-relaxed">{otDetalle.campo_libre}</div>
                    </div>
                  </div>
                )}

                {/* Materiales */}
                <div>
                  <div className="text-[#8ecbd8] text-[10px] font-black tracking-[0.2em] uppercase mb-2">Materiales</div>
                  {!otDetalle.orden_materiales?.length ? (
                    <div className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2.5 text-[#8ecbd8]/50 text-xs">Sin materiales cargados</div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {otDetalle.orden_materiales.map((om: any, i: number) => (
                        <div key={i} className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-white text-xs font-semibold">{om.materiales?.nombre}</div>
                            <div className="text-[#8ecbd8] text-[10px]">{om.cantidad} {om.materiales?.unidad}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            om.estado === 'entregado' ? 'bg-green-400/10 text-green-400 border-green-400/25' :
                            om.estado === 'preparado' ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/25' :
                            'bg-yellow-400/10 text-yellow-400 border-yellow-400/25'
                          }`}>{om.estado}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seguimiento */}
                {(otDetalle.trabajos_realizados || otDetalle.observaciones || otDetalle.pendientes_descripcion) && (
                  <div>
                    <div className="text-[#8ecbd8] text-[10px] font-black tracking-[0.2em] uppercase mb-2">Seguimiento</div>
                    <div className="flex flex-col gap-2">
                      {otDetalle.trabajos_realizados && (
                        <div className="bg-[#051015] border border-cyan-400/15 rounded-xl px-3 py-2.5">
                          <div className="text-[#8ecbd8] text-[9px] font-bold tracking-widest uppercase mb-1">Trabajos realizados</div>
                          <div className="text-white text-xs leading-relaxed">{otDetalle.trabajos_realizados}</div>
                        </div>
                      )}
                      {otDetalle.observaciones && (
                        <div className="bg-[#051015] border border-yellow-400/15 rounded-xl px-3 py-2.5">
                          <div className="text-yellow-400 text-[9px] font-bold tracking-widest uppercase mb-1">Observaciones</div>
                          <div className="text-white text-xs leading-relaxed">{otDetalle.observaciones}</div>
                        </div>
                      )}
                      {otDetalle.pendientes_descripcion && (
                        <div className="bg-[#051015] border border-red-400/15 rounded-xl px-3 py-2.5">
                          <div className="text-red-400 text-[9px] font-bold tracking-widest uppercase mb-1">Pendientes</div>
                          <div className="text-white text-xs leading-relaxed">{otDetalle.pendientes_descripcion}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
