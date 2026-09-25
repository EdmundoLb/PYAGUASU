// Catálogo de conceptos por tema (panel "Conceptos" de la pantalla del
// ejercicio). Para sumar un tema, agregar su módulo a esta lista.
import { CONCEPTO_CHOQUES } from './choques';

const CATALOGO = [CONCEPTO_CHOQUES];

/** Concepto que corresponde al ejercicio actual, o null si no hay ninguno cargado. */
export function buscarConcepto({ tema = '', enunciado = '' } = {}) {
  const texto = `${tema} ${enunciado}`;
  return CATALOGO.find((c) => c.patron.test(texto)) || null;
}
