'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  perfil: any
  onUpdatePerfil: (updates: { avatar_url: string; avatar_updated_at: string }) => void
}

export default function AvatarUpload({ perfil, onUpdatePerfil }: Props) {
  const [subiendo, setSubiendo] = useState(false)

  function puedeActualizar(): boolean {
    if (!perfil.avatar_updated_at) return true
    const ultima = new Date(perfil.avatar_updated_at)
    const diff = (Date.now() - ultima.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 30
  }

  function fechaHabilitada(): string {
    if (!perfil.avatar_updated_at) return ''
    const ultima = new Date(perfil.avatar_updated_at)
    const habilitada = new Date(ultima.getTime() + 30 * 24 * 60 * 60 * 1000)
    return habilitada.toLocaleDateString('es-AR')
  }

  async function handleFile(file: File) {
    setSubiendo(true)
    const path = `${perfil.id}/avatar.jpg`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?v=${Date.now()}`
      const ahora = new Date().toISOString()
      await supabase.from('profiles')
        .update({ avatar_url: url, avatar_updated_at: ahora })
        .eq('id', perfil.id)
      onUpdatePerfil({ avatar_url: url, avatar_updated_at: ahora })
    }
    setSubiendo(false)
  }

  const puede = puedeActualizar()

  return (
    <label style={{ cursor: puede ? 'pointer' : 'default' }}>
      {puede && (
        <input type="file" accept="image/*" capture="user" style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      )}
      <div
        style={{
          width: 36, height: 36, borderRadius: '50%', background: '#1a3040',
          border: `1.5px solid ${subiendo ? '#EF9F27' : '#1ABBD6'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: '#1ABBD6', overflow: 'hidden'
        }}
        onClick={!puede ? () => alert(`Podés cambiar tu foto de perfil el ${fechaHabilitada()}`) : undefined}
      >
        {perfil.avatar_url
          ? <img src={perfil.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : subiendo ? '...' : `${perfil.nombre?.[0]}${perfil.apellido?.[0]}`}
      </div>
    </label>
  )
}