// Tema claro/oscuro. Sin preferencia guardada, sigue al sistema; con el
// botón sol/luna (BotonTema) el alumno lo fija y queda recordado. El tema
// activo vive en <html data-theme="claro|oscuro">, que lo pone un script en
// layout.js ANTES de pintar (así no parpadea) y que globals.css usa para
// redefinir los colores.
export const CLAVE_TEMA = 'pyaguasu.tema';

// Script que layout.js pone en <head>: el mismo cálculo que temaResuelto(),
// minificado y sin imports porque corre antes de que cargue la app.
export const SCRIPT_TEMA_INICIAL = `(function(){try{var t=localStorage.getItem("${CLAVE_TEMA}");if(t!=="claro"&&t!=="oscuro")t=matchMedia("(prefers-color-scheme: dark)").matches?"oscuro":"claro";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

const listeners = new Set();

function preferenciaGuardada() {
  try {
    const t = window.localStorage.getItem(CLAVE_TEMA);
    return t === 'claro' || t === 'oscuro' ? t : null;
  } catch {
    return null;
  }
}

function temaDelSistema() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  } catch {
    return 'claro';
  }
}

export function temaResuelto() {
  return preferenciaGuardada() || temaDelSistema();
}

export function aplicarTema(tema = temaResuelto()) {
  document.documentElement.setAttribute('data-theme', tema);
  listeners.forEach((fn) => fn());
}

// Para useSyncExternalStore: lo que está aplicado en <html> ahora mismo.
export function leerTema() {
  if (typeof document === 'undefined') return 'claro';
  return document.documentElement.getAttribute('data-theme') === 'oscuro' ? 'oscuro' : 'claro';
}

export function leerTemaServidor() {
  return 'claro';
}

export function establecerTema(tema) {
  try {
    window.localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // localStorage puede fallar (modo privado, cuota llena) — igual se aplica.
  }
  aplicarTema(tema);
}

export function suscribirseTema(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Si el alumno nunca eligió, acompaña los cambios del sistema (ej. el
// celular pasa a modo oscuro de noche). Devuelve la función para dejar de escuchar.
export function seguirAlSistema() {
  let consulta;
  try {
    consulta = window.matchMedia('(prefers-color-scheme: dark)');
  } catch {
    return () => {};
  }
  const alCambiar = () => {
    if (!preferenciaGuardada()) aplicarTema();
  };
  consulta.addEventListener('change', alCambiar);
  return () => consulta.removeEventListener('change', alCambiar);
}
