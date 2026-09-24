import Icono from "./Icono";
import RenderizadorMatematico from "./RenderizadorMatematico";

const DIRECCIONES_VALIDAS = ["izquierda", "derecha", "arriba", "abajo", "ninguna"];

// Fila de fichas ícono+etiqueta que representa la escena física del paso
// actual (solo para el estilo de aprendizaje que la IA decida llenarla —
// ver construirContextoAprendizaje en lib/quiz/diagnostico.js). Cada ficha
// entra con una animación de un solo tiro (nunca en loop) que se asienta en
// un estado final fijo — ver .escena-elemento en globals.css.
export default function DiagramaEscena({ elementos = [] }) {
  if (!Array.isArray(elementos) || elementos.length === 0) return null;

  const resumen = elementos.map((el) => el.etiqueta).join("; ");

  return (
    <div
      className="mensaje-nuevo flex items-start gap-3 overflow-x-auto pb-1 -mx-1 px-1"
      role="img"
      aria-label={`Escena: ${resumen}`}
    >
      {elementos.map((el, i) => {
        const direccion = DIRECCIONES_VALIDAS.includes(el.direccion) ? el.direccion : "ninguna";
        return (
          <div
            key={i}
            className={`escena-elemento escena-elemento--${direccion} flex flex-col items-center gap-1 flex-shrink-0`}
            style={{ "--escena-stagger": `${i * 110}ms` }}
          >
            <span className="escena-icono w-12 h-12 rounded-xl bg-surface-container-low shadow-elevation-1 flex items-center justify-center text-primary">
              <Icono nombre={el.icono} size={28} />
            </span>
            <span className="font-mono text-label-sm text-on-surface-variant text-center max-w-[72px]">
              <RenderizadorMatematico texto={el.etiqueta} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
