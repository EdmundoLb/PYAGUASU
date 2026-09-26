"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";
import TarjetaClase from "@/components/TarjetaClase";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EstadoVacio from "@/components/EstadoVacio";
import Avatar from "@/components/Avatar";
import {
  leerPerfilActivo,
  perfilActivoServidor,
  suscribirsePerfilActivo,
} from "@/lib/identidad/perfilActivo";

export default function DocentePage() {
  const router = useRouter();
  // useSyncExternalStore evita el desajuste de hidratación server/cliente
  // sin necesitar un efecto que llame setState al montar — mismo patrón que
  // el toggle de sonido en Encabezado.
  const perfil = useSyncExternalStore(suscribirsePerfilActivo, leerPerfilActivo, perfilActivoServidor);
  const [clases, setClases] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (perfil === undefined) return; // todavía no se leyó localStorage
    if (perfil === null) {
      router.replace("/");
      return;
    }
    if (perfil.rol !== "docente") {
      router.replace("/");
      return;
    }
    fetch(`/api/clases?docenteId=${perfil.id}`)
      .then((res) => res.json())
      .then((data) => setClases(data.clases || []))
      .catch(() => setError("No se pudieron cargar tus clases."));
  }, [perfil, router]);

  return (
    <>
      <EncabezadoPagina
        titulo="Panel docente"
        derecha={
          perfil && (
            <>
              <span className="hidden sm:flex items-center gap-2 text-body-sm text-on-surface-variant">
                <Avatar nombre={perfil.nombre} size={30} />
                {perfil.nombre}
              </span>
              <BotonCerrarSesion />
            </>
          )
        }
      />

      <main className="flex-1 w-full max-w-[760px] mx-auto px-4 pt-6 pb-10 flex flex-col gap-6">
        <section className="superficie-marca relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-elevation-3">
          <div className="cuadricula absolute inset-0 opacity-50 pointer-events-none" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-label-md uppercase tracking-wider opacity-85">
                {perfil?.nombre ? `Hola, ${perfil.nombre.split(" ")[0]}` : "Hola"}
              </span>
              <h1 className="text-[28px] font-bold leading-tight">Tus clases</h1>
              {clases && (
                <span className="text-body-sm opacity-90">
                  {clases.length} clase{clases.length === 1 ? "" : "s"} ·{" "}
                  {clases.reduce((t, c) => t + c.alumnosIds.length, 0)} alumnos en total
                </span>
              )}
            </div>
            <Link
              href="/docente/clases/nueva"
              className="min-h-[48px] inline-flex items-center gap-1.5 px-5 rounded-full bg-white text-[#00248f] text-title-md font-semibold shadow-elevation-2 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
            >
              <Icono nombre="add" size={22} />
              Nueva clase
            </Link>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl bg-error-container text-on-error-container p-4 text-body-sm flex items-start gap-2 shadow-elevation-1">
            <Icono nombre="error" size={20} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {!clases && !error && (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando clases">
            {[0, 1].map((i) => (
              <div key={i} className="h-[92px] rounded-3xl esqueleto" />
            ))}
          </div>
        )}

        {clases && clases.length === 0 && (
          <EstadoVacio
            titulo="Creá tu primera clase"
            descripcion="Vas a recibir un código para que tus alumnos se unan, y desde acá ves su progreso."
          />
        )}

        <div className="escalonado grid gap-3 sm:grid-cols-2">
          {clases?.map((clase) => (
            <TarjetaClase key={clase.id} clase={clase} />
          ))}
        </div>
      </main>
    </>
  );
}
