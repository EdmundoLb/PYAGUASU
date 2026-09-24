// Identidad sin login real: el perfil elegido (mock, sin contraseña) se
// guarda en localStorage para sobrevivir a un refresh de página, aunque el
// store del server (src/lib/store/db.js) sea solo en memoria. No es
// seguridad de verdad — es solo continuidad de UX para la demo.
const CLAVE = 'pyaguasu.perfilActivo';

// Pub-sub mínimo para que useSyncExternalStore (ranking, dashboard, panel
// docente) se entere de un cambio hecho en la misma pestaña — localStorage
// no dispara su evento 'storage' para escrituras del propio documento.
const listeners = new Set();

export function guardarPerfilActivo(perfil) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(perfil));
  } catch {
    // localStorage puede fallar (modo privado, cuota, etc.) — no es crítico.
  }
  listeners.forEach((fn) => fn());
}

// useSyncExternalStore exige que getSnapshot devuelva el MISMO objeto
// mientras el store no cambió: si se hiciera JSON.parse en cada llamada,
// React vería un "cambio" en cada render y entraría en loop infinito
// ("Maximum update depth exceeded"). Por eso se cachea el objeto parseado
// usando el string crudo como clave.
let ultimoCrudo = null;
let ultimoPerfil = null;

export function leerPerfilActivo() {
  if (typeof window === 'undefined') return null;
  let crudo;
  try {
    crudo = window.localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
  if (crudo === ultimoCrudo) return ultimoPerfil;
  ultimoCrudo = crudo;
  try {
    ultimoPerfil = crudo ? JSON.parse(crudo) : null;
  } catch {
    ultimoPerfil = null;
  }
  return ultimoPerfil;
}

// Snapshot para el render en el servidor y la hidratación (ahí todavía no
// se leyó localStorage). Es `undefined` a propósito, distinto de `null`
// ("no hay perfil"): las páginas solo redirigen con `null`, así no echan
// al usuario en el primer render antes de haber leído su perfil.
export function perfilActivoServidor() {
  return undefined;
}

export function limpiarPerfilActivo() {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    // no-op
  }
  listeners.forEach((fn) => fn());
}

export function suscribirsePerfilActivo(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
