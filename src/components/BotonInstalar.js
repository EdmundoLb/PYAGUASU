"use client";

import { useState, useSyncExternalStore } from "react";
import Icono from "./Icono";
import {
  descartarInstalacion,
  estadoInstalacion,
  estadoInstalacionServidor,
  instalarApp,
  suscribirseInstalacion,
} from "@/lib/ui/instalacion";

// Invitación a instalar Py'aguasu como app. El cartel del navegador aparece
// solo a veces (y en iPhone nunca): este botón está siempre a mano. Ver
// lib/ui/instalacion.js. No aparece si ya está instalada o si el alumno la cerró.
export default function BotonInstalar({ className = "" }) {
  const estado = useSyncExternalStore(suscribirseInstalacion, estadoInstalacion, estadoInstalacionServidor);
  const [pasosAbiertos, setPasosAbiertos] = useState(false);

  if (estado === "oculto") return null;

  return (
    <div
      className={`mensaje-nuevo flex flex-col gap-3 p-4 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-1 text-left ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center flex-shrink-0">
          <Icono nombre="install_mobile" size={24} />
        </span>
        <span className="flex-1 min-w-0 flex flex-col">
          <span className="text-body-md font-semibold text-on-surface">Instalá Py&apos;aguasu en tu celular</span>
          <span className="text-body-sm text-on-surface-variant">Sin tienda de apps y ocupa casi nada.</span>
        </span>
        <button
          type="button"
          onClick={descartarInstalacion}
          aria-label="No mostrar más"
          title="No mostrar más"
          className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high flex-shrink-0"
        >
          <Icono nombre="close" size={18} />
        </button>
      </div>

      {estado === "android" && (
        <button
          type="button"
          onClick={instalarApp}
          className="boton-degradado min-h-[48px] rounded-full font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200"
        >
          <Icono nombre="download" size={20} />
          Instalar app
        </button>
      )}

      {estado === "ios" && !pasosAbiertos && (
        <button
          type="button"
          onClick={() => setPasosAbiertos(true)}
          className="boton-degradado min-h-[48px] rounded-full font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200"
        >
          <Icono nombre="download" size={20} />
          ¿Cómo la instalo?
        </button>
      )}

      {/* iPhone no permite instalar con un botón: se explican los 2 pasos. */}
      {estado === "ios" && pasosAbiertos && (
        <ol className="mensaje-nuevo flex flex-col gap-2 text-body-sm text-on-surface">
          <li className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full boton-degradado text-label-sm font-bold flex items-center justify-center flex-shrink-0">1</span>
            <span>
              Tocá <strong>Compartir</strong>{" "}
              <Icono nombre="ios_share" size={18} className="text-primary align-text-bottom" /> abajo en Safari.
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full boton-degradado text-label-sm font-bold flex items-center justify-center flex-shrink-0">2</span>
            <span>
              Elegí <strong>Agregar a inicio</strong>{" "}
              <Icono nombre="add_box" size={18} className="text-primary align-text-bottom" />.
            </span>
          </li>
        </ol>
      )}
    </div>
  );
}
