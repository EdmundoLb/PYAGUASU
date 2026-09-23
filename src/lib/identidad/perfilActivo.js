// Identidad sin login real: el perfil elegido (mock, sin contraseña) se
// guarda en localStorage para sobrevivir a un refresh de página, aunque el
// store del server (src/lib/store/db.js) sea solo en memoria. No es
// seguridad de verdad — es solo continuidad de UX para la demo.
const CLAVE = 'pyaguasu.perfilActivo';

export function guardarPerfilActivo(perfil) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(perfil));
  } catch {
    // localStorage puede fallar (modo privado, cuota, etc.) — no es crítico.
  }
}

export function leerPerfilActivo() {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

export function limpiarPerfilActivo() {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    // no-op
  }
}
