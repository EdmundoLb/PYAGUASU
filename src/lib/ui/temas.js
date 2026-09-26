// Ícono de Material Symbols por tema de física (por palabra clave del
// título, así un tema nuevo sin ícono propio igual se ve bien con el
// genérico). Lo usan el selector de temas y el historial de progreso.
const ICONOS_TEMA = [
  [/cinem/i, "speed"],
  [/newton|din[aá]m|fuerza/i, "open_with"],
  [/cantidad de movimiento|choque|impulso/i, "sports_hockey"],
  [/energ|trabajo/i, "bolt"],
  [/est[aá]tica|equilibrio/i, "balance"],
];

export function iconoDeTema(titulo = "") {
  return ICONOS_TEMA.find(([re]) => re.test(titulo))?.[1] || "science";
}
