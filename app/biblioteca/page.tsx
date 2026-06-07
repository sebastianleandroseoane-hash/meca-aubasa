'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Índice Manual Operativo y de Seguridad 2026 ────────────────────────────
// Títulos extraídos del texto real del documento (versión 2.0).
// El PDF es escaneado — el visor abre desde página 1. Usar el índice para orientación.
const INDICE_MANUAL = [
  { numero: '1', titulo: 'Objetivo' },
  { numero: '1.1', titulo: 'Finalidad del Manual' },
  { numero: '1.2', titulo: 'Política de Seguridad Operativa' },
  { numero: '1.3', titulo: 'Principios de Prevención' },
  { numero: '1.4', titulo: 'Alcance del Documento' },
  { numero: '2', titulo: 'Alcance' },
  { numero: '2.1', titulo: 'Alcance Geográfico' },
  { numero: '2.2', titulo: 'Alcance Operativo' },
  { numero: '2.3', titulo: 'Actividades Comprendidas' },
  { numero: '2.4', titulo: 'Actividades Excluidas' },
  { numero: '2.5', titulo: 'Personal Alcanzado' },
  { numero: '3', titulo: 'Marco Legal y Normativo' },
  { numero: '3.1', titulo: 'Legislación General' },
  { numero: '3.2', titulo: 'Ley Nº 19.587' },
  { numero: '3.3', titulo: 'Ley Nº 24.557' },
  { numero: '3.4', titulo: 'Decreto Nº 351/79' },
  { numero: '3.5', titulo: 'Resolución SRT Nº 3068/2014 (Trabajos BT)' },
  { numero: '3.6', titulo: 'Resolución SRT Nº 592/2004 (Trabajos MT)' },
  { numero: '3.7', titulo: 'Reglamentación AEA' },
  { numero: '3.8', titulo: 'Normativa Complementaria' },
  { numero: '4', titulo: 'Definiciones y Abreviaturas' },
  { numero: '5', titulo: 'Organización del Sector' },
  { numero: '5.1', titulo: 'Estructura General' },
  { numero: '5.2', titulo: 'Jefatura' },
  { numero: '5.3', titulo: 'Coordinación' },
  { numero: '5.4', titulo: 'Supervisión' },
  { numero: '5.5', titulo: 'Técnicos' },
  { numero: '5.6', titulo: 'Pañol' },
  { numero: '5.7', titulo: 'Bases Operativas' },
  { numero: '5.8', titulo: 'Turnos' },
  { numero: '5.9', titulo: 'Guardias' },
  { numero: '5.10', titulo: 'Comunicaciones Operativas' },
  { numero: '6', titulo: 'Roles y Responsabilidades' },
  { numero: '6.1', titulo: 'Principios Generales' },
  { numero: '6.2', titulo: 'Jefe del Sector' },
  { numero: '6.3', titulo: 'Coordinador' },
  { numero: '6.4', titulo: 'Supervisor' },
  { numero: '6.5', titulo: 'Técnicos' },
  { numero: '6.6', titulo: 'Operadores de Hidrogrúa' },
  { numero: '6.7', titulo: 'Pañoleros' },
  { numero: '6.8', titulo: 'Contratistas' },
  { numero: '6.9', titulo: 'Derecho a Detener una Tarea' },
  { numero: '7', titulo: 'Gestión Operativa' },
  { numero: '7.1', titulo: 'Planificación' },
  { numero: '7.2', titulo: 'Órdenes de Trabajo' },
  { numero: '7.3', titulo: 'Clasificación de OT' },
  { numero: '7.4', titulo: 'Asignación de Recursos' },
  { numero: '7.5', titulo: 'Inicio de Tareas' },
  { numero: '7.6', titulo: 'Desarrollo de la Intervención' },
  { numero: '7.7', titulo: 'Cierre de la Intervención' },
  { numero: '7.8', titulo: 'Emergencias' },
  { numero: '7.9', titulo: 'Registros' },
  { numero: '8', titulo: 'Seguridad Eléctrica' },
  { numero: '8.1', titulo: 'Principios Generales' },
  { numero: '8.2', titulo: 'Prioridad de Trabajo Sin Tensión' },
  { numero: '8.3', titulo: 'Cinco Reglas de Oro' },
  { numero: '8.4', titulo: 'Evaluación de Riesgos' },
  { numero: '8.5', titulo: 'Condiciones de Inicio' },
  { numero: '8.6', titulo: 'Condiciones de Suspensión' },
  { numero: '8.7', titulo: 'Condiciones de Reanudación' },
  { numero: '8.8', titulo: 'Condiciones de Cierre' },
  { numero: '8.9', titulo: 'Permisos de Trabajo' },
  { numero: '8.10', titulo: 'Investigación de Incidentes' },
  { numero: '9', titulo: 'Equipos de Protección Personal (EPP)' },
  { numero: '9.1', titulo: 'Principios Generales' },
  { numero: '9.2', titulo: 'Casco de Seguridad' },
  { numero: '9.3', titulo: 'Protección Ocular' },
  { numero: '9.4', titulo: 'Protección Facial' },
  { numero: '9.5', titulo: 'Guantes Dieléctricos' },
  { numero: '9.6', titulo: 'Calzado de Seguridad' },
  { numero: '9.7', titulo: 'Ropa de Trabajo' },
  { numero: '9.8', titulo: 'Ropa Ignífuga' },
  { numero: '9.9', titulo: 'Arnés de Seguridad' },
  { numero: '9.10', titulo: 'Inspección de EPP' },
  { numero: '9.11', titulo: 'Conservación' },
  { numero: '9.12', titulo: 'Reemplazo' },
  { numero: '10', titulo: 'Herramientas y Equipos' },
  { numero: '10.1', titulo: 'Principios Generales' },
  { numero: '10.2', titulo: 'Herramientas Manuales' },
  { numero: '10.3', titulo: 'Herramientas Dieléctricas' },
  { numero: '10.4', titulo: 'Instrumentos de Medición' },
  { numero: '10.5', titulo: 'Detectores de Tensión' },
  { numero: '10.6', titulo: 'Pinzas Amperométricas' },
  { numero: '10.7', titulo: 'Megóhmetros' },
  { numero: '10.8', titulo: 'Pértigas' },
  { numero: '10.9', titulo: 'Escaleras' },
  { numero: '10.10', titulo: 'Mantenimiento' },
  { numero: '10.11', titulo: 'Retiro de Servicio' },
  { numero: '11', titulo: 'Trabajos Sin Tensión' },
  { numero: '11.1', titulo: 'Principio General' },
  { numero: '11.2', titulo: 'Planificación' },
  { numero: '11.3', titulo: 'Corte Visible' },
  { numero: '11.4', titulo: 'Bloqueo' },
  { numero: '11.5', titulo: 'Señalización' },
  { numero: '11.6', titulo: 'Verificación de Ausencia de Tensión' },
  { numero: '11.7', titulo: 'Puesta a Tierra' },
  { numero: '11.8', titulo: 'Cortocircuito' },
  { numero: '11.9', titulo: 'Ejecución de la Tarea' },
  { numero: '11.10', titulo: 'Restitución del Servicio' },
  { numero: '12', titulo: 'Trabajos en Proximidad de Tensión' },
  { numero: '12.1', titulo: 'Definición' },
  { numero: '12.2', titulo: 'Evaluación Previa' },
  { numero: '12.3', titulo: 'Delimitación' },
  { numero: '12.4', titulo: 'Barreras de Protección' },
  { numero: '12.5', titulo: 'Pantallas Aislantes' },
  { numero: '12.6', titulo: 'Herramientas' },
  { numero: '12.7', titulo: 'Vigilancia Permanente' },
  { numero: '12.8', titulo: 'Restricciones' },
  { numero: '13', titulo: 'Trabajos con Tensión en Baja Tensión' },
  { numero: '13.1', titulo: 'Alcance' },
  { numero: '13.2', titulo: 'Requisitos del Personal' },
  { numero: '13.3', titulo: 'Condiciones Previas' },
  { numero: '13.4', titulo: 'Métodos de Trabajo' },
  { numero: '13.5', titulo: 'Herramientas Dieléctricas' },
  { numero: '13.6', titulo: 'Guantes Dieléctricos' },
  { numero: '13.7', titulo: 'Protección Facial' },
  { numero: '13.8', titulo: 'Restricciones Climáticas' },
  { numero: '13.9', titulo: 'Suspensión de la Tarea' },
  { numero: '13.10', titulo: 'Registros' },
  { numero: '14', titulo: 'Trabajos en Media Tensión 13,2 kV' },
  { numero: '14.1', titulo: 'Alcance' },
  { numero: '14.2', titulo: 'Instalaciones Alcanzadas' },
  { numero: '14.3', titulo: 'Personal Habilitado' },
  { numero: '14.4', titulo: 'Capacitación' },
  { numero: '14.5', titulo: 'Riesgos Específicos' },
  { numero: '14.6', titulo: 'EPP Específicos' },
  { numero: '14.7', titulo: 'Herramientas y Equipos' },
  { numero: '14.8', titulo: 'Maniobras' },
  { numero: '14.9', titulo: 'Condiciones Atmosféricas' },
  { numero: '14.10', titulo: 'Emergencias' },
  { numero: '15', titulo: 'Tableros Seccionales (TS)' },
  { numero: '15.1', titulo: 'Definición' },
  { numero: '15.2', titulo: 'Objetivos de Mantenimiento' },
  { numero: '15.3', titulo: 'Inspecciones' },
  { numero: '15.4', titulo: 'Verificaciones Eléctricas' },
  { numero: '15.5', titulo: 'Mantenimiento Preventivo' },
  { numero: '15.6', titulo: 'Mantenimiento Correctivo' },
  { numero: '15.7', titulo: 'Seguridad' },
  { numero: '15.8', titulo: 'Registros' },
  { numero: '15.9', titulo: 'Evidencias' },
  { numero: '15.10', titulo: 'Restitución del Servicio' },
  { numero: '16', titulo: 'Centros de Transformación (SET)' },
  { numero: '16.1', titulo: 'Definición' },
  { numero: '16.2', titulo: 'Acceso' },
  { numero: '16.3', titulo: 'Inspecciones Periódicas' },
  { numero: '16.4', titulo: 'Inspección de Equipos' },
  { numero: '16.5', titulo: 'Transformadores' },
  { numero: '16.6', titulo: 'Celdas de Media Tensión' },
  { numero: '16.7', titulo: 'Maniobras' },
  { numero: '16.8', titulo: 'Ruptofusibles' },
  { numero: '16.9', titulo: 'Mantenimiento Preventivo' },
  { numero: '16.10', titulo: 'Restitución del Servicio' },
  { numero: '17', titulo: 'Alimentadores Eléctricos' },
  { numero: '17.1', titulo: 'Definición' },
  { numero: '17.2', titulo: 'Clasificación' },
  { numero: '17.3', titulo: 'Inspección' },
  { numero: '17.4', titulo: 'Localización de Fallas' },
  { numero: '17.5', titulo: 'Empalmes' },
  { numero: '17.6', titulo: 'Reparaciones' },
  { numero: '17.7', titulo: 'Ensayos' },
  { numero: '17.8', titulo: 'Seguridad' },
  { numero: '17.9', titulo: 'Registros' },
  { numero: '17.10', titulo: 'Restitución' },
  { numero: '18', titulo: 'Columnas y Luminarias' },
  { numero: '18.1', titulo: 'Objetivo' },
  { numero: '18.2', titulo: 'Inspección de Columnas' },
  { numero: '18.3', titulo: 'Inspección de Luminarias' },
  { numero: '18.4', titulo: 'Cambio de Luminarias' },
  { numero: '18.5', titulo: 'Fotocélulas y Sistemas de Control' },
  { numero: '18.6', titulo: 'Cableado' },
  { numero: '18.7', titulo: 'Montaje y Desmontaje' },
  { numero: '18.8', titulo: 'Verificación Final' },
  { numero: '18.9', titulo: 'Registros' },
  { numero: '18.10', titulo: 'Evidencias' },
  { numero: '19', titulo: 'Hidrogrúas e Hidroelevadores' },
  { numero: '19.1', titulo: 'Generalidades' },
  { numero: '19.2', titulo: 'Operadores' },
  { numero: '19.3', titulo: 'Inspección Previa' },
  { numero: '19.4', titulo: 'Posicionamiento' },
  { numero: '19.5', titulo: 'Estabilización' },
  { numero: '19.6', titulo: 'Elevación de Personal' },
  { numero: '19.7', titulo: 'Comunicación' },
  { numero: '19.8', titulo: 'Restricciones' },
  { numero: '19.9', titulo: 'Emergencias' },
  { numero: '19.10', titulo: 'Finalización' },
  { numero: '20', titulo: 'Trabajos en Altura' },
  { numero: '20.1', titulo: 'Definición' },
  { numero: '20.2', titulo: 'Evaluación Previa' },
  { numero: '20.3', titulo: 'Sistemas de Protección' },
  { numero: '20.4', titulo: 'Arnés' },
  { numero: '20.5', titulo: 'Cabos y Conectores' },
  { numero: '20.6', titulo: 'Puntos de Anclaje' },
  { numero: '20.7', titulo: 'Inspección de Equipos' },
  { numero: '20.8', titulo: 'Rescate' },
  { numero: '20.9', titulo: 'Suspensión de Trabajos' },
  { numero: '20.10', titulo: 'Cierre de Actividad' },
  { numero: '21', titulo: 'Vehículos Operativos' },
  { numero: '21.1', titulo: 'Objetivo' },
  { numero: '21.2', titulo: 'Conductores Autorizados' },
  { numero: '21.3', titulo: 'Documentación Obligatoria' },
  { numero: '21.4', titulo: 'Inspección Diaria' },
  { numero: '21.5', titulo: 'Conducción Segura' },
  { numero: '21.6', titulo: 'Transporte de Personal' },
  { numero: '21.7', titulo: 'Transporte de Materiales' },
  { numero: '21.8', titulo: 'Condiciones Climáticas' },
  { numero: '21.9', titulo: 'Accidentes' },
  { numero: '21.10', titulo: 'Registro' },
  { numero: '22', titulo: 'Sistemas de Aire Acondicionado' },
  { numero: '22.1', titulo: 'Alcance' },
  { numero: '22.2', titulo: 'Inspecciones' },
  { numero: '22.3', titulo: 'Mantenimiento Preventivo' },
  { numero: '22.4', titulo: 'Mantenimiento Correctivo' },
  { numero: '22.5', titulo: 'Riesgos Eléctricos' },
  { numero: '22.6', titulo: 'Riesgos Mecánicos' },
  { numero: '22.7', titulo: 'Refrigerantes' },
  { numero: '22.8', titulo: 'Ensayos' },
  { numero: '22.9', titulo: 'Registros' },
  { numero: '22.10', titulo: 'Evidencias' },
  { numero: '23', titulo: 'Emergencias' },
  { numero: '23.1', titulo: 'Principios Generales' },
  { numero: '23.2', titulo: 'Accidente Eléctrico' },
  { numero: '23.3', titulo: 'Arco Eléctrico' },
  { numero: '23.4', titulo: 'Incendios' },
  { numero: '23.5', titulo: 'Rescate en Altura' },
  { numero: '23.6', titulo: 'Derrames' },
  { numero: '23.7', titulo: 'Comunicación' },
  { numero: '23.8', titulo: 'Investigación' },
  { numero: '23.9', titulo: 'Registros' },
  { numero: '23.10', titulo: 'Acciones Correctivas' },
  { numero: '24', titulo: 'Capacitación y Habilitaciones' },
  { numero: '24.1', titulo: 'Principios Generales' },
  { numero: '24.2', titulo: 'Capacitación Inicial' },
  { numero: '24.3', titulo: 'Capacitación Periódica' },
  { numero: '24.4', titulo: 'Habilitación para BT' },
  { numero: '24.5', titulo: 'Habilitación para MT' },
  { numero: '24.6', titulo: 'Trabajos con Tensión' },
  { numero: '24.7', titulo: 'Trabajos en Altura' },
  { numero: '24.8', titulo: 'Operación de Hidrogrúas' },
  { numero: '24.9', titulo: 'Registros' },
  { numero: '24.10', titulo: 'Evaluaciones' },
  { numero: '25', titulo: 'Registros y Formularios' },
  { numero: '25.1', titulo: 'Objetivo' },
  { numero: '25.2', titulo: 'Orden de Trabajo' },
  { numero: '25.3', titulo: 'Análisis Seguro de Trabajo (AST)' },
  { numero: '25.4', titulo: 'Permisos de Trabajo' },
  { numero: '25.5', titulo: 'Partes de Intervención' },
  { numero: '25.6', titulo: 'Evidencias Fotográficas' },
  { numero: '25.7', titulo: 'Registro de Materiales' },
  { numero: '25.8', titulo: 'Registro de Herramientas' },
  { numero: '25.9', titulo: 'Registro de Incidentes' },
  { numero: '25.10', titulo: 'Archivo y Conservación' },
  { numero: '26', titulo: 'Anexos' },
  { numero: '26.1', titulo: 'Distancias de Seguridad' },
  { numero: '26.2', titulo: 'Matriz de Riesgos' },
  { numero: '26.3', titulo: 'Checklists' },
  { numero: '26.4', titulo: 'Formularios (AST, Permisos, Registros)' },
  { numero: '26.5', titulo: 'Señalización' },
  { numero: '26.6', titulo: 'EPP por Tarea' },
  { numero: '26.7', titulo: 'Bibliografía Técnica' },
  { numero: '26.8', titulo: 'Actualización del Manual' },
  { numero: '26.9', titulo: 'Control de Cambios' },
  { numero: '26.10', titulo: 'Vigencia' },
  { numero: 'Anexo A', titulo: 'Matriz de Riesgos' },
  { numero: 'A.1', titulo: 'Cambio de Luminaria en Columna' },
  { numero: 'A.2', titulo: 'Cambio de Fotocélula' },
  { numero: 'A.3', titulo: 'Apertura de TS' },
  { numero: 'A.4', titulo: 'Mantenimiento en TS' },
  { numero: 'A.5', titulo: 'Reparación de Alimentador 400 V' },
  { numero: 'A.6', titulo: 'Reparación de Alimentador 1 kV' },
  { numero: 'A.7', titulo: 'Apertura de SET' },
  { numero: 'A.8', titulo: 'Intervención en Celda MT' },
  { numero: 'A.9', titulo: 'Maniobra de Ruptofusibles' },
  { numero: 'A.10', titulo: 'Operación de Hidrogrúa' },
  { numero: 'A.11', titulo: 'Trabajo en Altura' },
  { numero: 'A.12', titulo: 'Trabajos Nocturnos' },
  { numero: 'Anexo B', titulo: 'Distancias de Seguridad Eléctrica' },
  { numero: 'B.1', titulo: 'Objetivo' },
  { numero: 'B.2', titulo: 'Principio General' },
  { numero: 'B.3', titulo: 'Definiciones (Zona Libre, Proximidad, Riesgo)' },
  { numero: 'B.4', titulo: 'Baja Tensión' },
  { numero: 'B.5', titulo: 'Media Tensión' },
  { numero: 'B.6', titulo: 'Vehículos' },
  { numero: 'B.7', titulo: 'Hidrogrúas' },
  { numero: 'B.8', titulo: 'Escaleras' },
  { numero: 'B.9', titulo: 'Herramientas' },
  { numero: 'B.10', titulo: 'Condiciones Climáticas' },
  { numero: 'Anexo C', titulo: 'Proc. Operativo — Cambio de Luminaria' },
  { numero: 'C.2', titulo: 'Personal Mínimo (5 trabajadores)' },
  { numero: 'C.3', titulo: 'Funciones de la Cuadrilla' },
  { numero: 'C.4', titulo: 'Condición Previa Obligatoria (Balizamiento)' },
  { numero: 'C.6', titulo: 'EPP Obligatorio' },
  { numero: 'C.7', titulo: 'Verificaciones Previas' },
  { numero: 'C.8', titulo: 'Ejecución' },
  { numero: 'Anexo D', titulo: 'Proc. Operativo — Apertura e Inspección de TS' },
  { numero: 'D.4', titulo: 'Inspección Exterior' },
  { numero: 'D.5', titulo: 'Apertura' },
  { numero: 'D.6', titulo: 'Inspección Interior' },
  { numero: 'D.7', titulo: 'Mediciones' },
  { numero: 'Anexo E', titulo: 'Proc. Operativo — Centros de Transformación (SET)' },
  { numero: 'E.4', titulo: 'Acceso' },
  { numero: 'E.5', titulo: 'Inspección General' },
  { numero: 'E.6', titulo: 'Inspección de Transformadores' },
  { numero: 'E.7', titulo: 'Inspección de Celdas' },
  { numero: 'E.8', titulo: 'Maniobras' },
  { numero: 'Anexo F', titulo: 'Proc. Operativo — Alimentadores 400 V y 1 kV' },
  { numero: 'F.4', titulo: 'Inspección Previa' },
  { numero: 'F.5', titulo: 'Desenergización' },
  { numero: 'F.6', titulo: 'Reparación' },
  { numero: 'F.7', titulo: 'Ensayos' },
  { numero: 'Anexo G', titulo: 'Proc. Operativo — Hidrogrúas e Hidroelevadores' },
  { numero: 'G.3', titulo: 'Inspección Previa' },
  { numero: 'G.4', titulo: 'Posicionamiento' },
  { numero: 'G.5', titulo: 'Estabilización' },
  { numero: 'G.6', titulo: 'Elevación de Personal' },
  { numero: 'G.7', titulo: 'Suspensión de Tareas' },
  { numero: 'Anexo H', titulo: 'Modelo de AST — Análisis Seguro de Trabajo' },
  { numero: 'H.1', titulo: 'Datos Generales' },
  { numero: 'H.3', titulo: 'Riesgos Identificados' },
  { numero: 'H.4', titulo: 'Medidas de Control' },
  { numero: 'H.6', titulo: 'Condiciones de Inicio' },
  { numero: 'Anexo I', titulo: 'Autorización Operativa mediante OT' },
  { numero: 'I.1', titulo: 'Principio General' },
  { numero: 'I.2', titulo: 'Autorización de Inicio' },
  { numero: 'I.3', titulo: 'Responsabilidades del Supervisor' },
  { numero: 'I.5', titulo: 'Cierre Técnico' },
  { numero: 'I.6', titulo: 'Aprobación del Cierre' },
  { numero: 'I.7', titulo: 'Trazabilidad' },
]

// ─── Índice Convenio SUTPA ───────────────────────────────────────────────────
// Artículos confirmados como reales del documento.
// El resto del índice fue inferido — pendiente validación con el documento físico.
const INDICE_CONVENIO: { numero: string; titulo: string; confirmado?: boolean }[] = [
  { numero: 'Art. 27', titulo: 'Técnico Auxiliar de Mantenimiento Edilicio', confirmado: true },
  { numero: 'Art. 28', titulo: 'Técnico de Mantenimiento Eléctrico y/o Climatización', confirmado: true },
  { numero: 'Art. 29', titulo: 'Supervisor de Mantenimiento Eléctrico', confirmado: true },
  { numero: 'Art. 30', titulo: 'Agente de Seguridad Vial', confirmado: true },
  { numero: 'Art. 31', titulo: 'Agente de Señalamiento Vial', confirmado: true },
  { numero: 'Art. 44', titulo: 'Coordinador Técnico de Sistemas', confirmado: true },
  // Las secciones siguientes son navegación general — el técnico puede buscar en el PDF completo
  { numero: '—', titulo: 'Ver documento completo para índice detallado', confirmado: false },
]

type Tab = 'manual' | 'convenio'

export default function BibliotecaMECA() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('manual')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarPDF, setMostrarPDF] = useState(false)
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const indice = tab === 'manual' ? INDICE_MANUAL : INDICE_CONVENIO
  const pdfUrl = tab === 'manual'
    ? '/documentos/MANUAL_OPERATIVO_Y_DE_SEGURIDAD_2026.pdf'
    : '/documentos/convenio_sutpa.pdf'

  const busquedaNorm = busqueda.toLowerCase().trim()
  const indicesFiltrados = busquedaNorm
    ? indice.filter(item =>
        item.titulo.toLowerCase().includes(busquedaNorm) ||
        item.numero.toLowerCase().includes(busquedaNorm)
      )
    : indice

  function abrirPDF(seccion: string) {
    setSeccionSeleccionada(seccion)
    setMostrarPDF(true)
    setBusqueda('')
  }

  function cambiarTab(t: Tab) {
    setTab(t)
    setBusqueda('')
    setSeccionSeleccionada('')
    setMostrarPDF(false)
  }

  const esSubseccion = (numero: string) =>
    /^\d+\.\d+/.test(numero) ||
    numero.startsWith('Art.') ||
    /^[A-Z]\.\d+/.test(numero) ||
    numero === '—'

  // ─── PANTALLA VISOR PDF ────────────────────────────────────────────────────
  if (mostrarPDF) {
    return (
      <main style={{
        minHeight: '100vh',
        background: '#07131a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header visor */}
        <div style={{
          background: '#0c1c24',
          borderBottom: '1px solid #1a3040',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <button
            onClick={() => setMostrarPDF(false)}
            style={{
              background: 'none',
              border: '1px solid #1a3040',
              borderRadius: 8,
              color: '#4a8fa0',
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 12px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ← ÍNDICE
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: '#4a8fa0', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
              {tab === 'manual' ? 'Manual de Seguridad 2026' : 'Convenio SUTPA'}
            </div>
            {seccionSeleccionada && (
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#1ABBD6',
                whiteSpace: 'nowrap' as const,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {seccionSeleccionada}
              </div>
            )}
          </div>
        </div>

        {/* iframe PDF */}
        <iframe
          src={pdfUrl}
          style={{ flex: 1, width: '100%', border: 'none', background: '#1a1a1a' }}
          title={tab === 'manual' ? 'Manual Operativo y de Seguridad 2026' : 'Convenio SUTPA'}
        />

        {/* Botón volver */}
        <div style={{
          background: '#0c1c24',
          borderTop: '1px solid #1a3040',
          padding: '10px 14px',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setMostrarPDF(false)}
            style={{
              width: '100%',
              background: '#0f2a38',
              border: '1px solid #1a3040',
              borderRadius: 10,
              color: '#4a8fa0',
              fontWeight: 700,
              fontSize: 13,
              padding: '10px 0',
              cursor: 'pointer',
            }}
          >
            ← Volver al índice
          </button>
        </div>
      </main>
    )
  }

  // ─── PANTALLA ÍNDICE ──────────────────────────────────────────────────────
  return (
    <main style={{
      minHeight: '100vh',
      background: '#07131a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#e8f4f8',
    }}>

      {/* Header */}
      <div style={{
        background: '#0c1c24',
        borderBottom: '1px solid #1a3040',
        padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: '#4a8fa0',
              fontSize: 20,
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e8f4f8' }}>
              📚 Biblioteca MECA
            </div>
            <div style={{ fontSize: 11, color: '#4a8fa0', marginTop: 1 }}>
              Documentos de referencia operativa
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#0c1c24',
        borderBottom: '1px solid #1a3040',
        padding: '0 16px',
      }}>
        {([
          { key: 'manual' as Tab, label: 'Manual de Seguridad', emoji: '🛡️' },
          { key: 'convenio' as Tab, label: 'Convenio SUTPA', emoji: '📋' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => cambiarTab(t.key)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #1ABBD6' : '2px solid transparent',
              color: tab === t.key ? '#1ABBD6' : '#4a8fa0',
              fontWeight: tab === t.key ? 700 : 400,
              fontSize: 12,
              padding: '12px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: '#4a8fa0', fontSize: 14, pointerEvents: 'none' as const,
          }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder={`Buscar en ${tab === 'manual' ? 'el manual' : 'el convenio'}...`}
            style={{
              width: '100%',
              background: '#0c1c24',
              border: '1px solid ' + (busqueda ? '#1ABBD6' : '#1a3040'),
              borderRadius: 10,
              padding: '10px 36px',
              fontSize: 14,
              color: '#e8f4f8',
              outline: 'none',
              boxSizing: 'border-box' as const,
            }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)', background: 'none', border: 'none',
                color: '#4a8fa0', fontSize: 14, cursor: 'pointer', padding: 0,
              }}
            >✕</button>
          )}
        </div>
        {busqueda && (
          <div style={{ fontSize: 11, color: '#4a8fa0', marginTop: 6, paddingLeft: 2 }}>
            {indicesFiltrados.length} resultado{indicesFiltrados.length !== 1 ? 's' : ''} para &quot;{busqueda}&quot;
          </div>
        )}
      </div>

      {/* Botón ver documento completo */}
      <div style={{ padding: '0 16px 8px' }}>
        <button
          onClick={() => abrirPDF('Documento completo')}
          style={{
            width: '100%',
            background: '#0f2a38',
            border: '1px solid #1ABBD6',
            borderRadius: 10,
            color: '#1ABBD6',
            fontWeight: 700,
            fontSize: 12,
            padding: '10px 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span>📄</span>
          <span>Ver documento completo</span>
        </button>
      </div>

      {/* Índice */}
      <div style={{ padding: '0 16px 100px' }}>
        {indicesFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#4a8fa0', fontSize: 13 }}>
            Sin resultados para &quot;{busqueda}&quot;
          </div>
        ) : (
          indicesFiltrados.map((item, i) => {
            const esSub = esSubseccion(item.numero)
            const esPlaceholder = item.numero === '—'

            const highlight = (texto: string) => {
              if (!busquedaNorm) return <>{texto}</>
              const idx = texto.toLowerCase().indexOf(busquedaNorm)
              if (idx === -1) return <>{texto}</>
              return (
                <>
                  {texto.slice(0, idx)}
                  <span style={{ background: '#1ABBD622', color: '#1ABBD6', borderRadius: 2, padding: '0 1px' }}>
                    {texto.slice(idx, idx + busquedaNorm.length)}
                  </span>
                  {texto.slice(idx + busquedaNorm.length)}
                </>
              )
            }

            if (esPlaceholder) {
              return (
                <div key={i} style={{
                  background: '#0a1a22',
                  border: '1px dashed #1a3040',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 4,
                  marginLeft: 12,
                  color: '#2a5060',
                  fontSize: 11,
                  fontStyle: 'italic',
                }}>
                  {item.titulo}
                </div>
              )
            }

            return (
              <div
                key={i}
                onClick={() => abrirPDF(`${item.numero} — ${item.titulo}`)}
                style={{
                  background: '#0c1c24',
                  border: '1px solid #1a3040',
                  borderLeft: esSub ? '2px solid #1a3040' : '3px solid #1ABBD6',
                  borderRadius: esSub ? '0 8px 8px 0' : 10,
                  padding: esSub ? '8px 12px 8px 14px' : '11px 12px',
                  marginBottom: esSub ? 4 : 6,
                  marginLeft: esSub ? 12 : 0,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: esSub ? 9 : 10,
                    color: esSub ? '#2a5060' : '#4a8fa0',
                    fontWeight: 600,
                    textTransform: 'uppercase' as const,
                    letterSpacing: 0.5,
                    marginBottom: 2,
                  }}>
                    {highlight(item.numero)}
                  </div>
                  <div style={{
                    fontSize: esSub ? 12 : 13,
                    fontWeight: esSub ? 400 : 600,
                    color: esSub ? '#b0c4ce' : '#e8f4f8',
                    whiteSpace: 'nowrap' as const,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {highlight(item.titulo)}
                  </div>
                </div>
                <span style={{ color: '#2a5060', fontSize: 14, flexShrink: 0 }}>›</span>
              </div>
            )
          })
        )}
      </div>

      {/* Navbar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(12,28,36,0.97)', borderTop: '1px solid #1a3040',
        display: 'flex', justifyContent: 'space-around', padding: '8px 0 14px',
      }}>
        <div
          onClick={() => router.back()}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a8fa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          <span style={{ fontSize: 10, color: '#4a8fa0' }}>Panel</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1ABBD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span style={{ fontSize: 10, color: '#1ABBD6', fontWeight: 600 }}>Biblioteca</span>
        </div>
      </div>
    </main>
  )
}