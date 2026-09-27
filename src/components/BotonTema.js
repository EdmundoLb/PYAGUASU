"use client";

import { useSyncExternalStore } from "react";
import Icono from "./Icono";
import { establecerTema, leerTema, leerTemaServidor, suscribirseTema } from "@/lib/ui/tema";

// Sol/luna: cambia entre claro y oscuro y lo recuerda (ver lib/ui/tema.js).
export default function BotonTema() {
  const tema = useSyncExternalStore(suscribirseTema, leerTema, leerTemaServidor);
  const oscuro = tema === "oscuro";

  return (
    <button
      type="button"
      onClick={() => establecerTema(oscuro ? "claro" : "oscuro")}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className="min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface active:scale-[0.95] transition-all duration-200"
    >
      <Icono key={tema} nombre={oscuro ? "light_mode" : "dark_mode"} size={20} className="mensaje-nuevo" />
    </button>
  );
}
