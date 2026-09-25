"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Icono from "./Icono";
import {
  sonidoActivado,
  sonidoActivadoServidor,
  establecerSonidoActivado,
  suscribirseSonido,
} from "@/lib/sonido";
import TarjetaXp from "./TarjetaXp";

// Estado real de la conexión del dispositivo. Antes el encabezado decía
// "Sin conexión" ante CUALQUIER error del tutor — por ejemplo cuando Gemini
// está saturado (503) —, aunque el alumno tuviera internet: confundía.
function suscribirseConexion(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export default function Encabezado({ perfilActivo, claseActiva }) {
  const conectado = useSyncExternalStore(suscribirseConexion, () => navigator.onLine, () => true);
  // La preferencia vive en localStorage (solo existe en el cliente);
  // useSyncExternalStore evita el desajuste de hidratación server/cliente
  // sin necesitar un efecto que llame setState al montar.
  const sonido = useSyncExternalStore(suscribirseSonido, sonidoActivado, sonidoActivadoServidor);

  function alternarSonido() {
    establecerSonidoActivado(!sonido);
  }

  return (
    <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-1 bg-gradient-to-r from-primary via-secondary-container to-tertiary" />
      <div className="max-w-[680px] mx-auto h-16 sm:h-18 px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-0.5 rounded-xl bg-gradient-to-br from-primary via-secondary-container to-tertiary-fixed shadow-elevation-1 flex-shrink-0">
            <Image src="/logo.svg" alt="" width={40} height={40} className="rounded-[10px] block" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-title-md leading-none tracking-tight truncate">
              {"Py'aguasu IA"}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  conectado ? "bg-tertiary animate-pulse" : "bg-outline"
                }`}
              />
              <span className="text-label-sm text-on-surface-variant truncate">
                {claseActiva ? claseActiva.nombre : conectado ? "Tu profe está en línea" : "Sin conexión"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={alternarSonido}
            aria-label={sonido ? "Silenciar sonidos" : "Activar sonidos"}
            aria-pressed={sonido}
            className="min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-[0.98] transition-all duration-200"
          >
            <Icono nombre={sonido ? "volume_up" : "volume_off"} size={20} />
          </button>
          {perfilActivo ? (
            <TarjetaXp perfil={perfilActivo} variante="compacta" />
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-semibold flex-shrink-0">
              <Icono nombre="function" size={14} />
              Física · Nivel medio
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
