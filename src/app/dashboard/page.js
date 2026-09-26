"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";
import TarjetaInsignia from "@/components/TarjetaInsignia";
import NavegacionInferior from "@/components/NavegacionInferior";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import AnilloNivel from "@/components/AnilloNivel";
import EstadoVacio from "@/components/EstadoVacio";
import { calcularNivel, xpParaSiguienteNivel } from "@/lib/gamificacion/niveles";
import { iconoDeTema } from "@/lib/ui/temas";
import { leerPerfilActivo, limpiarPerfilActivo } from "@/lib/identidad/perfilActivo";
import { CATALOGO_INSIGNIAS } from "@/lib/gamificacion/insignias";

export default function DashboardPage() {
  const router = useRouter();
  const [progreso, setProgreso] = useState(null);
  const [clase, setClase] = useState(null);
  const [posicion, setPosicion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const perfil = leerPerfilActivo();
    if (!perfil) {
      router.replace("/");
      return;
    }
    if (perfil.rol === "docente") {
      router.replace("/docente");
      return;
    }

    fetch(`/api/progreso/${perfil.id}`)
      .then((res) => {
        // El store del server es en memoria: tras un reinicio este perfil ya
        // no existe allá. Se olvida y se vuelve a elegir perfil.
        if (res.status === 404) {
          limpiarPerfilActivo();
          router.replace("/");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) throw new Error(data.error);
        setProgreso(data);
        if (data.perfil.claseId) {
          fetch(`/api/clases/${data.perfil.claseId}`)
            .then((res) => res.json())
            .then((claseData) => setClase(claseData.clase || null))
            .catch(() => {});
          fetch(`/api/ranking/${data.perfil.claseId}`)
            .then((res) => res.json())
            .then((rankingData) => {
              const fila = (rankingData.ranking || []).find((f) => f.id === perfil.id);
              if (fila) setPosicion(fila.posicion);
            })
            .catch(() => {});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [router]);

  return (
    <>
      <EncabezadoPagina volverA="/" etiquetaVolver="Volver al tutor" titulo="Tu progreso" />

      <main className="flex-1 w-full max-w-[760px] mx-auto px-4 pt-5 pb-28 flex flex-col gap-6">
        {cargando && <EsqueletoProgreso />}

        {error && (
          <div className="rounded-2xl bg-error-container text-on-error-container p-4 text-body-sm flex items-start gap-2 shadow-elevation-1">
            <Icono nombre="error" size={20} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {progreso && (
          <div className="escalonado flex flex-col gap-6">
            <HeroProgreso perfil={progreso.perfil} clase={clase} posicion={posicion} />

            <div className="grid grid-cols-3 gap-2.5">
              <Estadistica icono="bolt" color="text-secondary" valor={progreso.perfil.xp} etiqueta="XP total" />
              <Estadistica
                icono="local_fire_department"
                color="text-secondary-container"
                valor={progreso.perfil.racha || 0}
                etiqueta={progreso.perfil.racha === 1 ? "sesión seguida" : "sesiones seguidas"}
              />
              <Estadistica icono="task_alt" color="text-tertiary" valor={progreso.historial.length} etiqueta="resueltos" />
            </div>

            {!progreso.perfil.claseId && (
              <Link
                href="/ranking"
                className="tarjeta-interactiva flex items-center gap-3 p-4 rounded-3xl bg-surface-container-lowest border border-dashed border-outline-variant text-body-sm"
              >
                <span className="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center flex-shrink-0">
                  <Icono nombre="group_add" size={22} />
                </span>
                <span className="flex-1 text-on-surface-variant">
                  <strong className="text-on-surface block">Todavía no estás en una clase</strong>
                  Unite con el código de tu docente para competir en el ranking.
                </span>
                <Icono nombre="chevron_right" size={22} className="text-outline" />
              </Link>
            )}

            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-title-lg font-semibold">Insignias</h2>
                <span className="text-label-md text-on-surface-variant font-mono">
                  {progreso.perfil.insigniasIds.length}/{CATALOGO_INSIGNIAS.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATALOGO_INSIGNIAS.map((insignia) => (
                  <TarjetaInsignia
                    key={insignia.id}
                    insignia={insignia}
                    desbloqueada={progreso.perfil.insigniasIds.includes(insignia.id)}
                  />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-title-lg font-semibold">Problemas resueltos</h2>
              {progreso.historial.length === 0 ? (
                <EstadoVacio
                  titulo="Todavía no resolviste ninguno"
                  descripcion="Cada problema que termines con el profe aparece acá, con el XP que ganaste."
                >
                  <Link
                    href="/"
                    className="boton-degradado min-h-[48px] px-5 rounded-full text-body-md font-semibold inline-flex items-center gap-2"
                  >
                    <Icono nombre="play_arrow" size={20} />
                    Resolver mi primer problema
                  </Link>
                </EstadoVacio>
              ) : (
                <ul className="flex flex-col rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-1 overflow-hidden divide-y divide-surface-container-high">
                  {progreso.historial.map((sesion) => (
                    <li key={sesion.id} className="flex items-center gap-3 p-3.5">
                      <span className="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center flex-shrink-0">
                        <Icono nombre={iconoDeTema(sesion.temaDetectado)} size={20} />
                      </span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-body-md font-semibold truncate">{sesion.temaDetectado || "Física"}</span>
                        <span className="text-body-sm text-on-surface-variant truncate">{sesion.enunciado}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-label-md font-bold flex-shrink-0">
                        +{sesion.xpGanada} XP
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <BotonCerrarSesion className="self-center" />
          </div>
        )}
      </main>
      <NavegacionInferior />
    </>
  );
}

// Tarjeta principal: quién sos, tu nivel como anillo y cuánto falta para el
// siguiente. Si estás en una clase, tu clase y posición (lleva al ranking).
function HeroProgreso({ perfil, clase, posicion }) {
  const nivel = calcularNivel(perfil.xp);
  const faltan = xpParaSiguienteNivel(nivel) - perfil.xp;

  return (
    <section className="superficie-marca relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-elevation-3">
      <div className="cuadricula absolute inset-0 opacity-50 pointer-events-none" aria-hidden="true" />
      <div className="relative flex items-center gap-4 sm:gap-6">
        <AnilloNivel xp={perfil.xp} size={104} />
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <span className="text-[24px] sm:text-[28px] font-bold leading-tight truncate">{perfil.nombre}</span>
          <span className="text-body-sm opacity-90">
            Te faltan <strong className="font-mono">{faltan} XP</strong> para el nivel {nivel + 1}
          </span>
          {perfil.claseId && (
            <Link
              href="/ranking"
              className="mt-1 self-start inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-label-md font-semibold transition-colors max-w-full"
            >
              <Icono nombre="groups" size={16} />
              <span className="truncate">{clase?.nombre || "Mi clase"}</span>
              {posicion && (
                <span className="px-2 py-0.5 rounded-full bg-white text-[#00248f] font-mono font-bold flex-shrink-0">
                  #{posicion}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Estadistica({ icono, color, valor, etiqueta }) {
  return (
    <div className="flex flex-col gap-1 p-3.5 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-1">
      <Icono nombre={icono} size={22} className={color} />
      <span className="font-mono font-bold text-[24px] leading-none text-on-surface tabular-nums mt-1">{valor}</span>
      <span className="text-label-md text-on-surface-variant leading-tight">{etiqueta}</span>
    </div>
  );
}

function EsqueletoProgreso() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando tu progreso">
      <div className="h-[148px] rounded-3xl esqueleto" />
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[104px] rounded-3xl esqueleto" />
        ))}
      </div>
      <div className="h-6 w-32 rounded-full esqueleto" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[120px] rounded-3xl esqueleto" />
        ))}
      </div>
    </div>
  );
}
