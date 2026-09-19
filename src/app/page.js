"use client";

import { useEffect, useRef, useState } from "react";
import Icono from "@/components/Icono";
import Encabezado from "@/components/Encabezado";
import IndicadorProgreso from "@/components/IndicadorProgreso";
import ChipDato from "@/components/ChipDato";
import BurbujaChat from "@/components/BurbujaChat";
import TutorEscribiendo from "@/components/TutorEscribiendo";

const EJEMPLO =
  "Un auto de 1200 kg viaja a 20 m/s sobre una pista horizontal sin fricción y choca de frente contra otro auto de 800 kg que se encuentra en reposo. Después del impacto, ambos quedan enganchados. ¿Cuál es la velocidad final del conjunto?";

const ESTADO_INICIAL = {
  fase: "inicio", // inicio | cargando | conversando | error
  idioma: "jopara",
  enunciado: "",
  historial: [], // [{ autor: 'estudiante' | 'tutor', texto }]
  tema: "",
  datos: [],
  incognita: "",
  pasoActual: 1,
  totalPasosEstimados: null,
  completado: false,
  resultadoFinal: null,
  analogiaCotidiana: "",
  pasosCerrados: [], // [{ paso, formula }]
  ultimaPista: "",
  ultimaCorrecta: null,
  ultimaEsErrorFrecuente: false,
  ultimaNormalizacion: "",
  proveedor: "",
  error: "",
};

export default function Home() {
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const [inputEnunciado, setInputEnunciado] = useState("");
  const [inputRespuesta, setInputRespuesta] = useState("");
  const finalChatRef = useRef(null);

  useEffect(() => {
    finalChatRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [estado.historial.length, estado.fase]);

  async function llamarTutor(payload) {
    const res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }

  async function iniciar(e) {
    e.preventDefault();
    if (!inputEnunciado.trim()) return;

    setEstado((s) => ({ ...s, fase: "cargando", error: "" }));

    try {
      const turno = await llamarTutor({
        esInicial: true,
        enunciado: inputEnunciado,
        idioma: estado.idioma,
        historial: [],
      });

      setEstado((s) => ({
        ...s,
        fase: "conversando",
        enunciado: inputEnunciado,
        historial: [
          { autor: "estudiante", texto: inputEnunciado },
          { autor: "tutor", texto: turno.mensaje },
        ],
        tema: turno.tema,
        datos: turno.datos || [],
        incognita: turno.incognita,
        pasoActual: turno.pasoActual,
        totalPasosEstimados: turno.totalPasosEstimados,
        ultimaPista: "",
        ultimaCorrecta: null,
        ultimaEsErrorFrecuente: false,
        ultimaNormalizacion: "",
        proveedor: turno.proveedor,
      }));
    } catch (err) {
      setEstado((s) => ({ ...s, fase: "error", error: err.message }));
    }
  }

  async function enviarTurno({ mensaje, pedirAyuda }) {
    // Historial tal como está ANTES de agregar este intento, para mandarle
    // al servidor exactamente lo que ya se conversó (stateless).
    const historialParaEnviar = estado.historial;
    const idioma = estado.idioma;

    // UI optimista: la burbuja del estudiante aparece al instante, no
    // recién cuando vuelve la respuesta del servidor.
    setEstado((s) => ({
      ...s,
      fase: "cargando",
      error: "",
      historial: pedirAyuda ? s.historial : [...s.historial, { autor: "estudiante", texto: mensaje }],
      ultimaPista: "",
      ultimaCorrecta: null,
      ultimaEsErrorFrecuente: false,
      ultimaNormalizacion: "",
    }));
    if (!pedirAyuda) setInputRespuesta("");

    try {
      const turno = await llamarTutor({
        esInicial: false,
        mensaje,
        pedirAyuda,
        idioma,
        historial: historialParaEnviar,
      });

      setEstado((s) => {
        const nuevoHistorial = [...s.historial, { autor: "tutor", texto: turno.mensaje }];

        const pasosCerrados = turno.formula
          ? [...s.pasosCerrados, { paso: s.pasoActual, formula: turno.formula }]
          : s.pasosCerrados;

        return {
          ...s,
          fase: "conversando",
          historial: nuevoHistorial,
          pasoActual: turno.pasoActual,
          totalPasosEstimados: turno.totalPasosEstimados ?? s.totalPasosEstimados,
          completado: Boolean(turno.completado),
          resultadoFinal: turno.resultadoFinal || s.resultadoFinal,
          analogiaCotidiana: turno.analogiaCotidiana || s.analogiaCotidiana,
          pasosCerrados,
          ultimaPista: turno.correcta === false ? turno.pista || "" : "",
          ultimaCorrecta: turno.correcta ?? null,
          ultimaEsErrorFrecuente: turno.correcta === false && Boolean(turno.esErrorFrecuente),
          ultimaNormalizacion: turno.correcta === false ? turno.normalizacion || "" : "",
          proveedor: turno.proveedor,
        };
      });
    } catch (err) {
      setEstado((s) => ({ ...s, fase: "error", error: err.message }));
    }
  }

  function responder(e) {
    e.preventDefault();
    if (!inputRespuesta.trim()) return;
    enviarTurno({ mensaje: inputRespuesta, pedirAyuda: false });
  }

  function pedirAyudaDirecta() {
    enviarTurno({ mensaje: "", pedirAyuda: true });
  }

  function reiniciar() {
    setEstado(ESTADO_INICIAL);
    setInputEnunciado("");
    setInputRespuesta("");
  }

  return (
    <>
      <Encabezado conectado={estado.fase !== "error"} />
      <main
        className={`flex-1 w-full max-w-[680px] mx-auto px-4 pt-6 flex flex-col gap-5 ${
          estado.fase !== "inicio" && !estado.completado ? "pb-28" : "pb-6"
        }`}
      >
        {estado.fase === "inicio" && (
          <PantallaInicio
            inputEnunciado={inputEnunciado}
            setInputEnunciado={setInputEnunciado}
            idioma={estado.idioma}
            setIdioma={(idioma) => setEstado((s) => ({ ...s, idioma }))}
            onIniciar={iniciar}
          />
        )}

        {estado.fase !== "inicio" && (
          <ConversacionTutor
            estado={estado}
            inputRespuesta={inputRespuesta}
            setInputRespuesta={setInputRespuesta}
            onResponder={responder}
            onPedirAyuda={pedirAyudaDirecta}
            onReiniciar={reiniciar}
            finalChatRef={finalChatRef}
          />
        )}
      </main>
    </>
  );
}

function PantallaInicio({ inputEnunciado, setInputEnunciado, idioma, setIdioma, onIniciar }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-elevation-1">
            <Icono nombre="waving_hand" size={18} />
          </span>
          <span className="font-mono text-label-md uppercase tracking-wider text-secondary font-semibold">
            Tu tutor de confianza
          </span>
        </div>
        <h1 className="text-headline-lg tracking-tight leading-tight">
          ¡Hola! ¿Con qué problema de física nos divertimos hoy?
        </h1>
        <p className="text-on-surface-variant text-body-md leading-relaxed">
          Escribí el ejercicio tal como viene en tu tarea. Te voy a preguntar de a un
          paso — vos intentás, yo te digo si vas bien o te doy una pista.
        </p>
      </section>

      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-surface-container shadow-elevation-1">
        <Icono nombre="route" size={20} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          <strong className="text-on-surface">Nunca te doy todo resuelto de una.</strong>{" "}
          Vas a intentar cada paso vos mismo/a; si te trabás, hay un botón para pedir
          ayuda en cualquier momento.
        </p>
      </div>

      <form onSubmit={onIniciar} className="flex flex-col gap-3 bg-surface-container-lowest rounded-2xl p-4 shadow-elevation-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="enunciado" className="text-label-md font-mono text-on-surface-variant flex items-center gap-1.5">
            <Icono nombre="draw" size={16} className="text-primary" />
            Enunciado de tu problema
          </label>
          <button
            type="button"
            className="text-body-sm text-secondary underline underline-offset-2 flex-shrink-0"
            onClick={() => setInputEnunciado(EJEMPLO)}
          >
            Cargar ejemplo
          </button>
        </div>
        <textarea
          id="enunciado"
          rows={4}
          value={inputEnunciado}
          onChange={(e) => setInputEnunciado(e.target.value)}
          placeholder="Ejemplo: Un auto de 1200 kg viaja a 20 m/s y choca contra..."
          className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline outline-none focus:bg-surface-container-high focus:ring-2 focus:ring-primary/30 transition-all resize-none text-body-md"
        />

        <div className="flex items-center gap-1 p-1 rounded-full bg-surface-container-high w-fit" role="radiogroup" aria-label="Idioma de la respuesta">
          <IdiomaPill label="Jopara (esencial)" activo={idioma === "jopara"} onClick={() => setIdioma("jopara")} />
          <IdiomaPill label="Castellano" activo={idioma === "castellano"} onClick={() => setIdioma("castellano")} />
        </div>

        <button
          type="submit"
          disabled={!inputEnunciado.trim()}
          className="min-h-[52px] rounded-full bg-secondary-container text-on-secondary-container text-title-md font-semibold shadow-elevation-2 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Icono nombre="smart_toy" size={22} />
          Empezar, guiame paso a paso
        </button>
      </form>
    </div>
  );
}

function IdiomaPill({ label, activo, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activo}
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-body-sm font-medium transition-colors ${
        activo ? "bg-primary text-on-primary shadow-elevation-1" : "text-on-surface-variant"
      }`}
    >
      {label}
    </button>
  );
}

function ConversacionTutor({ estado, inputRespuesta, setInputRespuesta, onResponder, onPedirAyuda, onReiniciar, finalChatRef }) {
  const { fase, tema, datos, incognita, pasoActual, totalPasosEstimados, completado } = estado;
  const cargando = fase === "cargando";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 bg-surface-container-lowest rounded-2xl p-4 shadow-elevation-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {tema && (
            <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-mono font-semibold">
              {tema}
            </span>
          )}
        </div>

        <IndicadorProgreso pasoActual={pasoActual} totalPasos={totalPasosEstimados} />

        {Array.isArray(datos) && datos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {datos.map((d, i) => (
              <ChipDato key={i} etiqueta={d.etiqueta} valor={d.valor} />
            ))}
          </div>
        )}

        {incognita && (
          <div className="p-3 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-body-sm">
              <Icono nombre="search" size={18} />
              Incógnita
            </span>
            <span className="font-mono font-bold text-body-sm text-right">{incognita}</span>
          </div>
        )}
      </div>

      {/* Chat de la conversación tutor <-> estudiante */}
      <div className="flex flex-col gap-2.5">
        {estado.historial.slice(1).map((turno, i) => (
          <BurbujaChat key={i} autor={turno.autor} texto={turno.texto} />
        ))}
        {cargando && <TutorEscribiendo />}

        {estado.ultimaCorrecta === false && estado.ultimaEsErrorFrecuente && estado.ultimaNormalizacion && (
          <div className="mensaje-nuevo ml-9 flex items-start gap-2 p-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed text-body-sm shadow-elevation-1">
            <Icono nombre="groups" size={18} className="flex-shrink-0 mt-0.5" />
            <p>
              <strong>No sos el único/a:</strong> {estado.ultimaNormalizacion}
            </p>
          </div>
        )}

        {estado.ultimaCorrecta === false && estado.ultimaPista && (
          <div className="mensaje-nuevo ml-9 flex items-start gap-2 p-3 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-body-sm shadow-elevation-1">
            <Icono nombre="lightbulb" size={18} className="flex-shrink-0 mt-0.5" />
            <p>
              <strong>Pista:</strong> {estado.ultimaPista}
            </p>
          </div>
        )}
        <div ref={finalChatRef} />
      </div>

      {estado.pasosCerrados.length > 0 && (
        <details className="rounded-2xl bg-surface-container-low shadow-elevation-1 overflow-hidden">
          <summary className="cursor-pointer px-4 py-3 font-semibold text-body-sm text-on-surface-variant flex items-center gap-2 select-none">
            <Icono nombre="functions" size={18} className="text-primary" />
            Fórmulas confirmadas ({estado.pasosCerrados.length})
          </summary>
          <div className="flex flex-col gap-2 px-4 pb-4">
            {estado.pasosCerrados.map((p, i) => (
              <div
                key={i}
                className="px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border-l-4 border-tertiary font-mono text-body-sm text-primary font-bold overflow-x-auto"
              >
                {p.formula}
              </div>
            ))}
          </div>
        </details>
      )}

      {completado && estado.resultadoFinal && (
        <div className="mensaje-nuevo flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-between gap-3 shadow-elevation-2">
            <span className="flex items-center gap-2 font-semibold text-body-sm uppercase tracking-wide">
              <Icono nombre="check_circle" size={22} className="text-tertiary" />
              Resuelto
            </span>
            <span className="font-mono font-bold text-title-lg">
              {estado.resultadoFinal.valor} {estado.resultadoFinal.unidad || ""}
            </span>
          </div>
          {estado.analogiaCotidiana && (
            <div className="p-3.5 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-body-sm leading-relaxed flex items-start gap-2 shadow-elevation-1">
              <Icono nombre="local_pizza" size={18} className="flex-shrink-0 mt-0.5" />
              <p>
                <strong>Para que se entienda fácil:</strong> {estado.analogiaCotidiana}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onReiniciar}
            className="min-h-[52px] rounded-full bg-primary text-on-primary text-title-md font-semibold shadow-elevation-2 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Icono nombre="refresh" size={20} />
            Resolver otro problema
          </button>
        </div>
      )}

      {fase === "error" && (
        <div className="rounded-2xl bg-error-container text-on-error-container p-4 text-body-sm flex items-start gap-2 shadow-elevation-1">
          <Icono nombre="error" size={20} className="flex-shrink-0 mt-0.5" />
          <p>
            <strong>No se pudo avanzar:</strong> {estado.error}
          </p>
        </div>
      )}

      {!completado && (
        <div className="fixed bottom-0 inset-x-0 z-10 bg-surface/95 backdrop-blur-xl border-t border-surface-container-high pb-[env(safe-area-inset-bottom,0px)]">
          <form onSubmit={onResponder} className="max-w-[680px] mx-auto px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-surface-container-lowest rounded-2xl shadow-elevation-2 p-2">
              <input
                type="text"
                value={inputRespuesta}
                onChange={(e) => setInputRespuesta(e.target.value)}
                placeholder="Escribí tu intento para este paso..."
                disabled={cargando}
                autoFocus
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline outline-none focus:bg-surface-container-high transition-colors disabled:opacity-60 text-body-md"
              />
              <button
                type="submit"
                disabled={cargando || !inputRespuesta.trim()}
                aria-label="Enviar mi respuesta"
                className="min-w-[48px] min-h-[48px] rounded-full bg-secondary-container text-on-secondary-container shadow-elevation-1 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
              >
                <Icono nombre="send" size={20} />
              </button>
            </div>
            <button
              type="button"
              onClick={onPedirAyuda}
              disabled={cargando}
              className="self-center flex items-center gap-1.5 px-3 py-1.5 rounded-full text-on-surface-variant text-body-sm font-medium hover:bg-surface-container-high disabled:opacity-50 transition-colors"
            >
              <Icono nombre="visibility" size={16} />
              Mostrame este paso
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
