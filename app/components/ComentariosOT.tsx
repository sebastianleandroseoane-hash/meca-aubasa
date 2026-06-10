'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  ordenId: string
  autorId: string
  autorRol: string
}

const ROLES_LABEL: Record<string, string> = {
  tecnico_electrico: 'Técnico',
  tecnico_ac: 'Técnico AC',
  supervisor_electrico: 'Supervisor',
  supervisor_ac: 'Supervisor AC',
  jefe: 'Jefe',
  superadmin: 'Superadmin',
}

const ROLES_COLOR: Record<string, string> = {
  tecnico_electrico: '#1ABBD6',
  tecnico_ac: '#1ABBD6',
  supervisor_electrico: '#EF9F27',
  supervisor_ac: '#EF9F27',
  jefe: '#1D9E75',
  superadmin: '#a78bfa',
}

export default function ComentariosOT({ ordenId, autorId, autorRol }: Props) {
  const [comentarios, setComentarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!ordenId) return
    cargarComentarios()
  }, [ordenId])

  async function cargarComentarios() {
    setLoading(true)
    setErrorCarga(false)
    const { data, error } = await supabase
      .from('ot_comentarios')
      .select('*, autor:profiles!ot_comentarios_autor_id_fkey(nombre, apellido)')
      .eq('orden_id', ordenId)
      .order('created_at', { ascending: true })
    setLoading(false)
    if (error) {
      setErrorCarga(true)
      return
    }
    setComentarios(data || [])
  }

  async function enviarComentario() {
    if (!mensaje.trim() || enviando) return
    if (!ordenId || !autorId || !autorRol) {
      alert('Faltan datos para enviar el comentario.')
      return
    }
    setEnviando(true)
    const { data, error } = await supabase
      .from('ot_comentarios')
      .insert({
        orden_id: ordenId,
        autor_id: autorId,
        autor_rol: autorRol,
        mensaje: mensaje.trim(),
      })
      .select('*, autor:profiles!ot_comentarios_autor_id_fkey(nombre, apellido)')
      .single()
    setEnviando(false)
    if (error) {
      alert('Error al enviar comentario. Intentá de nuevo.')
      return
    }
    setComentarios(prev => [...prev, data])
    setMensaje('')
  }

  const esPropio = (c: any) => c.autor_id === autorId

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid #1a3040', paddingTop: 14 }}>
      <div style={{ fontSize: 9, color: '#4a8fa0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        💬 Comunicación operativa · {comentarios.length}
      </div>

      {/* Lista */}
      <div style={{ marginBottom: 10 }}>
        {loading ? (
          <div style={{ fontSize: 11, color: '#4a8fa0', textAlign: 'center', padding: '10px 0' }}>
            Cargando...
          </div>
        ) : errorCarga ? (
          <div style={{ fontSize: 11, color: '#E24B4A', textAlign: 'center', padding: '10px 0', border: '1px dashed #E24B4A44', borderRadius: 8 }}>
            Error al cargar comentarios. <button onClick={cargarComentarios} style={{ background: 'none', border: 'none', color: '#1ABBD6', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Reintentar</button>
          </div>
        ) : comentarios.length === 0 ? (
          <div style={{ fontSize: 11, color: '#4a8fa0', textAlign: 'center', padding: '12px 0', border: '1px dashed #1a3040', borderRadius: 8 }}>
            Sin comentarios todavía
          </div>
        ) : (
          comentarios.map(c => {
            const propio = esPropio(c)
            const rolColor = ROLES_COLOR[c.autor_rol] || '#4a8fa0'
            const rolLabel = ROLES_LABEL[c.autor_rol] || c.autor_rol
            return (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: propio ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <div style={{
                  maxWidth: '85%',
                  background: propio ? '#0F3A42' : '#0c1c24',
                  border: `1px solid ${propio ? '#1ABBD644' : '#1a3040'}`,
                  borderRadius: propio ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '8px 10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: rolColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {rolLabel}
                    </span>
                    <span style={{ fontSize: 9, color: '#4a8fa0' }}>
                      {c.autor?.apellido || 'Usuario'}{c.autor?.nombre ? `, ${c.autor.nombre}` : ''}
                    </span>
                    <span style={{ fontSize: 9, color: '#4a8fa050', marginLeft: 'auto' }}>
                      {new Date(c.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#e8f4f8', lineHeight: 1.4 }}>
                    {c.mensaje}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarComentario() } }}
          placeholder="Escribí un comentario... (Enter para enviar)"
          rows={2}
          style={{
            flex: 1, background: '#07131a',
            border: `1px solid ${mensaje.trim() ? '#1ABBD6' : '#1a3040'}`,
            borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#e8f4f8',
            outline: 'none', resize: 'none', boxSizing: 'border-box',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          } as any}
        />
        <button
          onClick={enviarComentario}
          disabled={!mensaje.trim() || enviando}
          style={{
            background: !mensaje.trim() || enviando ? '#1a3040' : '#1ABBD6',
            border: 'none', borderRadius: 8,
            color: !mensaje.trim() || enviando ? '#4a8fa0' : 'white',
            fontWeight: 700, fontSize: 11, padding: '10px 12px',
            cursor: !mensaje.trim() || enviando ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
          }}>
          {enviando ? '...' : 'ENVIAR'}
        </button>
      </div>
    </div>
  )
}