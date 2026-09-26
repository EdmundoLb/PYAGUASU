import Link from "next/link";
import Icono from "./Icono";

export default function TarjetaClase({ clase }) {
  const cantidad = clase.alumnosIds.length;
  return (
    <Link
      href={`/docente/clases/${clase.id}`}
      className="tarjeta-interactiva group flex flex-col gap-4 p-5 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-2"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="w-11 h-11 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center flex-shrink-0">
          <Icono nombre="school" size={24} />
        </span>
        <Icono
          nombre="arrow_forward"
          size={22}
          className="text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200"
        />
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="text-title-lg font-semibold truncate">{clase.nombre}</span>
        <div className="flex items-center gap-2 flex-wrap text-body-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Icono nombre="group" size={16} />
            {cantidad} alumno{cantidad === 1 ? "" : "s"}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 font-mono font-bold text-secondary">
            <Icono nombre="key" size={15} />
            {clase.codigoInvitacion}
          </span>
        </div>
      </div>
    </Link>
  );
}
