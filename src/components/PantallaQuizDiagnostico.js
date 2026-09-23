import Icono from "./Icono";
import { CANAL, PREGUNTAS_DIAGNOSTICO } from "@/lib/quiz/diagnostico";

// Colores por canal, solo para esta pantalla (el estudiante SÍ sabe que
// está respondiendo un test de preferencias, así que no hay problema en que
// la UI distinga los canales visualmente — lo que nunca debe pasar es que
// el tutor los nombre después, en medio de la resolución de un problema).
const ACENTO_POR_CANAL = {
  [CANAL.VISUAL]: { borde: "border-primary", letra: "bg-primary text-on-primary" },
  [CANAL.AUDITIVO]: { borde: "border-secondary", letra: "bg-secondary text-on-secondary" },
  [CANAL.KINESTESICO]: { borde: "border-tertiary", letra: "bg-tertiary text-on-tertiary" },
};

// Test de diagnóstico de estilo de aprendizaje (VAK + Felder-Silverman): no
// hay respuestas correctas o incorrectas, cada opción representa un canal
// (visual / auditivo / kinestésico) y elegirla suma un punto a ese canal.
export default function PantallaQuizDiagnostico({ idioma, indice, onResponder }) {
  const pregunta = PREGUNTAS_DIAGNOSTICO[indice];
  const total = PREGUNTAS_DIAGNOSTICO.length;

  if (!pregunta) return null;

  return (
    <div className="flex flex-col gap-5 pt-1">
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-elevation-1">
            <Icono nombre="quiz" size={18} />
          </span>
          <span className="font-mono text-label-md uppercase tracking-wider text-secondary font-semibold">
            Test rápido · {indice + 1}/{total}
          </span>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= indice ? "bg-primary" : "bg-surface-container-high"
              }`}
            />
          ))}
        </div>
        <h1 className="text-headline-md tracking-tight leading-tight">
          {pregunta.texto[idioma] || pregunta.texto.jopara}
        </h1>
      </section>

      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Opciones del test">
        {pregunta.opciones.map((opcion, i) => {
          const acento = ACENTO_POR_CANAL[opcion.canal] || ACENTO_POR_CANAL[CANAL.VISUAL];
          return (
            <button
              key={opcion.canal}
              type="button"
              onClick={() => onResponder(opcion.canal)}
              aria-label={`Opción ${String.fromCharCode(65 + i)}`}
              className={`min-h-[44px] w-full px-3.5 py-3.5 rounded-xl bg-surface-container-lowest border-l-4 ${acento.borde} shadow-elevation-1 hover:shadow-elevation-2 text-left text-body-md font-medium active:scale-[0.98] transition-all duration-200 flex items-center gap-3`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-label-md font-bold flex-shrink-0 ${acento.letra}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opcion.texto[idioma] || opcion.texto.jopara}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
