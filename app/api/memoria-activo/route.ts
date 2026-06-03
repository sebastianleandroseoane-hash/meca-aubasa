import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Sesion invalida' }, { status: 401 })
  }

  let body: { activo_id?: string; orden_id?: string } = {}
  try { body = await req.json() } catch {}
  const { activo_id, orden_id } = body

  if (!activo_id) {
    return NextResponse.json({ error: 'activo_id requerido' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // --- 1. Ficha del activo ---
  const { data: ficha, error: fichaError } = await supabase
    .from('v_memoria_activo')
    .select('*')
    .eq('activo_id', activo_id)
    .maybeSingle()

  if (fichaError) {
    return NextResponse.json({ error: 'Error al leer ficha del activo', detail: fichaError.message }, { status: 500 })
  }
  if (!ficha) {
    return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 })
  }

  // --- 2. Datos del activo ---
  const { data: activo } = await supabase
    .from('activos')
    .select('id, codigo, nombre, tipo, subtipo')
    .eq('id', activo_id)
    .maybeSingle()

  // --- 3. Observaciones abiertas ---
  const { data: conocimiento, error: conocimientoError } = await supabase
    .from('activo_conocimiento')
    .select('id, tipo, titulo, descripcion, prioridad, estado, created_at, creado_por')
    .eq('activo_id', activo_id)
    .neq('estado', 'resuelta')
    .order('prioridad', { ascending: true })

  if (conocimientoError) {
    return NextResponse.json({ error: 'Error al leer conocimiento', detail: conocimientoError.message }, { status: 500 })
  }

  // --- 4. Informes tecnicos — ultima version por OT ---
  const { data: informes, error: informesError } = await supabase
    .from('informes_tecnicos')
    .select(`
      id, orden_id, version, estado_informe,
      estado_encontrado, causa_probable, causa_detalle,
      trabajo_realizado, trabajo_detalle,
      activo_operativo, requiere_seguimiento, seguimiento_detalle,
      riesgo_tipo, requiere_corte, requiere_balizamiento,
      requiere_hidrogrua, requiere_consignacion,
      riesgo_controlado, observaciones_seguridad,
      tension_entrada, tension_salida, corriente, mediciones_detalle,
      created_at,
      profiles!informes_tecnicos_tecnico_id_fkey(nombre, apellido)
    `)
    .eq('activo_id', activo_id)
    .order('orden_id', { ascending: false })
    .order('version', { ascending: false })

  if (informesError) {
    return NextResponse.json({ error: 'Error al leer informes', detail: informesError.message }, { status: 500 })
  }

  // Quedar con la ultima version por orden_id
  const ultimosPorOT: Record<string, any> = {}
  for (const inf of (informes ?? [])) {
    if (!ultimosPorOT[inf.orden_id]) {
      ultimosPorOT[inf.orden_id] = inf
    }
  }
  const informesFiltrados = Object.values(ultimosPorOT)
  const ordenIds = informesFiltrados.map((inf: any) => inf.orden_id)

  // --- 5. OTs de esos informes ---
  let otsPorId: Record<string, any> = {}
  if (ordenIds.length > 0) {
    const { data: otsData } = await supabase
      .from('ordenes_trabajo')
      .select('id, numero_orden, titulo, tipo, fecha_programada')
      .in('id', ordenIds)
    for (const ot of (otsData ?? [])) {
      otsPorId[ot.id] = ot
    }
  }

  // --- 6. Tecnicos participantes por OT ---
  let tecnicosPorOT: Record<string, any[]> = {}
  if (ordenIds.length > 0) {
    const { data: tecnicosData } = await supabase
      .from('orden_tecnicos')
      .select('orden_id, profiles!orden_tecnicos_tecnico_id_fkey(nombre, apellido)')
      .in('orden_id', ordenIds)
    for (const t of (tecnicosData ?? [])) {
      if (!tecnicosPorOT[t.orden_id]) tecnicosPorOT[t.orden_id] = []
      tecnicosPorOT[t.orden_id].push(t.profiles)
    }
  }

  // --- 7. Materiales por OT ---
  let materialesPorOT: Record<string, any[]> = {}
  if (ordenIds.length > 0) {
    const { data: materialesData } = await supabase
      .from('orden_materiales')
      .select('orden_id, cantidad, materiales!orden_materiales_material_id_fkey(nombre, unidad)')
      .in('orden_id', ordenIds)
    for (const m of (materialesData ?? [])) {
      if (!materialesPorOT[m.orden_id]) materialesPorOT[m.orden_id] = []
      const mat = Array.isArray(m.materiales) ? m.materiales[0] : m.materiales
      materialesPorOT[m.orden_id].push({
        nombre: mat?.nombre,
        cantidad: m.cantidad,
        unidad: mat?.unidad
      })
    }
  }

  // --- 8. Observaciones generadas por OT ---
  let observacionesPorOT: Record<string, any[]> = {}
  if (ordenIds.length > 0) {
    const { data: obsData } = await supabase
      .from('activo_conocimiento')
      .select('id, orden_id, tipo, titulo, prioridad, estado')
      .in('orden_id', ordenIds)
    for (const obs of (obsData ?? [])) {
      if (!observacionesPorOT[obs.orden_id]) observacionesPorOT[obs.orden_id] = []
      observacionesPorOT[obs.orden_id].push(obs)
    }
  }

  // --- 9. Armar intervenciones ---
  const intervenciones = informesFiltrados.map((inf: any) => {
    const ot = otsPorId[inf.orden_id] ?? {}

    const encontro = [
      inf.estado_encontrado?.replace(/_/g, ' '),
      inf.causa_probable?.replace(/_/g, ' ')
    ].filter(Boolean).join(' — ')

    const hizo = [
      inf.trabajo_realizado?.replace(/_/g, ' '),
      inf.trabajo_detalle?.slice(0, 120)
    ].filter(Boolean).join(': ')

    const resultado = inf.activo_operativo === true
      ? 'Activo operativo'
      : inf.activo_operativo === false
        ? inf.requiere_seguimiento
          ? `No operativo — seguimiento: ${inf.seguimiento_detalle ?? 'pendiente'}`
          : 'No operativo'
        : 'Sin datos'

    return {
      informe_id: inf.id,
      orden_id: inf.orden_id,
      numero_orden: ot.numero_orden,
      tipo_ot: ot.tipo,
      fecha: ot.fecha_programada,
      version: inf.version,
      estado_informe: inf.estado_informe,

      activo: {
        id: activo?.id,
        codigo: activo?.codigo,
        nombre: activo?.nombre,
        tipo: activo?.tipo,
        subtipo: activo?.subtipo
      },

      tecnico_firmante: inf.profiles ?? null,
      tecnicos_participantes: tecnicosPorOT[inf.orden_id] ?? [],

      diagnostico: {
        estado_encontrado: inf.estado_encontrado,
        causa_probable: inf.causa_probable,
        causa_detalle: inf.causa_detalle
      },

      trabajo: {
        tipo: inf.trabajo_realizado,
        detalle: inf.trabajo_detalle
      },

      resultado: {
        activo_operativo: inf.activo_operativo,
        requiere_seguimiento: inf.requiere_seguimiento,
        seguimiento_detalle: inf.seguimiento_detalle
      },

      seguridad: {
        riesgo_tipo: inf.riesgo_tipo,
        riesgo_controlado: inf.riesgo_controlado,
        requiere_corte: inf.requiere_corte,
        requiere_balizamiento: inf.requiere_balizamiento,
        requiere_hidrogrua: inf.requiere_hidrogrua,
        requiere_consignacion: inf.requiere_consignacion,
        observaciones_seguridad: inf.observaciones_seguridad
      },

      mediciones: {
        tension_entrada: inf.tension_entrada,
        tension_salida: inf.tension_salida,
        corriente: inf.corriente,
        detalle: inf.mediciones_detalle
      },

      materiales: materialesPorOT[inf.orden_id] ?? [],
      fotos: [],
      observaciones_generadas: observacionesPorOT[inf.orden_id] ?? [],

      intervencion_resumen: { encontro, hizo, resultado }
    }
  })

  return NextResponse.json({
    ficha,
    observaciones: conocimiento ?? [],
    intervenciones,
    meta: {
      activo_id,
      orden_id: orden_id ?? null,
      generado_at: new Date().toISOString(),
      ia: false
    }
  })
}