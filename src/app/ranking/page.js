"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";
import ListaRanking from "@/components/ListaRanking";
import NavegacionInferior from "@/components/NavegacionInferior";
import { leerPerfilActivo, guardarPerfilActivo } from "@/lib/identidad/perfilActivo";

export default function RankingPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [codigo, setCodigo] = useState("");
  const [uniendose, setUniendose] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const p = leerPerfilActivo();
    if (!p) {
      router.replace("/");
      return;
    }
    if (p.rol === "docente") {
      router.replace("/docente");
      return;
    }
    setPerfil(p);
    setCargando(false);
  }, [router]);

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
      const perfilActualizado = { ...perfil, claseId: data.clase.id };
      guardarPerfilActivo(perfilActualizado);
      setPerfil(perfilActualizado);
    } catch (err) {
      setError(err.message);
    } finally {
      setUniendose(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-1 bg-gradient-to-r from-primary via-secondary-container to-tertiary" />
        <div className="max-w-[680px] mx-auto h-16 px-4 flex items-center gap-2">
          <Link href="/dashboard" className="min-h-[44px] inline-flex items-center gap-1.5 text-body-sm text-secondary underline underline-offset-2">
            <Icono nombre="arrow_back" size={16} />
            Tu progreso
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[680px] mx-auto px-4 pt-6 pb-24 flex flex-col gap-5">
        <h1 className="text-headline-lg tracking-tight leading-tight flex items-center gap-2">
          <Icono nombre="leaderboard" size={26} className="text-primary" />
          Ranking de tu clase
        </h1>

        {cargando && <p className="text-body-sm text-on-surface-variant">Cargando...</p>}

        {!cargando && perfil && !perfil.claseId && (
          <form onSubmit={unirseAClase} className="flex flex-col gap-3 bg-surface-container-lowest rounded-2xl p-4 shadow-elevation-2">
            <p className="text-body-sm text-on-surface-variant">
              Todavía no estás en ninguna clase. Pedile a tu docente el código de invitación para unirte y ver el
              ranking de tus compañeros.
            </p>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código de clase (ej. FIS3B01)"
              className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline outline-none focus:bg-surface-container-high focus:ring-2 focus:ring-primary/30 transition-all text-body-md uppercase"
            />
            <button
              type="submit"
              disabled={!codigo.trim() || uniendose}
              className="boton-degradado min-h-[52px] rounded-full text-title-md font-semibold shadow-elevation-2 disabled:opacity-50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Icono nombre="group_add" size={20} />
              {uniendose ? "Uniéndome..." : "Unirme a la clase"}
            </button>
          </form>
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
