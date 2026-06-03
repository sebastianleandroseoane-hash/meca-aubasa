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

if (content.includes('iaTextoLibre')) {
  console.error('ERROR: iaTextoLibre ya existe en el archivo. Patch ya aplicado.')
  process.exit(1)
}

const VIEJO = `  const [itMedicionesDetalle, setItMedicionesDetalle] = useState('')`

const NUEVO = `  const [itMedicionesDetalle, setItMedicionesDetalle] = useState('')

  // Asistente IA
  const [iaTextoLibre, setIaTextoLibre]   = useState('')
  const [loadingIA, setLoadingIA]         = useState(false)`

if (!content.includes(VIEJO)) {
  console.error('ERROR: No se encontró el anchor exacto. No se modificó nada.')
  process.exit(1)
}

content = content.replace(VIEJO, NUEVO)
fs.writeFileSync(filePath, content, 'utf8')

// Verificación
const final = fs.readFileSync(filePath, 'utf8')
const checks = [
  ["iaTextoLibre",   "Estado iaTextoLibre presente"],
  ["loadingIA",      "Estado loadingIA presente"],
  ["Asistente IA",   "Comentario de sección presente"],
]
let ok = true
for (const [patron, desc] of checks) {
  if (final.includes(patron)) console.log('  ✅', desc)
  else { console.error('  ❌ FALTA:', desc); ok = false }
}

if (ok) console.log('\n✅ Paso 1 completo. Dos estados agregados, nada más.')
else { console.error('\n❌ Errores en la verificación.'); process.exit(1) }
