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
];

function conMismaMayuscula(original, reemplazo) {
  return original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()
    ? reemplazo[0].toUpperCase() + reemplazo.slice(1)
    : reemplazo;
}

export function corregirVocabulario(texto) {
  if (typeof texto !== 'string') return texto;
  return CORRECCIONES_VOCABULARIO.reduce(
    (t, [patron, reemplazo]) => t.replace(patron, (encontrado) => conMismaMayuscula(encontrado, reemplazo)),
    texto
  );
}
