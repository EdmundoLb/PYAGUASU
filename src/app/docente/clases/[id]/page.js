"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";
import TablaAlumnosClase from "@/components/TablaAlumnosClase";
import FormularioCrearTema from "@/components/FormularioCrearTema";
import FormularioCrearTarea from "@/components/FormularioCrearTarea";
import { leerPerfilActivo } from "@/lib/identidad/perfilActivo";

export default function DetalleClasePage({ params }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [clase, setClase] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const p = leerPerfilActivo();
    if (!p || p.rol !== "docente") {
      router.replace("/");
      return;
    }
    setPerfil(p);
  }, [router]);

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
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-1 bg-gradient-to-r from-primary via-secondary-container to-tertiary" />
        <div className="max-w-[680px] mx-auto h-16 px-4 flex items-center gap-2">
          <Link href="/docente" className="min-h-[44px] inline-flex items-center gap-1.5 text-body-sm text-secondary underline underline-offset-2">
            <Icono nombre="arrow_back" size={16} />
            Tus clases
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[680px] mx-auto px-4 pt-6 pb-10 flex flex-col gap-6">
        {error && (
          <div className="rounded-2xl bg-error-container text-on-error-container p-4 text-body-sm flex items-start gap-2 shadow-elevation-1">
            <Icono nombre="error" size={20} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {clase && (
          <>
            <section className="flex flex-col gap-1.5">
              <h1 className="text-headline-lg tracking-tight leading-tight">{clase.nombre}</h1>
              <span className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-mono font-bold">
                <Icono nombre="key" size={14} />
                Código para invitar alumnos: {clase.codigoInvitacion}
              </span>
            </section>

            <section className="flex flex-col gap-2.5">
              <h2 className="text-title-md font-semibold flex items-center gap-1.5">
                <Icono nombre="groups" size={18} className="text-primary" />
                Alumnos y su progreso
              </h2>
              <TablaAlumnosClase alumnos={clase.alumnos} />
            </section>

            <section className="flex flex-col gap-2.5">
              <h2 className="text-title-md font-semibold flex items-center gap-1.5">
                <Icono nombre="route" size={18} className="text-primary" />
                Plan de contenido
              </h2>
              <div className="flex flex-col gap-2">
                {clase.temas.map((tema) => (
                  <div key={tema.id} className="p-3 rounded-xl bg-surface-container-lowest shadow-elevation-1">
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
              <h2 className="text-title-md font-semibold flex items-center gap-1.5">
                <Icono nombre="assignment" size={18} className="text-primary" />
                Tareas asignadas
              </h2>
              <div className="flex flex-col gap-2">
                {clase.tareas.length === 0 && (
                  <p className="text-body-sm text-on-surface-variant">Todavía no asignaste ninguna tarea.</p>
                )}
                {clase.tareas.map((tarea) => (
                  <div key={tarea.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-surface-container-lowest shadow-elevation-1">
                    <span className="text-body-md font-semibold truncate">{tarea.titulo}</span>
                    <span className="font-mono font-bold text-secondary flex-shrink-0">+{tarea.xpRecompensa} XP</span>
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
