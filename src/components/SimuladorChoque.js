"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icono from "./Icono";
import { calcularChoque, redondear } from "@/lib/fisica/choques";
import { reproducirSonidoImpacto } from "@/lib/sonido";

// Simulador de choque frontal para el panel "Conceptos" (representación
// gráfica pedida en CONCEPTO.pdf). El alumno elige masas, velocidades y el
// tipo de choque; los bloques entran a escena, chocan SIEMPRE en el centro
// (sin importar las velocidades elegidas) y las barras de cantidad de
// movimiento muestran que el total de antes es igual al de después.

const ANCHO = 360;
const ALTO = 150;
const PISO = 114;
const CENTRO = ANCHO / 2;
const T_CHOQUE = 1.3; // segundos de animación hasta el impacto
const T_DESPUES = 1.9; // segundos de animación después del impacto
const VELOCIDAD_VISUAL_MAX = 110; // px/s del bloque más rápido

const fmt = (n) => String(redondear(n)).replace("-", "−");

function prefiereMenosMovimiento() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// Lado del bloque según la masa RELATIVA (crece con la raíz): el más pesado
// mide 58 px, sea de 5 kg o de 1200 kg; el otro, en proporción.
const ladoBloque = (m, mMax) => 34 + 24 * Math.sqrt(m / mMax);

// Tope de un deslizador: 1,5 veces el dato del ejercicio, redondeado "lindo".
function topeDeslizador(valor, minimo) {
  const tope = Math.max(minimo, Math.abs(valor) * 1.5);
  const paso = tope > 1000 ? 100 : tope > 100 ? 10 : tope > 20 ? 5 : 1;
  return Math.ceil(tope / paso) * paso;
}

const mismosDatos = (a, b) => a && b && a.m1 === b.m1 && a.v1 === b.v1 && a.m2 === b.m2 && a.v2 === b.v2;

function Flecha({ x, y, v, escala, prefijo = "", oculto = false }) {
  if (Math.abs(v) < 0.01) return null;
  const largo = Math.max(10, Math.min(64, Math.abs(v) * escala * 0.45));
  const dir = Math.sign(v);
  const x2 = x + dir * largo;
  return (
    <g className="text-on-surface-variant">
      <line x1={x} y1={y} x2={x2} y2={y} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d={`M ${x2} ${y} l ${-dir * 7} -5 l 0 10 z`} fill="currentColor" />
      <text x={(x + x2) / 2} y={y - 7} textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor">
        {prefijo}
        {oculto ? "? m/s" : `${fmt(v)} m/s`}
      </text>
    </g>
  );
}

function Bloque({ x, lado, color, etiqueta }) {
  return (
    <g>
      <rect x={x} y={PISO - lado} width={lado} height={lado} rx="7" fill={color} />
      <rect x={x + 3} y={PISO - lado + 3} width={lado - 6} height={lado * 0.28} rx="4" fill="white" opacity="0.18" />
      <text x={x + lado / 2} y={PISO - lado / 2 + 2} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
        {etiqueta}
      </text>
    </g>
  );
}

// Barras horizontales con signo, centradas en cero: a la derecha positivo,
// a la izquierda negativo (mismo sentido que el movimiento en la escena).
function BarraP({ etiqueta, valor, maximo, clase, visible = true, oculto = false }) {
  // `etiqueta` puede ser texto o JSX (p<sub>f</sub>: no hay subíndice Unicode para la f).
  const ancho = maximo > 0 ? (Math.abs(valor) / maximo) * 50 : 0;
  return (
    <div className="flex items-center gap-2 text-label-sm">
      <span className="w-9 flex-shrink-0 font-mono font-semibold text-on-surface-variant">{etiqueta}</span>
      <div className="relative flex-1 h-4 rounded-full bg-surface-container-high overflow-hidden">
        <span className="absolute left-1/2 top-0 bottom-0 w-px bg-outline-variant" />
        <span
          className={`absolute top-0 bottom-0 rounded-full transition-all duration-700 ease-out ${clase}`}
          style={{
            width: visible ? `${ancho}%` : "0%",
            left: valor >= 0 ? "50%" : `${50 - (visible ? ancho : 0)}%`,
          }}
        />
      </div>
      <span className={`w-28 flex-shrink-0 text-right font-mono font-semibold transition-opacity duration-500 ${visible ? "" : "opacity-0"}`}>
        {oculto ? "?" : fmt(valor)} kg·m/s
      </span>
    </div>
  );
}

const PRESETS = [
  { nombre: "Ejemplo", datos: { m1: 4, v1: 6, m2: 2, v2: -3 } },
  { nombre: "Masas iguales", datos: { m1: 3, v1: 5, m2: 3, v2: -5 } },
  { nombre: "Pesado vs. liviano", datos: { m1: 10, v1: 2, m2: 1, v2: -12 } },
  { nombre: "Uno quieto", datos: { m1: 2, v1: 8, m2: 6, v2: 0 } },
];

// datosEjercicio: { m1, v1, m2, v2, tipo } del ejercicio del alumno (o null).
// ocultarResultadosEjercicio: con los datos del ejercicio, los resultados
// (p₁, pᵢ, v', p_f...) se muestran como "?" — son las respuestas que el
// alumno tiene que calcular en el chat. Si mueve los deslizadores a otros
// valores, se ven normal (ya no es su ejercicio).
export default function SimuladorChoque({
  datosIniciales = PRESETS[0].datos,
  tipoInicial = "inelastico",
  datosEjercicio = null,
  ocultarResultadosEjercicio = false,
}) {
  const [datos, setDatos] = useState(datosIniciales);
  const [tipo, setTipo] = useState(tipoInicial);
  const [revelado, setRevelado] = useState(false);
  const [t, setT] = useState(0); // tiempo de la animación, en segundos
  const [animando, setAnimando] = useState(false);
  const [impacto, setImpacto] = useState(null); // { clave, x } para reiniciar los efectos
  const [sacudiendo, setSacudiendo] = useState(false);
  const impactoDisparado = useRef(false);

  const { m1, v1, m2, v2 } = datos;
  const r = useMemo(() => calcularChoque({ m1, v1, m2, v2, tipo }), [m1, v1, m2, v2, tipo]);
  const s1 = ladoBloque(m1, Math.max(m1, m2));
  const s2 = ladoBloque(m2, Math.max(m1, m2));
  const esEjercicio = mismosDatos(datos, datosEjercicio) && tipo === datosEjercicio.tipo;
  const oculto = ocultarResultadosEjercicio && esEjercicio && !revelado;
  const fmtR = (n) => (oculto ? "?" : fmt(n));
  const presets = datosEjercicio
    ? [{ nombre: "Tu ejercicio", datos: datosEjercicio, tipo: datosEjercicio.tipo, destacado: true }, ...PRESETS]
    : PRESETS;
  // Rangos de los deslizadores: alcanzan para los datos del ejercicio
  // (ej. 1200 kg) y nunca menos que 10 kg y ±15 m/s.
  const base = datosEjercicio || datosIniciales;
  const masaMax = topeDeslizador(Math.max(base.m1, base.m2), 10);
  const velMax = topeDeslizador(Math.max(Math.abs(base.v1), Math.abs(base.v2)), 15);
  // px/s por cada m/s. Se limita para que, contando hacia atrás desde el
  // choque en el centro, los dos bloques arranquen completos en pantalla.
  const MARGEN = 8;
  const escala = Math.min(
    VELOCIDAD_VISUAL_MAX / Math.max(Math.abs(v1), Math.abs(v2), 1),
    Math.abs(v1) > 0 ? (CENTRO - s1 - MARGEN) / (Math.abs(v1) * T_CHOQUE) : Infinity,
    Math.abs(v2) > 0 ? (CENTRO - s2 - MARGEN) / (Math.abs(v2) * T_CHOQUE) : Infinity
  );
  const duracion = r.chocan ? T_CHOQUE + T_DESPUES : 2.4;
  const yaChoco = r.chocan && t >= T_CHOQUE;

  // Posiciones (borde izquierdo de cada bloque) en función del tiempo. El
  // choque se ubica en el centro: se calcula hacia atrás desde ahí.
  let x1;
  let x2;
  if (!r.chocan) {
    x1 = 40 + v1 * escala * t;
    x2 = ANCHO - 40 - s2 + v2 * escala * t;
  } else if (!yaChoco) {
    x1 = CENTRO - s1 + v1 * escala * (t - T_CHOQUE);
    x2 = CENTRO + v2 * escala * (t - T_CHOQUE);
  } else {
    const dt = t - T_CHOQUE;
    x1 = CENTRO - s1 + r.v1Final * escala * dt;
    x2 = CENTRO + r.v2Final * escala * dt;
  }

  useEffect(() => {
    if (!animando) return;
    let id;
    let inicio;
    function cuadro(ahora) {
      inicio ??= ahora - t * 1000;
      const nuevoT = Math.min(duracion, (ahora - inicio) / 1000);
      setT(nuevoT);
      if (nuevoT < duracion) id = requestAnimationFrame(cuadro);
      else setAnimando(false);
    }
    id = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(id);
    // `t` solo se usa para retomar desde donde estaba al arrancar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animando, duracion]);

  // Efectos del impacto (onda, partículas, sacudón, sonido): una sola vez
  // por choque, cuando el tiempo cruza el instante del impacto.
  useEffect(() => {
    if (!yaChoco || impactoDisparado.current) return;
    impactoDisparado.current = true;
    const intensidad = Math.min(1, Math.abs(r.p1 - r.p2) / 150);
    reproducirSonidoImpacto({ elastico: tipo === "elastico", intensidad });
    setImpacto({ clave: Date.now(), x: CENTRO });
    setSacudiendo(true);
    const id = setTimeout(() => setSacudiendo(false), 420);
    return () => clearTimeout(id);
  }, [yaChoco, r.p1, r.p2, tipo]);

  function reiniciar() {
    setAnimando(false);
    setT(0);
    setImpacto(null);
    impactoDisparado.current = false;
  }

  function chocar() {
    reiniciar();
    if (prefiereMenosMovimiento()) {
      setT(duracion);
      return;
    }
    requestAnimationFrame(() => setAnimando(true));
  }

  function cambiar(campo, valor) {
    reiniciar();
    setDatos((d) => ({ ...d, [campo]: valor }));
  }

  const maximoP = Math.max(Math.abs(r.p1), Math.abs(r.p2), Math.abs(r.pi), Math.abs(r.p1Final), Math.abs(r.p2Final), 1);
  const terminado = t >= duracion;

  return (
    <div className="flex flex-col gap-4">
      {/* Tipo de choque */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-container" role="radiogroup" aria-label="Tipo de choque">
        {[
          { id: "inelastico", texto: "Quedan enganchados", icono: "link" },
          { id: "elastico", texto: "Rebotan", icono: "sports_handball" },
        ].map((op) => (
          <button
            key={op.id}
            type="button"
            role="radio"
            aria-checked={tipo === op.id}
            onClick={() => {
              reiniciar();
              setTipo(op.id);
            }}
            className={`min-h-[44px] rounded-xl text-body-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
              tipo === op.id ? "bg-surface-container-lowest shadow-elevation-1 text-primary" : "text-on-surface-variant"
            }`}
          >
            <Icono nombre={op.icono} size={16} />
            {op.texto}
          </button>
        ))}
      </div>

      {/* Escena */}
      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-b from-primary-fixed/60 to-surface-container-low shadow-elevation-1 ${sacudiendo ? "sacudir" : ""}`}>
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full h-auto block" role="img" aria-label="Animación del choque entre los dos bloques">
          {/* Piso con marcas, para que se note el movimiento */}
          <line x1="0" y1={PISO} x2={ANCHO} y2={PISO} stroke="var(--color-outline-variant)" strokeWidth="2" />
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={i} x1={i * 30} y1={PISO + 4} x2={i * 30 - 8} y2={PISO + 12} stroke="var(--color-outline-variant)" strokeWidth="1.5" />
          ))}
          <text x="8" y={PISO + 30} fontSize="10" fill="var(--color-outline)">− izquierda</text>
          <text x={ANCHO - 8} y={PISO + 30} fontSize="10" fill="var(--color-outline)" textAnchor="end">derecha +</text>

          <Bloque x={x1} lado={s1} color="var(--color-primary)" etiqueta={`${fmt(m1)} kg`} />
          <Bloque x={x2} lado={s2} color="var(--color-secondary)" etiqueta={`${fmt(m2)} kg`} />

          {/* Enganche: un eslabón entre los dos bloques unidos */}
          {yaChoco && tipo === "inelastico" && (
            <g className="enganche-choque" style={{ transformOrigin: `${x2}px ${PISO - 7}px` }}>
              <circle cx={x2} cy={PISO - 7} r="6" fill="var(--color-surface-container-lowest)" stroke="var(--color-tertiary)" strokeWidth="2.5" />
              <path d={`M ${x2 - 2.5} ${PISO - 7} h 5`} stroke="var(--color-tertiary)" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* Flechas de velocidad (antes y después) */}
          {!yaChoco ? (
            <>
              <Flecha x={x1 + s1 / 2} y={PISO - s1 - 14} v={v1} escala={escala} />
              <Flecha x={x2 + s2 / 2} y={PISO - s2 - 14} v={v2} escala={escala} />
            </>
          ) : tipo === "inelastico" ? (
            <Flecha x={x2} y={PISO - Math.max(s1, s2) - 14} v={r.v1Final} escala={escala} prefijo="v' = " oculto={oculto} />
          ) : (
            <>
              <Flecha x={x1 + s1 / 2} y={PISO - s1 - 14} v={r.v1Final} escala={escala} oculto={oculto} />
              <Flecha x={x2 + s2 / 2} y={PISO - s2 - 14} v={r.v2Final} escala={escala} oculto={oculto} />
            </>
          )}

          {/* Impacto: onda expansiva + partículas (se reinician con la clave) */}
          {impacto && (
            <g key={impacto.clave}>
              <circle className="onda-choque" cx={impacto.x} cy={PISO - 20} r="18" fill="none" stroke="var(--color-secondary-container)" strokeWidth="4" />
              <circle className="onda-choque onda-choque--tarde" cx={impacto.x} cy={PISO - 20} r="18" fill="none" stroke="var(--color-primary-fixed-dim)" strokeWidth="3" />
              <circle className="destello-choque" cx={impacto.x} cy={PISO - 20} r="26" fill="var(--color-secondary-fixed)" />
              {Array.from({ length: 14 }).map((_, i) => {
                const ang = (Math.PI * (i + 0.5)) / 14; // abanico hacia arriba
                const dist = 40 + (i % 3) * 16;
                return (
                  <circle
                    key={i}
                    className="particula-choque"
                    cx={impacto.x}
                    cy={PISO - 20}
                    r={i % 2 ? 3.5 : 5}
                    fill={i % 2 ? "var(--color-secondary-container)" : "var(--color-primary-fixed-dim)"}
                    style={{ "--dx": `${Math.cos(ang) * dist}px`, "--dy": `${-Math.sin(ang) * dist}px` }}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {esEjercicio && r.chocan && (
          <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-semibold shadow-elevation-1 flex items-center gap-1">
            <Icono nombre="assignment" size={14} />
            Tu ejercicio
          </span>
        )}
        {!r.chocan && (
          <p className="absolute top-2 inset-x-2 text-center text-label-sm font-semibold text-on-surface-variant bg-surface-container-lowest/85 rounded-lg px-2 py-1">
            Con estas velocidades el bloque azul no alcanza al naranja: no chocan.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={chocar}
          disabled={animando}
          className="boton-degradado flex-1 min-h-[48px] rounded-full text-title-md font-semibold shadow-elevation-2 disabled:opacity-60 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Icono nombre={terminado || t > 0 ? "replay" : "play_arrow"} size={22} />
          {terminado || t > 0 ? "Repetir choque" : "¡Chocar!"}
        </button>
      </div>

      {/* Barras de cantidad de movimiento: antes vs. después */}
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-surface-container-lowest shadow-elevation-1">
        <div className="flex flex-col gap-1.5">
          <span className="text-label-sm font-mono uppercase tracking-wider text-on-surface-variant">Antes del choque</span>
          <BarraP etiqueta="p₁" valor={r.p1} maximo={maximoP} clase="bg-primary" oculto={oculto} />
          <BarraP etiqueta="p₂" valor={r.p2} maximo={maximoP} clase="bg-secondary" oculto={oculto} />
          <BarraP etiqueta="pᵢ" valor={r.pi} maximo={maximoP} clase="bg-tertiary" oculto={oculto} />
        </div>
        <div className={`flex flex-col gap-1.5 transition-opacity duration-500 ${yaChoco ? "" : "opacity-50"}`}>
          <span className="text-label-sm font-mono uppercase tracking-wider text-on-surface-variant">
            Después del choque {!yaChoco && r.chocan ? "(tocá ¡Chocar!)" : ""}
          </span>
          {tipo === "elastico" && (
            <>
              <BarraP etiqueta="p₁'" valor={r.p1Final} maximo={maximoP} clase="bg-primary" visible={yaChoco} oculto={oculto} />
              <BarraP etiqueta="p₂'" valor={r.p2Final} maximo={maximoP} clase="bg-secondary" visible={yaChoco} oculto={oculto} />
            </>
          )}
          <BarraP etiqueta={<>p<sub>f</sub></>} valor={r.pf} maximo={maximoP} clase="bg-tertiary" visible={yaChoco} oculto={oculto} />
        </div>

        <div aria-live="polite">
          {yaChoco && (
            <div className="celebrar flex items-start gap-2 p-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed text-body-sm">
              <Icono nombre="balance" size={20} className="flex-shrink-0 mt-0.5" />
              <p>
                <strong>
                  p<sub>f</sub> = p<sub>i</sub>
                  {oculto ? "" : ` = ${fmt(r.pi)} kg·m/s`} ✓
                </strong>{" "}
                {oculto
                  ? tipo === "inelastico"
                    ? `Quedaron enganchados (${fmt(r.masaTotal)} kg) y se mueven juntos. ¿Con qué velocidad? ¡Eso lo calculás vos en el chat!`
                    : "Rebotaron. ¿Con qué velocidades? ¡Eso lo calculás vos en el chat!"
                  : tipo === "inelastico"
                    ? `Quedaron enganchados (${fmt(r.masaTotal)} kg) y se mueven juntos a v' = ${fmt(r.v1Final)} m/s.`
                    : `Rebotaron: el azul sale a ${fmt(r.v1Final)} m/s y el naranja a ${fmt(r.v2Final)} m/s.`}{" "}
                La cantidad de movimiento total es la misma antes y después.
              </p>
            </div>
          )}
        </div>
        {oculto && (
          <div className="flex items-center justify-between gap-2 text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Icono nombre="visibility_off" size={16} />
              Los resultados de tu ejercicio quedan en &quot;?&quot; para que los calcules vos.
            </span>
            <button
              type="button"
              onClick={() => setRevelado(true)}
              className="min-h-[36px] px-3 rounded-full bg-surface-container-high font-semibold text-primary flex-shrink-0 active:scale-[0.98] transition-all duration-200"
            >
              Mostrar los números
            </button>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-surface-container-low">
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.nombre}
              type="button"
              onClick={() => {
                reiniciar();
                setDatos({ m1: p.datos.m1, v1: p.datos.v1, m2: p.datos.m2, v2: p.datos.v2 });
                if (p.tipo) setTipo(p.tipo);
              }}
              className={`min-h-[36px] px-3 rounded-full text-label-sm font-semibold shadow-elevation-1 active:scale-[0.98] transition-all duration-200 flex items-center gap-1 ${
                p.destacado ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container-lowest text-on-surface-variant"
              }`}
            >
              {p.destacado && <Icono nombre="assignment" size={14} />}
              {p.nombre}
            </button>
          ))}
        </div>
        {[
          { campo: "m1", texto: "Masa bloque azul (m₁)", unidad: "kg", min: masaMax > 100 ? 10 : 1, max: masaMax, color: "accent-primary" },
          { campo: "v1", texto: "Velocidad bloque azul (v₁)", unidad: "m/s", min: -velMax, max: velMax, color: "accent-primary" },
          { campo: "m2", texto: "Masa bloque naranja (m₂)", unidad: "kg", min: masaMax > 100 ? 10 : 1, max: masaMax, color: "accent-secondary" },
          { campo: "v2", texto: "Velocidad bloque naranja (v₂)", unidad: "m/s", min: -velMax, max: velMax, color: "accent-secondary" },
        ].map((c) => (
          <label key={c.campo} className="flex flex-col gap-1">
            <span className="flex justify-between text-label-sm">
              <span className="text-on-surface-variant">{c.texto}</span>
              <span className="font-mono font-bold">
                {fmt(datos[c.campo])} {c.unidad}
              </span>
            </span>
            <input
              type="range"
              min={c.min}
              max={c.max}
              step={c.max > 100 ? 10 : c.max > 20 ? 1 : 0.5}
              value={datos[c.campo]}
              onChange={(e) => cambiar(c.campo, Number(e.target.value))}
              className={`w-full ${c.color}`}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
