'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
    <main className="min-h-screen bg-[#0F3A42] flex flex-col items-center justify-center px-6">

      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#1ABBD6] flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
          </svg>
        </div>
        <div className="text-[#1ABBD6] font-bold text-2xl tracking-widest">AUBASA</div>
        <div className="text-[#7ADCE8] text-sm tracking-widest text-center mt-1">
          MECA · Mantenimiento Eléctrico<br/>y Aire Acondicionado
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

      <div className="text-[#7ADCE8] text-xs mt-6 text-center">
        Sistema interno · Solo personal autorizado
      </div>

    </main>
  )
}