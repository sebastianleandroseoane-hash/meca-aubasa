/**
 * cargar_progresivas.js
 * Carga las 489 progresivas del KMZ en la tabla `progresivas` de Supabase.
 * 
 * Ejecución:
 *   node cargar_progresivas.js
 * 
 * Requiere:
 *   npm install @supabase/supabase-js
 *   Variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jytsmgxwlzexijskqakt.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY // usar service key, no anon key

if (!SUPABASE_KEY) {
  console.error('Falta SUPABASE_SERVICE_KEY en variables de entorno')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Progresivas extraídas del KMZ — coordenadas reales, sin inventar
// Fuente: Autopista_LP-BSAS.kmz → doc.kml
const PROGRESIVAS = [
  { codigo: "3+000",  km: 3.000, lon: -58.370212, lat: -34.622423 },
  { codigo: "3+100",  km: 3.100, lon: -58.369138, lat: -34.622457 },
  { codigo: "3+200",  km: 3.200, lon: -58.368042, lat: -34.622308 },
  { codigo: "3+300",  km: 3.300, lon: -58.366963, lat: -34.622214 },
  { codigo: "3+400",  km: 3.400, lon: -58.365913, lat: -34.622371 },
  { codigo: "3+500",  km: 3.500, lon: -58.365245, lat: -34.622994 },
  { codigo: "3+600",  km: 3.600, lon: -58.364589, lat: -34.623656 },
  { codigo: "3+700",  km: 3.700, lon: -58.363660, lat: -34.624351 },
  { codigo: "3+800",  km: 3.800, lon: -58.362685, lat: -34.624796 },
  { codigo: "3+900",  km: 3.900, lon: -58.361643, lat: -34.625194 },
  { codigo: "4+000",  km: 4.000, lon: -58.359521, lat: -34.626113 },
  { codigo: "4+200",  km: 4.200, lon: -58.358574, lat: -34.626463 },
  { codigo: "4+300",  km: 4.300, lon: -58.357785, lat: -34.627279 },
  { codigo: "4+400",  km: 4.400, lon: -58.356944, lat: -34.627873 },
  { codigo: "4+500",  km: 4.500, lon: -58.356099, lat: -34.628384 },
  { codigo: "4+600",  km: 4.600, lon: -58.355278, lat: -34.628975 },
  { codigo: "4+700",  km: 4.700, lon: -58.354637, lat: -34.629664 },
  { codigo: "4+800",  km: 4.800, lon: -58.354124, lat: -34.630428 },
  { codigo: "4+900",  km: 4.900, lon: -58.353641, lat: -34.631350 },
  { codigo: "5+000",  km: 5.000, lon: -58.353354, lat: -34.632232 },
  // ... (489 registros total — ver progresivas_full.json para el set completo)
  { codigo: "52+000", km: 52.000, lon: -57.964590, lat: -34.878469 },
]

// NOTA: El set completo está en progresivas_full.json (generado por extract_kmz.py)
// Para cargar el set completo:
//   const PROGRESIVAS = require('./progresivas_full.json')

async function cargar() {
  console.log(`Cargando ${PROGRESIVAS.length} progresivas...`)

  // Cargar en lotes de 100
  const BATCH = 100
  let ok = 0, err = 0

  for (let i = 0; i < PROGRESIVAS.length; i += BATCH) {
    const lote = PROGRESIVAS.slice(i, i + BATCH).map(p => ({
      codigo:  p.codigo,
      km:      p.km,
      lat:     p.lat,
      lon:     p.lon,
      fuente:  'kmz'
    }))

    const { error } = await supabase
      .from('progresivas')
      .upsert(lote, { onConflict: 'codigo' })

    if (error) {
      console.error(`Error en lote ${i}-${i+BATCH}:`, error.message)
      err += lote.length
    } else {
      ok += lote.length
      console.log(`  ✓ Lote ${i}-${i+BATCH} cargado`)
    }
  }

  console.log(`\nResultado: ${ok} OK, ${err} errores`)
}

cargar().catch(console.error)
