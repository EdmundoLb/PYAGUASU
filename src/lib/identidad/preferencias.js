// Idioma elegido y resultado del test de estilo de aprendizaje, recordados
// por perfil en localStorage. Sin esto, cada vez que se abría la app había
// que volver a elegir idioma y responder el test (5 pantallas antes de la
// primera pregunta de física) — la guía del hackathon pide cuidar la
// simplicidad, porque un tercio de los estudiantes anticipa dificultad de uso.
const CLAVE = 'pyaguasu.preferencias';

function leerTodas() {
  try {
    return JSON.parse(window.localStorage.getItem(CLAVE)) || {};
  } catch {
    return {};
  }
}

/** @returns {{ userLanguage: string, learningLevel: string } | null} */
export function leerPreferencias(perfilId) {
  if (typeof window === 'undefined' || !perfilId) return null;
  const prefs = leerTodas()[perfilId];
  return prefs?.userLanguage ? prefs : null;
}

export function guardarPreferencias(perfilId, { userLanguage, learningLevel }) {
  if (!perfilId || !userLanguage) return;
  try {
    const todas = leerTodas();
    todas[perfilId] = { userLanguage, learningLevel: learningLevel || '' };
    window.localStorage.setItem(CLAVE, JSON.stringify(todas));
  } catch {
    // localStorage puede fallar (modo privado, cuota) — no es crítico.
  }
}
