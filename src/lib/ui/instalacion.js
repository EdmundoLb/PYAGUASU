// Instalar Py'aguasu como app (PWA). El navegador avisa UNA sola vez por
// carga de página que se puede instalar (evento "beforeinstallprompt", solo
// Chrome/Edge/Android): se captura acá, desde RegistrarServiceWorker (que
// está en el layout y siempre montado), para que el botón lo pueda usar en
// cualquier pantalla aunque aparezca después. En iPhone ese evento no
// existe: se instala a mano (Compartir → Agregar a inicio) y el botón
// muestra esos pasos.
const CLAVE_DESCARTADO = 'pyaguasu.instalarDescartado';

let eventoInstalacion = null;
let recienInstalada = false;
let capturando = false;
const listeners = new Set();

function avisar() {
  listeners.forEach((fn) => fn());
}

export function iniciarCapturaInstalacion() {
  if (capturando || typeof window === 'undefined') return;
  capturando = true;
  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault(); // en vez del cartel del navegador, usamos nuestro botón
    eventoInstalacion = evento;
    avisar();
  });
  window.addEventListener('appinstalled', () => {
    eventoInstalacion = null;
    recienInstalada = true;
    avisar();
  });
}

function yaInstalada() {
  try {
    return recienInstalada || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return recienInstalada;
  }
}

function esIOS() {
  const { userAgent, platform, maxTouchPoints } = window.navigator;
  // iPadOS se presenta como Mac: se reconoce porque tiene pantalla táctil.
  return /iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

function descartado() {
  try {
    return window.localStorage.getItem(CLAVE_DESCARTADO) === '1';
  } catch {
    return false;
  }
}

// Para useSyncExternalStore: "android" (se puede instalar con un toque),
// "ios" (mostrar los pasos) u "oculto".
export function estadoInstalacion() {
  if (typeof window === 'undefined' || yaInstalada() || descartado()) return 'oculto';
  if (eventoInstalacion) return 'android';
  if (esIOS()) return 'ios';
  return 'oculto';
}

export function estadoInstalacionServidor() {
  return 'oculto';
}

export function suscribirseInstalacion(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Abre el diálogo de instalación del navegador. El evento sirve una sola
// vez: se descarta después, acepte o no.
export async function instalarApp() {
  const evento = eventoInstalacion;
  if (!evento) return;
  eventoInstalacion = null;
  avisar();
  try {
    await evento.prompt();
    await evento.userChoice;
  } catch {
    // Si el navegador no deja abrir el diálogo, no pasa nada.
  }
}

export function descartarInstalacion() {
  try {
    window.localStorage.setItem(CLAVE_DESCARTADO, '1');
  } catch {
    // localStorage puede fallar (modo privado): se oculta solo por esta vez.
    eventoInstalacion = null;
  }
  avisar();
}
