// Verificación aritmética determinística del cálculo que dice haber hecho
// el modelo (campo "verificacion" del turno, ver schema.js). Un LLM puede
// "razonar bien" y aun así fallar una cuenta simple con total confianza —
// esto la recalcula de verdad con una librería matemática en vez de confiar
// en que el modelo sumó/dividió bien.

import { evaluate } from 'mathjs';

const TOLERANCIA_RELATIVA = 0.02; // mismo margen que el prompt ya acepta para redondeos
const TOLERANCIA_MINIMA = 0.01; // piso absoluto para resultados cercanos a cero

/**
 * Evalúa una cuenta de calculadora escrita por el modelo.
 * @returns {number | null} null si no es una cuenta válida y segura.
 */
export function evaluarCuenta(expresion) {
  if (typeof expresion !== 'string' || !expresion.trim()) return null;

  // La expresión viene del modelo, que el estudiante puede influenciar con
  // su mensaje: se limita a una cuenta de calculadora (números, notación
  // científica y + - * / ^ ( )), sin funciones ni matrices de mathjs, que
  // permitirían expresiones capaces de bloquear el servidor.
  if (expresion.length > 200 || !/^[\d\s.,+\-*/^()eE]+$/.test(expresion)) return null;

  let valor;
  try {
    valor = evaluate(expresion);
  } catch {
    return null;
  }
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}

/**
 * @param {{ expresion?: string, resultado?: number }} verificacion
 * @returns {{ verificable: false } | { verificable: true, ok: boolean, valorCalculado: number }}
 */
export function verificarCalculo(verificacion) {
  const { expresion, resultado } = verificacion || {};

  if (typeof resultado !== 'number' || Number.isNaN(resultado)) {
    return { verificable: false };
  }

  const valorCalculado = evaluarCuenta(expresion);
  if (valorCalculado === null) {
    return { verificable: false };
  }

  const margen = Math.max(Math.abs(resultado) * TOLERANCIA_RELATIVA, TOLERANCIA_MINIMA);
  const ok = Math.abs(valorCalculado - resultado) <= margen;

  return { verificable: true, ok, valorCalculado };
}
