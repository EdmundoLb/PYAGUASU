// Curva de nivel a partir del XP acumulado. Curva simple tipo "raíz
// cuadrada" (cada nivel siguiente pide más XP que el anterior, pero sin
// crecer tan agresivo como una exponencial) — elegida para que en una
// demo de aula un alumno suba de nivel varias veces en pocos problemas
// resueltos, no solo una vez cada muchas sesiones.
const XP_BASE_POR_NIVEL = 50;

export function calcularNivel(xp) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / XP_BASE_POR_NIVEL)) + 1;
}

export function xpParaNivel(nivel) {
  return Math.pow(nivel - 1, 2) * XP_BASE_POR_NIVEL;
}

export function xpParaSiguienteNivel(nivel) {
  return xpParaNivel(nivel + 1);
}

// Progreso (0 a 1) dentro del nivel actual, para dibujar una barra.
export function progresoDentroDelNivel(xp) {
  const nivel = calcularNivel(xp);
  const xpDesde = xpParaNivel(nivel);
  const xpHasta = xpParaNivel(nivel + 1);
  if (xpHasta === xpDesde) return 1;
  return Math.min(1, Math.max(0, (xp - xpDesde) / (xpHasta - xpDesde)));
}

// XP otorgado al completar una sesión del tutor. Base fija + bonus por
// resolver sin ningún error + el extra que haya definido la tarea (si la
// sesión vino de una tarea asignada por el docente).
const XP_BASE_COMPLETAR = 20;
const XP_BONUS_SIN_ERRORES = 15;

export function calcularXpGanada({ errores = 0, xpRecompensaTarea = 0 }) {
  const bonusSinErrores = errores === 0 ? XP_BONUS_SIN_ERRORES : 0;
  return XP_BASE_COMPLETAR + bonusSinErrores + xpRecompensaTarea;
}
