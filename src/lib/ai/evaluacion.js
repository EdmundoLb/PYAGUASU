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
 * true si el modelo marcó como incorrecta una respuesta numérica que en
 * realidad coincide con el valor correcto del paso. Se mira el ÚLTIMO número
 * del mensaje (en "10 + (-30) = -20" la respuesta es -20).
 */
export function esFalsoIncorrecto({ turno, mensaje = '', pedirAyuda = false }) {
  if (pedirAyuda || turno?.correcta !== false || turno?.esIntento === false) return false;
  const correcto = valorCorrectoDelPaso(turno);
  if (correcto === null) return false;
  const numeros = extraerNumeros(mensaje);
  if (numeros.length === 0) return false;
  return coincide(numeros[numeros.length - 1], correcto);
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
