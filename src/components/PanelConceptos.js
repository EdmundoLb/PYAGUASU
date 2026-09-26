"use client";

import { useEffect, useRef, useState } from "react";
import Icono from "./Icono";
import RenderizadorMatematico from "./RenderizadorMatematico";
import SimuladorChoque from "./SimuladorChoque";
import FuentesBibliograficas from "./FuentesBibliograficas";
import { formulasParaIncisos } from "@/lib/conceptos/incisos";

// Panel "Conceptos" de la pantalla del ejercicio: el material del docente
// (lib/conceptos/*) en cuatro pestañas, empezando por la representación
// gráfica interactiva. Se abre sin perder el ejercicio en curso, y se adapta
// al ejercicio del alumno cuando hay datos del choque (`escena`).
const PESTANAS = [
  { id: "accion", texto: "Ver en acción", icono: "play_circle" },
  { id: "conceptos", texto: "Conceptos", icono: "lightbulb" },
  { id: "formulas", texto: "Fórmulas", icono: "functions" },
  { id: "ejemplo", texto: "Ejemplo", icono: "edit_note" },
];

const fmt = (n) => String(n).replace("-", "−");

function Tarjeta({ children, className = "" }) {
  return <div className={`p-4 rounded-2xl bg-surface-container-lowest shadow-elevation-1 ${className}`}>{children}</div>;
}

// Datos del ejercicio ubicados en las fórmulas: "m₁ = 5 kg", etc.
function DatosEjercicio({ escena }) {
  const filas = [
    ["$m_1$", "$" + escena.m1 + "\\text{ kg}$"],
    ["$v_1$", "$" + fmt(escena.v1) + "\\text{ m/s}$"],
    ["$m_2$", "$" + escena.m2 + "\\text{ kg}$"],
    ["$v_2$", "$" + fmt(escena.v2) + "\\text{ m/s}$"],
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {filas.map(([simbolo, valor]) => (
        <div key={simbolo} className="px-3 py-2 rounded-xl bg-surface-container-lowest flex items-center justify-between gap-2">
          <span className="font-bold text-primary">
            <RenderizadorMatematico texto={simbolo} />
          </span>
          <span className="font-semibold">
            <RenderizadorMatematico texto={valor} />
          </span>
        </div>
      ))}
    </div>
  );
}

function EtiquetaTuEjercicio() {
  return (
    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-semibold flex items-center gap-1">
      <Icono nombre="assignment" size={14} />
      Tu ejercicio
    </span>
  );
}

// escena: { m1, v1, m2, v2, tipo } del ejercicio del alumno (o null).
// ejercicioTerminado: mientras sea false, el simulador muestra los
// resultados del ejercicio como "?" (los tiene que calcular el alumno).
// pestanaInicial: "accion" | "conceptos" | "formulas" | "ejemplo" (desde el
// modal de un concepto se abre directo en el simulador o en los conceptos).
export default function PanelConceptos({ concepto, escena = null, enunciado = "", ejercicioTerminado = false, pestanaInicial = "accion", onCerrar }) {
  const [pestana, setPestana] = useState(pestanaInicial);
  // Cambia al cargar otros datos en el simulador, para reiniciarlo con ellos.
  const [simulacion, setSimulacion] = useState({
    clave: 0,
    datos: escena ? { m1: escena.m1, v1: escena.v1, m2: escena.m2, v2: escena.v2 } : concepto.ejemplo?.datos,
    tipo: escena?.tipo || "inelastico",
  });
  // Las fórmulas por inciso son las del choque perfectamente inelástico
  // (CONCEPTO.pdf). En un choque elástico la velocidad final es otra: no se
  // muestran, para no enseñar una fórmula que no corresponde.
  const esElastico = escena?.tipo === "elastico";
  const incisos = escena && !esElastico ? formulasParaIncisos(enunciado) : [];
  // Cada pestaña arranca desde arriba (si no, se heredaba el scroll de la
  // anterior y "Tu ejercicio", que está arriba de todo, quedaba fuera de vista).
  const contenidoRef = useRef(null);
  useEffect(() => {
    contenidoRef.current?.scrollTo({ top: 0 });
  }, [pestana]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", onKeyDown);
    // Sin scroll del chat de fondo mientras el panel está abierto.
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onCerrar]);

  return (
    <div className="backdrop-nuevo fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/60 backdrop-blur-sm sm:p-4" onClick={onCerrar}>
      <div
        className="mensaje-nuevo w-full max-w-[560px] h-[92vh] sm:h-auto sm:max-h-[90vh] bg-surface rounded-t-3xl sm:rounded-3xl shadow-elevation-3 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Conceptos: ${concepto.titulo}`}
      >
        {/* Encabezado */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2 superficie-marca">
          <span className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Icono nombre="auto_stories" size={20} />
            </span>
            <span className="flex flex-col min-w-0">
              <span className="text-label-sm uppercase tracking-wider opacity-80">Conceptos</span>
              <span className="text-title-md font-semibold truncate">{concepto.titulo}</span>
            </span>
          </span>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar conceptos y volver al ejercicio"
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center hover:bg-white/15 active:scale-[0.98] transition-all duration-200"
          >
            <Icono nombre="close" size={22} />
          </button>
        </div>

        {/* Pestañas */}
        <div className="px-3 py-2 bg-surface-container-low border-b border-surface-container-high">
          <div className="grid grid-cols-4 gap-1" role="tablist" aria-label="Secciones de conceptos">
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={pestana === p.id}
                onClick={() => setPestana(p.id)}
                className={`min-h-[52px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-label-sm font-semibold transition-all duration-200 ${
                  pestana === p.id ? "bg-surface-container-lowest text-primary shadow-elevation-1" : "text-on-surface-variant"
                }`}
              >
                <Icono nombre={p.icono} size={20} />
                {p.texto}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div ref={contenidoRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {pestana === "accion" && (
            <>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                {escena ? (
                  <>
                    Estos son <strong>los bloques de tu ejercicio</strong>. Tocá <strong>¡Chocar!</strong> para ver qué pasa;
                    después podés mover los valores o probar qué pasaría si <strong>rebotaran</strong>.
                  </>
                ) : (
                  <>
                    Elegí las masas y velocidades, tocá <strong>¡Chocar!</strong> y mirá qué pasa con la cantidad de movimiento.
                    Probá cambiar entre <strong>quedan enganchados</strong> y <strong>rebotan</strong>.
                  </>
                )}
              </p>
              <SimuladorChoque
                key={simulacion.clave}
                datosIniciales={simulacion.datos}
                tipoInicial={simulacion.tipo}
                datosEjercicio={escena}
                ocultarResultadosEjercicio={!ejercicioTerminado}
              />
            </>
          )}

          {pestana === "conceptos" && (
            <>
              <Tarjeta className="bg-primary-fixed text-on-primary-fixed">
                <p className="text-body-md font-semibold flex items-center gap-2">
                  <Icono nombre="swap_horiz" size={22} />
                  {concepto.introduccion}
                </p>
              </Tarjeta>
              {concepto.tipos.map((tipo) => (
                <Tarjeta key={tipo.id} className={escena?.tipo === tipo.id ? "ring-2 ring-secondary-container" : ""}>
                  <h3 className="text-title-md font-semibold flex items-center gap-2 mb-1.5 flex-wrap">
                    <Icono nombre={tipo.icono} size={20} className="text-primary" />
                    {tipo.nombre}
                    {escena?.tipo === tipo.id && <EtiquetaTuEjercicio />}
                  </h3>
                  <p className="text-body-sm leading-relaxed text-on-surface-variant">
                    <RenderizadorMatematico texto={tipo.descripcion} />
                  </p>
                </Tarjeta>
              ))}
              <Tarjeta>
                <h3 className="text-title-md font-semibold flex items-center gap-2 mb-2">
                  <Icono nombre="checklist" size={20} className="text-tertiary" />
                  Características del choque perfectamente inelástico
                </h3>
                <ul className="flex flex-col gap-2">
                  {concepto.caracteristicasInelastico.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-body-sm leading-relaxed">
                      <Icono nombre="check_circle" size={18} className="text-tertiary flex-shrink-0 mt-0.5" />
                      <span>
                        <RenderizadorMatematico texto={c} />
                      </span>
                    </li>
                  ))}
                </ul>
              </Tarjeta>
              <Tarjeta className="bg-secondary-fixed text-on-secondary-fixed">
                <p className="text-body-sm leading-relaxed flex items-start gap-2">
                  <Icono nombre="swap_horiz" size={18} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Signo de la velocidad: </strong>
                    <RenderizadorMatematico texto={concepto.signos} />
                  </span>
                </p>
              </Tarjeta>
              <FuentesBibliograficas fuentes={concepto.bibliografia} />
              <button
                type="button"
                onClick={() => setPestana("accion")}
                className="self-center min-h-[44px] px-4 rounded-full bg-surface-container-high text-body-sm font-semibold text-primary flex items-center gap-1.5 active:scale-[0.98] transition-all duration-200"
              >
                <Icono nombre="play_circle" size={18} />
                Verlo en el simulador
              </button>
            </>
          )}

          {pestana === "formulas" && (
            <>
              {escena && (
                <Tarjeta className="bg-secondary-fixed/60 flex flex-col gap-3">
                  <h3 className="text-title-md font-semibold flex items-center gap-2">
                    <Icono nombre="assignment" size={20} className="text-secondary" />
                    Tu ejercicio
                  </h3>
                  <DatosEjercicio escena={escena} />
                  {escena.v1 > 0 && escena.v2 < 0 && (
                    <p className="text-label-sm leading-relaxed">
                      <RenderizadorMatematico texto="$v_2$ es negativa porque el segundo bloque viene en sentido contrario." />
                    </p>
                  )}
                  {esElastico && (
                    <p className="text-body-sm leading-relaxed flex items-start gap-2 p-2.5 rounded-xl bg-surface-container-lowest">
                      <Icono nombre="info" size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                      <span>
                        Tu ejercicio es un <strong>choque elástico</strong>: los cuerpos rebotan, así que la velocidad final
                        NO se calcula con la fórmula de abajo (esa es para cuando quedan unidos). Lo que sí vale igual:{" "}
                        <RenderizadorMatematico texto="$p_1 = m_1 \cdot v_1$, $p_2 = m_2 \cdot v_2$ y $p_f = p_i$." /> Consultá con tu
                        profe o con el tutor cómo seguir.
                      </span>
                    </p>
                  )}
                  {incisos.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-label-sm uppercase tracking-wider font-semibold">¿Qué fórmula uso en cada inciso?</span>
                      {incisos.map((inc) => (
                        <div key={inc.letra} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container-lowest">
                          <span className="w-7 h-7 rounded-full bg-secondary text-on-secondary text-label-md font-bold flex items-center justify-center flex-shrink-0">
                            {inc.letra}
                          </span>
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="text-body-sm text-on-surface-variant">{inc.texto}</span>
                            <span className="flex flex-wrap gap-x-4 gap-y-1 font-bold text-primary">
                              {inc.formulas.map((f) => (
                                <RenderizadorMatematico key={f} texto={f} />
                              ))}
                            </span>
                          </div>
                        </div>
                      ))}
                      <span className="text-label-sm">Reemplazá tus datos y resolvelo paso a paso con el tutor.</span>
                    </div>
                  )}
                </Tarjeta>
              )}
              <Tarjeta className="bg-primary-fixed text-on-primary-fixed flex flex-col items-center gap-2 text-center">
                <span className="text-label-sm uppercase tracking-wider font-semibold">Fórmula general</span>
                <span className="text-title-lg">
                  <RenderizadorMatematico texto={concepto.formulaGeneral.latex} />
                </span>
                <span className="flex w-full justify-around text-label-sm opacity-80">
                  <span>{concepto.formulaGeneral.antes}</span>
                  <span>{concepto.formulaGeneral.despues}</span>
                </span>
              </Tarjeta>
              <div className="flex flex-col gap-2">
                {concepto.formulas.map((f) => (
                  <div key={f.nombre} className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-surface-container-lowest border-l-4 border-tertiary shadow-elevation-1">
                    <span className="text-body-sm text-on-surface-variant">{f.nombre}</span>
                    <span className="font-bold text-primary flex-shrink-0">
                      <RenderizadorMatematico texto={f.latex} />
                    </span>
                  </div>
                ))}
              </div>
              <Tarjeta>
                <h3 className="text-title-md font-semibold mb-2">Referencias</h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-body-sm">
                  {concepto.referencias.map(([simbolo, significado]) => (
                    <div key={simbolo} className="contents">
                      <dt className="font-bold text-primary">
                        <RenderizadorMatematico texto={simbolo} />
                      </dt>
                      <dd className="text-on-surface-variant">{significado}</dd>
                    </div>
                  ))}
                </dl>
              </Tarjeta>
              <Tarjeta>
                <h3 className="text-title-md font-semibold mb-2 flex items-center gap-2">
                  <Icono nombre="straighten" size={20} className="text-secondary" />
                  Unidades de medida
                </h3>
                <ul className="flex flex-col gap-1.5 text-body-sm">
                  {concepto.unidades.map(([magnitud, unidad]) => (
                    <li key={magnitud} className="flex justify-between gap-3">
                      <span className="text-on-surface-variant">
                        <RenderizadorMatematico texto={magnitud} />
                      </span>
                      <span className="font-bold">
                        <RenderizadorMatematico texto={unidad} />
                      </span>
                    </li>
                  ))}
                </ul>
              </Tarjeta>
              <Tarjeta className="bg-tertiary-fixed text-on-tertiary-fixed">
                <p className="text-body-sm leading-relaxed flex items-start gap-2">
                  <Icono nombre="balance" size={20} className="flex-shrink-0" />
                  <span>
                    <strong>Observación: </strong>
                    <RenderizadorMatematico texto={concepto.observacion} />
                  </span>
                </p>
              </Tarjeta>
              <FuentesBibliograficas fuentes={concepto.bibliografia} />
            </>
          )}

          {pestana === "ejemplo" && concepto.ejemplo && (
            <>
              <Tarjeta className="bg-secondary-fixed text-on-secondary-fixed">
                <span className="text-label-sm uppercase tracking-wider font-semibold">Ejemplo resuelto</span>
                <p className="text-body-md leading-relaxed mt-1">
                  <RenderizadorMatematico texto={concepto.ejemplo.enunciado} />
                </p>
              </Tarjeta>
              <ol className="flex flex-col gap-2.5">
                {concepto.ejemplo.pasos.map((paso, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-7 h-7 rounded-full bg-primary text-on-primary text-label-md font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-body-sm text-on-surface-variant">
                        <RenderizadorMatematico texto={paso.texto} />
                      </span>
                      <div className="px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border-l-4 border-tertiary shadow-elevation-1 overflow-x-auto font-bold text-primary">
                        <RenderizadorMatematico texto={paso.latex} />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <Tarjeta className="bg-tertiary-fixed text-on-tertiary-fixed">
                <p className="text-body-md font-semibold">
                  <RenderizadorMatematico texto={concepto.ejemplo.respuesta} />
                </p>
              </Tarjeta>
              <button
                type="button"
                onClick={() => {
                  setSimulacion((s) => ({ clave: s.clave + 1, datos: concepto.ejemplo.datos, tipo: "inelastico" }));
                  setPestana("accion");
                }}
                className="boton-degradado min-h-[48px] rounded-full text-title-md font-semibold shadow-elevation-2 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Icono nombre="play_circle" size={22} />
                Ver este ejemplo en el simulador
              </button>
            </>
          )}
        </div>

        <div className="p-3 border-t border-surface-container-high bg-surface-container-low">
          <button
            type="button"
            onClick={onCerrar}
            className="w-full min-h-[48px] rounded-full boton-degradado text-title-md font-semibold active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Icono nombre="arrow_back" size={20} />
            Volver al ejercicio
          </button>
        </div>
      </div>
    </div>
  );
}
