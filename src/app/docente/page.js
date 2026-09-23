"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";
import TarjetaClase from "@/components/TarjetaClase";
import BotonCerrarSesion from "@/components/BotonCerrarSesion";
import { leerPerfilActivo } from "@/lib/identidad/perfilActivo";

export default function DocentePage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [clases, setClases] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const p = leerPerfilActivo();
    if (!p) {
      router.replace("/");
      return;
    }
    if (p.rol !== "docente") {
      router.replace("/");
      return;
    }
    setPerfil(p);
    fetch(`/api/clases?docenteId=${p.id}`)
      .then((res) => res.json())
      .then((data) => setClases(data.clases || []))
      .catch(() => setError("No se pudieron cargar tus clases."));
  }, [router]);

  return (
    <>
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-1 bg-gradient-to-r from-primary via-secondary-container to-tertiary" />
        <div className="max-w-[680px] mx-auto h-16 px-4 flex items-center justify-between gap-2">
          <span className="font-bold text-title-md tracking-tight">Panel docente</span>
          {perfil && (
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                <span className="text-xl">{perfil.avatarEmoji}</span>
                {perfil.nombre}
              </span>
              <BotonCerrarSesion />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-[680px] mx-auto px-4 pt-6 pb-10 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-headline-lg tracking-tight leading-tight flex items-center gap-2">
            <Icono nombre="co_present" size={26} className="text-primary" />
            Tus clases
          </h1>
          <Link
            href="/docente/clases/nueva"
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-full boton-degradado text-title-md font-semibold shadow-elevation-2 active:scale-[0.98] transition-all duration-200"
          >
            <Icono nombre="add" size={20} />
            Nueva
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl bg-error-container text-on-error-container p-4 text-body-sm flex items-start gap-2 shadow-elevation-1">
            <Icono nombre="error" size={20} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {clases && clases.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">Todavía no creaste ninguna clase.</p>
        )}

        <div className="flex flex-col gap-2.5">
          {clases?.map((clase) => (
            <TarjetaClase key={clase.id} clase={clase} />
          ))}
        </div>
      </main>
    </>
  );
}
