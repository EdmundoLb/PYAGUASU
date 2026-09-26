"use client";

import { useEffect, useState, useSyncExternalStore, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";
import TablaAlumnosClase from "@/components/TablaAlumnosClase";
import FormularioCrearTema from "@/components/FormularioCrearTema";
import FormularioCrearTarea from "@/components/FormularioCrearTarea";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import CodigoInvitacion from "@/components/CodigoInvitacion";
import {
  leerPerfilActivo,
  perfilActivoServidor,
  suscribirsePerfilActivo,
} from "@/lib/identidad/perfilActivo";

export default function DetalleClasePage({ params }) {
  const { id } = usePromise(params);
  const router = useRouter();
  // useSyncExternalStore evita el desajuste de hidratación server/cliente
  // sin necesitar un efecto que llame setState al montar — mismo patrón que
  // el toggle de sonido en Encabezado.
  const perfil = useSyncExternalStore(suscribirsePerfilActivo, leerPerfilActivo, perfilActivoServidor);
  const [clase, setClase] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (perfil === undefined) return; // todavía no se leyó localStorage
    if (perfil === null || perfil.rol !== "docente") {
      router.replace("/");
    }
  }, [perfil, router]);

  function recargarClase() {
    fetch(`/api/clases/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setClase(data.clase);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (perfil) recargarClase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil, id]);

  async function agregarTema({ titulo, descripcion }) {
    const res = await fetch(`/api/clases/${id}/temas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descripcion }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    recargarClase();
  }

  async function agregarTarea({ titulo, temaId, dificultad, xpRecompensa }) {
    const res = await fetch(`/api/clases/${id}/tareas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, temaId, dificultad, xpRecompensa, creadaPorId: perfil.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    recargarClase();
  }

  return (
    <>
      <EncabezadoPagina volverA="/docente" etiquetaVolver="Volver a tus clases" titulo={clase?.nombre || "Clase"} />

      <main className="flex-1 w-full max-w-[760px] mx-auto px-4 pt-6 pb-10 flex flex-col gap-7">
        {error && (
          <div className="rounded-2xl bg-error-container text-on-error-container p-4 text-body-sm flex items-start gap-2 shadow-elevation-1">
            <Icono nombre="error" size={20} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {clase && (
          <>
            <section className="superficie-marca relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-elevation-3 flex flex-col gap-4">
              <div className="cuadricula absolute inset-0 opacity-50 pointer-events-none" aria-hidden="true" />
              <h1 className="relative text-[28px] font-bold leading-tight">{clase.nombre}</h1>
              <div className="relative grid grid-cols-3 gap-2">
                {[
                  { valor: clase.alumnos.length, etiqueta: "alumnos" },
                  {
                    valor: clase.alumnos.length
                      ? Math.round(clase.alumnos.reduce((t, a) => t + a.xp, 0) / clase.alumnos.length)
                      : 0,
                    etiqueta: "XP promedio",
                  },
                  { valor: clase.tareas.length, etiqueta: "tareas" },
                ].map((d) => (
                  <div key={d.etiqueta} className="flex flex-col gap-0.5 p-3 rounded-2xl bg-white/12">
                    <span className="font-mono font-bold text-[22px] leading-none">{d.valor}</span>
                    <span className="text-label-sm opacity-85">{d.etiqueta}</span>
                  </div>
                ))}
              </div>
              <div className="relative">
                <CodigoInvitacion codigo={clase.codigoInvitacion} />
              </div>
            </section>

            <section className="flex flex-col gap-2.5">
              <h2 className="text-title-lg font-semibold flex items-center gap-2">
                <Icono nombre="groups" size={18} className="text-primary" />
                Alumnos y su progreso
              </h2>
              <TablaAlumnosClase alumnos={clase.alumnos} />
            </section>

            <section className="flex flex-col gap-2.5">
              <h2 className="text-title-lg font-semibold flex items-center gap-2">
                <Icono nombre="route" size={18} className="text-primary" />
                Plan de contenido
              </h2>
              <div className="flex flex-col gap-2">
                {clase.temas.map((tema) => (
                  <div key={tema.id} className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-1">
                    <span className="text-body-md font-semibold">{tema.titulo}</span>
                    {tema.descripcion && (
                      <p className="text-body-sm text-on-surface-variant">{tema.descripcion}</p>
                    )}
                  </div>
                ))}
              </div>
              <FormularioCrearTema onCrear={agregarTema} />
            </section>

            <section className="flex flex-col gap-2.5">
              <h2 className="text-title-lg font-semibold flex items-center gap-2">
                <Icono nombre="assignment" size={18} className="text-primary" />
                Tareas asignadas
              </h2>
              <div className="flex flex-col gap-2">
                {clase.tareas.length === 0 && (
                  <p className="text-body-sm text-on-surface-variant">Todavía no asignaste ninguna tarea.</p>
                )}
                {clase.tareas.map((tarea) => (
                  <div key={tarea.id} className="flex items-center justify-between gap-2 p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-1">
                    <span className="text-body-md font-semibold truncate">{tarea.titulo}</span>
                    <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-label-md font-bold flex-shrink-0">+{tarea.xpRecompensa} XP</span>
                  </div>
                ))}
              </div>
              <FormularioCrearTarea temas={clase.temas} onCrear={agregarTarea} />
            </section>
          </>
        )}
      </main>
    </>
  );
}
