'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

const ROLES = [
  { value: 'tecnico_electrico', label: 'Técnico Eléctrico' },
  { value: 'tecnico_ac', label: 'Técnico Aire Acondicionado' },
  { value: 'tecnico_electrico_edificio', label: 'Técnico Eléctrico Edificios' },
  { value: 'tallerista_electrico', label: 'Tallerista Eléctrico' },
  { value: 'tallerista_ac', label: 'Tallerista Aire Acondicionado' },
  { value: 'supervisor_electrico', label: 'Supervisor Eléctrico' },
  { value: 'supervisor_ac', label: 'Supervisor Aire Acondicionado' },
  { value: 'panolero', label: 'Pañolero' },
  { value: 'jefe', label: 'Jefe de Sector' },
  { value: 'delegado', label: 'Delegado Gremial' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'subgerente', label: 'Subgerente' },
  { value: 'administrativo_rrhh', label: 'Administrativo RRHH' },
  { value: 'administrativo_compras_pms', label: 'Administrativo Compras y PMS' },
]

const TURNOS = [
  { value: '1', label: 'Turno 1 · Mañana 07–15' },
  { value: '2', label: 'Turno 2 · Tarde 14–22' },
  { value: '3', label: 'Turno 3 · Noche 22–06' },
  { value: 'admin', label: 'Administrativo · Lunes a Viernes' },
]

const SECTORES = [
  { value: 'electrico', label: 'Eléctrico' },
  { value: 'ac', label: 'Aire Acondicionado' },
  { value: 'edificio', label: 'Edificios de Peaje' },
  { value: 'general', label: 'General / Administrativo' },
]

const GRUPOS = [
  { value: 'A', label: 'Grupo A · Lunes a Miércoles' },
  { value: 'B', label: 'Grupo B · Jueves a Domingo' },
]

export default function CompletarPerfil() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    legajo: '',
    nro_afiliado: '',
    telefono: '',
    email_personal: '',
    email_corporativo: '',
    fecha_ingreso: '',
    rol: '',
    turno: '',
    grupo: '',
    sector_trabajo: '',
    nueva_password: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUser(data.user)
      setForm(f => ({ ...f, email_personal: data.user.email || '' }))
      getPerfil().then(p => {
        if (p?.nombre) {
          router.push('/')
        }
      })
    })
  }, [])

  async function guardar() {
    if (!form.nombre || !form.apellido || !form.legajo || !form.rol || !form.turno || !form.sector_trabajo) {
      setError('Completá todos los campos obligatorios *')
      return
    }
    setLoading(true)
    setError('')

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        nombre: form.nombre,
        apellido: form.apellido,
        legajo: form.legajo,
        nro_afiliado: form.nro_afiliado,
        telefono: form.telefono,
        email_personal: form.email_personal,
        email_corporativo: form.email_corporativo,
        fecha_ingreso: form.fecha_ingreso || null,
        rol: form.rol,
        turno: form.turno,
        grupo: form.grupo || null,
        sector_trabajo: form.sector_trabajo,
        activo: true,
      })

    if (profileError) {
      setError('Error al guardar. Verificá los datos.')
      setLoading(false)
      return
    }

    if (form.nueva_password) {
      await supabase.auth.updateUser({ password: form.nueva_password })
    }

    setLoading(false)
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-black pb-10">
      <div className="bg-[#0F3A42] px-4 py-4">
        <div className="text-white font-bold text-lg">Completá tu perfil</div>
        <div className="text-[#7ADCE8] text-xs mt-0.5">Aubasa · Sistema MECA</div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        <div className="bg-white rounded-2xl p-4">
          <div className="text-[#0F3A42] font-bold text-sm mb-3">Datos personales</div>

          <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Nombre *</div>
          <input
            className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
            placeholder="Ej: Juan"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
          />

          <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Apellido *</div>
          <input
            className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
            placeholder="Ej: García"
            value={form.apellido}
            onChange={e => setForm({ ...form, apellido: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Legajo *</div>
              <input
                className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
                placeholder="Ej: 1234"
                value={form.legajo}
                onChange={e => setForm({ ...form, legajo: e.target.value })}
              />
            </div>
            <div>
              <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Nº Afiliado</div>
              <input
                className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
                placeholder="Ej: 5678"
                value={form.nro_afiliado}
                onChange={e => setForm({ ...form, nro_afiliado: e.target.value })}
              />
            </div>
          </div>

          <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Teléfono</div>
          <input
            className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
            placeholder="Ej: 11 1234-5678"
            value={form.telefono}
            onChange={e => setForm({ ...form, telefono: e.target.value })}
          />

          <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Fecha de ingreso</div>
          <input
            type="date"
            className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
            value={form.fecha_ingreso}
            onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })}
          />
        </div>

        <div className="bg-white rounded-2xl p-4">
          <div className="text-[#0F3A42] font-bold text-sm mb-3">Emails</div>

          <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Email personal</div>
          <input
            className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
            placeholder="tu@gmail.com"
            value={form.email_personal}
            onChange={e => setForm({ ...form, email_personal: e.target.value })}
          />

          <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Email corporativo Aubasa</div>
          <input
            className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
            placeholder="nombre@aubasa.com (opcional)"
            value={form.email_corporativo}
            onChange={e => setForm({ ...form, email_corporativo: e.target.value })}
          />
        </div>

        <div className="bg-white rounded-2xl p-4">
          <div className="text-[#0F3A42] font-bold text-sm mb-3">Puesto y turno</div>

          <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Puesto que desempeña *</div>
          <select
            className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
            value={form.rol}
            onChange={e => setForm({ ...form, rol: e.target.value })}
          >
            <option value="">Seleccioná tu puesto</option>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Sector *</div>
          <select
            className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
            value={form.sector_trabajo}
            onChange={e => setForm({ ...form, sector_trabajo: e.target.value })}
          >
            <option value="">Seleccioná tu sector</option>
            {SECTORES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Turno *</div>
          <select
            className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] mb-3 outline-none"
            value={form.turno}
            onChange={e => setForm({ ...form, turno: e.target.value })}
          >
            <option value="">Seleccioná tu turno</option>
            {TURNOS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {form.sector_trabajo === 'electrico' && ['1', '2', '3'].includes(form.turno) && (
            <>
              <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Grupo</div>
              <select
                className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none"
                value={form.grupo}
                onChange={e => setForm({ ...form, grupo: e.target.value })}
              >
                <option value="">Seleccioná tu grupo</option>
                {GRUPOS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4">
          <div className="text-[#0F3A42] font-bold text-sm mb-3">Contraseña</div>
          <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Nueva contraseña (opcional)</div>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              className="w-full bg-[#F0FAFB] border border-[#B2E0E8] rounded-lg px-3 py-2 text-sm text-[#0F3A42] outline-none pr-10"
              placeholder="Dejá en blanco para mantener la actual"
              value={form.nueva_password}
              onChange={e => setForm({ ...form, nueva_password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-2.5 text-[#7A9EA5]"
            >
              {showPass ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        {error && <div className="bg-[#FCEBEB] border border-[#F09595] rounded-xl px-3 py-2 text-[#A32D2D] text-sm">{error}</div>}

        <button
          onClick={guardar}
          disabled={loading}
          className="w-full bg-[#1ABBD6] text-white font-bold text-base tracking-widest rounded-xl py-4 disabled:opacity-50"
        >
          {loading ? 'GUARDANDO...' : 'GUARDAR PERFIL'}
        </button>

      </div>
    </main>
  )
}