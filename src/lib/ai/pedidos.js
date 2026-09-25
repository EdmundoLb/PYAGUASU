// Pedido de ayuda escrito: "podés escribirme la fórmula", "decime la
// respuesta", "mostrame el paso". Caso real: el alumno lo pidió clarito y el
// tutor le devolvió una opción múltiple ("elegí cuál es la fórmula"). Un
// pedido explícito se trata igual que el botón "Mostrame este paso"
// ([AYUDA_DIRECTA]): se muestra el paso ordenado. Se detecta acá, sin
// depender de que el modelo lo interprete bien.
//
// Conservador a propósito: exige un verbo de pedido (castellano o jopara)
// Y un objeto (fórmula, paso, respuesta, resultado). "No entiendo la
// fórmula" o "¿la fórmula es p = m·v?" NO son pedidos: el primero se
// responde achicando la pregunta, el segundo es un intento a evaluar.

const VERBO_DE_PEDIDO = new RegExp(
  [
    // castellano rioplatense y neutro: escribime, decime, dame, pasame, mostrame, enseñame...
    String.raw`escrib[ií](?:me|la|melo|mela)?`,
    String.raw`escrib[ae]me`,
    String.raw`dec[ií](?:me|mela|melo)`,
    String.raw`d[ií]game`,
    String.raw`d[aá]me(?:la|lo)?`,
    String.raw`pas[aá](?:me|mela|melo)`,
    String.raw`mostr[aá](?:me|mela|melo)`,
    String.raw`mu[eé]strame`,
    String.raw`ense[ñn][aá]me`,
    String.raw`explic[aá]me`,
    String.raw`quiero (?:ver|saber)`,
    String.raw`cu[aá]l es`,
    String.raw`me (?:pod[eé]s|puede|podr[ií]as) (?:dar|decir|escribir|pasar|mostrar)`,
    // jopara/guaraní: ehai (escribí), emombe'u (contá/decí), ehechauka (mostrá), eme'ẽ (dame)
    String.raw`ehai(?:mi)?`,
    String.raw`emombe['’´]?u(?:mi)?`,
    String.raw`ehechauka(?:mi)?`,
    String.raw`eme['’´]?[eẽ](?:mi)?`,
  ].join('|'),
  'i'
);

const OBJETO_PEDIDO = /f[oó]rmula|el paso|este paso|la respuesta|el resultado|la soluci[oó]n|mba['’´]?[eé]pa ojejapo/i;

export function esPedidoDeAyudaExplicito(texto) {
  if (typeof texto !== 'string') return false;
  const t = texto.trim();
  // Un pedido es corto; un mensaje largo con estas palabras suele ser un
  // intento o una explicación del alumno.
  if (!t || t.length > 120) return false;
  // Si ya escribió una fórmula (hay un "="), está proponiendo, no pidiendo.
  if (t.includes('=')) return false;
  return VERBO_DE_PEDIDO.test(t) && OBJETO_PEDIDO.test(t);
}
