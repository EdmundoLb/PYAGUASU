// Generador de ids legibles, en su propio módulo para evitar un ciclo de
// imports entre db.js (que necesita sembrar datos con ids) y seed.js (que
// necesita generarlos).
let contadores = {};

export function crearId(prefijo) {
  contadores[prefijo] = (contadores[prefijo] || 0) + 1;
  return `${prefijo}-${contadores[prefijo]}`;
}

export function reiniciarContadores() {
  contadores = {};
}
