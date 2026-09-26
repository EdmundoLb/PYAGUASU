// Correcciones de vocabulario jopara/guaraní que se aplican a TODO texto
// visible del tutor, después de la respuesta de la IA. El prompt ya indica
// la forma correcta, pero un modelo puede repetir el error igual: esta lista
// lo corrige de forma determinística.
//
// ⚠️ PARA EL LINGÜISTA DEL EQUIPO: cuando encuentren una forma incorrecta en
// una conversación real, agréguenla acá como [patrón, reemplazo]. El patrón
// no distingue mayúsculas; si el original empezaba en mayúscula, el
// reemplazo también. Los apóstrofos ' ’ ´ se aceptan indistintamente (A).

const A = "['’´]";

export const CORRECCIONES_VOCABULARIO = [
  // "No te preocupes": segunda persona del imperativo negativo.
  [new RegExp(`\\bani\\s+(?:o|re)jepy${A}apy\\b`, 'gi'), "ani ejepy'apy"],
  // Vistas en pruebas del 26/09: "hekopeteĩnte" mezcla "hekopete" (correcto)
  // con "-ĩnte"; "upéva da 24000" mete el verbo castellano "da" en guaraní
  // (la base usa "ha'e" = es). ⚠️ Lingüista: confirmar.
  [/\bhekopeteĩnte\b/gi, 'hekopete'],
  [/\bupéva\s+da\b/gi, "upéva ha'e"],
  // Corregido por el equipo (26/09): "ha katu" → "ha ikatu" (también en la base).
  [/\bha\s+katu\b/gi, 'ha ikatu'],
  // Base jopara, "Errores a evitar": armonía nasal (raíz nasal → ña-).
  [/\bjañepyrũ/gi, 'ñañepyrũ'],
  // Base jopara, "Errores a evitar": sin plural después de un numeral
  // ("mokõi bloquekuéra" → "mokõi bloque").
  [/\b(peteĩ|mokõi|mbohapy|irundy|po)\s+(\p{L}+?)(?:kuéra|nguéra)\b/giu, '$1 $2'],
];

function conMismaMayuscula(original, reemplazo) {
  return original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()
    ? reemplazo[0].toUpperCase() + reemplazo.slice(1)
    : reemplazo;
}

export function corregirVocabulario(texto) {
  if (typeof texto !== 'string') return texto;
  return CORRECCIONES_VOCABULARIO.reduce(
    (t, [patron, reemplazo]) =>
      t.replace(patron, (encontrado, ...grupos) => {
        // "$1", "$2"… en el reemplazo = lo que capturó cada grupo del patrón.
        const conGrupos = reemplazo.replace(/\$(\d)/g, (_, n) => (typeof grupos[n - 1] === 'string' ? grupos[n - 1] : ''));
        return conMismaMayuscula(encontrado, conGrupos);
      }),
    texto
  );
}
