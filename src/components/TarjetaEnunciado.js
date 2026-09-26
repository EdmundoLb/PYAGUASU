"use client";

import { useState } from "react";
import Icono from "./Icono";
import RenderizadorMatematico from "./RenderizadorMatematico";

// Enunciado del ejercicio arriba de todo (antes no se veía durante la
// conversación: el chat lo ocultaba). Respeta los saltos de línea, así los
// incisos a/b/c/d quedan uno por renglón, y si es largo se muestra plegado.
const LARGO_PLEGABLE = 220;
const LINEAS_PLEGABLE = 4;

export default function TarjetaEnunciado({ enunciado, tema, accion }) {
  const [abierto, setAbierto] = useState(false);
  if (!enunciado) return null;
  const esLargo = enunciado.length > LARGO_PLEGABLE || enunciado.split("\n").length > LINEAS_PLEGABLE;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="flex items-center gap-2 min-w-0">
          <Icono nombre="description" size={18} className="text-primary flex-shrink-0" />
          <span className="text-label-md font-mono uppercase tracking-wider text-on-surface-variant font-semibold">Enunciado</span>
          {tema && (
            <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-mono font-semibold truncate">
              {tema}
            </span>
          )}
        </span>
        {accion}
      </div>
      <p
        className={`text-body-md leading-relaxed text-on-surface whitespace-pre-line ${esLargo && !abierto ? "line-clamp-4" : ""}`}
      >
        <RenderizadorMatematico texto={enunciado.trim()} />
      </p>
      {esLargo && (
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          className="self-end min-h-[36px] px-2 inline-flex items-center gap-1 text-label-md font-semibold text-secondary active:scale-[0.98] transition-all duration-200"
        >
          {abierto ? "Ver menos" : "Ver completo"}
          <Icono nombre={abierto ? "expand_less" : "expand_more"} size={18} />
        </button>
      )}
    </div>
  );
}
