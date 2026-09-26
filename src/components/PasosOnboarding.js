import Icono from "./Icono";

// Cuántos pasos faltan antes de empezar a practicar: sin esto el onboarding
// (perfil → idioma → test) se sentía como una lista de preguntas sin fin.
const PASOS = [
  { id: "perfil", etiqueta: "Perfil" },
  { id: "idioma", etiqueta: "Idioma" },
  { id: "quiz", etiqueta: "Tu estilo" },
];

export default function PasosOnboarding({ actual }) {
  const indiceActual = PASOS.findIndex((p) => p.id === actual);

  return (
    <ol className="flex items-center gap-2" aria-label="Pasos antes de empezar">
      {PASOS.map((paso, i) => {
        const hecho = i < indiceActual;
        const activo = i === indiceActual;
        return (
          <li key={paso.id} className="flex items-center gap-2 flex-1 min-w-0" aria-current={activo ? "step" : undefined}>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-label-sm font-bold flex-shrink-0 transition-all duration-300 ${
                hecho
                  ? "bg-tertiary text-on-tertiary"
                  : activo
                    ? "boton-degradado scale-110"
                    : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {hecho ? <Icono nombre="check" size={14} /> : i + 1}
            </span>
            <span
              className={`text-label-md truncate ${activo ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}
            >
              {paso.etiqueta}
            </span>
            {i < PASOS.length - 1 && (
              <span className={`h-0.5 flex-1 min-w-3 rounded-full ${hecho ? "bg-tertiary" : "bg-surface-container-high"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
