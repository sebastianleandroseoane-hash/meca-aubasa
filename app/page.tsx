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
  const [showPassword, setShowPassword] = useState(false)

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
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <video
        id="bg-video"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="https://jytsmgxwlzexijskqakt.supabase.co/storage/v1/object/public/media/WhatsApp%20Video%202026-06-06%20at%2020.48.32.mp4"
      />
      <button
        onClick={() => {
          const v = document.getElementById('bg-video') as HTMLVideoElement
          v.muted = !v.muted
          const btn = document.getElementById('mute-btn')
          if (btn) btn.textContent = v.muted ? '🔇' : '🔊'
        }}
        id="mute-btn"
        className="absolute top-4 right-4 z-20 bg-black/50 text-white text-xl rounded-full w-10 h-10 flex items-center justify-center"
      >
        🔇
      </button>
      <div className="relative z-10 w-full flex flex-col items-center">
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
        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none pr-10"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A9EA5]"
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
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
    </div>
    </main>
  )
}