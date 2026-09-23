"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";
import TarjetaXp from "@/components/TarjetaXp";
import TarjetaInsignia from "@/components/TarjetaInsignia";
import NavegacionInferior from "@/components/NavegacionInferior";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";
import { leerPerfilActivo } from "@/lib/identidad/perfilActivo";
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
      .then((res) => res.json())
      .then((data) => {
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
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-1 bg-gradient-to-r from-primary via-secondary-container to-tertiary" />
        <div className="max-w-[680px] mx-auto h-16 px-4 flex items-center gap-2">
          <Link href="/" className="min-h-[44px] inline-flex items-center gap-1.5 text-body-sm text-secondary underline underline-offset-2">
            <Icono nombre="arrow_back" size={16} />
            Volver al tutor
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[680px] mx-auto px-4 pt-6 pb-24 flex flex-col gap-5">
        <h1 className="text-headline-lg tracking-tight leading-tight flex items-center gap-2">
          <Icono nombre="insights" size={26} className="text-primary" />
          Tu progreso
        </h1>

        {cargando && <p className="text-body-sm text-on-surface-variant">Cargando...</p>}

        {error && (
          <div className="rounded-2xl bg-error-container text-on-error-container p-4 text-body-sm flex items-start gap-2 shadow-elevation-1">
            <Icono nombre="error" size={20} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {progreso && (
          <>
            {progreso.perfil.claseId ? (
              <Link
                href="/ranking"
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-primary text-on-primary shadow-elevation-2 active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-label-sm uppercase tracking-wider opacity-90">Mi clase</span>
                  <span className="text-title-md font-semibold truncate">{clase?.nombre || "Cargando..."}</span>
                </div>
                {posicion && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-title-md font-mono font-bold flex-shrink-0">
                    <Icono nombre="leaderboard" size={18} />#{posicion}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                href="/ranking"
                className="flex items-center gap-2 p-4 rounded-2xl bg-surface-container-lowest shadow-elevation-1 text-body-sm text-on-surface-variant active:scale-[0.98] transition-all duration-200"
              >
                <Icono nombre="group_add" size={18} className="text-primary flex-shrink-0" />
                Todavía no estás en ninguna clase — tocá acá para unirte con un código
              </Link>
            )}

            <TarjetaXp perfil={progreso.perfil} variante="hero" />

            <section className="flex flex-col gap-2.5">
              <h2 className="text-title-md font-semibold flex items-center gap-1.5">
                <Icono nombre="workspace_premium" size={18} className="text-primary" />
                Insignias
              </h2>
              <div className="grid grid-cols-4 gap-2.5">
                {CATALOGO_INSIGNIAS.map((insignia) => (
                  <TarjetaInsignia
                    key={insignia.id}
                    insignia={insignia}
                    desbloqueada={progreso.perfil.insigniasIds.includes(insignia.id)}
                  />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2.5">
              <h2 className="text-title-md font-semibold flex items-center gap-1.5">
                <Icono nombre="history" size={18} className="text-primary" />
                Historial de problemas resueltos
              </h2>
              {progreso.historial.length === 0 && (
                <p className="text-body-sm text-on-surface-variant">Todavía no resolviste ningún problema.</p>
              )}
              <div className="flex flex-col gap-2">
                {progreso.historial.map((sesion) => (
                  <div
                    key={sesion.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-xl bg-surface-container-lowest shadow-elevation-1"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-body-md font-semibold truncate">{sesion.temaDetectado || "Física"}</span>
                      <span className="text-body-sm text-on-surface-variant truncate">{sesion.enunciado}</span>
                    </div>
                    <span className="font-mono font-bold text-secondary flex-shrink-0">+{sesion.xpGanada} XP</span>
                  </div>
                ))}
              </div>
            </section>

            <BotonCerrarSesion className="self-center mt-2" />
          </>
        )}
      </main>
      <NavegacionInferior />
    </>
  );
}
