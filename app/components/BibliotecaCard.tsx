'use client'

import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'

interface Props {
  C: {
    card: string
    border: string
    text: string
    sub: string
    accent: string
    [key: string]: string
  }
  style?: CSSProperties
}

export default function BibliotecaCard({ C, style }: Props) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push('/biblioteca')}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '14px 12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        ...style,
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Biblioteca</div>
        <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>Manual · Convenio</div>
      </div>
    </div>
  )
}