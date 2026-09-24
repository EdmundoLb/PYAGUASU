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
  // Cuando no corresponde animar (inactivo, sin texto, o el sistema pide
  // menos movimiento), "longitud" se deriva directo de texto.length en cada
  // render — nunca se sincroniza con un setState en el efecto, así siempre
  // queda consistente al instante, sin importar por qué cambió "animar".
  const animar = activo && !!texto && !prefiereMenosMovimiento();
  const [longitudAnimada, setLongitudAnimada] = useState(0);
  const textoAnteriorRef = useRef(texto);

  useEffect(() => {
    if (!animar) return;
    if (texto === textoAnteriorRef.current && longitudAnimada > 0) return;
    textoAnteriorRef.current = texto;

    setLongitudAnimada(0);
    const id = setInterval(() => {
      setLongitudAnimada((l) => {
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
  }, [texto, animar]);

  const longitud = animar ? longitudAnimada : texto?.length || 0;
  const completo = longitud >= (texto?.length || 0);
  const saltarAlFinal = () => setLongitudAnimada(texto?.length || 0);

  return [texto ? texto.slice(0, longitud) : "", completo, saltarAlFinal];
}
