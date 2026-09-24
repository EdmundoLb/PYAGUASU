// Sin pipeline de audio en el proyecto: el "ding" se sintetiza con Web
// Audio API en vez de agregar un archivo binario nuevo (evita licencias y
// peso de repo). Silencioso si el usuario apagó el sonido, y nunca rompe la
// experiencia si el navegador bloquea el audio (autoplay policy, etc.).

const CLAVE_PREFERENCIA = "kyhyje_sonido";

// Pub-sub mínimo para que useSyncExternalStore (en Encabezado.js) se entere
// de un cambio hecho en la misma pestaña — localStorage no dispara su
// evento 'storage' para escrituras del propio documento.
const listeners = new Set();

export function sonidoActivado() {
  if (typeof window === "undefined") return true;
  try {
    const guardado = window.localStorage.getItem(CLAVE_PREFERENCIA);
    return guardado === null ? true : guardado === "1";
  } catch {
    return true;
  }
}

// Snapshot estable para el render en el servidor (ahí no hay localStorage).
export function sonidoActivadoServidor() {
  return true;
}

export function establecerSonidoActivado(activado) {
  try {
    window.localStorage.setItem(CLAVE_PREFERENCIA, activado ? "1" : "0");
  } catch {
    // localStorage puede fallar (modo privado, cuota llena) — no es crítico.
  }
  listeners.forEach((fn) => fn());
}

export function suscribirseSonido(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let contextoAudio = null;

function obtenerContexto() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!contextoAudio) contextoAudio = new AudioContextClass();
  return contextoAudio;
}

// Dos notas cortas ascendentes (Do5 -> Mi5, un "ding" cálido) generadas con
// osciladores — no depende de ningún archivo de audio.
export function reproducirSonidoCorrecto() {
  if (!sonidoActivado()) return;
  const ctx = obtenerContexto();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") ctx.resume();
    const ahora = ctx.currentTime;

    [
      { frecuencia: 523.25, inicio: 0 }, // Do5
      { frecuencia: 659.25, inicio: 0.09 }, // Mi5
    ].forEach(({ frecuencia, inicio }) => {
      const oscilador = ctx.createOscillator();
      const ganancia = ctx.createGain();
      oscilador.type = "sine";
      oscilador.frequency.value = frecuencia;
      ganancia.gain.setValueAtTime(0, ahora + inicio);
      ganancia.gain.linearRampToValueAtTime(0.18, ahora + inicio + 0.02);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + inicio + 0.25);
      oscilador.connect(ganancia);
      ganancia.connect(ctx.destination);
      oscilador.start(ahora + inicio);
      oscilador.stop(ahora + inicio + 0.26);
    });
  } catch {
    // Si el navegador bloquea el audio, fallamos en silencio.
  }
}
