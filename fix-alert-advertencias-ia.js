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

// El string roto tiene saltos de línea literales dentro del alert
// Buscamos el bloque por partes para ser robustos ante variaciones de espaciado
if (!content.includes("json.advertencias?.length > 0")) {
  console.error('ERROR: No se encontró el bloque de advertencias. Verificá el archivo.')
  process.exit(1)
}

if (content.includes("const msgs = json.advertencias.join(' | ')")) {
  console.log('INFO: El fix ya está aplicado. No se modificó nada.')
  process.exit(0)
}

// Reemplazar el bloque completo usando regex para capturar el alert
// independientemente de cómo quedaron los saltos de línea
const REGEX_BLOQUE = /\/\/ Mostrar advertencias si las hay\s*\n\s*if \(json\.advertencias\?\.length > 0\) \{[\s\S]*?\}/

const BLOQUE_NUEVO = `// Mostrar advertencias si las hay
      if (json.advertencias?.length > 0) {
        const msgs = json.advertencias.join(' | ')
        alert('Borrador generado con observaciones: ' + msgs)
      }`

if (!REGEX_BLOQUE.test(content)) {
  console.error('ERROR: No se pudo localizar el bloque roto con el regex. No se modificó nada.')
  process.exit(1)
}

content = content.replace(REGEX_BLOQUE, BLOQUE_NUEVO)
fs.writeFileSync(filePath, content, 'utf8')

// Verificación
const final = fs.readFileSync(filePath, 'utf8')

const checks = [
  ["const msgs = json.advertencias.join(' | ')",      'Alert corregido con join limpio'],
  ["'Borrador generado con observaciones: ' + msgs",  'Mensaje de alert correcto'],
  ["json.advertencias?.length > 0",                   'Condición de advertencias presente'],
]

let ok = true
for (const [patron, desc] of checks) {
  if (final.includes(patron)) console.log('  ✅', desc)
  else { console.error('  ❌ FALTA:', desc); ok = false }
}

// Verificar que no quedan saltos de línea dentro de comillas simples en esa zona
const idxBloque = final.indexOf("Mostrar advertencias")
const fragmento = final.slice(idxBloque, idxBloque + 200)
if (fragmento.includes("Revisá estos campos")) {
  console.error("  ❌ El string roto original sigue presente")
  ok = false
} else {
  console.log('  ✅ String roto eliminado')
}

if (ok) console.log('\n✅ Fix aplicado. Podés hacer el build y el push.')
else { console.error('\n❌ Errores en la verificación.'); process.exit(1) }
