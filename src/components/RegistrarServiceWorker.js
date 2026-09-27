"use client";

import { useEffect } from "react";
import { iniciarCapturaInstalacion } from "@/lib/ui/instalacion";

// Componente sin UI: registra el service worker una sola vez. Da
// instalabilidad (ícono de app, se abre sin barra del navegador) — no
// funcionamiento offline completo, porque el tutor de IA y el store mock
// necesitan servidor vivo siempre.
//
// ⚠️ Autorecarga al detectar un SW nuevo: un service worker desactualizado
// (de una versión anterior de sw.js) puede quedar sirviendo un HTML viejo
// congelado — el navegador ya trae eso solo (no fixeable con más código de
// servidor). Forzar `update()` + recargar una vez cuando cambia el
// "controller" es el patrón estándar para que la corrección de sw.js se
// propague sola en el próximo reload, sin que cada persona tenga que
// limpiar Application Storage a mano.
//
// ⚠️ Solo en producción: sw.js cachea `_next/static/*` con cache-first
// porque en un build esos nombres llevan hash del contenido. En `next dev`
// NO: Turbopack mantiene el mismo nombre (ej. `src_xxx._.js`) aunque el
// código cambie, así que el SW seguía sirviendo JS viejo mezclado con el
// runtime nuevo ("Router action dispatched before initialization", cambios
// que no aparecen). En dev se desinstala cualquier SW que haya quedado y
// se borra su caché.
function desinstalarEnDesarrollo() {
  navigator.serviceWorker.getRegistrations().then(async (registros) => {
    if (registros.length === 0) return;
    await Promise.all(registros.map((r) => r.unregister()));
    const claves = await caches.keys();
    await Promise.all(claves.map((c) => caches.delete(c)));
    // La página actual todavía la controla el SW viejo: una recarga y ya
    // queda libre (no se repite, porque ya no hay registros).
    window.location.reload();
  });
}

export default function RegistrarServiceWorker() {
  useEffect(() => {
    // Antes que nada: el aviso de "se puede instalar" llega una sola vez por
    // carga y lo usa el botón BotonInstalar en cualquier pantalla.
    iniciarCapturaInstalacion();
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      desinstalarEnDesarrollo();
      return;
    }

    let yaRecargo = false;
    function alCambiarController() {
      if (yaRecargo) return;
      yaRecargo = true;
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener("controllerchange", alCambiarController);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registro) => registro.update().catch(() => {}))
      .catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", alCambiarController);
    };
  }, []);

  return null;
}
