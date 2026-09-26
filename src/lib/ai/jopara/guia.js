// Convierte la base léxica jopara del equipo (base_jopara_tutor.json) en
// una sección compacta del prompt. El JSON es la fuente de verdad: el
// lingüista lo actualiza ahí y el prompt se regenera solo.
//
// Compacto a propósito: el JSON pesa ~63 KB; mandarlo entero en cada turno
// sumaría miles de tokens y demora. Se omiten las entradas "Validar" (la
// propia base dice no usarlas sin revisión), la nota de uso solo se incluye
// cuando es una advertencia, y los ejemplos solo en las categorías que el
// tutor más necesita (corregir y alentar).

import base from './base_jopara_tutor.json';

const CATEGORIAS_CON_EJEMPLO = new Set(['Corrección']);
const NOTA_ES_ADVERTENCIA = /no (?:usar|abusar|traducir)|puede sonar|indica rumor|no confundir/i;

function lineaLexico(l) {
  let linea = `${l.termino} = ${l.castellano}`;
  if (l.confianza !== 'Consolidado') linea += ` [${l.confianza}]`;
  if (CATEGORIAS_CON_EJEMPLO.has(l.categoria) && l.ejemplo && l.ejemplo !== '—') linea += ` (ej.: ${l.ejemplo})`;
  if (l.nota && NOTA_ES_ADVERTENCIA.test(l.nota)) linea += ` — ${l.nota}`;
  return linea;
}

export function construirGuiaDesdeBase(datos = base) {
  const lexico = datos.lexico.filter((l) => l.confianza !== 'Validar');
  const porCategoria = new Map();
  for (const l of lexico) {
    if (!porCategoria.has(l.categoria)) porCategoria.set(l.categoria, []);
    porCategoria.get(l.categoria).push(lineaLexico(l));
  }

  const secciones = [
    `BASE LÉXICA DEL EQUIPO ("${datos.meta.nombre}", revisada por el lingüista). Es tu referencia principal de vocabulario: usá estas formas antes que cualquier otra.`,
    'Reglas:',
    ...datos.reglas_ia.map((r) => `- ${r}`),
    'Léxico por categoría ("término = significado"; [Aula/MEC] y [Jopara coloquial]: usar con moderación):',
    ...[...porCategoria].map(([cat, lineas]) => `* ${cat}: ${lineas.join('; ')}`),
    'Morfología:',
    ...datos.morfologia.map((m) => `- ${m.forma} = ${m.significado}${m.ejemplo ? ` (${m.ejemplo})` : ''}${m.nota ? `. ${m.nota}` : ''}`),
    `Términos que NO se traducen (lista cerrada, quedan en castellano): ${datos.terminos_castellano.map((t) => t.termino).join('; ')}.`,
    'Errores a evitar:',
    ...datos.errores_evitar.map((e) => `- ${e.error} → ${e.solucion}`),
    'Plantillas para corregir (adaptalas; {…} = lo que corresponda):',
    ...datos.plantillas_corrector.map((p) => `- ${p.situacion}: "${p.plantilla}"`),
  ];
  return secciones.join('\n');
}

export const GUIA_BASE_JOPARA = construirGuiaDesdeBase();
