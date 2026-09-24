"use client";

import { useEffect, useRef, useState } from "react";
import Icono from "./Icono";

// Oculto por defecto (ver ConversacionTutor): el público de esta app tiene
// poca experiencia técnica, así que el input de texto simple sigue siendo
// la opción principal. Esto es un panel opcional para expresiones más
// complejas (fracciones, raíces, exponentes), tipo calculadora GeoGebra.
export default function TecladoMatematico({ onInsertar, onCerrar }) {
  const campoRef = useRef(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // mathlive registra <math-field> como custom element; necesita `window`,
    // por eso se carga solo en el cliente y recién cuando este panel se abre.
    import("mathlive").then(() => setListo(true));
  }, []);

  function insertar() {
    const latex = campoRef.current?.getValue?.("latex")?.trim();
    if (latex) onInsertar(`$${latex}$`);
  }

  return (
    <div className="mensaje-nuevo flex flex-col gap-2 p-3 rounded-2xl bg-surface-container-lowest shadow-elevation-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label-md font-mono text-on-surface-variant flex items-center gap-1.5">
          <Icono nombre="functions" size={16} className="text-primary" />
          Insertar fórmula
        </span>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar teclado matemático"
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high active:scale-[0.96] transition-all duration-200"
        >
          <Icono nombre="close" size={18} />
        </button>
      </div>

      {listo ? (
        // eslint-disable-next-line react/no-unknown-property -- custom element de mathlive
        <math-field ref={campoRef} virtual-keyboard-mode="onfocus" className="w-full p-2 rounded-xl bg-surface-container-low text-body-lg" />
      ) : (
        <p className="text-body-sm text-on-surface-variant">Cargando teclado...</p>
      )}

      <button
        type="button"
        onClick={insertar}
        disabled={!listo}
        className="min-h-[44px] rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-all duration-200"
      >
        Insertar en mi respuesta
      </button>
    </div>
  );
}
