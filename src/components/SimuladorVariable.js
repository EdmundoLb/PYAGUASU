"use client";

import { useEffect, useRef, useState } from "react";
import Icono from "./Icono";
import RenderizadorMatematico from "./RenderizadorMatematico";

const BASE_SEGUNDOS = 1.1;

// Duración del loop del ícono según qué tan lejos movió el estudiante el
// slider respecto al valor real del problema — nunca un número, solo la
// velocidad como metáfora de "más rápido/más lento".
function calcularDuracion({ valorActual, tendencia }, valorSlider) {
  const base = valorActual === 0 ? 1 : Math.abs(valorActual);
  const actual = valorSlider === 0 ? 0.0001 : Math.abs(valorSlider);
  const razon = tendencia === "directa" ? actual / base : base / actual;
  const duracion = BASE_SEGUNDOS / Math.max(razon, 0.0001);
  return Math.min(4, Math.max(0.3, duracion));
}

// Widget interactivo real (a diferencia de DiagramaEscena, que es un dibujo
// de un solo tiro): el estudiante arrastra una variable de ESTE problema y
// ve un ícono acelerar/frenar según la tendencia que declaró la IA — nunca
// un número de resultado, solo la tendencia. Solo aparece para el estilo de
// aprendizaje que la IA decida llenar "variableExplorable" (ver
// construirContextoAprendizaje en lib/quiz/diagnostico.js).
export default function SimuladorVariable({ variable }) {
  const [valor, setValor] = useState(variable?.valorActual ?? 0);
  const [interactuando, setInteractuando] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (!variable) return null;

  function manejarCambio(e) {
    const nuevo = Number(e.target.value);
    setValor(nuevo);
    setInteractuando(true);
    clearTimeout(timeoutRef.current);
    // Se "asienta" solo si el estudiante deja de tocar el control un rato —
    // nunca queda animando para siempre sin interacción.
    timeoutRef.current = setTimeout(() => setInteractuando(false), 1200);
  }

  const duracion = calcularDuracion(variable, valor);
  const paso = (variable.valorMax - variable.valorMin) / 20 || 1;

  return (
    <div className="mensaje-nuevo flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
      <span
        className={`w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center flex-shrink-0 ${
          interactuando ? "simulador-en-marcha" : ""
        }`}
        style={{ "--simulador-duracion": `${duracion}s` }}
      >
        <Icono nombre="speed" size={22} />
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-label-sm font-mono text-on-surface-variant">
          <RenderizadorMatematico texto={variable.etiqueta} />
        </span>
        <div className="flex items-center gap-2">
          <span className="text-label-sm text-outline flex-shrink-0">
            {variable.valorMin}
            {variable.unidad}
          </span>
          <input
            type="range"
            min={variable.valorMin}
            max={variable.valorMax}
            step={paso}
            value={valor}
            onChange={manejarCambio}
            aria-label={`Explorar ${variable.etiqueta}`}
            className="w-full accent-primary"
          />
          <span className="text-label-sm text-outline flex-shrink-0">
            {variable.valorMax}
            {variable.unidad}
          </span>
        </div>
      </div>
    </div>
  );
}
