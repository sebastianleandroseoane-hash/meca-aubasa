'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  ordenId: string
  ordenEstado: string
  activoId?: string | null
  autorId: string
  autorRol: string
}

const CONTEXTOS = [
  { value: 'antes_intervencion', label: 'Antes de intervención' },
  { value: 'durante_intervencion', label: 'Durante intervención' },
  { value: 'despues_intervencion', label: 'Después de intervención' },
]

const ESTADOS_PERMITE_SUBIR = ['pendiente', 'en_curso', 'cierre_propuesto', 'devuelta_supervisor', 'derivada']
const ROLES_SOLO_LECTURA = ['jefe', 'superadmin']
const MAX_FOTOS = 10

const CONTEXTO_LABEL: Record<string, string> = {
  antes_intervencion: 'Antes',
  durante_intervencion: 'Durante',
  despues_intervencion: 'Después',
}

type FotoConUrl = {
  id: string
  storage_path: string
  nombre_archivo: string | null
  contexto: string
  descripcion: string | null
  tomada_por: string | null
  created_at: string
  autor: { nombre: string; apellido: string; rol: string } | null
  signedUrl: string | null
}

export default function FotosOT({ ordenId, ordenEstado, activoId, autorId, autorRol }: Props) {
  const [fotos, setFotos] = useState<FotoConUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [fotoAmpliada, setFotoAmpliada] = useState<FotoConUrl | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [contexto, setContexto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [errorSubida, setErrorSubida] = useState<string | null>(null)
  const [borrando, setBorrando] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const soloLectura = ROLES_SOLO_LECTURA.includes(autorRol)
  const puedeSubir = !soloLectura && ESTADOS_PERMITE_SUBIR.includes(ordenEstado) && fotos.length < MAX_FOTOS

  useEffect(() => {
    if (!ordenId) return
    cargarFotos()
  }, [ordenId])

  async function cargarFotos() {
    setLoading(true)
    setErrorCarga(false)
    const { data, error } = await supabase
      .from('fotos')
      .select('id, storage_path, nombre_archivo, contexto, descripcion, tomada_por, created_at, autor:profiles!fotos_tomada_por_fkey(nombre, apellido, rol)')
      .eq('ot_id', ordenId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
    setLoading(false)
    if (error) { setErrorCarga(true); return }
    const conUrls = await Promise.all((data || []).map(async (f: any) => {
      const { data: signed } = await supabase.storage.from('ot-fotos').createSignedUrl(f.storage_path, 3600)
      const autor = Array.isArray(f.autor) ? (f.autor[0] || null) : (f.autor || null)
      return { ...f, autor, signedUrl: signed?.signedUrl || null }
    }))
    setFotos(conUrls)
  }

  async function subirFoto(file: File) {
    if (!contexto) { setErrorSubida('Seleccioná el contexto antes de subir.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorSubida('Solo se permiten imágenes JPG, PNG o WEBP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorSubida('El archivo no puede superar 10 MB.')
      return
    }
    setSubiendo(true)
    setErrorSubida(null)
    const ext = file.name.split('.').pop()
    const uuid = crypto.randomUUID()
    const path = `${ordenId}/${uuid}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('ot-fotos')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) {
      setSubiendo(false)
      setErrorSubida('Error al subir la imagen. Intentá de nuevo.')
      return
    }
    const { data: inserted, error: insertError } = await supabase
      .from('fotos')
      .insert({
        ot_id: ordenId,
        activo_id: activoId || null,
        tomada_por: autorId,
        storage_path: path,
        nombre_archivo: file.name,
        mime_type: file.type,
        tamanio_bytes: file.size,
        contexto,
        descripcion: descripcion.trim() || null,
      })
      .select('id, storage_path, nombre_archivo, contexto, descripcion, tomada_por, created_at, autor:profiles!fotos_tomada_por_fkey(nombre, apellido, rol)')
      .single()
    setSubiendo(false)
    if (insertError) {
      await supabase.storage.from('ot-fotos').remove([path])
      setErrorSubida('Error al registrar la foto. Intentá de nuevo.')
      return
    }
    const { data: signed } = await supabase.storage.from('ot-fotos').createSignedUrl(path, 3600)
    const autorInserted = Array.isArray(inserted.autor) ? (inserted.autor[0] || null) : (inserted.autor || null)
    setFotos(prev => [...prev, { ...inserted, autor: autorInserted, signedUrl: signed?.signedUrl || null }])
    setContexto('')
    setDescripcion('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function borrarFoto(foto: FotoConUrl) {
    if (!confirm('¿Confirmás borrar esta foto?\n\nEsta acción no puede deshacerse.')) return
    setBorrando(foto.id)
    const { error } = await supabase
      .from('fotos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', foto.id)
    setBorrando(null)
    if (error) { alert('Error al borrar la foto. Intentá de nuevo.'); return }
    setFotos(prev => prev.filter(f => f.id !== foto.id))
    if (fotoAmpliada?.id === foto.id) setFotoAmpliada(null)
  }

  function puedeBorrar(foto: FotoConUrl) {
    if (['cerrada', 'eliminada'].includes(ordenEstado)) return false
    if (soloLectura) return false
    return foto.tomada_por === autorId ||
      ['supervisor_electrico', 'supervisor_ac'].includes(autorRol)
  }

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid #1a3040', paddingTop: 14 }}>
      <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        📷 Fotos de trabajo · {fotos.length}/{MAX_FOTOS}
      </div>

      {/* Galería */}
      {loading ? (
        <div style={{ fontSize: 11, color: '#4a8fa0', textAlign: 'center', padding: '10px 0' }}>Cargando...</div>
      ) : errorCarga ? (
        <div style={{ fontSize: 11, color: '#E24B4A', textAlign: 'center', padding: '10px 0', border: '1px dashed #E24B4A44', borderRadius: 8, marginBottom: 10 }}>
          Error al cargar fotos.{' '}
          <button onClick={cargarFotos} style={{ background: 'none', border: 'none', color: '#1ABBD6', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Reintentar</button>
        </div>
      ) : fotos.length === 0 ? (
        <div style={{ fontSize: 11, color: '#4a8fa0', textAlign: 'center', padding: '12px 0', border: '1px dashed #1a3040', borderRadius: 8, marginBottom: 10 }}>
          Sin fotos todavía
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
          {fotos.map(f => (
            <div key={f.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #1a3040', background: '#07131a', aspectRatio: '1' }}>
              {f.signedUrl ? (
                <img
                  src={f.signedUrl}
                  alt={f.nombre_archivo || 'foto'}
                  onClick={() => setFotoAmpliada(f)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a8fa0', fontSize: 10 }}>Sin URL</div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(7,19,26,0.85)', padding: '3px 5px', fontSize: 9, color: '#8ecbd8' }}>
                {CONTEXTO_LABEL[f.contexto] || f.contexto}
              </div>
              {puedeBorrar(f) && (
                <button
                  onClick={() => borrarFoto(f)}
                  disabled={borrando === f.id}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(226,75,74,0.9)', border: 'none', borderRadius: 4, color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 5px', cursor: 'pointer' }}>
                  {borrando === f.id ? '...' : '✕'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Límite alcanzado */}
      {!puedeSubir && !soloLectura && fotos.length >= MAX_FOTOS && ESTADOS_PERMITE_SUBIR.includes(ordenEstado) && (
        <div style={{ fontSize: 11, color: '#EF9F27', textAlign: 'center', padding: '8px 0', marginBottom: 8 }}>
          Límite de {MAX_FOTOS} fotos alcanzado
        </div>
      )}

      {/* Formulario de subida */}
      {puedeSubir && (
        <div style={{ background: '#07131a', border: '1px solid #1a3040', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Subir foto</div>
          <select
            value={contexto}
            onChange={e => setContexto(e.target.value)}
            style={{ width: '100%', background: '#07131a', border: `1px solid ${contexto ? '#1ABBD6' : '#1a3040'}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, color: contexto ? '#e8f4f8' : '#4a8fa0', outline: 'none', marginBottom: 8, boxSizing: 'border-box' as const }}>
            <option value=''>— Seleccioná contexto *</option>
            {CONTEXTOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Descripción opcional (ej: tablero antes de abrir)"
            style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#e8f4f8', outline: 'none', marginBottom: 8, boxSizing: 'border-box' as const }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) subirFoto(f) }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!contexto || subiendo}
            style={{ width: '100%', background: !contexto || subiendo ? '#1a3040' : '#1ABBD6', border: 'none', borderRadius: 8, color: !contexto || subiendo ? '#4a8fa0' : 'white', fontWeight: 700, fontSize: 12, padding: '10px 0', cursor: !contexto || subiendo ? 'default' : 'pointer' }}>
            {subiendo ? 'Subiendo...' : '📷 SELECCIONAR FOTO'}
          </button>
          {errorSubida && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 6 }}>{errorSubida}</div>}
        </div>
      )}

      {/* Modal foto ampliada */}
      {fotoAmpliada && (
        <div
          onClick={() => setFotoAmpliada(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.93)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '100%' }}>
            <img
              src={fotoAmpliada.signedUrl || ''}
              alt={fotoAmpliada.nombre_archivo || 'foto'}
              style={{ width: '100%', borderRadius: 10, display: 'block', maxHeight: '65vh', objectFit: 'contain' }}
            />
            <div style={{ marginTop: 10, background: '#0c1c24', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1ABBD6', marginBottom: 2 }}>
                {CONTEXTOS.find(c => c.value === fotoAmpliada.contexto)?.label}
              </div>
              {fotoAmpliada.descripcion && (
                <div style={{ fontSize: 12, color: '#e8f4f8', marginBottom: 4 }}>{fotoAmpliada.descripcion}</div>
              )}
              <div style={{ fontSize: 10, color: '#4a8fa0' }}>
                {fotoAmpliada.autor
                  ? `${fotoAmpliada.autor.apellido || 'Usuario'}${fotoAmpliada.autor.nombre ? `, ${fotoAmpliada.autor.nombre}` : ''}`
                  : 'Usuario'
                } · {new Date(fotoAmpliada.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button
              onClick={() => setFotoAmpliada(null)}
              style={{ width: '100%', marginTop: 10, background: 'none', border: '1px solid #1a3040', borderRadius: 8, color: '#4a8fa0', fontWeight: 700, fontSize: 13, padding: '10px 0', cursor: 'pointer' }}>
              CERRAR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}