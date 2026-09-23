"use client";

import { useEffect, useState } from "react";
import Icono from "./Icono";

export default function PantallaPerfil({ rol, onElegir, onVolver }) {
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    fetch(`/api/perfiles?rol=${rol}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelado) setPerfiles(data.perfiles || []);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar los perfiles.");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [rol]);

  async function crearPerfil(e) {
    e.preventDefault();
    if (!nombreNuevo.trim()) return;
    setCreando(true);
    setError("");
    try {
      const res = await fetch("/api/perfiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol, nombre: nombreNuevo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      onElegir(data.perfil);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreando(false);
    }
  }

  const titulo = rol === "docente" ? "¿Quién sos?" : "¿Con qué perfil entrás?";
  const etiquetaNuevo = rol === "docente" ? "Nombre del/la docente" : "Tu nombre";

  return (
    <div className="flex flex-col gap-5 pt-1">
      <section className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={onVolver}
          className="self-start flex items-center gap-1 text-body-sm text-secondary underline underline-offset-2 min-h-[44px]"
        >
          <Icono nombre="arrow_back" size={16} />
          Cambiar rol
        </button>
        <h1 className="text-headline-lg tracking-tight leading-tight">{titulo}</h1>
        <p className="text-on-surface-variant text-body-md leading-relaxed">
          Elegí un perfil de ejemplo o creá uno nuevo. No hace falta contraseña.
        </p>
      </section>

      {cargando && <p className="text-body-sm text-on-surface-variant">Cargando perfiles...</p>}

      {!cargando && perfiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {perfiles.map((perfil) => (
            <button
              key={perfil.id}
              type="button"
              onClick={() => onElegir(perfil)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-container-lowest shadow-elevation-2 hover:shadow-elevation-3 active:scale-[0.98] transition-all duration-200"
            >
              <span className="text-3xl">{perfil.avatarEmoji}</span>
              <span className="text-title-md font-semibold text-center leading-tight">{perfil.nombre}</span>
              {perfil.rol === "alumno" && (
                <span className="text-label-sm font-mono text-secondary">Nivel {perfil.nivel} · {perfil.xp} XP</span>
              )}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={crearPerfil} className="flex flex-col gap-3 bg-surface-container-lowest rounded-2xl p-4 shadow-elevation-2">
        <label htmlFor="nombre-nuevo-perfil" className="text-label-md font-mono text-on-surface-variant flex items-center gap-1.5">
          <Icono nombre="person_add" size={16} className="text-primary" />
          Crear perfil nuevo
        </label>
        <input
          id="nombre-nuevo-perfil"
          type="text"
          value={nombreNuevo}
          onChange={(e) => setNombreNuevo(e.target.value)}
          placeholder={etiquetaNuevo}
          className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline outline-none focus:bg-surface-container-high focus:ring-2 focus:ring-primary/30 transition-all text-body-md"
        />
        <button
          type="submit"
          disabled={!nombreNuevo.trim() || creando}
          className="boton-degradado min-h-[52px] rounded-full text-title-md font-semibold shadow-elevation-2 disabled:opacity-50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Icono nombre="add_circle" size={20} />
          {creando ? "Creando..." : "Crear y entrar"}
        </button>
      </form>

      {error && (
        <div className="rounded-2xl bg-error-container text-on-error-container p-4 text-body-sm flex items-start gap-2 shadow-elevation-1">
          <Icono nombre="error" size={20} className="flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
