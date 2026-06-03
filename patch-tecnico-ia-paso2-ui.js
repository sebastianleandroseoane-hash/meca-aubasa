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

if (content.includes('Asistente IA para informe técnico')) {
  console.error('ERROR: El bloque IA ya existe en el archivo. Patch ya aplicado.')
  process.exit(1)
}

if (!content.includes('iaTextoLibre')) {
  console.error('ERROR: iaTextoLibre no existe. Aplicá primero el paso 1.')
  process.exit(1)
}

const ANCHOR = `                  <div style={{ fontSize: 10, color: '#1ABBD6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4, fontWeight: 700 }}>Diagnóstico</div>`

const BLOQUE_IA = `                  {/* ── Asistente IA ─────────────────────────────────── */}
                  <div style={{ background: '#071f2e', border: '1px solid #1ABBD655', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#1ABBD6', fontWeight: 700, marginBottom: 4 }}>🤖 Asistente IA para informe técnico</div>
                    <div style={{ fontSize: 11, color: '#4a8fa0', marginBottom: 10 }}>
                      Describí en tus palabras qué encontraste y qué hiciste. La IA va a completar el formulario como borrador. Vos revisás y corregís antes de enviar.
                    </div>
                    <textarea
                      value={iaTextoLibre}
                      onChange={e => setIaTextoLibre(e.target.value)}
                      rows={4}
                      placeholder="Ej: Llegué al SET 12, la lámpara estaba apagada por fusible quemado. Cambié el fusible 6A y quedó funcionando. Medí 220V de entrada."
                      style={{ width: '100%', background: '#07131a', border: '1px solid #1a3040', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e8f4f8', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }}
                    />
                    <button
                      disabled={loadingIA || iaTextoLibre.trim().length < 10}
                      style={{
                        width: '100%',
                        padding: '10px 0',
                        borderRadius: 8,
                        border: 'none',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: loadingIA || iaTextoLibre.trim().length < 10 ? 'not-allowed' : 'pointer',
                        background: loadingIA || iaTextoLibre.trim().length < 10 ? '#1a3040' : '#1ABBD6',
                        color: loadingIA || iaTextoLibre.trim().length < 10 ? '#4a8fa0' : '#07131a',
                      }}
                    >
                      {loadingIA ? 'Generando...' : '🤖 Generar borrador'}
                    </button>
                  </div>
                  {/* ── Fin Asistente IA ─────────────────────────────────── */}

                  <div style={{ fontSize: 10, color: '#1ABBD6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4, fontWeight: 700 }}>Diagnóstico</div>`

if (!content.includes(ANCHOR)) {
  console.error('ERROR: No se encontró el anchor de Diagnóstico. No se modificó nada.')
  process.exit(1)
}

// El ANCHOR ya está incluido al final de BLOQUE_IA — reemplazamos el anchor solo
content = content.replace(ANCHOR, BLOQUE_IA)
fs.writeFileSync(filePath, content, 'utf8')

// Verificación
const final = fs.readFileSync(filePath, 'utf8')
const checks = [
  ['Asistente IA para informe técnico',   'Título del bloque IA'],
  ['iaTextoLibre',                         'textarea conectado a iaTextoLibre'],
  ['setIaTextoLibre',                      'onChange conectado a setIaTextoLibre'],
  ['loadingIA',                            'disabled con loadingIA'],
  ['Generar borrador',                     'Texto del botón'],
  ['Generando...',                         'Estado de carga del botón'],
  ['trim().length < 10',                   'Validación mínimo 10 caracteres'],
  ['Diagnóstico',                          'Sección Diagnóstico sigue presente'],
]

let ok = true
for (const [patron, desc] of checks) {
  if (final.includes(patron)) console.log('  ✅', desc)
  else { console.error('  ❌ FALTA:', desc); ok = false }
}

// Verificar que el botón NO tiene onClick todavía
if (final.includes('generarBorradorIA')) {
  console.error('  ❌ ERROR: generarBorradorIA no debería existir en este paso')
  ok = false
} else {
  console.log('  ✅ Botón sin onClick (correcto para este paso)')
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

if (ok) console.log('\n✅ Paso 2 completo. Bloque visual IA insertado.')
else { console.error('\n❌ Errores en la verificación.'); process.exit(1) }
