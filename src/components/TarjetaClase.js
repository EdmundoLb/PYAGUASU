import Link from "next/link";
import Icono from "./Icono";

export default function TarjetaClase({ clase }) {
  return (
    <Link
      href={`/docente/clases/${clase.id}`}
      className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface-container-lowest shadow-elevation-2 hover:shadow-elevation-3 active:scale-[0.98] transition-all duration-200"
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-title-md font-semibold truncate">{clase.nombre}</span>
        <span className="text-body-sm text-on-surface-variant flex items-center gap-1.5">
          <Icono nombre="group" size={14} />
          {clase.alumnosIds.length} alumno{clase.alumnosIds.length === 1 ? "" : "s"}
        </span>
      </div>
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-mono font-bold flex-shrink-0">
        <Icono nombre="key" size={14} />
        {clase.codigoInvitacion}
      </span>
    </Link>
  );
}
