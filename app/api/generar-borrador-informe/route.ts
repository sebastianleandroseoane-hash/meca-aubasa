import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ─── Cliente service_role — solo para escritura de logs (bypasea RLS) ─────────

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface OTInput {
  id: string
  tipo?: string
  descripcion?: string
  activo_nombre?: string
  activo_tipo?: string
}

interface RequestBody {
  textoLibre: string
  ot: OTInput
}

interface BorradorInforme {
  estado_encontrado:    string        // '' si no se puede inferir
  causa_probable:       string        // '' si no se puede inferir
  causa_detalle:        string
  trabajo_realizado:    string        // '' si no se puede inferir
  trabajo_detalle:      string
  activo_operativo:     boolean | null
  requiere_seguimiento: boolean
  seguimiento_detalle:  string
  riesgo_tipo:          string        // 'ninguno' por defecto
  riesgo_controlado:    boolean
  observaciones_seguridad: string
  tension_entrada:      number | null
  tension_salida:       number | null
  corriente:            number | null
  mediciones_detalle:   string
}

// ─── Valores válidos (espejo exacto de los selects del formulario) ─────────────

const ESTADOS_ENCONTRADO  = ['operativo', 'falla_parcial', 'falla_total', 'sin_tension', 'intervenido']
const CAUSAS_PROBABLE     = ['sobrecarga', 'falla_aislacion', 'vandalismo', 'desgaste', 'desconocida', 'otro']
const TRABAJOS_REALIZADOS = ['reemplazo', 'reparacion', 'ajuste', 'limpieza', 'revision', 'otro']
const RIESGOS_TIPO        = ['ninguno', 'electrico', 'altura', 'transito', 'terceros', 'mecanico', 'ambiental', 'estructural', 'otro']

// ─── Validación del borrador devuelto por la IA ───────────────────────────────

function validarBorrador(raw: unknown): { borrador: BorradorInforme; advertencias: string[] } {
  const advertencias: string[] = []

  if (typeof raw !== 'object' || raw === null) {
    throw new Error('La IA no devolvió un objeto JSON válido')
  }

  const r = raw as Record<string, unknown>

  // estado_encontrado
  const estado_encontrado = ESTADOS_ENCONTRADO.includes(r.estado_encontrado as string)
    ? (r.estado_encontrado as string)
    : ''
  if (!estado_encontrado) advertencias.push('No se pudo inferir el estado encontrado del activo')

  // causa_probable
  const causa_probable = CAUSAS_PROBABLE.includes(r.causa_probable as string)
    ? (r.causa_probable as string)
    : ''
  if (!causa_probable) advertencias.push('No se pudo inferir la causa probable')

  // trabajo_realizado
  const trabajo_realizado = TRABAJOS_REALIZADOS.includes(r.trabajo_realizado as string)
    ? (r.trabajo_realizado as string)
    : ''
  if (!trabajo_realizado) advertencias.push('No se pudo inferir el tipo de trabajo realizado')

  // riesgo_tipo — default 'ninguno' si no viene o es inválido
  const riesgo_tipo = RIESGOS_TIPO.includes(r.riesgo_tipo as string)
    ? (r.riesgo_tipo as string)
    : 'ninguno'

  // activo_operativo — debe ser boolean o null
  let activo_operativo: boolean | null = null
  if (typeof r.activo_operativo === 'boolean') {
    activo_operativo = r.activo_operativo
  } else {
    advertencias.push('No se pudo determinar si el activo quedó operativo')
  }

  // mediciones — number o null
  const parsearMedicion = (val: unknown, campo: string): number | null => {
    if (val === null || val === undefined || val === '') return null
    const n = Number(val)
    if (isNaN(n)) {
      advertencias.push(`Medición "${campo}" no reconocida, se dejó en blanco`)
      return null
    }
    return n
  }

  const borrador: BorradorInforme = {
    estado_encontrado,
    causa_probable,
    causa_detalle:        typeof r.causa_detalle === 'string'           ? r.causa_detalle.trim()            : '',
    trabajo_realizado,
    trabajo_detalle:      typeof r.trabajo_detalle === 'string'         ? r.trabajo_detalle.trim()          : '',
    activo_operativo,
    requiere_seguimiento: typeof r.requiere_seguimiento === 'boolean'   ? r.requiere_seguimiento            : false,
    seguimiento_detalle:  typeof r.seguimiento_detalle === 'string'     ? r.seguimiento_detalle.trim()      : '',
    riesgo_tipo,
    riesgo_controlado:    typeof r.riesgo_controlado === 'boolean'      ? r.riesgo_controlado               : true,
    observaciones_seguridad: typeof r.observaciones_seguridad === 'string' ? r.observaciones_seguridad.trim() : '',
    tension_entrada:      parsearMedicion(r.tension_entrada,  'tension_entrada'),
    tension_salida:       parsearMedicion(r.tension_salida,   'tension_salida'),
    corriente:            parsearMedicion(r.corriente,        'corriente'),
    mediciones_detalle:   typeof r.mediciones_detalle === 'string'      ? r.mediciones_detalle.trim()       : '',
  }

  // Advertencias de coherencia
  if (borrador.riesgo_tipo !== 'ninguno' && !borrador.observaciones_seguridad) {
    advertencias.push('Se detectó un riesgo pero no hay observaciones de seguridad — completá este campo antes de enviar')
  }
  if (borrador.requiere_seguimiento && !borrador.seguimiento_detalle) {
    advertencias.push('Se marcó seguimiento requerido pero falta el detalle — completá antes de enviar')
  }

  return { borrador, advertencias }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {

  // 1. Autenticación — mismo patrón que el resto de la app
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
  }

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Sesión inválida' }, { status: 401 })
  }

  // 2. Parseo y validación del body
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Body JSON inválido' }, { status: 400 })
  }

  const { textoLibre, ot } = body

  if (!textoLibre || typeof textoLibre !== 'string' || textoLibre.trim().length < 10) {
    return NextResponse.json({ ok: false, error: 'textoLibre es requerido (mínimo 10 caracteres)' }, { status: 400 })
  }
  if (!ot?.id) {
    return NextResponse.json({ ok: false, error: 'ot.id es requerido' }, { status: 400 })
  }

  // 3. Verificar límite diario de uso de IA (20 usos por usuario cada 24 horas)
  const supabaseService = getServiceClient()
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count: usosHoy, error: errorConteo } = await supabaseService
    .from('ia_uso_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', hace24h)

  if (errorConteo) {
    console.error('[generar-borrador] Error al consultar límite diario:', errorConteo)
    // Si falla la consulta del límite, bloqueamos por precaución
    return NextResponse.json(
      { ok: false, error: 'Error al verificar límite de uso. Intentá de nuevo.' },
      { status: 503 }
    )
  }

  if ((usosHoy ?? 0) >= 20) {
    return NextResponse.json(
      { ok: false, error: 'Límite diario de IA alcanzado. Podés volver a usar el servicio en 24 horas.' },
      { status: 429 }
    )
  }

  // 4. Verificar que la API key está configurada
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[generar-borrador] ANTHROPIC_API_KEY no configurada')
    return NextResponse.json({ ok: false, error: 'Servicio de IA no configurado' }, { status: 503 })
  }

  // 5. Construir el prompt
  const systemPrompt = `Sos un asistente técnico especializado en mantenimiento eléctrico de autopistas.
Tu tarea es analizar el relato de un técnico electricista y extraer información estructurada para completar un informe técnico.

IMPORTANTE:
- Devolvé ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.
- Usá exactamente los valores de los enums indicados. Si no podés inferir un campo con certeza, dejalo como null o string vacío según corresponda.
- No inventes datos que no estén en el texto del técnico.
- Los campos de medición (tension_entrada, tension_salida, corriente) deben ser número o null.

ENUMS VÁLIDOS:
- estado_encontrado: "operativo" | "falla_parcial" | "falla_total" | "sin_tension" | "intervenido" | ""
- causa_probable: "sobrecarga" | "falla_aislacion" | "vandalismo" | "desgaste" | "desconocida" | "otro" | ""
- trabajo_realizado: "reemplazo" | "reparacion" | "ajuste" | "limpieza" | "revision" | "otro" | ""
- riesgo_tipo: "ninguno" | "electrico" | "altura" | "transito" | "terceros" | "mecanico" | "ambiental" | "estructural" | "otro"

ESTRUCTURA JSON A DEVOLVER:
{
  "estado_encontrado": string,
  "causa_probable": string,
  "causa_detalle": string,
  "trabajo_realizado": string,
  "trabajo_detalle": string,
  "activo_operativo": boolean | null,
  "requiere_seguimiento": boolean,
  "seguimiento_detalle": string,
  "riesgo_tipo": string,
  "riesgo_controlado": boolean,
  "observaciones_seguridad": string,
  "tension_entrada": number | null,
  "tension_salida": number | null,
  "corriente": number | null,
  "mediciones_detalle": string
}`

  const contextoOT = [
    `OT ID: ${ot.id}`,
    ot.tipo            ? `Tipo de OT: ${ot.tipo}`                 : null,
    ot.descripcion     ? `Descripción de la OT: ${ot.descripcion}` : null,
    ot.activo_nombre   ? `Activo intervenido: ${ot.activo_nombre}` : null,
    ot.activo_tipo     ? `Tipo de activo: ${ot.activo_tipo}`       : null,
  ].filter(Boolean).join('\n')

  const userMessage = `CONTEXTO DE LA ORDEN DE TRABAJO:
${contextoOT}

RELATO DEL TÉCNICO:
${textoLibre.trim()}

Generá el JSON del informe técnico basándote en este relato.`

  // 6. Llamada a la API de Anthropic
  let iaResponse: Response
  try {
    iaResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            apiKey,
        'anthropic-version':    '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system:     systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ],
      }),
    })
  } catch (err) {
    console.error('[generar-borrador] Error de red al llamar a Anthropic:', err)
    return NextResponse.json({ ok: false, error: 'Error de conexión con el servicio de IA' }, { status: 502 })
  }

  // 7. Procesar respuesta de Anthropic
  if (!iaResponse.ok) {
    const errorBody = await iaResponse.text().catch(() => '')
    console.error('[generar-borrador] Anthropic devolvió error:', iaResponse.status, errorBody)
    return NextResponse.json(
      { ok: false, error: `Error del servicio de IA (${iaResponse.status})` },
      { status: 502 }
    )
  }

  let iaData: { content?: Array<{ type: string; text?: string }> }
  try {
    iaData = await iaResponse.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Respuesta de IA malformada' }, { status: 502 })
  }

  const textBlock = iaData.content?.find(b => b.type === 'text')?.text ?? ''
  if (!textBlock) {
    return NextResponse.json({ ok: false, error: 'La IA no devolvió contenido' }, { status: 502 })
  }

  // 8. Parsear el JSON devuelto por la IA
  let rawBorrador: unknown
  try {
    // Limpiar posibles bloques markdown que la IA incluya por error
    const limpio = textBlock.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    rawBorrador = JSON.parse(limpio)
  } catch {
    console.error('[generar-borrador] JSON inválido de la IA:', textBlock)
    return NextResponse.json({ ok: false, error: 'La IA devolvió un formato inesperado. Intentá de nuevo.' }, { status: 502 })
  }

  // 9. Validar y sanear el borrador
  let borrador: BorradorInforme
  let advertencias: string[]
  try {
    ;({ borrador, advertencias } = validarBorrador(rawBorrador))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al validar el borrador'
    return NextResponse.json({ ok: false, error: msg }, { status: 502 })
  }

  // 10. Registrar log de uso y devolver resultado
  //     El log se guarda DESPUÉS de una respuesta exitosa — nunca antes.
  //     Si falla el log, igual devolvemos el borrador (no bloqueamos al técnico).
  //     costo_estimado_usd: ~1000 tokens input ($0.001) + ~300 output ($0.0015) = $0.0025
  const { error: errorLog } = await supabaseService
    .from('ia_uso_logs')
    .insert({
      user_id:            user.id,
      orden_id:           ot.id,
      endpoint:           'generar-borrador-informe',
      modelo:             'claude-haiku-4-5-20251001',
      costo_estimado_usd: 0.002500,
    })

  if (errorLog) {
    // Log no crítico — no interrumpimos la respuesta al técnico
    console.error('[generar-borrador] Error al guardar log de uso:', errorLog)
  }

  return NextResponse.json({ ok: true, borrador, advertencias })
}
