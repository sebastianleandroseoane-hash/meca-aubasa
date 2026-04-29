'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Perfil() {
  const router = useRouter()

  useEffect(() => {
    router.push('/perfil/completar')
  }, [])

  return <div className="min-h-screen bg-[#F0FAFB]"></div>
}