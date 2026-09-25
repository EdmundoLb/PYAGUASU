// Datos del choque del ejercicio actual ({ m1, v1, m2, v2, tipo }), para que
// el simulador y el panel "Conceptos" arranquen con EL ejercicio del alumno.
//
// Dos fuentes, siempre validadas contra el enunciado:
//   1. La IA, en el primer turno (campo "escenaChoque" del schema).
//   2. Este lector de enunciados, como respaldo (y para ejercicios que ya
//      estaban empezados antes de que existiera el campo).
// Convención: positivo = sentido del primer cuerpo. Si el segundo "viene a
// su encuentro" / en sentido contrario, su velocidad es negativa.

import { extraerNumeros } from '@/lib/ai/cierre';

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const aNumero = (n) => Number(String(n).replace(',', '.'));

const SENTIDO_CONTRARIO = /a su encuentro|en sentido (?:contrario|opuesto)|direcci[oó]n (?:contraria|opuesta)|viene hacia|se acerca(?:n)? (?:uno al otro|entre s[ií])|en contra/i;
const ES_ELASTICO = /\bel[aá]stic|rebot/i;
const ES_INELASTICO = /inel[aá]stic|adherid|enganchad|quedan unid|quedan pegad|quedan junt|se mueven junt|se unen|acoplad/i;

function tipoDeChoque(texto) {
  if (ES_INELASTICO.test(texto)) return 'inelastico';
  if (ES_ELASTICO.test(texto)) return 'elastico';
  return 'inelastico';
}

/** Lee masas, velocidades y tipo de choque del enunciado. null si no es un choque de dos cuerpos reconocible. */
export function extraerEscenaDeEnunciado(enunciado) {
  if (typeof enunciado !== 'string' || !/choc|colisi|impact|choque/i.test(enunciado)) return null;

  // Todo se pasa a kg y m/s (unidades del simulador): "500 g" → 0.5 kg,
  // "72 km/h" → 20 m/s. Sin esto, un ejercicio en km/h se animaba con 72 m/s.
  const masas = [...enunciado.matchAll(new RegExp(`${NUM}\\s*(kg|kilo|g(?:r|ramos?)?\\b)`, 'gi'))].map(
    (m) => aNumero(m[1]) / (/^k/i.test(m[2]) ? 1 : 1000)
  );
  if (masas.length !== 2) return null;

  const velocidades = [...enunciado.matchAll(new RegExp(`(-?)\\s*${NUM}\\s*(m\\s*/\\s*s(?:eg)?|km\\s*/\\s*h)`, 'gi'))].map(
    (m) => ((m[1] ? -1 : 1) * aNumero(m[2])) / (/^km/i.test(m[3]) ? 3.6 : 1)
  );
  const enReposo = /en reposo|est[aá] quiet|detenid|parad/i.test(enunciado);

  let v1;
  let v2;
  if (velocidades.length >= 2) {
    [v1, v2] = velocidades;
  } else if (velocidades.length === 1 && enReposo) {
    // El que está en reposo suele ser el segundo ("choca contra otro en reposo").
    [v1, v2] = [velocidades[0], 0];
  } else {
    return null;
  }

  if (v2 > 0 && v1 > 0 && SENTIDO_CONTRARIO.test(enunciado)) v2 = -v2;

  return { m1: masas[0], v1, m2: masas[1], v2, tipo: tipoDeChoque(enunciado) };
}

/**
 * Valida la escena que devolvió la IA: números finitos, masas positivas, y
 * que las masas y velocidades (en valor absoluto) estén en el enunciado —
 * así la IA no puede inventar datos que el alumno no escribió.
 */
export function sanearEscena(escena, enunciado) {
  if (!escena || typeof escena !== 'object') return null;
  const { m1, v1, m2, v2 } = escena;
  if (![m1, v1, m2, v2].every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
  if (m1 <= 0 || m2 <= 0) return null;
  const numerosEnunciado = extraerNumeros(enunciado).map(Math.abs);
  // También vale si la IA convirtió unidades: km/h → m/s (÷3,6) o g → kg (÷1000).
  const aparece = (n) =>
    n === 0 || numerosEnunciado.some((x) => [x, x / 3.6, x / 1000].some((c) => Math.abs(c - Math.abs(n)) < 1e-6));
  if (![m1, v1, m2, v2].every(aparece)) return null;
  return { m1, v1, m2, v2, tipo: escena.tipo === 'elastico' ? 'elastico' : 'inelastico' };
}
