import Icono from "./Icono";

const ESTILOS_POR_ESTADO = {
  idle: "bg-surface-container-lowest text-on-surface border-transparent",
  correcta: "bg-tertiary-fixed text-on-tertiary-fixed border-tertiary",
  incorrecta: "bg-error-container text-on-error-container border-error",
};

const ESTILOS_LETRA_POR_ESTADO = {
  idle: "bg-surface-container-high text-on-surface-variant",
  correcta: "bg-tertiary text-on-tertiary",
  incorrecta: "bg-error text-on-error",
};

function vibrarSiSePuede(patron) {
  try {
    navigator.vibrate?.(patron);
  } catch {
    // Algunos navegadores/dispositivos no lo soportan — no pasa nada.
  }
}

export default function OpcionQuiz({ opcion, letra, estado = "idle", onResponder, disabled }) {
  const estilo = ESTILOS_POR_ESTADO[estado] || ESTILOS_POR_ESTADO.idle;
  const estiloLetra = ESTILOS_LETRA_POR_ESTADO[estado] || ESTILOS_LETRA_POR_ESTADO.idle;

  function manejarClick() {
    vibrarSiSePuede(opcion.correcta ? 15 : [15, 60, 15]);
    onResponder(opcion);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={manejarClick}
        aria-label={`Opción ${letra}: ${opcion.texto}`}
        className={`min-h-[44px] w-full px-3 py-3 rounded-xl border-2 text-left text-body-md font-medium shadow-elevation-1 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center gap-3 ${estilo} ${
          estado === "incorrecta" ? "sacudir" : ""
        }`}
      >
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-label-md font-bold flex-shrink-0 transition-colors duration-200 ${estiloLetra}`}
        >
          {letra}
        </span>
        <span className="flex-1">{opcion.texto}</span>
        {estado === "correcta" && <Icono nombre="check_circle" size={20} className="flex-shrink-0" />}
        {estado === "incorrecta" && <Icono nombre="cancel" size={20} className="flex-shrink-0" />}
      </button>
      {estado === "incorrecta" && opcion.errorComun && (
        <p className="mensaje-nuevo text-body-sm text-error px-1">
          Ojo: esta es una confusión bastante típica en este tema — segui intentando.
        </p>
      )}
    </div>
  );
}
