// Service worker mínimo: solo da instalabilidad (ícono de app, se abre sin
// barra del navegador). NO cachea /api/* — el tutor de IA y el store mock
// necesitan servidor vivo siempre, cachear esas respuestas sería incorrecto.
//
// ⚠️ Las navegaciones (el documento HTML) van SIEMPRE primero a la red, y
// solo caen a caché si no hay conexión. Un cache-first de "/" (como tenía
// una versión anterior de este archivo) deja la app CONGELADA en el primer
// HTML que se haya cacheado — con Turbopack/Next en dev cada compilación
// cambia los hashes de los chunks, así que servir ese HTML viejo intenta
// cargar JS que ya no existe y la app deja de reaccionar a clics sin ni
// siquiera tirar un error visible. Solo los assets de `_next/static/*` son
// seguros para cache-first: su nombre de archivo cambia con el contenido.
const CACHE = "pyaguasu-shell-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // siempre red, nunca caché

  // Navegación (HTML): red primero, caché solo como respaldo sin conexión.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copia));
          return respuesta;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets estáticos con nombre hasheado: cache-first es seguro.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then(
        (cacheada) =>
          cacheada ||
          fetch(event.request).then((respuesta) => {
            const copia = respuesta.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copia));
            return respuesta;
          })
      )
    );
  }
});
