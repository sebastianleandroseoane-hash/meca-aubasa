const fs   = require('fs')
const path = require('path')

const filePath = path.join(
  process.cwd(),
  'app', 'dashboard', 'tecnico-electrico', 'page.tsx'
)

if (!fs.existsSync(filePath)) {
  console.error('ERROR: No se encontró', filePath)
  process.exit(1)
}

let content = fs.readFileSync(filePath, 'utf8')

if (content.includes('generarBorradorIA')) {
  console.error('ERROR: generarBorradorIA ya existe. Patch ya aplicado.')
  process.exit(1)
}

if (!content.includes('iaTextoLibre')) {
  console.error('ERROR: iaTextoLibre no existe. Aplicá primero los pasos 1 y 2.')
  process.exit(1)
}

// ── PATCH 1: Insertar función generarBorradorIA antes de resetInforme ─────────

const ANCHOR_RESET = ` function resetInforme() {`

const FUNCION_IA = ` async function generarBorradorIA() {
    if (loadingIA || iaTextoLibre.trim().length < 10) return
    if (!ordenDetalle) { alert('No hay OT seleccionada.'); return }
    setLoadingIA(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { alert('Sesión no válida. Recargá la página.'); return }

      const res = await fetch('/api/generar-borrador-informe', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({
          textoLibre: iaTextoLibre,
          ot: {
            id:           ordenDetalle.id,
            tipo:         ordenDetalle.tipo          ?? undefined,
            descripcion:  ordenDetalle.descripcion   ?? undefined,
            activo_nombre: ordenDetalle.activo_nombre ?? undefined,
            activo_tipo:  ordenDetalle.activo_tipo   ?? undefined,
          },
        }),
      })

      const json = await res.json()

      if (!json.ok) {
        alert('Error al generar borrador: ' + (json.error ?? 'Error desconocido'))
        return
      }

      const b = json.borrador

      // Volcar el borrador en los campos del formulario
      if (b.estado_encontrado)     setItEstadoEncontrado(b.estado_encontrado)
      if (b.causa_probable)        setItCausaProbable(b.causa_probable)
      if (b.causa_detalle)         setItCausaDetalle(b.causa_detalle)
      if (b.trabajo_realizado)     setItTrabajoRealizado(b.trabajo_realizado)
      if (b.trabajo_detalle)       setItTrabajoDetalle(b.trabajo_detalle)
      if (b.activo_operativo !== null) setItActivoOperativo(b.activo_operativo)
      setItRequiereSeguimiento(!!b.requiere_seguimiento)
      if (b.seguimiento_detalle)   setItSeguimientoDetalle(b.seguimiento_detalle)
      if (b.riesgo_tipo)           setItRiesgoTipo(b.riesgo_tipo)
      setItRiesgoControlado(b.riesgo_controlado ?? true)
      if (b.observaciones_seguridad) setItObservacionesSeguridad(b.observaciones_seguridad)
      // tension/corriente vienen como number|null — convertir a string para los inputs
      setItTensionEntrada(b.tension_entrada != null ? String(b.tension_entrada) : '')
      setItTensionSalida(b.tension_salida   != null ? String(b.tension_salida)  : '')
      setItCorriente(b.corriente            != null ? String(b.corriente)        : '')
      if (b.mediciones_detalle)    setItMedicionesDetalle(b.mediciones_detalle)

      // Mostrar advertencias si las hay
      if (json.advertencias?.length > 0) {
        alert('Borrador generado. Revisá estos campos antes de enviar:\n\n• ' + json.advertencias.join('\n• '))
      }

    } catch (err) {
      console.error('[generarBorradorIA]', err)
      alert('Error de conexión al generar el borrador. Intentá de nuevo.')
    } finally {
      setLoadingIA(false)
    }
  }

 function resetInforme() {`

if (!content.includes(ANCHOR_RESET)) {
  console.error('ERROR PATCH 1: No se encontró el anchor de resetInforme.')
  process.exit(1)
}

content = content.replace(ANCHOR_RESET, FUNCION_IA)
console.log('✅ PATCH 1: Función generarBorradorIA insertada')

// ── PATCH 2: Agregar onClick al botón del Asistente IA ────────────────────────

const BOTON_SIN_CLICK = `                    <button
                      disabled={loadingIA || iaTextoLibre.trim().length < 10}`

const BOTON_CON_CLICK = `                    <button
                      onClick={generarBorradorIA}
                      disabled={loadingIA || iaTextoLibre.trim().length < 10}`

if (!content.includes(BOTON_SIN_CLICK)) {
  console.error('ERROR PATCH 2: No se encontró el botón sin onClick.')
  process.exit(1)
}

content = content.replace(BOTON_SIN_CLICK, BOTON_CON_CLICK)
console.log('✅ PATCH 2: onClick={generarBorradorIA} agregado al botón')

// ── Escribir archivo ──────────────────────────────────────────────────────────
fs.writeFileSync(filePath, content, 'utf8')

// ── Verificaciones ────────────────────────────────────────────────────────────
const final = fs.readFileSync(filePath, 'utf8')

const checks = [
  ['generarBorradorIA',                   'Función generarBorradorIA presente'],
  ['onClick={generarBorradorIA}',          'onClick conectado al botón'],
  ['generar-borrador-informe',             'Llamada al endpoint correcto'],
  ['session.access_token',                 'Token de sesión usado'],
  ['json.borrador',                        'Respuesta del endpoint procesada'],
  ['setItEstadoEncontrado',               'Vuelca estado_encontrado'],
  ['setItTrabajoDetalle',                 'Vuelca trabajo_detalle'],
  ['setItActivoOperativo',               'Vuelca activo_operativo'],
  ['setItRiesgoTipo',                     'Vuelca riesgo_tipo'],
  ['String(b.tension_entrada)',           'Convierte tension_entrada a string'],
  ['json.advertencias',                   'Muestra advertencias al técnico'],
  ['setLoadingIA(false)',                 'loadingIA se resetea en finally'],
  ['resetInforme',                        'resetInforme sigue presente'],
]

let ok = true
for (const [patron, desc] of checks) {
  if (final.includes(patron)) console.log('  ✅', desc)
  else { console.error('  ❌ FALTA:', desc); ok = false }
}

// Balanceo de llaves
let open = 0, close = 0
for (const ch of final) {
  if (ch === '{') open++
  if (ch === '}') close++
}
if (open !== close) {
  console.error(`  ❌ Llaves desbalanceadas: { ${open} vs } ${close}`)
  ok = false
} else {
  console.log(`  ✅ Llaves balanceadas (${open} pares)`)
}

if (ok) console.log('\n✅ Paso 3 completo. Función IA conectada al botón.')
else { console.error('\n❌ Errores en la verificación.'); process.exit(1) }
