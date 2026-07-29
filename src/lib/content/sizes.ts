/**
 * Tabla de equivalencias de talles.
 *
 * El catálogo es de origen brasilero y la numeración corre un punto abajo de
 * la argentina: en toda la tabla se cumple que AR = BR + 1. Vive acá y no en
 * el componente para que la página y cualquier otro lugar que la necesite
 * —una ficha de producto, un mensaje de WhatsApp— lean siempre lo mismo.
 */
export interface SizeRow {
  /** El que se pide, porque es el que trae la caja. */
  br: number;
  /** El que la persona usa acá. */
  ar: number;
  /** Largo del pie en centímetros, con coma decimal como se escribe acá. */
  cm: string;
}

export const SIZE_TABLE: SizeRow[] = [
  { br: 34, ar: 35, cm: "22,0" },
  { br: 35, ar: 36, cm: "22,5" },
  { br: 36, ar: 37, cm: "23,5" },
  { br: 37, ar: 38, cm: "24,0" },
  { br: 38, ar: 39, cm: "24,5" },
  { br: 39, ar: 40, cm: "25,0" },
  { br: 40, ar: 41, cm: "26,0" },
  { br: 41, ar: 42, cm: "26,5" },
  { br: 42, ar: 43, cm: "27,5" },
  { br: 43, ar: 44, cm: "28,0" },
];

/** Pasos para medir el pie en casa. El orden importa: es una secuencia. */
export const MEASURE_STEPS = [
  "Apoyá una hoja en el piso, contra una pared.",
  "Parate sobre la hoja con el talón tocando la pared.",
  "Marcá el punto más largo de tu pie.",
  "Medí la distancia desde el borde de la hoja hasta la marca.",
  "Compará esa medida con la tabla de acá abajo y listo.",
];
