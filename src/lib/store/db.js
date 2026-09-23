// Store mock en memoria del servidor. No hay base de datos real: es un MVP
// para demostrar UI/UX funcional, no para producción (ver tipos.js para las
// formas de cada entidad).
//
// ⚠️ Patrón globalThis: en `next dev`, cada guardado de archivo recompila
// los módulos del server (HMR), lo que reiniciaría este store en cada
// cambio si viviera en una variable de módulo normal. Colgándolo de
// `globalThis` sobrevive a esas recompilaciones (mismo truco que se usa
// para no recrear un cliente de Prisma en cada hot-reload).

import { seedInicial } from './seed';
import { reiniciarContadores } from './id';

function crearDbVacia() {
  return {
    perfiles: new Map(),
    materias: new Map(),
    clases: new Map(),
    temas: new Map(),
    tareas: new Map(),
    sesiones: new Map(),
    insignias: new Map(),
  };
}

export function obtenerDb() {
  if (!globalThis.__PYAGUASU_DB__) {
    globalThis.__PYAGUASU_DB__ = crearDbVacia();
    seedInicial(globalThis.__PYAGUASU_DB__);
  }
  return globalThis.__PYAGUASU_DB__;
}

// Solo para depuración manual: fuerza un store nuevo con el seed de nuevo
// aplicado (no se usa en el flujo normal de la app).
export function reiniciarDb() {
  reiniciarContadores();
  globalThis.__PYAGUASU_DB__ = crearDbVacia();
  seedInicial(globalThis.__PYAGUASU_DB__);
  return globalThis.__PYAGUASU_DB__;
}
