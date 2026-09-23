"use client";

import { useEffect } from "react";

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
export default function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

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
