'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function Registro() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleRegistro() {
    if (!email || !password || !confirmar) {
      setError('Completá todos los campos')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError('Error al registrarse. Verificá los datos.')
      setLoading(false)
      return
    }
    setLoading(false)
    router.push('/perfil/completar')
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-6">
        <Image
          src="/sector-logo-dark.png"
          alt="MECA"
          width={160}
          height={160}
          className="mb-4"
        />
        <Image
          src="/width_712.png"
          alt="AUBASA"
          width={140}
          height={40}
          className="mb-2"
        />
        <div className="text-[#7ADCE8] text-xs tracking-widest text-center uppercase">
          Registrarse · Sistema MECA
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="text-[#0F3A42] font-bold text-sm mb-4">Crear cuenta</div>

        <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1 font-semibold">Email personal</div>
        <input
          className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
          placeholder="tu@gmail.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />

        <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1 font-semibold">Contraseña</div>
        <div className="relative mb-3">
          <input
            type={showPass ? 'text' : 'password'}
            autoComplete="new-password"
            className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none pr-10"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-[#7A9EA5]">
            {showPass ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>

        <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1 font-semibold">Confirmar contraseña</div>
        <input
          type="password"
          autoComplete="new-password"
          className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-4 outline-none"
          placeholder="Repetí la contraseña"
          value={confirmar}
          onChange={e => setConfirmar(e.target.value)}
        />

        {error && <div className="text-[#A32D2D] text-xs mb-3">{error}</div>}

        <button
          onClick={handleRegistro}
          disabled={loading}
          className="w-full bg-[#1ABBD6] text-white font-bold text-base tracking-widest rounded-lg py-3 hover:bg-[#0F8FAA] transition-colors disabled:opacity-50 mb-2"
        >
          {loading ? 'REGISTRANDO...' : 'CREAR CUENTA'}
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full border border-[#B2E0E8] text-[#0F3A42] font-bold text-sm tracking-widest rounded-lg py-3 hover:bg-[#F0FAFB] transition-colors"
        >
          YA TENGO CUENTA
        </button>
      </div>

      <div className="text-gray-600 text-xs mt-6 text-center">
        Tu cuenta quedará pendiente de aprobación
      </div>
    </main>
  )
}