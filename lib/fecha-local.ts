/**
 * Devuelve la fecha actual en Argentina como string YYYY-MM-DD
 * sin depender del timezone del servidor ni de UTC.
 * Reemplaza: new Date().toISOString().split('T')[0]
 */
export function fechaHoyAR(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires'
  })
}

/**
 * Formatea un string de fecha (YYYY-MM-DD o ISO) para mostrar en UI argentina.
 * Evita el bug de timezone al parsear strings tipo YYYY-MM-DD.
 * Reemplaza: new Date(fecha_programada).toLocaleDateString('es-AR')
 */
export function formatFechaAR(fecha: string | null | undefined): string {
  if (!fecha) return 'No registrado'
  const normalized = fecha.length === 10 ? `${fecha}T12:00:00` : fecha
  try {
    return new Date(normalized).toLocaleDateString('es-AR')
  } catch {
    return String(fecha)
  }
}