'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'

interface Instructivo {
  id: string
  codigo: string
  titulo: string
  contenido: string
  modulo: string
}

function getDashboard(rol: string): string {
  const rutas: Record<string, string> = {
    superadmin: '/dashboard/superadmin',
    gerente: '/dashboard/gerente',
    subgerente: '/dashboard/Sub-gerente',
    jefe: '/dashboard/jefe',
    delegado: '/dashboard/delegado',
    supervisor_electrico: '/dashboard/supervisor-electrico',
    supervisor_ac: '/dashboard/supervisor-ac',
    tecnico_electrico: '/dashboard/tecnico-electrico',
    tecnico_ac: '/dashboard/tecnico-ac',
    tecnico_electrico_edificio: '/dashboard/tecnico-electrico-edificios',
    tallerista_electrico: '/dashboard/tallerista-electrico',
    tallerista_ac: '/dashboard/tallerista-aire-acondicionado',
    panolero: '/dashboard/panolero',
    administrativo_rrhh: '/dashboard/administrativo-rrhh',
    administrativo_compras_pms: '/dashboard/administrativo-compras-pms',
  }
  return rutas[rol] || '/perfil/completar'
}

const moduloLabel: Record<string, string> = {
  seguridad: 'Seguridad',
  electrico: 'Eléctrico',
  ac: 'Aire Acondicionado',
  flota: 'Flota y Movilidad',
}

const moduloColor: Record<string, string> = {
  seguridad: '#A32D2D',
  electrico: '#1ABBD6',
  ac: '#0F8FAA',
  flota: '#0F3A42',
}

export default function Instructivos() {
  const router = useRouter()
  const [instructivos, setInstructivos] = useState<Instructivo[]>([])
  const [aceptados, setAceptados] = useState<Set<string>>(new Set())
  const [actual, setActual] = useState(0)
  const [userId, setUserId] = useState('')
  const [rol, setRol] = useState('')
  const [loading, setLoading] = useState(true)
  const [aceptando, setAceptando] = useState(false)
  const [leido, setLeido] = useState(false)

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const perfil = await getPerfil()
      if (!perfil || !perfil.nombre) { router.push('/perfil/completar'); return }

      setUserId(user.id)
      setRol(perfil.rol)

      // Traer instructivos del rol
      const { data: todos } = await supabase
        .from('instructivos')
        .select('id, codigo, titulo, contenido, modulo')
        .contains('roles_requeridos', [perfil.rol])
        .eq('activo', true)
        .order('modulo')
        .order('codigo')

      if (!todos || todos.length === 0) {
        router.push(getDashboard(perfil.rol))
        return
      }

      // Traer aceptaciones existentes
      const { data: yaAceptados } = await supabase
        .from('instructivos_aceptados')
        .select('instructivo_id')
        .eq('usuario_id', user.id)

      const setAcept = new Set((yaAceptados || []).map((a: any) => a.instructivo_id))

      // Filtrar solo pendientes
      const pendientes = todos.filter((i: Instructivo) => !setAcept.has(i.id))

      if (pendientes.length === 0) {
        router.push(getDashboard(perfil.rol))
        return
      }

      setInstructivos(pendientes)
      setAceptados(setAcept)
      setLoading(false)
    }
    cargar()
  }, [])

  // Resetear leido al cambiar de instructivo
  useEffect(() => {
    setLeido(false)
    const el = document.getElementById('contenido-instructivo')
    if (el) {
      el.scrollTop = 0
      setTimeout(() => {
        if (el.scrollHeight <= el.clientHeight + 10) setLeido(true)
      }, 100)
    }
  }, [actual])

  async function handleAceptar() {
    if (!leido) return
    setAceptando(true)
    const instructivo = instructivos[actual]

    await supabase.from('instructivos_aceptados').insert({
      usuario_id: userId,
      instructivo_id: instructivo.id,
    })

    if (actual + 1 >= instructivos.length) {
      router.push(getDashboard(rol))
    } else {
      setActual(actual + 1)
    }
    setAceptando(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0F3A42] flex items-center justify-center">
        <div className="text-[#1ABBD6] text-sm tracking-widest">CARGANDO...</div>
      </main>
    )
  }

  const instructivo = instructivos[actual]
  const progreso = Math.round((actual / instructivos.length) * 100)

  return (
    <main className="min-h-screen bg-[#0F3A42] flex flex-col items-center justify-start px-4 py-8">

      {/* Header */}
      <div className="w-full max-w-xl mb-6">
        <div className="text-[#7ADCE8] text-xs tracking-widest uppercase mb-1">
          MECA · Instructivos obligatorios
        </div>
        <div className="text-white text-lg font-bold mb-3">
          Antes de ingresar al sistema debés leer y aceptar los instructivos correspondientes a tu rol.
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-[#0a2830] rounded-full h-2 mb-1">
          <div
            className="bg-[#1ABBD6] h-2 rounded-full transition-all duration-500"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="text-[#7ADCE8] text-xs text-right">
          {actual} de {instructivos.length} aceptados
        </div>
      </div>

      {/* Card instructivo */}
      <div className="w-full max-w-xl bg-white rounded-2xl overflow-hidden shadow-xl">

        {/* Módulo badge */}
        <div
          className="px-5 py-2 flex items-center gap-2"
          style={{ backgroundColor: moduloColor[instructivo.modulo] }}
        >
          <span className="text-white text-xs font-bold tracking-widest uppercase">
            {moduloLabel[instructivo.modulo]}
          </span>
          <span className="text-white/70 text-xs ml-auto">
            {instructivo.codigo}
          </span>
        </div>

        {/* Título */}
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-[#0F3A42] font-bold text-lg leading-tight">
            {instructivo.titulo}
          </h2>
        </div>

        {/* Contenido scrolleable */}
        <div
          id="contenido-instructivo"
          className="px-5 pb-4 overflow-y-auto text-sm text-[#0F3A42] leading-relaxed"
          style={{ maxHeight: '60vh' }}
          onScroll={(e) => {
            const el = e.currentTarget
            const llegóAlFinal = el.scrollHeight - el.scrollTop <= el.clientHeight + 40
            if (llegóAlFinal) setLeido(true)
          }}
        >
          {instructivo.contenido
  .split('\\n')
  .join('\n')
  .split('\n')
  .map((linea, i) => (
    <span key={i}>{linea}<br /></span>
  ))}
          {!leido && (
            <div className="text-[#7A9EA5] text-xs mt-4 italic">
              ↓ Scrolleá hasta el final para habilitar la aceptación
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#B2E0E8] bg-[#F0FAFB]">
          {!leido ? (
            <div className="text-center text-[#7A9EA5] text-sm">
              Leé el instructivo completo para continuar
            </div>
          ) : (
            <button
              onClick={handleAceptar}
              disabled={aceptando}
              className="w-full bg-[#1ABBD6] text-white font-bold text-sm tracking-widest rounded-lg py-3 hover:bg-[#0F8FAA] transition-colors disabled:opacity-50"
            >
              {aceptando ? 'REGISTRANDO...' : actual + 1 < instructivos.length
                ? `ACEPTO — VER SIGUIENTE (${actual + 1} de ${instructivos.length})`
                : 'ACEPTO — INGRESAR AL SISTEMA'}
            </button>
          )}
        </div>
      </div>

      {/* Lista de pendientes */}
      <div className="w-full max-w-xl mt-6">
        <div className="text-[#7ADCE8] text-xs tracking-widest uppercase mb-2">
          Pendientes
        </div>
        <div className="flex flex-col gap-1">
          {instructivos.map((inst, idx) => (
            <div
              key={inst.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                idx === actual
                  ? 'bg-[#1ABBD6] text-white font-bold'
                  : idx < actual
                  ? 'bg-[#0a2830] text-[#7ADCE8] line-through'
                  : 'bg-[#0a2830] text-[#7ADCE8]'
              }`}
            >
              <span className="font-mono">{inst.codigo}</span>
              <span>{inst.titulo}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}