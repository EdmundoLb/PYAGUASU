import MascotaProfe from "./MascotaProfe";

const ETAPAS = ["Leyendo", "Verificando unidades", "Identificando fórmula", "Preparando pista"];

// `etapa` es controlado por el padre (page.js) con un intervalo de ~800ms
// mientras fase === "cargando" — este componente solo pinta el estado actual.
export default function TutorPensando({ etapa = 0 }) {
  return (
    <div className="mensaje-nuevo flex items-start gap-2">
      <div className="w-7 h-7 rounded-full superficie-marca flex items-center justify-center flex-shrink-0 shadow-elevation-1">
        <MascotaProfe estado="pensando" size={16} />
      </div>
      <div className="px-4 py-3 rounded-3xl rounded-bl-md bg-surface-container-lowest border border-surface-container-high shadow-elevation-1 flex flex-col gap-1.5 min-w-[190px]">
        {ETAPAS.map((texto, i) => {
          const activa = i === etapa % ETAPAS.length;
          const pasada = i < etapa % ETAPAS.length;
          return (
            <div
              key={texto}
              className={`flex items-center gap-2 text-body-sm transition-colors duration-200 ${
                activa ? "text-primary font-semibold" : pasada ? "text-on-surface-variant" : "text-outline"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-200 ${
                  activa ? "bg-primary punto-escribiendo" : pasada ? "bg-on-surface-variant" : "bg-outline-variant"
                }`}
              />
              {texto}
            </div>
          );
        })}
      </div>
    </div>
  );
}
