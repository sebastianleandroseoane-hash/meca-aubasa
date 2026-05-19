'use client'

import { useRouter } from 'next/navigation'

export default function SinAcceso() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-[#F0FAFB] flex flex-col items-center justify-center px-6">
      <div className="text-5xl mb-4">🚧</div>
      <div className="text-[#0F3A42] font-bold text-lg mb-2 text-center">Función no disponible</div>
      <div className="text-[#7A9EA5] text-sm text-center mb-6">Esta sección todavía no está habilitada para tu rol.</div>
      <button onClick={() => router.back()}
        className="bg-[#1ABBD6] text-white font-bold text-sm px-6 py-3 rounded-xl w-full max-w-xs">
        VOLVER
      </button>
    </div>
  )
}