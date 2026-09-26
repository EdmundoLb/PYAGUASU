"use client";

import Icono from "./Icono";
import DiagramaEscena from "./DiagramaEscena";
import SimuladorVariable from "./SimuladorVariable";
import MascotaProfe from "./MascotaProfe";
import RenderizadorMatematico from "./RenderizadorMatematico";
import { useTypewriter } from "@/lib/ui/useTypewriter";

// "nueva" | "correcta" | "incorrecta": estado del último intento del
// estudiante, para que la tarjeta del paso EN CURSO cambie de color/etiqueta
// como refuerzo inmediato (estilo lección corta) — nunca cambia el texto,
// solo el marco alrededor (y la expresión de la mascota).
const ACENTO_POR_ESTADO = {
  nueva: {
    borde: "border-primary",
    avatar: "superficie-marca",
    etiqueta: "text-primary",
    texto: "Tu turno",
  },
  correcta: {
    borde: "border-tertiary",
    avatar: "bg-tertiary text-on-tertiary",
    etiqueta: "text-tertiary",
    texto: "¡Correcto!",
  },
  incorrecta: {
    borde: "border-secondary",
    avatar: "bg-secondary text-on-secondary",
    etiqueta: "text-secondary",
    texto: "Casi — seguí probando",
  },
  // "Mostrame este paso": pedir ayuda no es un error, así que no se pinta
  // como "Casi".
  ayuda: {
    borde: "border-primary",
    avatar: "superficie-marca",
    etiqueta: "text-primary",
    texto: "Así se resuelve este paso",
  },
};

// Chips "Repasar: …" bajo un mensaje del tutor que menciona un concepto del
// material del profe (ver lib/conceptos/glosario.js): abren el repaso.
function ChipsConcepto({ conceptos, onAbrir }) {
  if (!conceptos?.length || !onAbrir) return null;
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Repasar conceptos">
      {conceptos.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAbrir(c.id);
          }}
          className="min-h-[40px] px-3 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-md font-semibold shadow-elevation-1 flex items-center gap-1.5 active:scale-[0.98] hover:-translate-y-0.5 transition-all duration-200"
        >
          <Icono nombre="auto_stories" size={16} />
          Repasar: {c.titulo}
        </button>
      ))}
    </div>
  );
}

export default function BurbujaChat({
  autor,
  texto,
  activa = false,
  estadoTurno = "nueva",
  elementosEscena = [],
  variableExplorable = null,
  conceptos = [],
  onAbrirConcepto,
}) {
  const esTutor = autor === "tutor";
  // El efecto de "escribiendo" solo aplica al paso EN CURSO — el historial
  // ya resuelto se sigue mostrando completo al instante, como antes.
  const [textoRevelado, completo, saltarAlFinal] = useTypewriter(texto, { activo: esTutor && activa });

  // El paso EN CURSO (el último mensaje del tutor, mientras no se respondió
  // todavía) se destaca como una tarjeta de lección en vez de una burbuja
  // más del historial — así el estudiante siempre sabe cuál es "el reto de
  // ahora" de un vistazo, sin tener que releer el chat entero.
  if (esTutor && activa) {
    const acento = ACENTO_POR_ESTADO[estadoTurno] || ACENTO_POR_ESTADO.nueva;
    return (
      <div
        className={`mensaje-nuevo flex flex-col gap-2 p-4 sm:p-5 rounded-3xl bg-surface-container-lowest border border-surface-container-high border-l-[5px] ${acento.borde} shadow-elevation-3`}
        onClick={completo ? undefined : saltarAlFinal}
      >
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-elevation-1 ${acento.avatar}`}>
            <MascotaProfe estado={estadoTurno} size={18} />
          </div>
          <span className={`font-mono text-label-sm uppercase tracking-wider font-bold ${acento.etiqueta}`}>
            {acento.texto}
          </span>
        </div>
        <DiagramaEscena elementos={elementosEscena} />
        <p className="text-body-lg leading-relaxed text-on-surface pl-11 -mt-1">
          {/* Durante la escritura las fórmulas aparecen completas y ya
              renderizadas; antes se veía el LaTeX crudo ("$v$") hasta el final. */}
          <RenderizadorMatematico texto={texto} longitudVisible={completo ? undefined : textoRevelado.length} />
        </p>
        <SimuladorVariable variable={variableExplorable} />
        <div className="pl-11">
          <ChipsConcepto conceptos={conceptos} onAbrir={onAbrirConcepto} />
        </div>
      </div>
    );
  }

  return (
    <div className={`mensaje-nuevo flex items-end gap-2 ${esTutor ? "justify-start" : "justify-end"}`}>
      {esTutor && (
        <div className="w-7 h-7 rounded-full superficie-marca flex items-center justify-center flex-shrink-0 shadow-elevation-1">
          <MascotaProfe estado="nueva" size={16} />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 text-body-md leading-relaxed shadow-elevation-1 ${
          esTutor
            ? "bg-surface-container text-on-surface-variant rounded-3xl rounded-bl-md"
            : "superficie-marca rounded-3xl rounded-br-md"
        }`}
      >
        <RenderizadorMatematico texto={texto} />
        {esTutor && conceptos?.length > 0 && (
          <div className="mt-2">
            <ChipsConcepto conceptos={conceptos} onAbrir={onAbrirConcepto} />
          </div>
        )}
      </div>
      {!esTutor && (
        <div className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center flex-shrink-0 shadow-elevation-1">
          <Icono nombre="person" size={16} />
        </div>
      )}
    </div>
  );
}
