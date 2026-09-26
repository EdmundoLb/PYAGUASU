// Chequeo determinístico de la EVALUACIÓN del modelo. Caso real: el
// estudiante respondió "-20 kg·m/s" a "sumá 10 kg·m/s y -30 kg·m/s", la
// respuesta correcta, y el tutor contestó "¡Casi!" — y encima le ofreció
// "-20 kg·m/s" como opción. Decirle "está mal" a quien acertó es lo peor que
// puede hacer una herramienta pensada para quitar el miedo a equivocarse.
//
// El modelo informa en "verificacionRespuesta.expresion" la cuenta de la
// respuesta correcta del paso que el estudiante acaba de responder (ej.
// "10 + (-30)"). El servidor la calcula con mathjs y la compara con lo que
// escribió el estudiante.

import { evaluarCuenta } from './verificacion';
import { extraerNumeros } from './cierre';

const TOLERANCIA_RELATIVA = 0.02; // el mismo margen de redondeo que acepta el prompt
const TOLERANCIA_MINIMA = 0.01;

// Con signo: "-20" y "20" son respuestas distintas en un paso con vectores.
function coincide(a, b) {
  return Math.abs(a - b) <= Math.max(Math.abs(b) * TOLERANCIA_RELATIVA, TOLERANCIA_MINIMA);
}

/** Valor correcto del paso evaluado, calculado de verdad (o null si no hay cuenta verificable). */
export function valorCorrectoDelPaso(turno) {
  return evaluarCuenta(turno?.verificacionRespuesta?.expresion);
}

/**
 * true si el mensaje termina en un número sin unidad después ("-20",
 * "p = -20"). "-20 kg·m/s", "-20 kgm/seg" o "-20 (kg m/s)" sí la tienen.
 */
export function faltaUnidadEnRespuesta(mensaje) {
  if (typeof mensaje !== 'string') return false;
  const texto = mensaje.replace(/[−–]/g, '-');
  const numeros = [...texto.matchAll(/-?\d+(?:[.,]\d+)?/g)];
  if (numeros.length === 0) return false;
  const ultimo = numeros[numeros.length - 1];
  const despues = texto.slice(ultimo.index + ultimo[0].length);
  return !/[A-Za-zµ°Ω]/.test(despues);
}

/**
 * Caso real: "sumá 10 kg·m/s y -30 kg·m/s" → el estudiante escribió "-20"
 * y el tutor dijo "¡Correcto!" y pasó al paso siguiente. En Física la
 * unidad es parte de la respuesta: el paso no se da por resuelto. Es true
 * si el modelo avanzó (correcta=true) con un número correcto pero sin
 * unidad, en un paso que la tiene.
 */
export function avanzoSinUnidad({ turno, mensaje = '', pedirAyuda = false }) {
  if (pedirAyuda || turno?.correcta !== true) return false;
  const unidad = turno?.verificacionRespuesta?.unidad?.trim();
  if (!unidad || !faltaUnidadEnRespuesta(mensaje)) return false;
  // Si la cuenta es verificable, el número tiene que ser el correcto (si no,
  // el problema es otro y no corresponde hablar de la unidad).
  const correcto = valorCorrectoDelPaso(turno);
  if (correcto === null) return true;
  const numeros = extraerNumeros(mensaje);
  return numeros.length > 0 && coincide(numeros[numeros.length - 1], correcto);
}

/**
 * true si el turno está pidiendo la unidad: el estudiante dio el número
 * correcto sin unidad y el modelo (bien) no avanzó ni lo contó como error.
 */
export function estaPidiendoUnidad({ turno, mensaje = '', pedirAyuda = false }) {
  if (pedirAyuda || turno?.correcta !== false || turno?.esIntento !== false) return false;
  if (!turno?.verificacionRespuesta?.unidad?.trim() || !faltaUnidadEnRespuesta(mensaje)) return false;
  const correcto = valorCorrectoDelPaso(turno);
  if (correcto === null) return true;
  const numeros = extraerNumeros(mensaje);
  return numeros.length > 0 && coincide(numeros[numeros.length - 1], correcto);
}

// Unidades para elegir cuando el tutor pide la unidad y el modelo no mandó
// opciones: la correcta + 3 distractores plausibles, en una posición al azar
// (si fuera siempre la misma, el alumno aprendería a tocar esa).
const UNIDADES_FRECUENTES = ['kg·m/s', 'm/s', 'kg', 'N', 'm/s²', 'J', 's', 'm'];
const normalizarUnidad = (u) => u.toLowerCase().replace(/\s+/g, '').replace(/[*.]/g, '·').replace(/seg\b/g, 's').replace(/\^2/g, '²');

export function opcionesDeUnidad(correcta) {
  const norm = normalizarUnidad(correcta);
  const distractores = UNIDADES_FRECUENTES.filter((u) => normalizarUnidad(u) !== norm).slice(0, 3);
  const posicion = Math.floor(Math.random() * 4);
  distractores.splice(posicion, 0, correcta);
  return distractores;
}

/**
 * true si el modelo marcó como incorrecta una respuesta numérica que en
 * realidad coincide con el valor correcto del paso. Se mira el ÚLTIMO número
 * del mensaje (en "10 + (-30) = -20" la respuesta es -20).
 */
export function esFalsoIncorrecto({ turno, mensaje = '', pedirAyuda = false }) {
  if (pedirAyuda || turno?.correcta !== false || turno?.esIntento === false) return false;
  // Número correcto sin unidad: que el modelo no avance es lo que corresponde.
  if (turno?.verificacionRespuesta?.unidad?.trim() && faltaUnidadEnRespuesta(mensaje)) return false;
  const correcto = valorCorrectoDelPaso(turno);
  if (correcto === null) return false;
  const numeros = extraerNumeros(mensaje);
  if (numeros.length === 0) return false;
  return coincide(numeros[numeros.length - 1], correcto);
}

/**
 * Caso real: el alumno respondió "800" a "¿cuánto es p₁?" (1200 kg a 20 m/s)
 * y el tutor contestó "Ñamyatyrõ oñondive: 12·2 = 24… 24000 kg·m/s" y pasó
 * al auto 2 — le regaló el resultado en el PRIMER intento fallido. La
 * escalera de pistas no lo permite nunca (solo "Mostrame este paso").
 *
 * true si el turno marca el intento como incorrecto y aun así muestra el
 * valor correcto del paso en el mensaje o la pista, sin que ese
 * número haya aparecido antes (si ya estaba en el enunciado, es un dato).
 */
export function reveloResultado({ turno, mensaje = '', historial = [], pedirAyuda = false }) {
  if (pedirAyuda || turno?.correcta !== false || turno?.esIntento === false) return false;
  const correcto = valorCorrectoDelPaso(turno);
  if (correcto === null) return false;
  const aparece = (texto) => extraerNumeros(texto).some((n) => coincide(Math.abs(n), Math.abs(correcto)));
  const yaEstaba = [mensaje, ...historial.map((t) => t.texto)].some(aparece);
  if (yaEstaba) return false;
  // "formula" no se mira: en un intento fallido el servidor la vacía siempre
  // (ver index.js), así que nunca llega al alumno.
  return [turno.mensaje, turno.pista].some(aparece);
}

/**
 * Si el estudiante sigue en el mismo paso (correcta=false), las sugerencias
 * no pueden regalarle la respuesta de ese paso: se sacan los chips que la
 * contienen, y un opción múltiple con la respuesta numérica se convierte en
 * respuesta libre (el prompt ya prohíbe opción múltiple en pasos de cálculo).
 */
export function quitarRespuestaDeSugerencias(turno) {
  if (turno?.correcta !== false) return turno;
  const correcto = valorCorrectoDelPaso(turno);
  if (correcto === null) return turno;
  const contieneRespuesta = (texto) => extraerNumeros(texto).some((n) => coincide(n, correcto));

  const resultado = { ...turno };
  if (Array.isArray(turno.opcionesRespuesta)) {
    const restantes = turno.opcionesRespuesta.filter((t) => !contieneRespuesta(t));
    // Dejar solo distractores numéricos tampoco ayuda: si se sacó alguno y
    // quedan menos de 2, no se muestran chips.
    resultado.opcionesRespuesta =
      restantes.length < turno.opcionesRespuesta.length && restantes.length < 2 ? [] : restantes;
  }
  if (turno.requiereOpcion && Array.isArray(turno.opciones) && turno.opciones.some((o) => contieneRespuesta(o?.texto))) {
    resultado.requiereOpcion = false;
    resultado.opciones = [];
  }
  return resultado;
}
