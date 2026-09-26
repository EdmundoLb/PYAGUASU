// Glosario de conceptos para los chips "Repasar: …" del chat. Cuando el
// tutor menciona un concepto, debajo de su mensaje aparece un chip que abre
// un modal con ese concepto APLICADO AL EJERCICIO del alumno.
//
// El contenido sale de CONCEPTO.pdf (lib/conceptos/choques.js, material del
// profe): acá solo se reparte en piezas. La detección es determinística
// (patrones sobre el texto del tutor): sin costo de IA ni demora extra.

import { CONCEPTO_CHOQUES as C } from './choques';
import { formulasParaIncisos } from './incisos';
import { calcularChoque, redondear } from '@/lib/fisica/choques';

const tipo = (id) => C.tipos.find((t) => t.id === id);
const formula = (nombre) => C.formulas.find((f) => f.nombre === nombre).latex;
const F_P1 = formula('Cantidad de movimiento del bloque 1');
const F_P2 = formula('Cantidad de movimiento del bloque 2');
const F_PI = formula('Cantidad de movimiento inicial del sistema');
const F_V = formula('Velocidad final (juntos)');
const F_PF = formula('Cantidad de movimiento final');

// Fuentes del MEC de las que salen todos estos conceptos (ver choques.js).
export const BIBLIOGRAFIA = C.bibliografia;

export const GLOSARIO = {
  choque: {
    titulo: 'Choque',
    icono: 'swap_horiz',
    explicacion: [C.introduccion],
    formulas: [],
    patron: /\bchoque|\bchocan|colisi[oó]n/i,
  },
  choque_inelastico: {
    titulo: 'Choque perfectamente inelástico',
    icono: 'link',
    explicacion: [tipo('inelastico').descripcion, ...C.caracteristicasInelastico],
    formulas: [C.formulaGeneral.latex],
    patron: /inel[aá]stic|quedan (?:unid|enganchad|adherid|pegad|junt)|opyta(?:\s+hikuái)?\s+oñondive|oñondive\s+opyta|masa total/i,
  },
  choque_elastico: {
    titulo: 'Choque elástico',
    icono: 'sports_handball',
    explicacion: [tipo('elastico').descripcion],
    formulas: [],
    patron: /(?<!in)el[aá]stic|rebot/i,
  },
  cantidad_movimiento: {
    titulo: 'Cantidad de movimiento',
    icono: 'arrow_forward',
    explicacion: ['La cantidad de movimiento de cada cuerpo es su masa por su velocidad.', 'Se mide en $\\text{kg}\\cdot\\text{m/s}$.'],
    formulas: [F_P1, F_P2],
    patron: /cantidad de movimiento|momento lineal|\bp_?\{?[12]\b/i,
  },
  cantidad_movimiento_sistema: {
    titulo: 'Cantidad de movimiento del sistema',
    icono: 'functions',
    explicacion: ['Es la suma de las cantidades de movimiento de los dos cuerpos antes del choque.'],
    formulas: [F_PI],
    patron: /inicial del sistema|total inicial|movimiento total|p_\{?(?:i|total)\b/i,
  },
  velocidad_final: {
    titulo: 'Velocidad final',
    icono: 'speed',
    explicacion: ["Si los cuerpos quedan unidos, después del choque se mueven juntos con una misma velocidad final $v'$."],
    formulas: [F_V],
    patron: /velocidad final|\bv_\{?(?:f|final)\b|\bv'/i,
  },
  conservacion: {
    titulo: 'Conservación de la cantidad de movimiento',
    icono: 'balance',
    explicacion: [C.observacion],
    formulas: [C.formulaGeneral.latex, F_PF],
    patron: /conserv|final del sistema|\bp_\{?f\}?\s*=\s*p_\{?i|se mantiene|ojoja/i,
  },
  signo_velocidad: {
    titulo: 'Signo de la velocidad',
    icono: 'compare_arrows',
    explicacion: [C.signos],
    formulas: [],
    patron: /negativ|sentido contrario|a su encuentro|\bsigno/i,
  },
  unidades: {
    titulo: 'Unidades de medida',
    icono: 'straighten',
    explicacion: C.unidades.map(([magnitud, unidad]) => `${magnitud}: ${unidad}`),
    formulas: [],
    patron: /\bunidad|kg\s*[·*.]?\s*m\/s/i,
  },
};

// Más específico primero: si el tutor habla de "velocidad final" en un
// choque, conviene repasar eso antes que la definición general de choque.
const PRIORIDAD = [
  'velocidad_final',
  'cantidad_movimiento_sistema',
  'conservacion',
  'cantidad_movimiento',
  'choque_inelastico',
  'choque_elastico',
  'signo_velocidad',
  'unidades',
  'choque',
];
const MAXIMO_POR_MENSAJE = 2;

/** Conceptos que menciona un mensaje del tutor, en orden de prioridad (máx. 2). */
export function detectarConceptos(texto) {
  if (typeof texto !== 'string' || !texto.trim()) return [];
  return PRIORIDAD.filter((id) => GLOSARIO[id].patron.test(texto))
    .slice(0, MAXIMO_POR_MENSAJE)
    .map((id) => ({ id, titulo: GLOSARIO[id].titulo, icono: GLOSARIO[id].icono }));
}

const num = (n) => String(redondear(n));
const kg = (n) => `${num(n)}\\text{ kg}`;
const ms = (n) => `${num(n)}\\text{ m/s}`;
const kgms = (n) => `${num(n)}\\text{ kg·m/s}`;

/**
 * Cómo se aplica el concepto al ejercicio del alumno. Los RESULTADOS quedan
 * como "?" hasta que termine (mismo criterio que el simulador): el modal
 * ayuda a repasar, no a copiar la respuesta.
 * @returns {string[]} líneas con LaTeX entre $…$ (vacío si no hay datos del choque)
 */
export function contenidoEnTuEjercicio(id, escena, terminado = false) {
  if (!escena) return [];
  const r = calcularChoque(escena);
  const res = (texto) => (terminado ? texto : '?');
  const datos1 = `$m_1 = ${kg(escena.m1)}$ y $v_1 = ${ms(escena.v1)}$`;
  const datos2 = `$m_2 = ${kg(escena.m2)}$ y $v_2 = ${ms(escena.v2)}$`;

  switch (id) {
    case 'choque':
      return [`Chocan un cuerpo de $${kg(escena.m1)}$ y otro de $${kg(escena.m2)}$.`];
    case 'choque_inelastico':
      return escena.tipo === 'inelastico'
        ? [`Tu ejercicio es de este tipo: quedan unidos, con masa total $m_1 + m_2 = ${res(kg(r.masaTotal))}$.`]
        : ['Tu ejercicio NO es de este tipo: los cuerpos rebotan.'];
    case 'choque_elastico':
      return escena.tipo === 'elastico'
        ? ['Tu ejercicio es de este tipo: los cuerpos rebotan.']
        : ['Tu ejercicio NO es de este tipo: los cuerpos quedan unidos.'];
    case 'cantidad_movimiento':
      return [`Bloque 1: ${datos1} → $p_1 = ${res(kgms(r.p1))}$`, `Bloque 2: ${datos2} → $p_2 = ${res(kgms(r.p2))}$`];
    case 'cantidad_movimiento_sistema':
      return [`$p_i = p_1 + p_2 = ${res(kgms(r.pi))}$`];
    case 'velocidad_final':
      return escena.tipo === 'inelastico'
        ? [`Datos: ${datos1}; ${datos2}.`, `$v' = ${res(ms(r.v1Final))}$`]
        : ['En tu ejercicio los cuerpos rebotan: esta fórmula es para cuando quedan unidos. Consultá con el tutor cómo seguir.'];
    case 'conservacion':
      return terminado
        ? [`$p_f = p_i = ${kgms(r.pi)}$ ✓`]
        : ['Cuando llegues al final, tu $p_f$ tiene que dar igual a tu $p_i$. Si no da igual, revisá alguna cuenta.'];
    case 'signo_velocidad':
      if (escena.v1 > 0 && escena.v2 < 0) return [`El bloque 2 viene en sentido contrario, por eso $v_2 = ${ms(escena.v2)}$ (negativa).`];
      if (escena.v2 === 0) return ['El bloque 2 está en reposo: $v_2 = 0$.'];
      return [`Los dos van en el mismo sentido: $v_1 = ${ms(escena.v1)}$ y $v_2 = ${ms(escena.v2)}$.`];
    case 'unidades':
      return ['Las masas en $\\text{kg}$, las velocidades en $\\text{m/s}$ y todas las cantidades de movimiento ($p_1$, $p_2$, $p_i$, $p_f$) en $\\text{kg·m/s}$.'];
    default:
      return [];
  }
}

/** Incisos del enunciado que se resuelven con este concepto (ej. ["b"]). */
export function incisosDelConcepto(id, enunciado) {
  const formulas = GLOSARIO[id]?.formulas || [];
  if (formulas.length === 0) return [];
  return formulasParaIncisos(enunciado)
    .filter((inc) => inc.formulas.some((f) => formulas.includes(f)))
    .map((inc) => inc.letra);
}
