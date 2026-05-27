import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const supabaseUser = createClient(supabaseUrl, anonKey)
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token)
    if (userError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

    const { data: perfilAdmin, error: perfilError } = await supabaseAdmin
      .from('profiles').select('rol, activo').eq('id', user.id).single()

    if (perfilError || !perfilAdmin) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })
    if (!perfilAdmin.activo || !['superadmin', 'jefe', 'administrador'].includes(perfilAdmin.rol))
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const body = await req.json()
    const { email, password, nombre, apellido, legajo, telefono, email_corporativo, rol, turno, modalidad, grupo, sector_trabajo } = body

    if (!email || !password || !nombre || !apellido || !rol)
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })

    const { data: nuevoUsuario, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { nombre, apellido, legajo }
    })

    if (createError || !nuevoUsuario.user)
      return NextResponse.json({ error: createError?.message || 'No se pudo crear el usuario' }, { status: 400 })

    const { error: profileError } = await supabaseAdmin.from('profiles').update({
      nombre, apellido,
      legajo: legajo || null,
      telefono: telefono || null,
      email_personal: email,
      email_corporativo: email_corporativo || null,
      rol, turno: turno || null,
      modalidad: modalidad || null,
      grupo: grupo || null,
      sector_trabajo: sector_trabajo || null,
      activo: true
    }).eq('id', nuevoUsuario.user.id)

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(nuevoUsuario.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Usuario creado', userId: nuevoUsuario.user.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error inesperado' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const supabaseUser = createClient(supabaseUrl, anonKey)
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token)
    if (userError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

    const { data: perfilAdmin } = await supabaseAdmin
      .from('profiles').select('rol, activo').eq('id', user.id).single()
    if (!perfilAdmin || !['superadmin', 'jefe', 'administrador'].includes(perfilAdmin.rol))
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const allowed = ['rol', 'turno', 'grupo', 'sector_trabajo', 'activo', 'nombre', 'apellido', 'legajo']
    const safeUpdates: any = {}
    for (const key of allowed) {
      if (key in updates) safeUpdates[key] = updates[key]
    }

    const { error } = await supabaseAdmin.from('profiles').update(safeUpdates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error inesperado' }, { status: 500 })
  }
}