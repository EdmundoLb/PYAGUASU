"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";
import ListaRanking from "@/components/ListaRanking";
import EncabezadoPagina from "@/components/EncabezadoPagina";
import EstadoVacio from "@/components/EstadoVacio";
import NavegacionInferior from "@/components/NavegacionInferior";
import {
  leerPerfilActivo,
  guardarPerfilActivo,
  perfilActivoServidor,
  suscribirsePerfilActivo,
} from "@/lib/identidad/perfilActivo";

export default function RankingPage() {
  const router = useRouter();
  // useSyncExternalStore evita el desajuste de hidratación server/cliente
  // (localStorage no existe en el server) sin necesitar un efecto que llame
  // setState al montar — mismo patrón que el toggle de sonido en Encabezado.
  const perfil = useSyncExternalStore(suscribirsePerfilActivo, leerPerfilActivo, perfilActivoServidor);
  const cargando = perfil === undefined; // todavía no se leyó localStorage
  const [ranking, setRanking] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [uniendose, setUniendose] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (perfil === undefined) return;
    if (perfil === null) {
      router.replace("/");
      return;
    }
    if (perfil.rol === "docente") router.replace("/docente");
  }, [perfil, router]);

  useEffect(() => {
    if (!perfil?.claseId) return;
    fetch(`/api/ranking/${perfil.claseId}`)
      .then((res) => res.json())
      .then((data) => setRanking(data.ranking || []))
      .catch(() => setError("No se pudo cargar el ranking."));
  }, [perfil]);

  async function unirseAClase(e) {
    e.preventDefault();
    if (!codigo.trim()) return;
    setUniendose(true);
    setError("");
    try {
      const res = await fetch("/api/clases/unirse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumnoId: perfil.id, codigo: codigo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      guardarPerfilActivo({ ...perfil, claseId: data.clase.id });
    } catch (err) {
      setError(err.message);
    } finally {
      setUniendose(false);
    }
  }

  return (
    <>
      <EncabezadoPagina volverA="/dashboard" etiquetaVolver="Volver a tu progreso" titulo="Ranking de tu clase" />

      <main className="flex-1 w-full max-w-[760px] mx-auto px-4 pt-8 pb-28 flex flex-col gap-5">
        {(cargando || (perfil?.claseId && !ranking && !error)) && (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando ranking">
            <div className="h-48 rounded-3xl esqueleto" />
            <div className="h-40 rounded-3xl esqueleto" />
          </div>
        )}

        {!cargando && perfil && !perfil.claseId && (
          <EstadoVacio
            titulo="Unite a tu clase"
            descripcion="Pedile a tu docente el código de invitación para competir en el ranking con tus compañeros."
          >
            <form onSubmit={unirseAClase} className="flex flex-col sm:flex-row gap-2 w-full max-w-[420px]">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej. FIS3B01"
                aria-label="Código de clase"
                className="flex-1 min-h-[52px] px-5 rounded-full bg-surface-container-low border-2 border-transparent text-on-surface placeholder:text-outline outline-none focus:border-primary/40 transition-all font-mono text-title-md tracking-widest uppercase text-center sm:text-left"
              />
              <button
                type="submit"
                disabled={!codigo.trim() || uniendose}
                className="boton-degradado min-h-[52px] px-6 rounded-full text-title-md font-semibold active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Icono nombre="group_add" size={20} />
                {uniendose ? "Uniéndome..." : "Unirme"}
              </button>
            </form>
          </EstadoVacio>
        )}

        {ranking && <ListaRanking ranking={ranking} alumnoActivoId={perfil?.id} />}

        {error && (
          <div className="rounded-2xl bg-error-container text-on-error-container p-4 text-body-sm flex items-start gap-2 shadow-elevation-1">
            <Icono nombre="error" size={20} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </main>
      <NavegacionInferior />
    </>
  );
}
