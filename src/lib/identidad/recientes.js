// Perfiles usados en ESTE dispositivo (hasta 3, el más reciente primero),
// para mostrarlos arriba en la pantalla de elegir perfil. Aparte de
// perfilActivo.js porque "Cambiar perfil" borra el activo, pero queremos
// seguir recordando quién usa este celular.
const CLAVE = 'pyaguasu.perfilesRecientes';
const MAXIMO = 3;

export function leerRecientes() {
  if (typeof window === 'undefined') return [];
  try {
    const ids = JSON.parse(window.localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function registrarReciente(id) {
  if (!id) return;
  try {
    const ids = [id, ...leerRecientes().filter((otro) => otro !== id)].slice(0, MAXIMO);
    window.localStorage.setItem(CLAVE, JSON.stringify(ids));
  } catch {
    // localStorage puede fallar (modo privado, cuota, etc.) — no es crítico.
  }
}
