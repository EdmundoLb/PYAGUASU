// Control de "cierre prematuro": el modelo a veces marca completado=true
// (con resultadoFinal) en el MISMO turno en que le pide al estudiante que
// calcule el último paso — ej. "ecalculami la velocidad final" + "Resuelto:
// −2.5 m/s". Como al completar la app oculta la barra de respuesta, el
// estudiante nunca llega a hacer ese cálculo: se le regala la respuesta, lo
// contrario de un tutor socrático.
//
// Criterio: un cierre es legítimo solo si el valor del resultado final ya
// apareció antes en la conversación — porque lo dijo el estudiante, o
// porque el tutor ya lo reveló (ej. con "Mostrame este paso") — o si este
// turno es justamente un pedido de ayuda directa. Si el número es nuevo, el
// cierre es prematuro.

const TOLERANCIA_RELATIVA = 0.02; // el mismo margen de redondeo que acepta el prompt
const TOLERANCIA_MINIMA = 0.01;

// Números de un texto, con coma o punto decimal y signo menos ASCII o
// tipográfico ("−2,5" → -2.5). Se ignoran los dígitos que forman parte de
// subíndices/exponentes de LaTeX ("v_1", "t^2") para no confundirlos con datos.
export function extraerNumeros(texto) {
  if (typeof texto !== 'string') return [];
  const limpio = texto.replace(/[_^]\{?\d+\}?/g, ' ').replace(/[−–]/g, '-');
  const aNumero = (n) => Number(n.replace(',', '.'));
  const numeros = (limpio.match(/-?\d+(?:[.,]\d+)?/g) || []).map(aNumero);
  // Fracciones ("-20/8", "\frac{-20}{8}"): un estudiante puede dar el
  // resultado sin hacer la división, y eso también es haberlo calculado.
  const NUM = String.raw`(-?\d+(?:[.,]\d+)?)`;
  const fracciones = [
    ...limpio.matchAll(new RegExp(`${NUM}\\s*/\\s*${NUM}`, 'g')),
    ...limpio.matchAll(new RegExp(String.raw`\\frac\{\s*${NUM}\s*\}\{\s*${NUM}\s*\}`, 'g')),
  ];
  for (const [, a, b] of fracciones) {
    if (aNumero(b) !== 0) numeros.push(aNumero(a) / aNumero(b));
  }
  return numeros;
}

function coincide(a, b) {
  const margen = Math.max(Math.abs(b) * TOLERANCIA_RELATIVA, TOLERANCIA_MINIMA);
  // Se compara en valor absoluto: "2.5 m/s hacia la izquierda" es el mismo
  // resultado que "−2.5 m/s".
  return Math.abs(Math.abs(a) - Math.abs(b)) <= margen;
}

/**
 * @param {{ turno: object, historial: Array<{autor: string, texto: string}>, mensaje: string, pedirAyuda: boolean }} args
 * @returns {boolean} true si el turno cierra el problema con un resultado que nadie calculó todavía.
 */
export function esCierrePrematuro({ turno, historial = [], mensaje = '', pedirAyuda = false }) {
  if (!turno?.completado || pedirAyuda) return false;

  // El resultado es el último número del valor: en "\frac{-20}{8} = -2.5"
  // es -2.5. Si no hay número (resultado conceptual), no hay nada que chequear.
  const valoresResultado = extraerNumeros(turno.resultadoFinal?.valor);
  if (valoresResultado.length === 0) return false;
  const resultado = valoresResultado[valoresResultado.length - 1];

  const textosPrevios = [...historial.map((t) => t.texto), mensaje];
  const yaApareció = textosPrevios.some((t) => extraerNumeros(t).some((n) => coincide(n, resultado)));
  return !yaApareció;
}

// Deshace el cierre: el mensaje del tutor (que ya le está pidiendo al
// estudiante el último cálculo) se mantiene; se sacan el resultado y la
// analogía, y la fórmula del paso si ya contiene el resultado.
export function anularCierre(turno) {
  const valores = extraerNumeros(turno.resultadoFinal?.valor);
  const resultado = valores[valores.length - 1];
  const formulaRevelaResultado = extraerNumeros(turno.formula).some((n) => coincide(n, resultado));
  return {
    ...turno,
    completado: false,
    resultadoFinal: undefined,
    analogiaCotidiana: '',
    formula: formulaRevelaResultado ? '' : turno.formula,
  };
}
