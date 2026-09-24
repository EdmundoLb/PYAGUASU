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

export function leerPerfilActivo() {
  if (typeof window === 'undefined') return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

// Snapshot estable para el render en el servidor (ahí no hay localStorage).
export function perfilActivoServidor() {
  return null;
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
