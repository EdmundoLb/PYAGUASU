"use client";

import { useLayoutEffect } from "react";
import { aplicarTema, seguirAlSistema } from "@/lib/ui/tema";

// El script de layout.js pone el tema antes de pintar. Esto lo vuelve a
// aplicar después de hidratar (en desarrollo, el Strict Mode de React
// remonta y borra el atributo de <html>) y acompaña los cambios del sistema
// mientras el alumno no haya elegido uno a mano.
export default function AplicarTema() {
  useLayoutEffect(() => {
    aplicarTema();
    return seguirAlSistema();
  }, []);
  return null;
}
