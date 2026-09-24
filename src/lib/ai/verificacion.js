// Verificación aritmética determinística del cálculo que dice haber hecho
// el modelo (campo "verificacion" del turno, ver schema.js). Un LLM puede
// "razonar bien" y aun así fallar una cuenta simple con total confianza —
// esto la recalcula de verdad con una librería matemática en vez de confiar
// en que el modelo sumó/dividió bien.

import { evaluate } from 'mathjs';

const TOLERANCIA_RELATIVA = 0.02; // mismo margen que el prompt ya acepta para redondeos
const TOLERANCIA_MINIMA = 0.01; // piso absoluto para resultados cercanos a cero

/**
 * @param {{ expresion?: string, resultado?: number }} verificacion
 * @returns {{ verificable: false } | { verificable: true, ok: boolean, valorCalculado: number }}
 */
export function verificarCalculo(verificacion) {
  const { expresion, resultado } = verificacion || {};

  if (typeof expresion !== 'string' || !expresion.trim() || typeof resultado !== 'number' || Number.isNaN(resultado)) {
    return { verificable: false };
  }

  let valorCalculado;
  try {
    valorCalculado = evaluate(expresion);
  } catch {
    return { verificable: false };
  }

  if (typeof valorCalculado !== 'number' || Number.isNaN(valorCalculado) || !Number.isFinite(valorCalculado)) {
    return { verificable: false };
  }

  const margen = Math.max(Math.abs(resultado) * TOLERANCIA_RELATIVA, TOLERANCIA_MINIMA);
  const ok = Math.abs(valorCalculado - resultado) <= margen;

  return { verificable: true, ok, valorCalculado };
}
