'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

const ROLES = [
  { value: 'tecnico_electrico', label: 'Técnico Eléctrico' },
  { value: 'tecnico_ac', label: 'Técnico AC' },
  { value: 'tecnico_electrico_edificio', label: 'Técnico Edificio' },
  { value: 'supervisor_electrico', label: 'Supervisor Eléctrico' },
  { value: 'supervisor_ac', label: 'Supervisor AC' },
  { value: 'panolero', label: 'Pañolero' },
  { value: 'tallerista_electrico', label: 'Tallerista Eléctrico' },
  { value: 'tallerista_ac', label: 'Tallerista AC' },
  { value: 'jefe', label: 'Jefe' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'subgerente', label: 'Subgerente' },
  { value: 'administrador', label: 'Administrador' },
  { value: 'tecnico_peaje', label: 'Técnico Peaje' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'sin_acceso', label: 'Sin acceso' },
  { value: 'superadmin', label: 'Superadmin' },
]

const SECTORES = ['electrico', 'ac', 'edificio', 'peaje', 'general']
const TURNOS = ['mañana', 'tarde', 'noche', 'admin']
const GRUPOS = ['A', 'B', 'C', 'D']

const C = {
  bg: '#07131a', card: '#0c1c24', border: '#1a3040', text: '#e8f4f8',
  sub: '#4a8fa0', accent: '#1ABBD6', warn: '#EF9F27', err: '#E24B4A', ok: '#1D9E75'
}
const inp = {
  width: '100%', background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: C.text,
  outline: 'none', boxSizing: 'border-box' as const
}

const emptyForm = {
  email: '', password: '', nombre: '', apellido: '',
  rol: 'tecnico_electrico', turno: '', grupo: '', sector_trabajo: '', legajo: ''
}

export default function PageUsuarios() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')

  useEffect(() => {
    getPerfil().then(p => {
      if (!p || !['superadmin', 'jefe', 'administrador'].includes(p.rol)) {
        router.push('/dashboard')
        return
      }
      setPerfil(p)
      cargarUsuarios()
    })
  }, [])

  async function cargarUsuarios() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('apellido', { ascending: true })
    setUsuarios(data || [])
  }

  function abrirNuevo() {
    setEditando(null)
    setForm(emptyForm)
    setMsg(null)
    setShowForm(true)
  }

  function abrirEditar(u: any) {
    setEditando(u)
    setForm({
      email: u.email_corporativo || '',
      password: '',
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      rol: u.rol || 'sin_acceso',
      turno: u.turno || '',
      grupo: u.grupo || '',
      sector_trabajo: u.sector_trabajo || '',
      legajo: u.legajo || ''
    })
    setMsg(null)
    setShowForm(true)
  }

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }

  async function guardar() {
    setLoading(true)
    setMsg(null)
    try {
      if (editando) {
        // PATCH — actualizar perfil
        const token = await getToken()
        const res = await fetch('/api/admin/crear-usuario', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            id: editando.id,
            nombre: form.nombre,
            apellido: form.apellido,
            rol: form.rol,
            turno: form.turno || null,
            grupo: form.grupo || null,
            sector_trabajo: form.sector_trabajo || null,
            legajo: form.legajo || null,
          })
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setMsg({ ok: true, text: 'Usuario actualizado' })
      } else {
        // POST — crear nuevo
        if (!form.email || !form.password || form.password.length < 6) {
          setMsg({ ok: false, text: 'Email y contraseña (mín 6 caracteres) son obligatorios' })
          setLoading(false)
          return
        }
        const token = await getToken()
        const res = await fetch('/api/admin/crear-usuario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(form)
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setMsg({ ok: true, text: 'Usuario creado correctamente' })
        setForm(emptyForm)
      }
      await cargarUsuarios()
    } catch (e: any) {
      setMsg({ ok: false, text: e.message })
    }
    setLoading(false)
  }

  async function toggleActivo(u: any) {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || ''
    await fetch('/api/admin/crear-usuario', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id: u.id, activo: !u.activo })
    })
    await cargarUsuarios()
    setLoading(false)
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase()
    const matchBusqueda = !q || `${u.nombre} ${u.apellido} ${u.email_corporativo || ''} ${u.legajo || ''}`.toLowerCase().includes(q)
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol
    return matchBusqueda && matchRol
  })

  if (!perfil) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>Cargando...</div>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui', color: C.text }}>

      {/* HEADER */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Gestión de usuarios</div>
          <div style={{ fontSize: 11, color: C.sub }}>{usuarios.length} usuarios · {usuarios.filter(u => u.activo).length} activos</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, cursor: 'pointer' }}>← Volver</button>
          <button onClick={abrirNuevo} style={{ background: C.accent, border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 12, padding: '7px 14px', cursor: 'pointer' }}>+ NUEVO</button>
        </div>
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: 20, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{editando ? 'Editar usuario' : 'Nuevo usuario'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, cursor: 'pointer' }}>CERRAR</button>
            </div>

            {msg && (
              <div style={{ background: msg.ok ? '#0F2A1A' : '#2A0F0F', border: `1px solid ${msg.ok ? C.ok : C.err}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: msg.ok ? C.ok : C.err }}>
                {msg.ok ? '✅' : '❌'} {msg.text}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {[['Nombre *', 'nombre', 'Juan'], ['Apellido *', 'apellido', 'García']].map(([label, key, ph]) => (
                <div key={key}>
                  <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                  <input style={inp} placeholder={ph} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
            </div>

            {!editando && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Email *</div>
                  <input style={inp} placeholder="usuario@aubasa.com.ar" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Contraseña inicial *</div>
                  <input type="password" style={inp} placeholder="Mín 6 caracteres" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Rol *</div>
                <select style={inp} value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Sector</div>
                <select style={inp} value={form.sector_trabajo} onChange={e => setForm({ ...form, sector_trabajo: e.target.value })}>
                  <option value="">— ninguno —</option>
                  {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Turno</div>
                <select style={inp} value={form.turno} onChange={e => setForm({ ...form, turno: e.target.value })}>
                  <option value="">—</option>
                  {TURNOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Grupo</div>
                <select style={inp} value={form.grupo} onChange={e => setForm({ ...form, grupo: e.target.value })}>
                  <option value="">—</option>
                  {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Legajo</div>
                <input style={inp} placeholder="12345" value={form.legajo} onChange={e => setForm({ ...form, legajo: e.target.value })} />
              </div>
            </div>

            <button onClick={guardar} disabled={loading}
              style={{ width: '100%', background: loading ? C.border : C.accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, padding: '13px 0', cursor: loading ? 'default' : 'pointer' }}>
              {loading ? 'Guardando...' : editando ? 'GUARDAR CAMBIOS' : 'CREAR USUARIO'}
            </button>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
        <input style={{ ...inp, flex: 1 }} placeholder="Buscar por nombre, email, legajo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select style={{ ...inp, width: 'auto' }} value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
          <option value="todos">Todos los roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* LISTA */}
      <div style={{ padding: '0 16px 100px' }}>
        <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          {usuariosFiltrados.length} resultados
        </div>
        {usuariosFiltrados.map(u => (
          <div key={u.id} style={{ background: C.card, border: `1px solid ${u.activo ? C.border : C.err + '44'}`, borderLeft: `3px solid ${u.activo ? C.accent : C.err}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: u.activo ? C.text : C.sub }}>
                    {u.apellido}, {u.nombre}
                  </div>
                  {!u.activo && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: '#2A0F0F', color: C.err }}>INACTIVO</span>}
                </div>
                <div style={{ fontSize: 11, color: C.sub }}>
                  {u.email_corporativo || '—'}
                  {u.legajo ? ` · Leg. ${u.legajo}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#0F2A35', color: C.accent }}>{u.rol}</span>
                  {u.turno && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: C.border, color: C.sub }}>{u.turno}</span>}
                  {u.grupo && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: C.border, color: C.sub }}>Gr.{u.grupo}</span>}
                  {u.sector_trabajo && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: C.border, color: C.sub }}>{u.sector_trabajo}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                <button onClick={() => abrirEditar(u)}
                  style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.sub, fontSize: 11, padding: '6px 10px', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => toggleActivo(u)} disabled={loading}
                  style={{ background: u.activo ? '#2A0F0F' : '#0F2A1A', border: `1px solid ${u.activo ? C.err : C.ok}44`, borderRadius: 8, color: u.activo ? C.err : C.ok, fontSize: 11, padding: '6px 10px', cursor: 'pointer' }}>
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
