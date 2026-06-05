// lib/kits-correctivo.ts
// IDs verificados contra DB jytsmgxwlzexijskqakt el 2025-06-05.
// material_id: null = no existe en materiales → va a pedidos_material con no_catalogado=true

export type KitItem = {
  material_id: string | null
  nombre: string
  cantidad: number
  unidad: string
  categoria: 'epp' | 'material' | 'herramienta'
}

export type KitCorrectivo = {
  subtipo: string
  label: string
  items: KitItem[]
}

export const KITS_CORRECTIVO: KitCorrectivo[] = [
  {
    subtipo: 'traza_luminarias',
    label: 'Correctivo traza luminarias',
    items: [
      { material_id: '549e40f2-99c8-437f-8040-ea97ce4c0aa0', nombre: 'ARNES DE ALTURA (2 CON LINEA VIDA)', cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: null,                                    nombre: 'CASCO CON VISOR INACTINICO',          cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: 'fd15d1a4-3c56-4cb2-8161-37efa3338ead', nombre: 'KIT DE BLOQUEO',                      cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: '529173a3-a698-4030-935e-343786725985', nombre: 'DETECTOR DE TENSION A DISTANCIA (MARCA TYRCO)', cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: '52c79079-2455-447e-bd27-2f981b0279b0', nombre: 'FUSIBLE J-15',          cantidad: 2, unidad: 'unidad', categoria: 'material' },
      { material_id: '16bb5226-be8e-4a0d-b9dc-5f6714d86ce7', nombre: 'CABLE TPR 2X1,50 MM',   cantidad: 5, unidad: 'metros', categoria: 'material' },
      { material_id: '15ff8803-6b48-49f5-8973-1140e7238d22', nombre: 'CINTAS AISLADORAS',      cantidad: 2, unidad: 'unidad', categoria: 'material' },
      { material_id: 'd796aa71-1f63-449f-b95e-cd4c907dca0c', nombre: 'CINTAS AUTOSOLDABLE',    cantidad: 2, unidad: 'unidad', categoria: 'material' },
      { material_id: '4e52a81a-7efc-48a0-973f-9eabb776662a', nombre: 'RIEL DIN PARA TABLEROS', cantidad: 1, unidad: 'unidad', categoria: 'material' },
      { material_id: null,                                    nombre: 'BORNERA',                cantidad: 4, unidad: 'unidad', categoria: 'material' },
      { material_id: '3785b1ba-1cf1-4052-b049-2a7f47171976', nombre: 'ATORNILLADORA A BATERIA 12V GSR 120-LI (MARCA BOSCH)',           cantidad: 1, unidad: 'unidad', categoria: 'herramienta' },
      { material_id: '9603e2fd-b684-40ab-8c4e-b740d64f0344', nombre: 'PERTIGA DE MANIOBRA SM-15AB-H (MARCA LIAT) HOMOLOGADA 2022',    cantidad: 1, unidad: 'unidad', categoria: 'herramienta' },
      { material_id: '5e99430c-87fa-47a5-8f35-6e474cf9a3fa', nombre: 'PERTIGA EXTRACTOR DE RUTO FUSIBLE (MARCA LIAT) HOMOLOGADA 2022', cantidad: 1, unidad: 'unidad', categoria: 'herramienta' },
      { material_id: null,                                    nombre: 'PALA',                   cantidad: 1, unidad: 'unidad', categoria: 'herramienta' },
    ],
  },
  {
    subtipo: 'empalmes_380',
    label: 'Correctivo empalmes 380 V',
    items: [
      { material_id: '549e40f2-99c8-437f-8040-ea97ce4c0aa0', nombre: 'ARNES DE ALTURA (2 CON LINEA VIDA)', cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: null,                                    nombre: 'CASCO CON VISOR INACTINICO',          cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: 'fd15d1a4-3c56-4cb2-8161-37efa3338ead', nombre: 'KIT DE BLOQUEO',                      cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: '529173a3-a698-4030-935e-343786725985', nombre: 'DETECTOR DE TENSION A DISTANCIA (MARCA TYRCO)', cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: 'ead50f26-ea55-4f61-925d-64128318538b', nombre: 'ALAMBRE PARA FARDO',                    cantidad: 1, unidad: 'KILOGRAMO', categoria: 'material' },
      { material_id: '10535fe9-6ca6-419d-a505-0b8ef735e056', nombre: 'UNIONES ESTAÑADOS   35 MM',            cantidad: 4, unidad: 'unidad',    categoria: 'material' },
      { material_id: '534244b2-a356-429d-9901-264ebe5864d6', nombre: 'UNIONES ESTAÑADOS   50 MM',            cantidad: 4, unidad: 'unidad',    categoria: 'material' },
      { material_id: 'e3d9c9cd-8d53-45fc-a1f9-a83fc618c5ef', nombre: 'TERMINALES COBRE ESTAÑADO    35MM',   cantidad: 4, unidad: 'unidad',    categoria: 'material' },
      { material_id: '535dc805-832a-42c1-a4ac-587817805460', nombre: 'TERMINALES COBRE ESTAÑADO    70 1/4 MM', cantidad: 4, unidad: 'unidad', categoria: 'material' },
      { material_id: '15ff8803-6b48-49f5-8973-1140e7238d22', nombre: 'CINTAS AISLADORAS',                   cantidad: 2, unidad: 'unidad',    categoria: 'material' },
      { material_id: 'd796aa71-1f63-449f-b95e-cd4c907dca0c', nombre: 'CINTAS AUTOSOLDABLE',                 cantidad: 2, unidad: 'unidad',    categoria: 'material' },
      { material_id: null,                                    nombre: 'SOGA',                                cantidad: 1, unidad: 'metros',    categoria: 'material' },
      { material_id: null,                                    nombre: 'TABLERO COLUMNA',                     cantidad: 1, unidad: 'unidad',    categoria: 'material' },
      { material_id: '9603e2fd-b684-40ab-8c4e-b740d64f0344', nombre: 'PERTIGA DE MANIOBRA SM-15AB-H (MARCA LIAT) HOMOLOGADA 2022',   cantidad: 1, unidad: 'unidad', categoria: 'herramienta' },
      { material_id: 'ecbb3032-7e60-4bb0-84b9-3ef5d441a7a6', nombre: 'PERTIGA DE DESCARGA (MARCA LIAT) 39 SM06716 HOMOLOGADA 2022',  cantidad: 1, unidad: 'unidad', categoria: 'herramienta' },
      { material_id: '3785b1ba-1cf1-4052-b049-2a7f47171976', nombre: 'ATORNILLADORA A BATERIA 12V GSR 120-LI (MARCA BOSCH)',         cantidad: 1, unidad: 'unidad', categoria: 'herramienta' },
      { material_id: null,                                    nombre: 'PALA',                                cantidad: 1, unidad: 'unidad',    categoria: 'herramienta' },
      { material_id: null,                                    nombre: 'CAÑAS',                               cantidad: 2, unidad: 'unidad',    categoria: 'herramienta' },
    ],
  },
  {
    subtipo: 'empalmes_1kv',
    label: 'Correctivo empalmes 1 kV',
    items: [
      { material_id: '549e40f2-99c8-437f-8040-ea97ce4c0aa0', nombre: 'ARNES DE ALTURA (2 CON LINEA VIDA)', cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: null,                                    nombre: 'CASCO CON VISOR INACTINICO',          cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: 'fd15d1a4-3c56-4cb2-8161-37efa3338ead', nombre: 'KIT DE BLOQUEO',                      cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: 'f79414ae-3496-4a21-934f-1cd5ab5172fa', nombre: 'DETECTOR DE TENSION PARA PERTIGA (MARCA LIAT) 10-35 KV', cantidad: 1, unidad: 'unidad', categoria: 'epp' },
      { material_id: '2b716f89-c65a-48e0-8f24-165270dfc9a6', nombre: 'CONJUNTO DE EMPALME 35-70 (RAYCHEM)',  cantidad: 2, unidad: 'unidad',    categoria: 'material' },
      { material_id: 'ffb64418-b0a4-4e5f-9f79-cd705afc776d', nombre: 'CONJUNTO DE EMPALME 70-150 (RAYCHEM)', cantidad: 2, unidad: 'unidad',    categoria: 'material' },
      { material_id: 'ead50f26-ea55-4f61-925d-64128318538b', nombre: 'ALAMBRE PARA FARDO',                   cantidad: 1, unidad: 'KILOGRAMO', categoria: 'material' },
      { material_id: '0e0fb093-4d59-4178-b6fe-9546a2fe82bb', nombre: 'UNIONES ESTAÑADOS   70 MM',            cantidad: 4, unidad: 'unidad',    categoria: 'material' },
      { material_id: 'e4fb342c-a3c1-4752-820e-db2608f472ea', nombre: 'UNIONES ESTAÑADOS   95 MM',            cantidad: 4, unidad: 'unidad',    categoria: 'material' },
      { material_id: '15ff8803-6b48-49f5-8973-1140e7238d22', nombre: 'CINTAS AISLADORAS',                   cantidad: 2, unidad: 'unidad',    categoria: 'material' },
      { material_id: 'd796aa71-1f63-449f-b95e-cd4c907dca0c', nombre: 'CINTAS AUTOSOLDABLE',                 cantidad: 2, unidad: 'unidad',    categoria: 'material' },
      { material_id: null,                                    nombre: 'SOGA',                                cantidad: 1, unidad: 'metros',    categoria: 'material' },
      { material_id: null,                                    nombre: 'TRAPOS',                              cantidad: 4, unidad: 'unidad',    categoria: 'material' },
      { material_id: '9603e2fd-b684-40ab-8c4e-b740d64f0344', nombre: 'PERTIGA DE MANIOBRA SM-15AB-H (MARCA LIAT) HOMOLOGADA 2022',   cantidad: 1, unidad: 'unidad', categoria: 'herramienta' },
      { material_id: 'ecbb3032-7e60-4bb0-84b9-3ef5d441a7a6', nombre: 'PERTIGA DE DESCARGA (MARCA LIAT) 39 SM06716 HOMOLOGADA 2022',  cantidad: 1, unidad: 'unidad', categoria: 'herramienta' },
      { material_id: '2071ca2c-8a0d-4b93-b360-0f4be6626394', nombre: 'PERTIGA ALARGUE (MARCA LIAT) 39 SM06713 HOMOLOGADA 2022',      cantidad: 1, unidad: 'unidad', categoria: 'herramienta' },
      { material_id: null,                                    nombre: 'GARRAFA GAS ENVASADO PARA SOPLETE',   cantidad: 1, unidad: 'unidad',    categoria: 'herramienta' },
      { material_id: null,                                    nombre: 'SOPLETE',                             cantidad: 1, unidad: 'unidad',    categoria: 'herramienta' },
      { material_id: null,                                    nombre: 'LIMPIADORA NEUMATICA',                cantidad: 1, unidad: 'unidad',    categoria: 'herramienta' },
      { material_id: null,                                    nombre: 'PALA',                                cantidad: 1, unidad: 'unidad',    categoria: 'herramienta' },
      { material_id: null,                                    nombre: 'JUEGO DE TUBOS',                      cantidad: 1, unidad: 'unidad',    categoria: 'herramienta' },
    ],
  },
]

export function getKitBySubtipo(subtipo: string): KitCorrectivo | null {
  return KITS_CORRECTIVO.find(k => k.subtipo === subtipo) ?? null
}