"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import FormularioCrearClase from "@/components/FormularioCrearClase";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import {
  leerPerfilActivo,
  perfilActivoServidor,
  suscribirsePerfilActivo,
} from "@/lib/identidad/perfilActivo";

export default function NuevaClasePage() {
  const router = useRouter();
  // useSyncExternalStore evita el desajuste de hidratación server/cliente
  // sin necesitar un efecto que llame setState al montar — mismo patrón que
  // el toggle de sonido en Encabezado.
  const perfil = useSyncExternalStore(suscribirsePerfilActivo, leerPerfilActivo, perfilActivoServidor);

  useEffect(() => {
    if (perfil === undefined) return; // todavía no se leyó localStorage
    if (perfil === null || perfil.rol !== "docente") {
      router.replace("/");
    }
  }, [perfil, router]);

  async function crearClase({ nombre }) {
    const res = await fetch("/api/clases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, materiaId: "fisica", docenteId: perfil.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    router.push(`/docente/clases/${data.clase.id}`);
  }

  return (
    <>
      <EncabezadoPagina volverA="/docente" etiquetaVolver="Volver a tus clases" titulo="Nueva clase" />

      <main className="flex-1 w-full max-w-[760px] mx-auto px-4 pt-6 pb-10 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold tracking-tight leading-tight">Creá una clase</h1>
          <p className="text-body-md text-on-surface-variant">Al crearla vas a recibir un código para que tus alumnos se unan.</p>
        </div>
        {perfil && <FormularioCrearClase onCrear={crearClase} />}
      </main>
    </>
  );
}
