// "Qué fórmula uso en cada inciso": lee los incisos del enunciado
// ("a La cantidad de movimiento inicial de cada bloque", "b ...") y les
// asigna la fórmula de CONCEPTO.pdf que corresponde, SIN resolverla.

// El orden importa: lo más específico primero ("inicial del sistema" antes
// que "inicial de cada bloque").
const REGLAS = [
  { patron: /cantidad de movimiento final|momento final|p_?f\b/i, formulas: ["$p_f = (m_1 + m_2) \\cdot v'$"] },
  { patron: /velocidad final|velocidad (?:despu[eé]s|luego)|velocidad (?:del conjunto|com[uú]n|de ambos)/i, formulas: ["$v' = \\dfrac{m_1 v_1 + m_2 v_2}{m_1 + m_2}$"] },
  { patron: /inicial del sistema|total (?:inicial|del sistema)|del sistema/i, formulas: ['$p_i = p_1 + p_2$'] },
  { patron: /(?:inicial )?de cada (?:bloque|cuerpo|auto|objeto|uno)|de (?:ambos|los dos)|inicial/i, formulas: ['$p_1 = m_1 \\cdot v_1$', '$p_2 = m_2 \\cdot v_2$'] },
];

/** @returns {Array<{ letra: string, texto: string, formulas: string[] }>} vacío si no hay incisos reconocibles. */
export function formulasParaIncisos(enunciado) {
  if (typeof enunciado !== 'string') return [];
  // Incisos al principio de línea o después de un punto/dos puntos:
  // "a) ...", "a. ...", "a- ...", "a La cantidad..." (como en el ejercicio del profe).
  const partes = [...enunciado.matchAll(/(?:^|\n|[.:;]\s*)\s*([a-e])(?:\)|\.|-|:)?\s+([A-ZÁÉÍÓÚÑ¿][^\n]*?)(?=\s*(?:\n|$|[.;]\s*[a-e](?:\)|\.|-|:)?\s+[A-ZÁÉÍÓÚÑ¿]))/g)];
  const vistos = new Set();
  const incisos = [];
  for (const [, letra, texto] of partes) {
    if (vistos.has(letra)) continue;
    const regla = REGLAS.find((r) => r.patron.test(texto));
    if (!regla) continue;
    vistos.add(letra);
    incisos.push({ letra, texto: texto.trim(), formulas: regla.formulas });
  }
  return incisos.length >= 2 ? incisos : [];
}
