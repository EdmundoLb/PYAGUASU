import Link from "next/link";
import Icono from "./Icono";
import BarraProgresoXp from "./BarraProgresoXp";
import { calcularNivel } from "@/lib/gamificacion/niveles";

// Un único componente de gamificación, con dos variantes, para que el "peso
// visual" de nivel/XP no quede repartido en chips sueltos distintos por
// pantalla (header vs dashboard). "compacta" es un resumen tocable; "hero"
// es la versión completa con la barra de progreso.
export default function TarjetaXp({ perfil, variante = "compacta" }) {
  if (!perfil) return null;
  const nivel = calcularNivel(perfil.xp);

  if (variante === "compacta") {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-semibold flex-shrink-0 active:scale-[0.96] transition-all duration-200"
      >
        <span className="w-6 h-6 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-mono text-[11px] font-bold">
          {nivel}
        </span>
        <Icono nombre="bolt" size={14} />
        {perfil.xp} XP
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-3 bg-surface-container-lowest rounded-2xl p-4 shadow-elevation-2">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{perfil.avatarEmoji}</span>
        <div className="flex flex-col">
          <span className="text-title-lg font-semibold">{perfil.nombre}</span>
          {perfil.racha > 0 && (
            <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
              <Icono nombre="local_fire_department" size={14} className="text-secondary" />
              {perfil.racha} sesiones seguidas
            </span>
          )}
        </div>
      </div>
      <BarraProgresoXp xp={perfil.xp} />
    </div>
  );
}
