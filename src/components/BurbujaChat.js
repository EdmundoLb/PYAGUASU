import Icono from "./Icono";

// "nueva" | "correcta" | "incorrecta": estado del último intento del
// estudiante, para que la tarjeta del paso EN CURSO cambie de color/etiqueta
// como refuerzo inmediato (estilo lección corta) — nunca cambia el texto,
// solo el marco alrededor.
const ACENTO_POR_ESTADO = {
  nueva: {
    borde: "border-primary",
    avatar: "bg-primary text-on-primary",
    etiqueta: "text-primary",
    icono: "school",
    texto: "Tu turno",
  },
  correcta: {
    borde: "border-tertiary",
    avatar: "bg-tertiary text-on-tertiary",
    etiqueta: "text-tertiary",
    icono: "check_circle",
    texto: "¡Correcto!",
  },
  incorrecta: {
    borde: "border-secondary",
    avatar: "bg-secondary text-on-secondary",
    etiqueta: "text-secondary",
    icono: "lightbulb",
    texto: "Casi — seguí probando",
  },
};

export default function BurbujaChat({ autor, texto, activa = false, estadoTurno = "nueva" }) {
  const esTutor = autor === "tutor";

  // El paso EN CURSO (el último mensaje del tutor, mientras no se respondió
  // todavía) se destaca como una tarjeta de lección en vez de una burbuja
  // más del historial — así el estudiante siempre sabe cuál es "el reto de
  // ahora" de un vistazo, sin tener que releer el chat entero.
  if (esTutor && activa) {
    const acento = ACENTO_POR_ESTADO[estadoTurno] || ACENTO_POR_ESTADO.nueva;
    return (
      <div
        className={`mensaje-nuevo flex flex-col gap-2 p-4 rounded-2xl bg-surface-container-lowest border-l-4 ${acento.borde} shadow-elevation-2`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-elevation-1 ${acento.avatar}`}>
            <Icono nombre={acento.icono} size={18} />
          </div>
          <span className={`font-mono text-label-sm uppercase tracking-wider font-bold ${acento.etiqueta}`}>
            {acento.texto}
          </span>
        </div>
        <p className="text-body-lg leading-relaxed text-on-surface pl-10 -mt-1">{texto}</p>
      </div>
    );
  }

  return (
    <div className={`mensaje-nuevo flex items-end gap-2 opacity-70 ${esTutor ? "justify-start" : "justify-end"}`}>
      {esTutor && (
        <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0 shadow-elevation-1">
          <Icono nombre="school" size={16} />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 text-body-md leading-relaxed shadow-elevation-1 ${
          esTutor
            ? "bg-surface-container-lowest text-on-surface rounded-2xl rounded-bl-sm"
            : "bg-primary text-on-primary rounded-2xl rounded-br-sm"
        }`}
      >
        {texto}
      </div>
      {!esTutor && (
        <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0 shadow-elevation-1">
          <Icono nombre="person" size={16} />
        </div>
      )}
    </div>
  );
}
