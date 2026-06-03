const fs   = require('fs')
const path = require('path')

// ── Archivos ──────────────────────────────────────────────────────────────────
const pathPage    = path.join(process.cwd(), 'app', 'dashboard', 'tecnico-electrico', 'page.tsx')
const pathRoute   = path.join(process.cwd(), 'app', 'api', 'generar-borrador-informe', 'route.ts')

for (const f of [pathPage, pathRoute]) {
  if (!fs.existsSync(f)) {
    console.error('ERROR: No se encontró', f)
    process.exit(1)
  }
}

let page  = fs.readFileSync(pathPage,  'utf8')
let route = fs.readFileSync(pathRoute, 'utf8')

if (page.includes('numero_orden: ordenDetalle.numero_orden')) {
  console.error('ERROR: El patch ya fue aplicado en page.tsx.')
  process.exit(1)
}
if (route.includes('numero_orden?: number')) {
  console.error('ERROR: El patch ya fue aplicado en route.ts.')
  process.exit(1)
}

// ════════════════════════════════════════════════════════════════════════════
// PATCH A — page.tsx: ampliar objeto ot enviado al endpoint
// ════════════════════════════════════════════════════════════════════════════

const OT_VIEJO = `          ot: {
            id:           ordenDetalle.id,
            tipo:         ordenDetalle.tipo          ?? undefined,
            descripcion:  ordenDetalle.descripcion   ?? undefined,
            activo_nombre: ordenDetalle.activo_nombre ?? undefined,
            activo_tipo:  ordenDetalle.activo_tipo   ?? undefined,
          },`

const OT_NUEVO = `          ot: {
            id:            ordenDetalle.id,
            numero_orden:  ordenDetalle.numero_orden  ?? undefined,
            titulo:        ordenDetalle.titulo        ?? undefined,
            tipo:          ordenDetalle.tipo          ?? undefined,
            descripcion:   ordenDetalle.descripcion   ?? undefined,
            prioridad:     ordenDetalle.prioridad     ?? undefined,
            km:            ordenDetalle.km            ?? undefined,
            ubicacion:     ordenDetalle.ubicacion     ?? undefined,
            activo_nombre: ordenDetalle.activo_nombre ?? undefined,
            activo_tipo:   ordenDetalle.activo_tipo   ?? undefined,
            tecnicos: ordenDetalle.tecnicos
              ? ordenDetalle.tecnicos.map((t: any) => (t.profiles?.apellido && t.profiles?.nombre ? t.profiles.apellido + ', ' + t.profiles.nombre : null)).filter(Boolean)
              : [],
            materiales: ordenDetalle.materiales
              ? ordenDetalle.materiales.filter((m: any) => m.estado === 'entregado').map((m: any) => ({ nombre: m.materiales?.nombre ?? '', cantidad: m.cantidad ?? 0, unidad: m.materiales?.unidad ?? '' }))
              : [],
          },`

if (!page.includes(OT_VIEJO)) {
  console.error('ERROR PATCH A: No se encontró el objeto ot original en page.tsx.')
  process.exit(1)
}
page = page.replace(OT_VIEJO, OT_NUEVO)
console.log('✅ PATCH A: objeto ot ampliado en page.tsx')

// ════════════════════════════════════════════════════════════════════════════
// PATCH B — route.ts: actualizar interfaz OTInput
// ════════════════════════════════════════════════════════════════════════════

const INTERFACE_VIEJA = `interface OTInput {
  id: string
  tipo?: string
  descripcion?: string
  activo_nombre?: string
  activo_tipo?: string
}`

const INTERFACE_NUEVA = `interface OTInput {
  id: string
  numero_orden?: number
  titulo?: string
  tipo?: string
  descripcion?: string
  prioridad?: string
  km?: string | number
  ubicacion?: string
  activo_nombre?: string
  activo_tipo?: string
  tecnicos?: string[]
  materiales?: Array<{ nombre: string; cantidad: number; unidad: string }>
}`

if (!route.includes(INTERFACE_VIEJA)) {
  console.error('ERROR PATCH B: No se encontró la interfaz OTInput original en route.ts.')
  process.exit(1)
}
route = route.replace(INTERFACE_VIEJA, INTERFACE_NUEVA)
console.log('✅ PATCH B: interfaz OTInput actualizada en route.ts')

// ════════════════════════════════════════════════════════════════════════════
// PATCH C — route.ts: mejorar prompt y contextoOT
// ════════════════════════════════════════════════════════════════════════════

const PROMPT_VIEJO = `  // 5. Construir el prompt
  const systemPrompt = \`Sos un asistente técnico especializado en mantenimiento eléctrico de autopistas.
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
}\`

  const contextoOT = [
    \`OT ID: \${ot.id}\`,
    ot.tipo            ? \`Tipo de OT: \${ot.tipo}\`                 : null,
    ot.descripcion     ? \`Descripción de la OT: \${ot.descripcion}\` : null,
    ot.activo_nombre   ? \`Activo intervenido: \${ot.activo_nombre}\` : null,
    ot.activo_tipo     ? \`Tipo de activo: \${ot.activo_tipo}\`       : null,
  ].filter(Boolean).join('\\n')

  const userMessage = \`CONTEXTO DE LA ORDEN DE TRABAJO:
\${contextoOT}

RELATO DEL TÉCNICO:
\${textoLibre.trim()}

Generá el JSON del informe técnico basándote en este relato.\``

const PROMPT_NUEVO = `  // 5. Construir el prompt
  const systemPrompt = \`Sos un asistente técnico especializado en mantenimiento eléctrico de autopistas. Redactás informes técnicos formales para supervisores y jefes de mantenimiento.

REGLAS ABSOLUTAS:
- Devolvé ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.
- Usá exactamente los valores de los enums indicados. Si no podés inferir un campo, dejalo como string vacío o null.
- JAMÁS inventes datos. Si un dato no está en el relato ni en el contexto, no lo menciones.
- No inventes técnicos, materiales, mediciones ni ubicaciones que no figuren explícitamente.
- Los campos de medición (tension_entrada, tension_salida, corriente) deben ser número o null.

ENUMS VÁLIDOS:
- estado_encontrado: "operativo" | "falla_parcial" | "falla_total" | "sin_tension" | "intervenido" | ""
- causa_probable: "sobrecarga" | "falla_aislacion" | "vandalismo" | "desgaste" | "desconocida" | "otro" | ""
- trabajo_realizado: "reemplazo" | "reparacion" | "ajuste" | "limpieza" | "revision" | "otro" | ""
- riesgo_tipo: "ninguno" | "electrico" | "altura" | "transito" | "terceros" | "mecanico" | "ambiental" | "estructural" | "otro"

CAMPO trabajo_detalle — INSTRUCCIONES ESPECIALES:
Este campo debe contener un informe técnico redactado en párrafos completos, formal, claro y apto para supervisor y jefe.
NO es una frase corta. Es un informe de intervención completo.
Estructura del informe (incluí solo los bloques para los que tenés datos reales):
1. Origen: mencionar número de OT si existe, motivo o descripción original de la solicitud.
2. Activo e inspección: identificación del activo, ubicación (km, sector), condición encontrada al arribo.
3. Diagnóstico: causa detectada, descripción técnica del problema.
4. Trabajos realizados: descripción precisa de las tareas ejecutadas.
5. Materiales utilizados: listar solo los materiales que figuran en el contexto.
6. Mediciones: solo si existen valores reales.
7. Participantes: solo los técnicos que figuran en el contexto.
8. Condición final: estado operativo del activo al cierre de la intervención.
9. Riesgos y seguridad: solo si hubo riesgo real.
10. Seguimiento: solo si se requiere intervención futura.
Tono: técnico, formal, tercera persona, sin abreviaciones informales.\`

  const tecnicosStr = ot.tecnicos && ot.tecnicos.length > 0
    ? ot.tecnicos.join(', ')
    : null

  const materialesStr = ot.materiales && ot.materiales.length > 0
    ? ot.materiales.map((m: { nombre: string; cantidad: number; unidad: string }) => m.cantidad + ' ' + m.unidad + ' de ' + m.nombre).join(', ')
    : null

  const contextoOT = [
    ot.numero_orden    ? 'Número de OT: OT-' + String(ot.numero_orden).padStart(5, '0') : null,
    ot.titulo          ? 'Título de la OT: ' + ot.titulo                                 : null,
    ot.tipo            ? 'Tipo de OT: ' + ot.tipo                                        : null,
    ot.prioridad       ? 'Prioridad: ' + ot.prioridad                                    : null,
    ot.descripcion     ? 'Descripción original: ' + ot.descripcion                       : null,
    ot.activo_nombre   ? 'Activo intervenido: ' + ot.activo_nombre                       : null,
    ot.activo_tipo     ? 'Tipo de activo: ' + ot.activo_tipo                             : null,
    ot.km              ? 'Kilómetro: ' + ot.km                                           : null,
    ot.ubicacion       ? 'Ubicación: ' + ot.ubicacion                                    : null,
    tecnicosStr        ? 'Técnicos participantes: ' + tecnicosStr                        : null,
    materialesStr      ? 'Materiales entregados: ' + materialesStr                       : null,
  ].filter(Boolean).join('\\n')

  const userMessage = \`CONTEXTO DE LA ORDEN DE TRABAJO:
\${contextoOT}

RELATO DEL TÉCNICO:
\${textoLibre.trim()}

Generá el JSON del informe técnico. El campo trabajo_detalle debe ser un informe técnico completo en párrafos, no una frase corta.\``

if (!route.includes(PROMPT_VIEJO)) {
  console.error('ERROR PATCH C: No se encontró el bloque del prompt original en route.ts.')
  process.exit(1)
}
route = route.replace(PROMPT_VIEJO, PROMPT_NUEVO)
console.log('✅ PATCH C: prompt mejorado en route.ts')

// ── Escribir archivos ─────────────────────────────────────────────────────────
fs.writeFileSync(pathPage,  page,  'utf8')
fs.writeFileSync(pathRoute, route, 'utf8')

// ── Verificaciones ────────────────────────────────────────────────────────────
const finalPage  = fs.readFileSync(pathPage,  'utf8')
const finalRoute = fs.readFileSync(pathRoute, 'utf8')

const checksPage = [
  ['numero_orden:',                              'numero_orden en objeto ot'],
  ['titulo:',                                    'titulo en objeto ot'],
  ['km:',                                        'km en objeto ot'],
  ['tecnicos: ordenDetalle.tecnicos',            'tecnicos en objeto ot'],
  ['materiales: ordenDetalle.materiales',        'materiales en objeto ot'],
  ["estado === 'entregado'",                     'filtro materiales entregados'],
]

const checksRoute = [
  ['numero_orden?: number',                      'numero_orden en interfaz'],
  ['tecnicos?: string[]',                        'tecnicos en interfaz'],
  ['materiales?: Array',                         'materiales en interfaz'],
  ['trabajo_detalle — INSTRUCCIONES ESPECIALES', 'instrucciones de informe en prompt'],
  ['Origen: mencionar número de OT',             'estructura del informe en prompt'],
  ['JAMÁS inventes datos',                       'regla anti-invención en prompt'],
  ['Número de OT: OT-',                          'número de OT en contextoOT'],
  ['Técnicos participantes:',                    'técnicos en contextoOT'],
  ['Materiales entregados:',                     'materiales en contextoOT'],
  ['informe técnico completo en párrafos',       'instrucción de párrafos en userMessage'],
]

let ok = true
console.log('\n── Verificaciones page.tsx ──')
for (const [patron, desc] of checksPage) {
  if (finalPage.includes(patron)) console.log('  ✅', desc)
  else { console.error('  ❌ FALTA:', desc); ok = false }
}

console.log('\n── Verificaciones route.ts ──')
for (const [patron, desc] of checksRoute) {
  if (finalRoute.includes(patron)) console.log('  ✅', desc)
  else { console.error('  ❌ FALTA:', desc); ok = false }
}

// Balanceo llaves page.tsx
let op = 0, cl = 0
for (const ch of finalPage) { if (ch === '{') op++; if (ch === '}') cl++ }
if (op !== cl) { console.error(`  ❌ page.tsx llaves desbalanceadas: { ${op} vs } ${cl}`); ok = false }
else console.log(`\n  ✅ page.tsx llaves balanceadas (${op} pares)`)

if (ok) {
  console.log('\n✅ Patch completo.')
  console.log('\nnpm run build')
  console.log('git add .')
  console.log('git commit -m "feat: mejora redaccion tecnica del informe IA"')
  console.log('git push origin main')
} else {
  console.error('\n❌ Errores en verificación. No hacer push.')
  process.exit(1)
}
