import Icono from "./Icono";
import PasosOnboarding from "./PasosOnboarding";
import MascotaHero from "./MascotaHero";
import { CANAL, PREGUNTAS_DIAGNOSTICO } from "@/lib/quiz/diagnostico";

// Colores por canal, solo para esta pantalla (el estudiante SÍ sabe que
// está respondiendo un test de preferencias, así que no hay problema en que
// la UI distinga los canales visualmente — lo que nunca debe pasar es que
// el tutor los nombre después, en medio de la resolución de un problema).
const ACENTO_POR_CANAL = {
  [CANAL.VISUAL]: { borde: "hover:border-primary/50", letra: "bg-primary-fixed text-primary" },
  [CANAL.AUDITIVO]: { borde: "hover:border-secondary/50", letra: "bg-secondary-fixed text-secondary" },
  [CANAL.KINESTESICO]: { borde: "hover:border-tertiary/50", letra: "bg-tertiary-fixed text-tertiary" },
};

// Test de diagnóstico de estilo de aprendizaje (VAK + Felder-Silverman): no
// hay respuestas correctas o incorrectas, cada opción representa un canal
// (visual / auditivo / kinestésico) y elegirla suma un punto a ese canal.
export default function PantallaQuizDiagnostico({ idioma, indice, onResponder }) {
  const pregunta = PREGUNTAS_DIAGNOSTICO[indice];
  const total = PREGUNTAS_DIAGNOSTICO.length;

  if (!pregunta) return null;

  return (
    <div className="flex flex-col gap-6 pt-1">
      <PasosOnboarding actual="quiz" />
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <MascotaHero estado="pensando" size={56} />
          <div className="flex flex-col gap-1.5 flex-1">
            <span className="text-label-md font-semibold text-secondary flex items-center gap-1.5">
              <Icono nombre="quiz" size={16} />
              Pregunta {indice + 1} de {total} · no hay respuestas incorrectas
            </span>
            <div className="flex gap-1.5" aria-hidden="true">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                    i <= indice ? "boton-degradado" : "bg-surface-container-high"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <h1 key={indice} className="mensaje-nuevo text-[26px] leading-tight font-bold tracking-tight">
          {pregunta.texto[idioma] || pregunta.texto.jopara}
        </h1>
      </section>

      <div key={indice} className="escalonado flex flex-col gap-3" role="group" aria-label="Opciones del test">
        {pregunta.opciones.map((opcion, i) => {
          const acento = ACENTO_POR_CANAL[opcion.canal] || ACENTO_POR_CANAL[CANAL.VISUAL];
          return (
            <button
              key={opcion.canal}
              type="button"
              onClick={() => onResponder(opcion.canal)}
              className={`tarjeta-interactiva min-h-[64px] w-full px-4 py-4 rounded-2xl bg-surface-container-lowest border-2 border-surface-container-high ${acento.borde} shadow-elevation-1 text-left text-body-lg font-medium flex items-center gap-3.5`}
            >
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-title-md font-bold flex-shrink-0 ${acento.letra}`}>
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
