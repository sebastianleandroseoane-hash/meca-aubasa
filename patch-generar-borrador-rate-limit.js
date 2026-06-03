const fs   = require('fs')
const path = require('path')

const filePath = path.join(
  process.cwd(),
  'app', 'api', 'generar-borrador-informe', 'route.ts'
)

// ── Guardar verificaciones previas ───────────────────────────────────────────
if (!fs.existsSync(filePath)) {
  console.error('ERROR: No existe', filePath)
  console.error('Ejecutá primero instalar-generar-borrador-informe.js')
  process.exit(1)
}

let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('ia_uso_logs')) {
  console.error('ERROR: El archivo ya tiene ia_uso_logs. El patch ya fue aplicado.')
  process.exit(1)
}

// ── PATCH 1: Agregar cliente service_role después de los imports ─────────────

const ANCHOR_IMPORTS = `import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'`

const IMPORTS_CON_SERVICE = `import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ─── Cliente service_role — solo para escritura de logs (bypasea RLS) ─────────

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}`

if (!content.includes(ANCHOR_IMPORTS)) {
  console.error('ERROR PATCH 1: No se encontró el anchor de imports')
  process.exit(1)
}
content = content.replace(ANCHOR_IMPORTS, IMPORTS_CON_SERVICE)
console.log('✅ PATCH 1: Cliente service_role agregado')

// ── PATCH 2: Insertar control de límite diario + log después del paso 3 ──────
// Ancla: el comentario "// 3. Verificar que la API key está configurada"
// Se inserta un nuevo bloque "// 3. Verificar límite diario" antes de ese comentario,
// y se renumera el de la API key a "// 4."

const ANCHOR_APIKEY = `  // 3. Verificar que la API key está configurada
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[generar-borrador] ANTHROPIC_API_KEY no configurada')
    return NextResponse.json({ ok: false, error: 'Servicio de IA no configurado' }, { status: 503 })
  }`

const APIKEY_CON_RATELIMIT = `  // 3. Verificar límite diario de uso de IA (20 usos por usuario cada 24 horas)
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
  }`

if (!content.includes(ANCHOR_APIKEY)) {
  console.error('ERROR PATCH 2: No se encontró el anchor del paso 3 (API key)')
  process.exit(1)
}
content = content.replace(ANCHOR_APIKEY, APIKEY_CON_RATELIMIT)
console.log('✅ PATCH 2: Control de límite diario agregado (paso 3)')

// ── PATCH 3: Renumerar pasos 4-9 → 5-10 ─────────────────────────────────────
// Los pasos originales 4 al 9 pasan a ser 5 al 10 para mantener numeración coherente

const renumeraciones = [
  ['  // 4. Construir el prompt',         '  // 5. Construir el prompt'],
  ['  // 5. Llamada a la API de Anthropic', '  // 6. Llamada a la API de Anthropic'],
  ['  // 6. Procesar respuesta de Anthropic', '  // 7. Procesar respuesta de Anthropic'],
  ['  // 7. Parsear el JSON devuelto por la IA', '  // 8. Parsear el JSON devuelto por la IA'],
  ['  // 8. Validar y sanear el borrador', '  // 9. Validar y sanear el borrador'],
  ['  // 9. Devolver resultado — nunca toca Supabase', '  // 10. Registrar log de uso y devolver resultado'],
]

for (const [viejo, nuevo] of renumeraciones) {
  if (!content.includes(viejo)) {
    console.error(`ERROR PATCH 3: No se encontró: "${viejo}"`)
    process.exit(1)
  }
  content = content.replace(viejo, nuevo)
}
console.log('✅ PATCH 3: Pasos renumerados correctamente')

// ── PATCH 4: Reemplazar el return final con log + return ─────────────────────

const RETURN_FINAL_VIEJO = `  // 10. Registrar log de uso y devolver resultado
  return NextResponse.json({ ok: true, borrador, advertencias })
}`

const RETURN_FINAL_NUEVO = `  // 10. Registrar log de uso y devolver resultado
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
}`

if (!content.includes(RETURN_FINAL_VIEJO)) {
  console.error('ERROR PATCH 4: No se encontró el return final para reemplazar')
  process.exit(1)
}
content = content.replace(RETURN_FINAL_VIEJO, RETURN_FINAL_NUEVO)
console.log('✅ PATCH 4: Log de uso insertado después de respuesta exitosa')

// ── Escribir el archivo final ────────────────────────────────────────────────
fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ Archivo actualizado:', filePath)

// ── Verificaciones post-patch ────────────────────────────────────────────────
const final = fs.readFileSync(filePath, 'utf8')

const checks = [
  ['ia_uso_logs',                     'Tabla ia_uso_logs referenciada'],
  ['usosHoy',                         'Variable de conteo presente'],
  ['>= 20',                           'Límite de 20 usos presente'],
  ['429',                             'Status 429 para límite alcanzado'],
  ['Límite diario de IA alcanzado',   'Mensaje de error correcto'],
  ['hace24h',                         'Ventana de 24 horas presente'],
  ['SUPABASE_SERVICE_ROLE_KEY',       'Service role key referenciada'],
  ['costo_estimado_usd: 0.002500',    'Costo estimado registrado'],
  ['errorLog',                        'Manejo de error en log presente'],
  ['order_id',                        ''],  // este NO debe estar
]

let todoOk = true
for (const [patron, desc] of checks) {
  if (!desc) continue  // skip
  if (final.includes(patron)) {
    console.log('  ✅', desc)
  } else {
    console.error('  ❌ FALTA:', desc, `(buscaba: "${patron}")`)
    todoOk = false
  }
}

// Verificar que el log NO se guarda antes del return de error de límite
const idxLimite  = final.indexOf('Límite diario de IA alcanzado')
const idxInsert  = final.indexOf(".from('ia_uso_logs')\n    .insert(")
if (idxInsert < idxLimite) {
  console.error('  ❌ ERROR DE ORDEN: el insert aparece ANTES del bloqueo por límite')
  todoOk = false
} else {
  console.log('  ✅ Orden correcto: log solo se guarda después del bloqueo')
}

// Verificar balanceo de llaves
let open = 0, close = 0
for (const ch of final) {
  if (ch === '{') open++
  if (ch === '}') close++
}
if (open !== close) {
  console.error(`  ❌ Llaves desbalanceadas: { ${open} vs } ${close}`)
  todoOk = false
} else {
  console.log(`  ✅ Llaves balanceadas (${open} pares)`)
}

console.log()
if (todoOk) {
  console.log('✅ Patch aplicado correctamente.')
  console.log()
  console.log('Verificá que en Vercel estén configuradas:')
  console.log('  - ANTHROPIC_API_KEY')
  console.log('  - SUPABASE_SERVICE_ROLE_KEY  (ya debería existir)')
  console.log()
  console.log('Cuando estés listo: git add . → git commit → git push')
} else {
  console.error('❌ Patch con errores. No hacer push hasta resolverlos.')
  process.exit(1)
}
