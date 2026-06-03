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

  const { data: conocimiento, error: conocimientoError } = await supabase
    .from('activo_conocimiento')
    .select('id, tipo, titulo, descripcion, prioridad, estado, created_at, creado_por')
    .eq('activo_id', activo_id)
    .neq('estado', 'resuelta')
    .order('prioridad', { ascending: true })

  if (conocimientoError) {
    return NextResponse.json({ error: 'Error al leer conocimiento', detail: conocimientoError.message }, { status: 500 })
  }

  const conocimientoIds = (conocimiento ?? []).map((k: any) => k.id)
  let fotos: any[] = []
  if (conocimientoIds.length > 0) {
    const { data: fotosData, error: fotosError } = await supabase
      .from('activo_conocimiento_fotos')
      .select('id, conocimiento_id, foto_url, descripcion, created_at')
      .in('conocimiento_id', conocimientoIds)
      .order('created_at', { ascending: false })

    if (fotosError) {
      return NextResponse.json({ error: 'Error al leer fotos', detail: fotosError.message }, { status: 500 })
    }
    fotos = fotosData ?? []
  }

  const observaciones = (conocimiento ?? []).map((obs: any) => ({
    ...obs,
    fotos: fotos.filter((f: any) => f.conocimiento_id === obs.id)
  }))

  const { data: ots, error: otsError } = await supabase
    .from('ordenes_trabajo')
    .select('id, numero_orden, titulo, tipo, estado, fecha_programada, trabajos_realizados, created_at')
    .eq('activo_id', activo_id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (otsError) {
    return NextResponse.json({ error: 'Error al leer OTs', detail: otsError.message }, { status: 500 })
  }

  return NextResponse.json({
    ficha,
    observaciones,
    ultimas_ots: ots ?? [],
    meta: {
      activo_id,
      orden_id: orden_id ?? null,
      generado_at: new Date().toISOString(),
      ia: false
    }
  })
}