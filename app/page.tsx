'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
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
          placeholder="usuario@aubasa.com"
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
      </div>

      <div className="text-gray-600 text-xs mt-6 text-center">
        Sistema interno · Solo personal autorizado
      </div>

    </main>
  )
}