'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'
import Image from 'next/image'

function getDashboard(rol: string): string {
  const rutas: Record<string, string> = {
    superadmin: '/dashboard/superadmin',
    gerente: '/dashboard/gerente',
    subgerente: '/dashboard/Sub-gerente',
    jefe: '/dashboard/jefe',
    delegado: '/dashboard/delegado-gremial',
    supervisor_electrico: '/dashboard/supervisor-electrico',
    supervisor_ac: '/dashboard/supervisor-aire-acondicionado',
    tecnico_electrico: '/dashboard/tecnico-electrico',
    tecnico_ac:'/dashboard/tecnico-aire-acondicionado' ,
    tecnico_electrico_edificio: '/dashboard/tecnico-electrico-edificios',
    tallerista_electrico: '/dashboard/tallerista-electrico',
    tallerista_ac: '/dashboard/tallerista-aire-acondicionado',
    panolero: '/dashboard/panolero',
    administrativo_rrhh: '/dashboard/administrativo-rrhh',
    administrativo_compras_pms: '/dashboard/administrativo-compras-pms',
  }
  return rutas[rol] || '/perfil/completar'
}

async function tieneInstructivosPendientes(userId: string, rol: string): Promise<boolean> {
  // Instructivos que corresponden a este rol
  const { data: instructivos } = await supabase
    .from('instructivos')
    .select('id')
    .contains('roles_requeridos', [rol])
    .eq('activo', true)

  if (!instructivos || instructivos.length === 0) return false

  // Aceptaciones del usuario
  const { data: aceptados } = await supabase
    .from('instructivos_aceptados')
    .select('instructivo_id')
    .eq('usuario_id', userId)

  const aceptadosIds = new Set((aceptados || []).map((a: any) => a.instructivo_id))
  const pendientes = instructivos.filter((i: any) => !aceptadosIds.has(i.id))

  return pendientes.length > 0
}

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
      return
    }

    const perfil = await getPerfil()
    if (!perfil || !perfil.nombre) {
      router.push('/perfil/completar')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Error al obtener usuario')
      setLoading(false)
      return
    }

    const pendientes = await tieneInstructivosPendientes(user.id, perfil.rol)
    if (pendientes) {
      router.push('/instructivos')
      return
    }

    router.push(getDashboard(perfil.rol))
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-6">
        <Image
          src="/sector-logo-dark.png"
          alt="Mantenimiento Eléctrico y Aire Acondicionado"
          width={220}
          height={220}
          className="mb-4"
        />
        <Image
          src="/width_712.png"
          alt="AUBASA"
          width={160}
          height={45}
          className="mb-2"
        />
        <div className="text-[#7ADCE8] text-xs tracking-widest text-center uppercase">
          Mantenimiento Eléctrico · Aire Acondicionado
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1 font-semibold">Usuario</div>
        <input
          className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-4 outline-none"
          placeholder="usuario@gmail.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1 font-semibold">Contraseña</div>
        <input
          type="password"
          className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-4 outline-none"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className="text-[#A32D2D] text-xs mb-3">{error}</div>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#1ABBD6] text-white font-bold text-base tracking-widest rounded-lg py-3 hover:bg-[#0F8FAA] transition-colors disabled:opacity-50"
        >
          {loading ? 'INGRESANDO...' : 'INGRESAR'}
        </button>
        <button
          onClick={() => router.push('/registro')}
          className="w-full border border-[#B2E0E8] text-[#0F3A42] font-bold text-sm tracking-widest rounded-lg py-3 mt-2 hover:bg-[#F0FAFB] transition-colors"
        >
          REGISTRARSE
        </button>
      </div>

      <div className="text-gray-600 text-xs mt-6 text-center">
        Sistema interno · Solo personal autorizado
      </div>
    </main>
  )
}