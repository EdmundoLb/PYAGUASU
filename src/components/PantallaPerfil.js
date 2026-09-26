"use client";

import { useEffect, useState } from "react";
import Icono from "./Icono";
import Avatar from "./Avatar";
import PasosOnboarding from "./PasosOnboarding";
import { calcularNivel, progresoDentroDelNivel, xpParaSiguienteNivel } from "@/lib/gamificacion/niveles";

const CANTIDAD_ESQUELETOS = 5;

// Nivel como insignia + barra de progreso hacia el siguiente nivel, en el
// color de acento (terracota). Sin imágenes: solo tipografía y datos.
function ProgresoXp({ xp }) {
  const nivel = calcularNivel(xp);
  const progreso = progresoDentroDelNivel(xp);
  const faltan = xpParaSiguienteNivel(nivel) - xp;
  return (
    <span className="flex items-center gap-2.5 w-full" title={`Faltan ${faltan} XP para el nivel ${nivel + 1}`}>
      <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold tracking-wide tabular-nums">
        Nivel {nivel}
      </span>
      <span
        className="flex-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden"
        role="progressbar"
        aria-label={`Progreso hacia el nivel ${nivel + 1}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progreso * 100)}
      >
        <span
          className="block h-full rounded-full bg-gradient-to-r from-secondary-container to-secondary transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(4, Math.round(progreso * 100))}%` }}
        />
      </span>
      <span className="flex-shrink-0 text-[11px] font-semibold text-on-surface-variant tabular-nums">{xp} XP</span>
    </span>
  );
}

// Fila de una lista agrupada (estilo panel de configuración): avatar con
// iniciales (para encontrarse rápido en la lista), nombre, detalle y flecha.
function FilaPerfil({ perfil, onElegir }) {
  const esAlumno = perfil.rol === "alumno";
  return (
    <li>
      <button
        type="button"
        onClick={() => onElegir(perfil)}
        className="group w-full min-h-[68px] flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-surface-container-low active:bg-surface-container focus-visible:outline-none focus-visible:bg-surface-container-low focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary transition-colors duration-150"
      >
        <Avatar nombre={perfil.nombre} size={42} />
        <span className="flex-1 min-w-0 flex flex-col gap-1.5">
          <span className="text-body-md font-semibold text-on-surface leading-tight truncate">{perfil.nombre}</span>
          {esAlumno ? (
            <ProgresoXp xp={perfil.xp || 0} />
          ) : (
            <span className="text-body-sm text-on-surface-variant truncate">{perfil.materia || "Docente"}</span>
          )}
        </span>
        <Icono
          nombre="chevron_right"
          size={22}
          className="flex-shrink-0 text-outline group-hover:text-secondary group-hover:translate-x-0.5 transition-all duration-150"
        />
      </button>
    </li>
  );
}

// Esqueleto de carga con la misma forma que la fila (no un texto suelto).
function EsqueletoFila() {
  return (
    <li className="min-h-[68px] flex items-center gap-3.5 px-4 py-3.5" aria-hidden="true">
      <span className="w-[42px] h-[42px] rounded-full esqueleto flex-shrink-0" />
      <span className="flex-1 flex flex-col gap-2">
        <span className="h-4 w-2/5 rounded-full esqueleto" />
        <span className="h-1.5 w-4/5 rounded-full esqueleto" />
      </span>
    </li>
  );
}

const CLASES_LISTA = "rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-2 overflow-hidden divide-y divide-surface-container-high";

export default function PantallaPerfil({ rol, onElegir, onVolver }) {
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
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
    <div className="flex flex-col gap-6 pt-1">
      <section className="flex flex-col gap-4">
        {rol === "alumno" && <PasosOnboarding actual="perfil" />}
        <button
          type="button"
          onClick={onVolver}
          className="self-start min-h-[40px] pl-2.5 pr-3.5 rounded-full border border-secondary/30 text-secondary text-label-md font-semibold flex items-center gap-1 hover:bg-secondary-fixed/60 active:scale-[0.98] transition-all duration-200"
        >
          <Icono nombre="arrow_back" size={18} />
          Cambiar rol
        </button>
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] leading-tight font-bold tracking-tight text-on-surface">{titulo}</h1>
          <p className="text-on-surface-variant text-body-md leading-relaxed">
            Elegí un perfil de ejemplo o creá uno nuevo. No hace falta contraseña.
          </p>
        </div>
      </section>

      {cargando && (
        <ul className={CLASES_LISTA} aria-label="Cargando perfiles" aria-busy="true">
          {Array.from({ length: CANTIDAD_ESQUELETOS }).map((_, i) => (
            <EsqueletoFila key={i} />
          ))}
        </ul>
      )}

      {!cargando && perfiles.length > 0 && (
        <ul className={`${CLASES_LISTA} mensaje-nuevo`} aria-label="Perfiles">
          {perfiles.map((perfil) => (
            <FilaPerfil key={perfil.id} perfil={perfil} onElegir={onElegir} />
          ))}
        </ul>
      )}

      <form
        onSubmit={crearPerfil}
        className="flex flex-col gap-3 rounded-3xl p-4 border border-dashed border-outline-variant bg-surface-container-lowest/60"
      >
        <label htmlFor="nombre-nuevo-perfil" className="text-label-md font-semibold text-on-surface-variant flex items-center gap-1.5">
          <Icono nombre="person_add" size={18} className="text-secondary" />
          Crear perfil nuevo
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="nombre-nuevo-perfil"
            type="text"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder={etiquetaNuevo}
            maxLength={60}
            className="flex-1 min-h-[48px] px-4 rounded-full bg-surface-container-lowest border border-surface-container-high text-on-surface placeholder:text-outline outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all text-body-md"
          />
          <button
            type="submit"
            disabled={!nombreNuevo.trim() || creando}
            className="boton-degradado min-h-[48px] px-5 rounded-full text-title-md font-semibold shadow-elevation-2 disabled:opacity-50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Icono nombre="arrow_forward" size={20} />
            {creando ? "Creando..." : "Crear y entrar"}
          </button>
        </div>
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
