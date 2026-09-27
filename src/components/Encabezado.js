"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Icono from "./Icono";
import {
  sonidoActivado,
  sonidoActivadoServidor,
  establecerSonidoActivado,
  suscribirseSonido,
} from "@/lib/sonido";
import TarjetaXp from "./TarjetaXp";
import LogoMarca from "./LogoMarca";
import BotonTema from "./BotonTema";

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

// Presencia "viva" del Profe: el encabezado cuenta lo que está pasando en
// la clase (antes era un punto verde que titilaba siempre, pasara lo que
// pasara). `estadoTutor` lo calcula page.js a partir de la conversación.
// `cara`: la expresión del logo (LogoMarca) en cada estado.
const PRESENCIA = {
  listo: { texto: "Profe en línea", color: "text-tertiary", punto: "bg-tertiary pulso-presencia", cara: "feliz" },
  pensando: { texto: "Pensando", color: "text-primary", punto: "bg-primary", cara: "pensando" },
  celebrando: { texto: "¡Bien ahí!", color: "text-tertiary", punto: "bg-tertiary", icono: "auto_awesome", cara: "celebrando" },
  resuelto: { texto: "¡Resuelto!", color: "text-secondary", punto: "bg-secondary-container", icono: "emoji_events", cara: "celebrando" },
  sinConexion: { texto: "Sin conexión", color: "text-on-surface-variant", punto: "bg-outline", icono: "wifi_off", cara: "dormido" },
};

function PuntosPensando() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-0.5" aria-hidden="true">
      {[0, 150, 300].map((retraso) => (
        <span
          key={retraso}
          className="w-1 h-1 rounded-full bg-primary punto-escribiendo"
          style={{ animationDelay: `${retraso}ms` }}
        />
      ))}
    </span>
  );
}

export default function Encabezado({ perfilActivo, claseActiva, estadoTutor = "listo" }) {
  const conectado = useSyncExternalStore(suscribirseConexion, () => navigator.onLine, () => true);
  // La preferencia vive en localStorage (solo existe en el cliente);
  // useSyncExternalStore evita el desajuste de hidratación server/cliente
  // sin necesitar un efecto que llame setState al montar.
  const sonido = useSyncExternalStore(suscribirseSonido, sonidoActivado, sonidoActivadoServidor);

  function alternarSonido() {
    establecerSonidoActivado(!sonido);
  }

  // Sin internet no importa lo demás: es lo primero que hay que saber.
  const clave = conectado ? estadoTutor : "sinConexion";
  const presencia = PRESENCIA[clave] || PRESENCIA.listo;

  return (
    <header className="sticky top-0 z-10 bg-surface/85 backdrop-blur-xl border-b border-surface-container-high/70">
      <div className="max-w-[1080px] mx-auto h-16 px-4 sm:px-8 flex items-center justify-between gap-2">
        <Link
          href="/"
          aria-label="Py'aguasu IA, ir al inicio"
          className="group flex items-center gap-3 min-w-0 rounded-2xl -ml-1.5 pl-1.5 pr-2 py-1 hover:bg-surface-container-low transition-colors duration-200"
        >
          {/* Logo (la cara del Profe, que cambia de expresión según el
              estado) con el punto de presencia en la esquina, como en un chat */}
          <span className="relative flex-shrink-0">
            <LogoMarca
              estado={presencia.cara}
              size={42}
              className="block rounded-[13px] shadow-elevation-2 group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-[2.5px] ring-surface transition-colors duration-300 ${presencia.punto}`}
              aria-hidden="true"
            />
          </span>

          <span className="flex flex-col min-w-0 gap-1">
            <span className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-title-lg tracking-tight text-on-surface">{"Py'aguasu"}</span>
              <span className="px-1.5 py-0.5 rounded-md boton-degradado text-[10px] font-bold tracking-wider leading-none">
                IA
              </span>
            </span>

            {/* aria-live: un lector de pantalla anuncia "Pensando", "¡Bien ahí!"… */}
            <span className="flex items-center gap-1.5 min-w-0 text-label-md leading-none" aria-live="polite">
              <span key={clave} className={`mensaje-nuevo inline-flex items-center gap-1 font-semibold flex-shrink-0 ${presencia.color}`}>
                {presencia.icono && <Icono nombre={presencia.icono} size={14} />}
                {presencia.texto}
                {clave === "pensando" && <PuntosPensando />}
              </span>
              {claseActiva && (
                <>
                  <span className="text-outline-variant flex-shrink-0" aria-hidden="true">
                    ·
                  </span>
                  <span className="truncate text-on-surface-variant">{claseActiva.nombre}</span>
                </>
              )}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1.5 flex-shrink-0">
          <BotonTema />
          <button
            type="button"
            onClick={alternarSonido}
            aria-label={sonido ? "Silenciar sonidos" : "Activar sonidos"}
            aria-pressed={sonido}
            className="min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface active:scale-[0.95] transition-all duration-200"
          >
            <Icono nombre={sonido ? "volume_up" : "volume_off"} size={20} />
          </button>
          {perfilActivo && <TarjetaXp perfil={perfilActivo} variante="compacta" />}
        </div>
      </div>

      {/* Barra de carga fina mientras el Profe prepara la respuesta */}
      {clave === "pensando" && (
        <div className="absolute inset-x-0 -bottom-px h-[2px] overflow-hidden" aria-hidden="true">
          <div className="barra-pensando h-full w-2/5 bg-gradient-to-r from-transparent via-primary to-secondary-container" />
        </div>
      )}
    </header>
  );
}
