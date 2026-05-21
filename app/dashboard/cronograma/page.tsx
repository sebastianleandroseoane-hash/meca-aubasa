'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil, supabase } from '@/lib/supabase'

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const TURNOS: Record<string, string> = {
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
  guardia_manana: 'Guardia M',
  guardia_tarde: 'Guardia T',
  guardia_noche: 'Guardia N',
}

const COLOR_ESTADO: Record<string, string> = {
  T: 'bg-[#1ABBD6] text-white',
  F: 'bg-[#1A3A42] text-[#4A7A84]',
  V: 'bg-[#854F0B] text-[#FAEEDA]',
  FC: 'bg-[#5A3A8A] text-[#DDD0FF]',
  LM: 'bg-[#0F5A0F] text-[#B2F0B2]',
  S: 'bg-[#8A3A0F] text-[#FFD0B2]',
}

function colorEstado(e: string) {
  if (!e) return 'bg-[#1A3A42] text-[#4A7A84]'
  const key = e.trim().toUpperCase()
  return COLOR_ESTADO[key] || 'bg-[#2A4A54] text-[#7ADCE8]'
}

export default function CronogramaPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio] = useState(2026)
  const [registros, setRegistros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [turnoFiltro, setTurnoFiltro] = useState('auto')
  const [sectorFiltro, setSectorFiltro] = useState('auto')
  const [vistaCompleta, setVistaCompleta] = useState(false)
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null)

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) { router.push('/'); return }
      setPerfil(p)
    })
  }, [])

  useEffect(() => {
    cargarMes()
  }, [mes])

  async function cargarMes() {
    setLoading(true)
    const { data } = await supabase
      .from('cronograma')
      .select('*')
      .eq('mes', mes)
      .eq('anio', anio)
      .order('turno')
    console.log('cronograma data:', data, 'mes:', mes)
    setRegistros(data || [])
    setLoading(false)
  }

  const diasDelMes = new Date(anio, mes, 0).getDate()

  const turnosUnicos = [...new Set(registros.map(r => r.turno))]

  const normalizarTurno = (t: string) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const turnoEfectivo = vistaCompleta ? 'todos' : normalizarTurno(perfil?.turno || '')
  const sectorEfectivo = vistaCompleta ? 'todos' : (perfil?.sector_trabajo || 'todos')

  const registrosFiltrados = registros.filter(r => {
    const turnoOk = vistaCompleta || !perfil?.turno || normalizarTurno(r.turno) === turnoEfectivo
    const sectorOk = vistaCompleta || !perfil?.sector_trabajo || r.sector === sectorEfectivo
    return turnoOk && sectorOk
  })

  // Para el día seleccionado: quién trabaja (T)
  const presentesHoy = diaSeleccionado
    ? registros.filter(r => {
        const e = r.estados?.[String(diaSeleccionado)]?.trim().toUpperCase()
        return e === 'T'
      })
    : []

  return (
    <main className="bg-[#0A2730] min-h-screen text-white pb-20">
      {/* Header */}
      <div className="bg-[#0F3A42] px-4 py-3 flex items-center justify-between border-b border-[#1A4A54]">
        <button onClick={() => router.back()} className="text-[#7ADCE8] text-sm">← Volver</button>
        <span className="text-white font-bold text-sm tracking-widest uppercase">Cronograma</span>
        <div className="w-12" />
      </div>

      {/* Navegación mes */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setMes(m => m > 1 ? m - 1 : m)}
          className="bg-[#1A4A54] text-[#1ABBD6] rounded-lg px-3 py-1 text-sm font-bold"
        >←</button>
        <span className="text-white font-bold text-base">{MESES[mes]} {anio}</span>
        <button
          onClick={() => setMes(m => m < 9 ? m + 1 : m)}
          className="bg-[#1A4A54] text-[#1ABBD6] rounded-lg px-3 py-1 text-sm font-bold"
        >→</button>
      </div>

      {/* Toggle vista */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="text-[#7ADCE8] text-xs font-bold uppercase tracking-widest">
          {vistaCompleta ? 'Todo el personal' : `Mi turno · ${TURNOS[perfil?.turno] || perfil?.turno || ''}`}
        </div>
        <button
          onClick={() => setVistaCompleta(v => !v)}
          className={`text-xs font-bold px-3 py-1.5 rounded-full ${vistaCompleta ? 'bg-[#1ABBD6] text-white' : 'bg-[#1A4A54] text-[#7ADCE8]'}`}
        >
          {vistaCompleta ? 'Ver mi turno' : 'Ver todos'}
        </button>
      </div>

      {/* Selector de día */}
      <div className="px-4 mb-3">
        <div className="text-[#7A9EA5] text-xs font-bold uppercase tracking-widest mb-2">Tocá un día para ver quién trabaja</div>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: diasDelMes }, (_, i) => i + 1).map(d => (
            <button
              key={d}
              onClick={() => setDiaSeleccionado(diaSeleccionado === d ? null : d)}
              className={`w-8 h-8 rounded-lg text-xs font-bold ${diaSeleccionado === d ? 'bg-[#1ABBD6] text-white' : 'bg-[#1A4A54] text-[#7ADCE8]'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Panel día seleccionado */}
      {diaSeleccionado && (
        <div className="mx-4 mb-3 bg-[#0F3A42] border border-[#1ABBD6] rounded-xl p-3">
          <div className="text-[#1ABBD6] font-bold text-sm mb-2">
            Día {diaSeleccionado} — {presentesHoy.length} presentes
          </div>
          {presentesHoy.length === 0 ? (
            <div className="text-[#7A9EA5] text-xs">Nadie trabaja este día</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {presentesHoy.map(r => (
                <div key={r.id} className="bg-[#1A4A54] rounded-lg px-2 py-1">
                  <div className="text-white text-xs font-bold">{r.nombre}</div>
                  <div className="text-[#7ADCE8] text-xs">{TURNOS[r.turno] || r.turno}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="text-center text-[#7A9EA5] py-8">Cargando...</div>
      ) : (
        <div className="px-2 overflow-x-auto">
          <table className="text-xs min-w-max">
            <thead>
              <tr>
                <th className="text-left text-[#7ADCE8] font-bold px-2 py-1 sticky left-0 bg-[#0A2730] min-w-25">Nombre</th>
                <th className="text-left text-[#7ADCE8] font-bold px-1 py-1 min-w-15">Turno</th>

                {Array.from({ length: diasDelMes }, (_, i) => i + 1).map(d => (
                  <th key={d} className={`text-center font-bold px-0.5 py-1 w-7 ${diaSeleccionado === d ? 'text-[#1ABBD6]' : 'text-[#4A7A84]'}`}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map(r => (
                <tr key={r.id} className="border-t border-[#1A3A42]">
                  <td className="text-white px-2 py-1 sticky left-0 bg-[#0A2730] font-medium">{r.nombre}</td>
                  <td className="text-[#7ADCE8] px-1 py-1 whitespace-nowrap">{TURNOS[r.turno] || r.turno}</td>
                  {Array.from({ length: diasDelMes }, (_, i) => i + 1).map(d => {
                    const e = r.estados?.[String(d)] || ''
                    return (
                      <td key={d} className="px-0.5 py-1 text-center">
                        <span className={`inline-block w-6 h-5 rounded text-center leading-5 font-bold ${colorEstado(e)}`}>
                          {e.length <= 2 ? e : e[0]}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Leyenda */}
      <div className="px-4 mt-4 mb-2">
        <div className="text-[#7A9EA5] text-xs font-bold uppercase tracking-widest mb-2">Referencias</div>
        <div className="flex flex-wrap gap-2">
          {[['T','Trabajo'],['F','Franco'],['V','Vacaciones'],['FC','Franco comp.'],['LM','Lic. médica'],['S','Suspensión']].map(([k,v]) => (
            <div key={k} className="flex items-center gap-1">
              <span className={`inline-block w-6 h-5 rounded text-center leading-5 font-bold text-xs ${colorEstado(k)}`}>{k}</span>
              <span className="text-[#7A9EA5] text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0F3A42] border-t border-[#1A4A54] flex justify-around py-2">
        <div onClick={() => router.back()} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span className="text-[#7ADCE8] text-xs">Panel</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="text-[#1ABBD6] text-xs">Cronograma</span>
        </div>
        <div onClick={() => router.push('/historial')} className="flex flex-col items-center gap-0.5 cursor-pointer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="text-[#7ADCE8] text-xs">Historial</span>
        </div>
      </div>
    </main>
  )
}