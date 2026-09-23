import Icono from "./Icono";

export default function TarjetaInsignia({ insignia, desbloqueada = true }) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl shadow-elevation-1 text-center ${
        desbloqueada ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-surface-container text-on-surface-variant opacity-50"
      }`}
    >
      <Icono nombre={insignia.icono} size={26} />
      <span className="text-label-sm font-semibold leading-tight">{insignia.nombre}</span>
    </div>
  );
}
