"use client";

import { useEffect, useRef, useState } from "react";

function prefiereMenosMovimiento() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const CARACTERES_POR_TICK = 2;
const MS_POR_TICK = 18;

// Revela `texto` de a poco, tipo máquina de escribir. Se reinicia solo
// cuando cambia el texto de entrada (no en cada render del padre). Devuelve
// [textoRevelado, completo, saltarAlFinal].
export function useTypewriter(texto, { activo = true } = {}) {
  const [longitud, setLongitud] = useState(activo && !prefiereMenosMovimiento() ? 0 : texto?.length || 0);
  const textoAnteriorRef = useRef(texto);

  useEffect(() => {
    if (texto === textoAnteriorRef.current && longitud > 0) return;
    textoAnteriorRef.current = texto;

    if (!activo || !texto || prefiereMenosMovimiento()) {
      setLongitud(texto?.length || 0);
      return;
    }

    setLongitud(0);
    const id = setInterval(() => {
      setLongitud((l) => {
        const siguiente = l + CARACTERES_POR_TICK;
        if (siguiente >= texto.length) {
          clearInterval(id);
          return texto.length;
        }
        return siguiente;
      });
    }, MS_POR_TICK);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, activo]);

  const completo = longitud >= (texto?.length || 0);
  const saltarAlFinal = () => setLongitud(texto?.length || 0);

  return [texto ? texto.slice(0, longitud) : "", completo, saltarAlFinal];
}
