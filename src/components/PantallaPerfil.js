"use client";

import { useEffect, useRef, useState } from "react";
import Icono from "./Icono";
import PasosOnboarding from "./PasosOnboarding";
import EstadoVacio from "./EstadoVacio";
import { calcularNivel } from "@/lib/gamificacion/niveles";
import { leerRecientes, registrarReciente } from "@/lib/identidad/recientes";

const CANTIDAD_ESQUELETOS = 5;
// A partir de cuántos perfiles aparece el buscador (con pocos, estorba).
const MINIMO_PARA_BUSCAR = 7;

// Ícono de rol en un cuadrado redondeado, el mismo lenguaje visual que las
// tarjetas de la bienvenida (PantallaRol). Nada de emojis de animales.
const ICONO_ROL = {
  alumno: { icono: "school", clases: "bg-primary-fixed text-primary" },
  docente: { icono: "co_present", clases: "bg-tertiary-fixed text-tertiary" },
};

// "Sofía" y "sofia" tienen que encontrarse igual (búsqueda y duplicados).
function normalizar(texto = "") {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

// Fila de la lista: ícono de rol, nombre y un dato discreto (el nivel, sin
// barra de XP: esta pantalla es para identificarse, no un ranking).
function FilaPerfil({ perfil, onElegir, eligiendoId }) {
  const rol = ICONO_ROL[perfil.rol] || ICONO_ROL.alumno;
  const entrando = eligiendoId === perfil.id;
  return (
    <li>
      <button
        type="button"
        onClick={() => onElegir(perfil)}
        disabled={Boolean(eligiendoId)}
        className={`group w-full min-h-[68px] flex items-center gap-3.5 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-container-low active:bg-surface-container disabled:cursor-default ${
          eligiendoId && !entrando ? "opacity-50" : ""
        } ${entrando ? "bg-primary-fixed/50" : ""}`}
      >
        <span className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${rol.clases}`}>
          <Icono nombre={rol.icono} size={24} />
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-body-lg font-semibold text-on-surface leading-tight truncate">{perfil.nombre}</span>
          <span className="text-body-sm text-on-surface-variant truncate">
            {perfil.rol === "docente" ? perfil.materia || "Docente" : `Nivel ${calcularNivel(perfil.xp || 0)}`}
          </span>
        </span>
        {entrando ? (
          <span className="flex items-center gap-1.5 text-label-md font-semibold text-primary flex-shrink-0">
            <Icono nombre="progress_activity" size={18} className="animate-spin" />
            Entrando…
          </span>
        ) : (
          <Icono
            nombre="chevron_right"
            size={22}
            className="flex-shrink-0 text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150"
          />
        )}
      </button>
    </li>
  );
}

// Esqueleto de carga con la misma forma que la fila.
function EsqueletoFila() {
  return (
    <li className="min-h-[68px] flex items-center gap-3.5 px-4 py-3" aria-hidden="true">
      <span className="w-11 h-11 rounded-2xl esqueleto flex-shrink-0" />
      <span className="flex-1 flex flex-col gap-2">
        <span className="h-4 w-2/5 rounded-full esqueleto" />
        <span className="h-3 w-1/5 rounded-full esqueleto" />
      </span>
    </li>
  );
}

const CLASES_LISTA =
  "rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-2 overflow-hidden divide-y divide-surface-container-high";

function TituloSeccion({ icono, children }) {
  return (
    <h2 className="flex items-center gap-1.5 px-1 text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
      <Icono nombre={icono} size={16} />
      {children}
    </h2>
  );
}

export default function PantallaPerfil({ rol, onElegir, onVolver }) {
  const [perfiles, setPerfiles] = useState([]);
  const [recientesIds, setRecientesIds] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [intento, setIntento] = useState(0); // sube con "Reintentar" para volver a pedir la lista
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState("");
  const [eligiendoId, setEligiendoId] = useState(null);
  const campoNombreRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    fetch(`/api/perfiles?rol=${rol}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (cancelado) return;
        const lista = data.perfiles || [];
        setPerfiles(lista);
        setRecientesIds(leerRecientes());
        // Sin ningún perfil, lo único que se puede hacer es crear uno.
        if (lista.length === 0) setMostrarFormulario(true);
      })
      .catch(() => {
        if (!cancelado) setErrorCarga("No pudimos cargar los perfiles. Revisá tu conexión.");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [rol, intento]);

  useEffect(() => {
    if (mostrarFormulario && perfiles.length > 0) campoNombreRef.current?.focus();
  }, [mostrarFormulario, perfiles.length]);

  function reintentar() {
    setErrorCarga("");
    setCargando(true);
    setIntento((n) => n + 1);
  }

  // Un solo toque: el resto de la lista queda desactivada mientras se entra.
  function elegir(perfil) {
    if (eligiendoId) return;
    setEligiendoId(perfil.id);
    registrarReciente(perfil.id);
    onElegir(perfil);
  }

  async function crearPerfil() {
    if (!nombreNuevo.trim() || creando) return;
    setCreando(true);
    setErrorCrear("");
    try {
      const res = await fetch("/api/perfiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol, nombre: nombreNuevo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      registrarReciente(data.perfil.id);
      onElegir(data.perfil);
    } catch (err) {
      setErrorCrear(err.message);
      setCreando(false);
    }
  }

  function abrirFormulario(nombreInicial = "") {
    setNombreNuevo(nombreInicial);
    setErrorCrear("");
    setMostrarFormulario(true);
  }

  // --- Derivados -----------------------------------------------------------
  const consulta = normalizar(busqueda);
  const coincide = (p) => !consulta || normalizar(p.nombre).includes(consulta);
  const recientes = recientesIds.map((id) => perfiles.find((p) => p.id === id)).filter(Boolean).filter(coincide);
  const idsRecientes = new Set(recientes.map((p) => p.id));
  const resto = perfiles
    .filter((p) => !idsRecientes.has(p.id) && coincide(p))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const resultados = recientes.length + resto.length;
  const duplicado = nombreNuevo.trim() ? perfiles.find((p) => normalizar(p.nombre) === normalizar(nombreNuevo)) : null;

  const esDocente = rol === "docente";
  const titulo = esDocente ? "¿Quién sos?" : "¿Quién va a practicar?";

  return (
    <div className="flex flex-col gap-6 pt-1">
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVolver}
            aria-label="Volver a elegir rol"
            title="Volver a elegir rol"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-on-surface shadow-elevation-1 hover:bg-surface-container-high active:scale-95 transition-all duration-200 flex-shrink-0"
          >
            <Icono nombre="arrow_back" size={20} />
          </button>
          {!esDocente && (
            <div className="flex-1 min-w-0">
              <PasosOnboarding actual="perfil" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] leading-tight font-bold tracking-tight text-on-surface">{titulo}</h1>
          <p className="text-on-surface-variant text-body-md leading-relaxed">
            Elegí tu perfil de la lista. No hace falta contraseña.
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

      {errorCarga && (
        <div role="alert" className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-error-container text-on-error-container text-center">
          <Icono nombre="wifi_off" size={32} />
          <p className="text-body-md">{errorCarga}</p>
          <button
            type="button"
            onClick={reintentar}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-5 rounded-full bg-surface-container-lowest text-on-surface font-semibold shadow-elevation-1 active:scale-[0.98] transition-all duration-200"
          >
            <Icono nombre="refresh" size={18} />
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !errorCarga && perfiles.length === 0 && (
        <EstadoVacio
          titulo="Todavía no hay perfiles"
          descripcion={esDocente ? "Creá tu perfil de docente para armar tu clase." : "Creá tu perfil para empezar a practicar."}
        />
      )}

      {!cargando && !errorCarga && perfiles.length >= MINIMO_PARA_BUSCAR && (
        <div className="relative">
          <Icono nombre="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              // Enter entra directo si la búsqueda dejó un solo perfil.
              if (e.key === "Enter" && resultados === 1) elegir(recientes[0] || resto[0]);
            }}
            placeholder="Buscá tu nombre"
            aria-label="Buscar perfil por nombre"
            className="w-full min-h-[52px] pl-12 pr-4 rounded-full bg-surface-container-lowest border-2 border-surface-container-high text-on-surface placeholder:text-outline outline-none focus:border-primary/50 transition-colors text-body-lg shadow-elevation-1"
          />
        </div>
      )}

      {!cargando && !errorCarga && recientes.length > 0 && (
        <section className="flex flex-col gap-2 mensaje-nuevo">
          <TituloSeccion icono="smartphone">Usado en este celular</TituloSeccion>
          <ul className={CLASES_LISTA}>
            {recientes.map((perfil) => (
              <FilaPerfil key={perfil.id} perfil={perfil} onElegir={elegir} eligiendoId={eligiendoId} />
            ))}
          </ul>
        </section>
      )}

      {!cargando && !errorCarga && resto.length > 0 && (
        <section className="flex flex-col gap-2 mensaje-nuevo">
          {recientes.length > 0 && <TituloSeccion icono="group">Todos los perfiles</TituloSeccion>}
          <ul className={CLASES_LISTA} aria-label="Perfiles">
            {resto.map((perfil) => (
              <FilaPerfil key={perfil.id} perfil={perfil} onElegir={elegir} eligiendoId={eligiendoId} />
            ))}
          </ul>
        </section>
      )}

      {!cargando && !errorCarga && consulta && resultados === 0 && (
        <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-surface-container-lowest border border-dashed border-outline-variant text-center">
          <Icono nombre="person_search" size={32} className="text-on-surface-variant" />
          <p className="text-body-md text-on-surface">
            No encontramos a <strong>«{busqueda.trim()}»</strong>
          </p>
          {!mostrarFormulario && (
            <button
              type="button"
              onClick={() => abrirFormulario(busqueda.trim())}
              className="boton-degradado min-h-[48px] px-5 rounded-full font-semibold inline-flex items-center gap-2 active:scale-[0.98] transition-all duration-200"
            >
              <Icono nombre="person_add" size={20} />
              Crear el perfil «{busqueda.trim()}»
            </button>
          )}
        </div>
      )}

      {!cargando && !errorCarga && !mostrarFormulario && !(consulta && resultados === 0) && (
        <button
          type="button"
          onClick={() => abrirFormulario()}
          className="min-h-[56px] flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-outline-variant text-on-surface-variant font-semibold hover:border-primary/50 hover:text-primary hover:bg-surface-container-lowest transition-all duration-200"
        >
          <Icono nombre="person_add" size={20} />
          No estoy en la lista — crear mi perfil
        </button>
      )}

      {!cargando && !errorCarga && mostrarFormulario && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!duplicado) crearPerfil();
          }}
          className="mensaje-nuevo flex flex-col gap-3 rounded-3xl p-4 sm:p-5 bg-surface-container-lowest border border-surface-container-high shadow-elevation-2"
        >
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="nombre-nuevo-perfil" className="text-title-md font-semibold text-on-surface">
              {esDocente ? "Tu nombre (como te llaman tus alumnos)" : "Tu nombre y apellido"}
            </label>
            {perfiles.length > 0 && (
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                aria-label="Cancelar"
                className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high flex-shrink-0"
              >
                <Icono nombre="close" size={20} />
              </button>
            )}
          </div>
          <input
            ref={campoNombreRef}
            id="nombre-nuevo-perfil"
            type="text"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder={esDocente ? "Ej.: Profe Martínez" : "Ej.: Camila Giménez"}
            maxLength={60}
            autoComplete="name"
            className="w-full min-h-[52px] px-4 rounded-2xl bg-surface-container-low border-2 border-transparent text-on-surface placeholder:text-outline outline-none focus:border-primary/40 transition-colors text-body-lg"
          />

          {duplicado ? (
            // Mismo nombre que un perfil existente: casi siempre es la misma
            // persona que no se encontró en la lista.
            <div className="mensaje-nuevo flex flex-col gap-3 p-3.5 rounded-2xl bg-secondary-fixed text-on-secondary-fixed">
              <p className="flex items-start gap-2 text-body-sm">
                <Icono nombre="info" size={18} className="flex-shrink-0 mt-0.5" />
                <span>
                  Ya existe el perfil <strong>«{duplicado.nombre}»</strong>. ¿Sos vos?
                </span>
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => elegir(duplicado)}
                  className="boton-degradado flex-1 min-h-[48px] px-4 rounded-full font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200"
                >
                  <Icono nombre="login" size={20} />
                  Sí, entrar como {duplicado.nombre.split(" ")[0]}
                </button>
                <button
                  type="button"
                  onClick={crearPerfil}
                  disabled={creando}
                  className="min-h-[48px] px-4 rounded-full font-semibold bg-surface-container-lowest text-on-surface shadow-elevation-1 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
                >
                  {creando ? "Creando…" : "No, crear otro perfil"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!nombreNuevo.trim() || creando}
              className="boton-degradado min-h-[52px] px-5 rounded-full text-title-md font-semibold active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              {creando ? "Creando…" : "Crear y entrar"}
              {!creando && <Icono nombre="arrow_forward" size={20} />}
            </button>
          )}

          {errorCrear && (
            <p role="alert" className="flex items-start gap-2 text-body-sm text-error">
              <Icono nombre="error" size={18} className="flex-shrink-0 mt-0.5" />
              {errorCrear}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
