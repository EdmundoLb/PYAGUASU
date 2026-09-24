"use client";

import { useRouter } from "next/navigation";
import Icono from "./Icono";
import { limpiarPerfilActivo } from "@/lib/identidad/perfilActivo";

// Único punto de "cerrar sesión" de la app (no hay login real, así que esto
// simplemente olvida el perfil activo y vuelve al selector de rol).
export default function BotonCerrarSesion({ className = "" }) {
  const router = useRouter();

  function cerrarSesion() {
    limpiarPerfilActivo();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={cerrarSesion}
      className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-full text-body-sm font-medium text-on-surface-variant hover:bg-surface-container-high active:scale-[0.98] transition-all duration-200 ${className}`}
    >
      <Icono nombre="logout" size={18} />
      Cerrar sesión
    </button>
  );
}
