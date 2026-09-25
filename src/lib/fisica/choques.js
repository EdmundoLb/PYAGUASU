// Física de un choque frontal (una dimensión) entre dos cuerpos, para el
// simulador de conceptos (SimuladorChoque.js). Convención de signos: hacia
// la derecha es positivo; un cuerpo que viene en sentido contrario tiene
// velocidad negativa.
//
// Fórmulas (CONCEPTO.pdf, validado por el docente del equipo):
//   p₁ = m₁·v₁   p₂ = m₂·v₂   pᵢ = p₁ + p₂
//   perfectamente inelástico: v' = (m₁v₁ + m₂v₂) / (m₁ + m₂),  p_f = (m₁ + m₂)·v'
//   elástico (conserva además la energía cinética):
//     v₁' = ((m₁ − m₂)v₁ + 2m₂v₂) / (m₁ + m₂)
//     v₂' = ((m₂ − m₁)v₂ + 2m₁v₁) / (m₁ + m₂)
// En los dos casos la cantidad de movimiento total se conserva: p_f = pᵢ.

/**
 * @param {{ m1: number, v1: number, m2: number, v2: number, tipo: 'inelastico' | 'elastico' }} datos
 */
export function calcularChoque({ m1, v1, m2, v2, tipo }) {
  const p1 = m1 * v1;
  const p2 = m2 * v2;
  const pi = p1 + p2;
  const masaTotal = m1 + m2;

  let v1Final;
  let v2Final;
  if (tipo === 'elastico') {
    v1Final = ((m1 - m2) * v1 + 2 * m2 * v2) / masaTotal;
    v2Final = ((m2 - m1) * v2 + 2 * m1 * v1) / masaTotal;
  } else {
    v1Final = pi / masaTotal; // v': se mueven juntos
    v2Final = v1Final;
  }

  const p1Final = m1 * v1Final;
  const p2Final = m2 * v2Final;
  return {
    p1,
    p2,
    pi,
    masaTotal,
    v1Final,
    v2Final,
    p1Final,
    p2Final,
    pf: p1Final + p2Final,
    // Si el de atrás no va más rápido que el de adelante, nunca se alcanzan.
    chocan: v1 > v2,
  };
}

// Redondeo para mostrar: hasta 2 decimales, sin ceros de más, y sin "-0".
export function redondear(n) {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? 0 : r;
}
