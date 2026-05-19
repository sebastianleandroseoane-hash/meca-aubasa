'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getPerfil } from '@/lib/supabase'

const ITEMS_INSPECCION = [
  'Luces (bajas, altas, guiños, stop)',
  'Frenos',
  'Nivel de aceite',
  'Nivel de agua/refrigerante',
  'Estado de neumáticos',
  'Gomas de auxilio / crique / llave',
  'Limpia parabrisas',
  'Bocina',
  'Cinturones de seguridad',
  'Documentación vigente (seguro/VTV/etc.)',
  'Botiquín, balizas y matafuegos',
  'Limpieza exterior',
  'Limpieza interior',
  'Señalización externa',
  'Aditamentos',
]

export default function CheckinVehiculos() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [moviles, setMoviles] = useState<any[]>([])
  const [movilId, setMovilId] = useState('')
  const [kmInicial, setKmInicial] = useState('')
  const [kmFinal, setKmFinal] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [items, setItems] = useState<Record<string, { estado: 'bien' | 'mal', observacion: string }>>(
    Object.fromEntries(ITEMS_INSPECCION.map(i => [i, { estado: 'bien', observacion: '' }]))
  )
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    getPerfil().then(async p => {
      if (!p) { router.push('/'); return }
      setPerfil(p)
      const sector = p.sector_trabajo === 'ac' ? 'ac' : 'electrico'
      const { data } = await supabase
        .from('moviles')
        .select('*')
        .eq('sector', sector)
        .eq('estado', 'disponible')
        .order('marca', { ascending: true })
      setMoviles(data || [])
    })
  }, [])

  function toggleItem(nombre: string) {
    setItems(prev => ({
      ...prev,
      [nombre]: { ...prev[nombre], estado: prev[nombre].estado === 'bien' ? 'mal' : 'bien' }
    }))
  }

  function setObsItem(nombre: string, obs: string) {
    setItems(prev => ({ ...prev, [nombre]: { ...prev[nombre], observacion: obs } }))
  }

  async function enviar() {
    if (!movilId) return
    setLoading(true)
    const turno = perfil.turno || 'mañana'
    const sector = perfil.sector_trabajo === 'ac' ? 'ac' : 'electrico'

    const { data: checkin, error } = await supabase
      .from('checkins_vehiculos')
      .insert({
        movil_id: movilId,
        sector,
        turno,
        fecha: new Date().toISOString().split('T')[0],
        conductor_id: perfil.id,
        km_inicial: kmInicial ? parseInt(kmInicial) : null,
        km_final: kmFinal ? parseInt(kmFinal) : null,
        observaciones_generales: observaciones || null,
        estado: 'pendiente_aprobacion',
      })
      .select()
      .single()

    if (!error && checkin) {
      await supabase.from('checkins_vehiculos_items').insert(
        ITEMS_INSPECCION.map((nombre, i) => ({
          checkin_id: checkin.id,
          item: nombre,
          orden: i + 1,
          estado: items[nombre].estado,
          observacion: items[nombre].observacion || null,
        }))
      )
      setEnviado(true)
    }
    setLoading(false)
  }

  if (!perfil) return (
    <div className="min-h-screen bg-[#F0FAFB] flex items-center justify-center text-[#0F3A42]">Cargando...</div>
  )

  if (enviado) return (
    <div className="min-h-screen bg-[#F0FAFB] flex flex-col items-center justify-center px-6">
      <div className="text-5xl mb-4">✅</div>
      <div className="text-[#0F3A42] font-bold text-lg mb-2 text-center">Checkin enviado</div>
      <div className="text-[#7A9EA5] text-sm text-center mb-6">Pendiente de aprobación por supervisor o técnico entrante</div>
      <button onClick={() => router.push('/dashboard/checkin/vehiculos/historial')}
        className="bg-[#1ABBD6] text-white font-bold text-sm px-6 py-3 rounded-xl mb-3 w-full">
        VER HISTORIAL
      </button>
      <button onClick={() => router.back()}
        className="bg-[#E8E8E6] text-[#5F5E5A] font-bold text-sm px-6 py-3 rounded-xl w-full">
        VOLVER
      </button>
    </div>
  )

  const movilSeleccionado = moviles.find(m => m.id === movilId)
  const itemsMal = Object.entries(items).filter(([, v]) => v.estado === 'mal').length

  return (
    <main className="min-h-screen bg-[#F0FAFB]">
      <div className="bg-[#0F3A42] px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg tracking-wide">Checkin Vehículo</div>
            <div className="text-[#7ADCE8] text-xs mt-0.5">{perfil.nombre} {perfil.apellido} · {perfil.turno}</div>
          </div>
          <button onClick={() => router.back()} className="text-[#7ADCE8] text-xs font-bold">← VOLVER</button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-28">

        {/* VEHÍCULO */}
        <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Vehículo *</div>
        <select
          className="w-full bg-white border border-[#B2E0E8] rounded-xl px-3 py-2 text-sm text-[#0F3A42] mb-1 outline-none"
          value={movilId}
          onChange={e => setMovilId(e.target.value)}
        >
          <option value="">Seleccioná un vehículo</option>
          {moviles.map(m => (
            <option key={m.id} value={m.id}>{m.marca} {m.modelo} — {m.patente}</option>
          ))}
        </select>
        {movilSeleccionado && (
          <div className="bg-[#D6F4F8] border border-[#1ABBD6] rounded-lg px-3 py-2 mb-3 text-xs text-[#0F3A42]">
            Patente: <span className="font-bold">{movilSeleccionado.patente}</span> · Sector: {movilSeleccionado.sector}
          </div>
        )}

        {/* KM */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Km / Horóm. Inicial</div>
            <input type="number"
              className="w-full bg-white border border-[#B2E0E8] rounded-xl px-3 py-2 text-sm text-[#0F3A42] outline-none"
              placeholder="0"
              value={kmInicial}
              onChange={e => setKmInicial(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Km / Horóm. Final</div>
            <input type="number"
              className="w-full bg-white border border-[#B2E0E8] rounded-xl px-3 py-2 text-sm text-[#0F3A42] outline-none"
              placeholder="0"
              value={kmFinal}
              onChange={e => setKmFinal(e.target.value)} />
          </div>
        </div>

        {/* INSPECCIÓN */}
        <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-2">
          Inspección general {itemsMal > 0 && <span className="text-[#E24B4A]">· {itemsMal} con MAL</span>}
        </div>
        <div className="bg-white border border-[#B2E0E8] rounded-xl overflow-hidden mb-3">
          {ITEMS_INSPECCION.map((nombre, i) => (
            <div key={nombre} className={`${i < ITEMS_INSPECCION.length - 1 ? 'border-b border-[#F0FAFB]' : ''}`}>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-[#0F3A42] text-xs flex-1 pr-2">{nombre}</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => items[nombre].estado !== 'bien' && toggleItem(nombre)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${items[nombre].estado === 'bien' ? 'bg-[#1ABBD6] text-white' : 'bg-[#F0FAFB] text-[#7A9EA5] border border-[#B2E0E8]'}`}>
                    BIEN
                  </button>
                  <button
                    onClick={() => items[nombre].estado !== 'mal' && toggleItem(nombre)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${items[nombre].estado === 'mal' ? 'bg-[#E24B4A] text-white' : 'bg-[#F0FAFB] text-[#7A9EA5] border border-[#B2E0E8]'}`}>
                    MAL
                  </button>
                </div>
              </div>
              {items[nombre].estado === 'mal' && (
                <div className="px-3 pb-2">
                  <input
                    className="w-full bg-[#FFF8F8] border border-[#F09595] rounded-lg px-2 py-1.5 text-xs text-[#0F3A42] outline-none"
                    placeholder="Observación obligatoria..."
                    value={items[nombre].observacion}
                    onChange={e => setObsItem(nombre, e.target.value)} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* OBSERVACIONES GENERALES */}
        <div className="text-xs text-[#7A9EA5] uppercase tracking-widest mb-1">Observaciones generales / Novedades</div>
        <textarea
          className="w-full bg-white border border-[#B2E0E8] rounded-xl px-3 py-2 text-sm text-[#0F3A42] mb-4 outline-none resize-none"
          rows={3}
          placeholder="Novedades del turno, daños, faltantes..."
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)} />

        <button
          onClick={enviar}
          disabled={loading || !movilId}
          className="w-full bg-[#1ABBD6] text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50">
          {loading ? 'Enviando...' : '✅ ENVIAR CHECKIN'}
        </button>
      </div>
    </main>
  )
}