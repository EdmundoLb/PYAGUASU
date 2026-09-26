import Icono from "./Icono";

// Una insignia bloqueada muestra CÓMO se consigue (antes era solo un ícono
// gris sin explicación): así funciona como meta, no como hueco vacío.
export default function TarjetaInsignia({ insignia, desbloqueada = true }) {
  return (
    <div
      className={`relative flex flex-col items-center gap-2 p-3.5 rounded-3xl text-center border ${
        desbloqueada
          ? "bg-surface-container-lowest border-tertiary/40 shadow-elevation-2"
          : "bg-surface-container-low border-dashed border-outline-variant"
      }`}
      title={insignia.descripcion}
    >
      <span
        className={`w-14 h-14 rounded-full flex items-center justify-center ${
          desbloqueada
            ? "bg-gradient-to-br from-[#2fb8a5] to-[#00534a] text-white shadow-elevation-2"
            : "bg-surface-container-high text-outline"
        }`}
      >
        <Icono nombre={insignia.icono} size={28} />
      </span>
      {!desbloqueada && (
        <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center">
          <Icono nombre="lock" size={14} />
        </span>
      )}
      <span className={`text-body-sm font-semibold leading-tight ${desbloqueada ? "text-on-surface" : "text-on-surface-variant"}`}>
        {insignia.nombre}
      </span>
      <span className="text-label-sm font-normal text-on-surface-variant leading-snug">{insignia.descripcion}</span>
    </div>
  );
}
