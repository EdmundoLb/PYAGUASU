"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";
import Encabezado from "@/components/Encabezado";
import IndicadorProgreso from "@/components/IndicadorProgreso";
import ChipDato from "@/components/ChipDato";
import BurbujaChat from "@/components/BurbujaChat";
import TutorPensando from "@/components/TutorPensando";
import ChipsRespuesta from "@/components/ChipsRespuesta";
import OpcionQuiz from "@/components/OpcionQuiz";
import TarjetaPista from "@/components/TarjetaPista";
import ModalSolucion from "@/components/ModalSolucion";
import PantallaIdioma from "@/components/PantallaIdioma";
import PantallaRol from "@/components/PantallaRol";
import PantallaPerfil from "@/components/PantallaPerfil";
import PantallaQuizDiagnostico from "@/components/PantallaQuizDiagnostico";
import TarjetaXpGanada from "@/components/TarjetaXpGanada";
import NavegacionInferior from "@/components/NavegacionInferior";
import RenderizadorMatematico from "@/components/RenderizadorMatematico";
import TecladoMatematico from "@/components/TecladoMatematico";
import { PREGUNTAS_DIAGNOSTICO, calcularEstiloPredominante } from "@/lib/quiz/diagnostico";
import { guardarPerfilActivo, leerPerfilActivo } from "@/lib/identidad/perfilActivo";

const EJEMPLO =
  "Un auto de 1200 kg viaja a 20 m/s sobre una pista horizontal sin fricción y choca de frente contra otro auto de 800 kg que se encuentra en reposo. Después del impacto, ambos quedan enganchados. ¿Cuál es la velocidad final del conjunto?";

const ESTADO_INICIAL = {
  fase: "rol", // rol | perfil | idioma | quiz | inicio | cargando | conversando | error
  rolElegido: "", // 'alumno' | 'docente' — elegido en PantallaRol
  perfilActivo: null, // perfil mock elegido en PantallaPerfil (sin login real)
  sesionTutorId: "", // id de la SesionTutor mock ligada a la conversación actual
  erroresSesion: 0, // total de intentos incorrectos en el problema actual (para XP)
  userLanguage: "", // 'jopara' | 'castellano' — elegido en PantallaIdioma, bloquea el resto de la app
  quizPasoActual: 0,
  quizCompleted: false,
  visualScore: 0,
  auditoryScore: 0,
  kinestheticScore: 0,
  learningLevel: "", // 'visual' | 'auditor' | 'kinestesico', calculado al cerrar el test
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
  // --- interactividad ---
  opcionesRespuesta: [], // chips sugeridos por el tutor (atajos de texto libre)
  pistaActual: null, // pista revelable del paso actual (TarjetaPista)
  opcionEstado: {}, // { [idOpcion]: 'correcta' | 'incorrecta' } (OpcionQuiz)
  mostrarSolucion: false, // controla ModalSolucion
  etapaPensando: 0, // índice de etapa en TutorPensando
  requiereOpcion: false, // true => el paso actual se responde con OpcionQuiz
  opciones: [], // opciones del quiz cuando requiereOpcion=true
  racha: 0, // aciertos seguidos en este problema (se corta con un error)
  resultadoXp: null, // { xpGanada, nivelNuevo, subioDeNivel, insigniasNuevas } al completar
};

export default function Home() {
  const router = useRouter();
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const [inputEnunciado, setInputEnunciado] = useState("");
  const [inputRespuesta, setInputRespuesta] = useState("");
  const [claseActiva, setClaseActiva] = useState(null); // { nombre } — solo para mostrar en el header
  const finalChatRef = useRef(null);

  // Un alumno pertenece a UNA sola clase en este MVP (perfil.claseId). Se
  // resuelve el nombre acá para poder mostrarlo en el header sin obligar a
  // entrar a "Progreso" para saber en qué clase se está.
  useEffect(() => {
    const claseId = estado.perfilActivo?.claseId;
    if (!claseId) {
      setClaseActiva(null);
      return;
    }
    let cancelado = false;
    fetch(`/api/clases/${claseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelado && data.clase) setClaseActiva(data.clase);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [estado.perfilActivo?.claseId]);

  // Si ya había un perfil elegido en esta máquina (localStorage), se retoma
  // en vez de mostrar el selector de rol de nuevo. Un docente va directo a
  // su panel; un alumno retoma el flujo de onboarding de siempre.
  useEffect(() => {
    const perfilGuardado = leerPerfilActivo();
    if (!perfilGuardado) return;
    if (perfilGuardado.rol === "docente") {
      router.push("/docente");
      return;
    }
    setEstado((s) => ({
      ...s,
      fase: "idioma",
      rolElegido: "alumno",
      perfilActivo: perfilGuardado,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    finalChatRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [estado.historial.length, estado.fase]);

  // Mantiene el perfil guardado en localStorage al día con el XP/nivel más
  // reciente, para que un refresh de página no muestre un valor viejo.
  useEffect(() => {
    if (estado.perfilActivo) guardarPerfilActivo(estado.perfilActivo);
  }, [estado.perfilActivo]);

  // Anima TutorPensando por etapas mientras se espera la respuesta del tutor.
  useEffect(() => {
    if (estado.fase !== "cargando") return;
    setEstado((s) => ({ ...s, etapaPensando: 0 }));
    const id = setInterval(() => {
      setEstado((s) => ({ ...s, etapaPensando: s.etapaPensando + 1 }));
    }, 800);
    return () => clearInterval(id);
  }, [estado.fase]);

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

  // --- Gamificación: el chat con el tutor (arriba) es totalmente ajeno a
  // esto. Estas dos llamadas son las únicas que conectan una conversación
  // con el progreso/XP del alumno (ver src/lib/store/sesiones.js).
  async function iniciarSesionMock({ alumnoId, enunciado }) {
    const res = await fetch("/api/sesiones/iniciar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumnoId, enunciado }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data.sesion;
  }

  async function completarSesionMock({ sesionId, temaDetectado, errores, rachaMaxima }) {
    const res = await fetch(`/api/sesiones/${sesionId}/completar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temaDetectado, errores, rachaMaxima }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }

  function seleccionarRol(rol) {
    setEstado((s) => ({ ...s, rolElegido: rol, fase: "perfil" }));
  }

  // Sin login real: elegir (o crear) un perfil mock reemplaza el login. Un
  // docente sale del árbol de estados de esta página hacia /docente; un
  // alumno sigue el onboarding de idioma/estilo de aprendizaje de siempre.
  function elegirPerfil(perfil) {
    guardarPerfilActivo(perfil);
    if (perfil.rol === "docente") {
      router.push("/docente");
      return;
    }
    setEstado((s) => ({ ...s, perfilActivo: perfil, fase: "idioma" }));
  }

  function seleccionarIdioma(userLanguage) {
    setEstado((s) => ({ ...s, userLanguage, fase: "quiz" }));
  }

  // Test de diagnóstico de estilo de aprendizaje: cada opción suma un punto
  // a su canal (visual/auditivo/kinestésico); al responder la última
  // pregunta se calcula el estilo predominante y se pasa a la pantalla de
  // inicio del problema.
  function responderQuiz(canal) {
    setEstado((s) => {
      const campoPuntaje =
        canal === "visual" ? "visualScore" : canal === "auditivo" ? "auditoryScore" : "kinestheticScore";
      const puntajes = { ...s, [campoPuntaje]: s[campoPuntaje] + 1 };
      const siguientePaso = s.quizPasoActual + 1;

      if (siguientePaso >= PREGUNTAS_DIAGNOSTICO.length) {
        return {
          ...puntajes,
          quizPasoActual: siguientePaso,
          quizCompleted: true,
          learningLevel: calcularEstiloPredominante(puntajes),
          fase: "inicio",
        };
      }

      return { ...puntajes, quizPasoActual: siguientePaso };
    });
  }

  // Punto de entrada único a un problema nuevo, con o sin enunciado propio.
  // Con `temaSeleccionado`, el tutor inventa el problema (ver
  // construirSolicitudProblemaGenerado en lib/ai/prompt.js) y lo devuelve en
  // `turno.enunciadoGenerado` para mostrarlo como si el estudiante lo hubiera
  // escrito.
  async function comenzarProblema({ enunciadoPropio, temaSeleccionado, dificultadSeleccionada }) {
    setEstado((s) => ({ ...s, fase: "cargando", error: "" }));

    try {
      const [turno, sesion] = await Promise.all([
        llamarTutor({
          esInicial: true,
          enunciado: enunciadoPropio || "",
          temaSeleccionado,
          dificultadSeleccionada,
          idioma: estado.userLanguage,
          learningLevel: estado.learningLevel,
          historial: [],
        }),
        iniciarSesionMock({
          alumnoId: estado.perfilActivo?.id,
          enunciado: enunciadoPropio || `Practicar: ${temaSeleccionado}`,
        }),
      ]);

      const enunciadoMostrado = enunciadoPropio || turno.enunciadoGenerado || `Practicar: ${temaSeleccionado}`;

      setEstado((s) => ({
        ...s,
        fase: "conversando",
        enunciado: enunciadoMostrado,
        sesionTutorId: sesion.id,
        erroresSesion: 0,
        resultadoXp: null,
        historial: [
          { autor: "estudiante", texto: enunciadoMostrado },
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
        opcionesRespuesta: turno.opcionesRespuesta || [],
        requiereOpcion: Boolean(turno.requiereOpcion),
        opciones: turno.opciones || [],
        opcionEstado: {},
        pistaActual: null,
        racha: 0,
      }));
    } catch (err) {
      setEstado((s) => ({ ...s, fase: "error", error: err.message }));
    }
  }

  function iniciar(e) {
    e.preventDefault();
    if (!inputEnunciado.trim()) return;
    comenzarProblema({ enunciadoPropio: inputEnunciado });
  }

  function iniciarConTema({ tema, dificultad }) {
    comenzarProblema({ temaSeleccionado: tema, dificultadSeleccionada: dificultad });
  }

  async function enviarTurno({ mensaje, pedirAyuda }) {
    // Historial tal como está ANTES de agregar este intento, para mandarle
    // al servidor exactamente lo que ya se conversó (stateless).
    const historialParaEnviar = estado.historial;
    const idioma = estado.userLanguage;

    // UI optimista: la burbuja del estudiante aparece al instante, no
    // recién cuando vuelve la respuesta del servidor. El color que ya se
    // pintó en OpcionQuiz (si vino de ahí) se mantiene durante la carga:
    // no tocamos opcionEstado/opciones acá, solo se reemplazan cuando
    // llega el turno siguiente.
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
        learningLevel: estado.learningLevel,
        historial: historialParaEnviar,
      });

      // Se derivan acá (no dentro del setEstado) para poder usarlos también
      // en la llamada a completarSesionMock de abajo, con el mismo criterio
      // que ya usa el resto del archivo para leer estado "de antes" (ver
      // historialParaEnviar más arriba).
      const erroresTotales = estado.erroresSesion + (turno.correcta === false ? 1 : 0);
      const rachaTrasTurno = turno.correcta === false ? 0 : turno.correcta === true ? estado.racha + 1 : estado.racha;

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
          opcionesRespuesta: turno.opcionesRespuesta || [],
          requiereOpcion: Boolean(turno.requiereOpcion),
          opciones: turno.opciones || [],
          opcionEstado: {},
          pistaActual: turno.correcta === false ? turno.pista || null : null,
          racha: rachaTrasTurno,
          erroresSesion: erroresTotales,
        };
      });

      if (turno.completado && estado.sesionTutorId) {
        completarSesionMock({
          sesionId: estado.sesionTutorId,
          temaDetectado: turno.tema,
          errores: erroresTotales,
          rachaMaxima: rachaTrasTurno,
        })
          .then((resultadoXp) =>
            setEstado((s) => ({
              ...s,
              resultadoXp,
              // El chip de XP del encabezado (Encabezado.js) lee de acá —
              // se actualiza al toque para que se sienta inmediato.
              perfilActivo: s.perfilActivo
                ? { ...s.perfilActivo, xp: s.perfilActivo.xp + resultadoXp.xpGanada, nivel: resultadoXp.nivelNuevo }
                : s.perfilActivo,
            }))
          )
          .catch((err) => console.error("[gamificación] No se pudo registrar el XP:", err));
      }
    } catch (err) {
      setEstado((s) => ({ ...s, fase: "error", error: err.message }));
    }
  }

  function responder(e) {
    e.preventDefault();
    if (!inputRespuesta.trim()) return;
    enviarTurno({ mensaje: inputRespuesta, pedirAyuda: false });
  }

  function elegirChip(texto) {
    if (estado.fase === "cargando") return;
    enviarTurno({ mensaje: texto, pedirAyuda: false });
  }

  function elegirOpcion(opcion, idx) {
    if (estado.fase === "cargando") return;
    setEstado((s) => ({
      ...s,
      opcionEstado: { ...s.opcionEstado, [idx]: opcion.correcta ? "correcta" : "incorrecta" },
    }));
    enviarTurno({ mensaje: opcion.texto, pedirAyuda: false });
  }

  function pedirAyudaDirecta() {
    enviarTurno({ mensaje: "", pedirAyuda: true });
  }

  // "Resolver otro problema" vuelve a la pantalla de enunciado, pero
  // conserva el idioma y el resultado del test de estilo de aprendizaje —
  // esos no se vuelven a pedir en cada problema, solo al abrir la app.
  function reiniciar() {
    setEstado((s) => ({
      ...ESTADO_INICIAL,
      fase: "inicio",
      rolElegido: s.rolElegido,
      perfilActivo: s.perfilActivo,
      userLanguage: s.userLanguage,
      quizCompleted: s.quizCompleted,
      visualScore: s.visualScore,
      auditoryScore: s.auditoryScore,
      kinestheticScore: s.kinestheticScore,
      learningLevel: s.learningLevel,
    }));
    setInputEnunciado("");
    setInputRespuesta("");
  }

  const enConversacion = !["rol", "perfil", "idioma", "quiz", "inicio"].includes(estado.fase);
  // El nav inferior solo se muestra fuera del "modo foco" de resolver un
  // problema (ahí ya hay una barra fija de input al pie — dos barras fijas
  // se pisarían) y nunca durante el onboarding.
  // "error" queda fuera a propósito: ahí la barra fija de input/reintento de
  // ConversacionTutor sigue mostrándose (para poder reintentar sin perder el
  // problema), y dos barras fijas al pie se pisarían.
  const mostrarNav = estado.fase === "inicio" || estado.completado;

  return (
    <>
      <Encabezado conectado={estado.fase !== "error"} perfilActivo={estado.perfilActivo} claseActiva={claseActiva} />
      <main
        className={`flex-1 w-full max-w-[680px] mx-auto px-4 pt-6 flex flex-col gap-5 ${
          mostrarNav
            ? "pb-24"
            : enConversacion && !estado.completado
              ? estado.requiereOpcion && estado.opciones.length > 0
                ? "pb-72"
                : "pb-40"
              : "pb-6"
        }`}
      >
        {/* Transición suave entre pantallas. Se usa una key estable (no la
            fase cruda) para no remontar el chat en cada turno — eso
            rompería el scroll y el estado optimista. */}
        <div key={enConversacion ? "chat" : estado.fase} className="mensaje-nuevo">
          {estado.fase === "rol" && <PantallaRol onSeleccionar={seleccionarRol} />}

          {estado.fase === "perfil" && (
            <PantallaPerfil
              rol={estado.rolElegido}
              onElegir={elegirPerfil}
              onVolver={() => setEstado((s) => ({ ...s, fase: "rol" }))}
            />
          )}

          {estado.fase === "idioma" && <PantallaIdioma onSeleccionar={seleccionarIdioma} />}

          {estado.fase === "quiz" && (
            <PantallaQuizDiagnostico
              idioma={estado.userLanguage}
              indice={estado.quizPasoActual}
              onResponder={responderQuiz}
            />
          )}

          {estado.fase === "inicio" && (
            <PantallaInicio
              inputEnunciado={inputEnunciado}
              setInputEnunciado={setInputEnunciado}
              idioma={estado.userLanguage}
              onCambiarIdioma={() => setEstado((s) => ({ ...s, fase: "idioma" }))}
              onIniciar={iniciar}
              onIniciarConTema={iniciarConTema}
            />
          )}

          {enConversacion && (
            <ConversacionTutor
              estado={estado}
              inputRespuesta={inputRespuesta}
              setInputRespuesta={setInputRespuesta}
              onResponder={responder}
              onElegirChip={elegirChip}
              onElegirOpcion={elegirOpcion}
              onPedirAyuda={pedirAyudaDirecta}
              onReiniciar={reiniciar}
              onAbrirSolucion={() => setEstado((s) => ({ ...s, mostrarSolucion: true }))}
              onCerrarSolucion={() => setEstado((s) => ({ ...s, mostrarSolucion: false }))}
              finalChatRef={finalChatRef}
            />
          )}
        </div>
      </main>
      {mostrarNav && estado.perfilActivo && <NavegacionInferior />}
    </>
  );
}

const ETIQUETA_IDIOMA = { jopara: "Jopara", castellano: "Castellano" };

function PantallaInicio({ inputEnunciado, setInputEnunciado, idioma, onCambiarIdioma, onIniciar, onIniciarConTema }) {
  const [modo, setModo] = useState("propio"); // "propio" | "tema"

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

      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-container" role="tablist" aria-label="Cómo querés practicar">
        <button
          type="button"
          role="tab"
          aria-selected={modo === "propio"}
          onClick={() => setModo("propio")}
          className={`min-h-[44px] rounded-xl text-body-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
            modo === "propio" ? "bg-surface-container-lowest shadow-elevation-1 text-primary" : "text-on-surface-variant"
          }`}
        >
          <Icono nombre="draw" size={16} />
          Mi propio problema
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === "tema"}
          onClick={() => setModo("tema")}
          className={`min-h-[44px] rounded-xl text-body-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
            modo === "tema" ? "bg-surface-container-lowest shadow-elevation-1 text-primary" : "text-on-surface-variant"
          }`}
        >
          <Icono nombre="menu_book" size={16} />
          Elegir un tema
        </button>
      </div>

      {modo === "propio" ? (
        <form onSubmit={onIniciar} className="flex flex-col gap-3 bg-surface-container-lowest rounded-2xl p-4 shadow-elevation-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="enunciado" className="text-label-md font-mono text-on-surface-variant flex items-center gap-1.5">
              <Icono nombre="draw" size={16} className="text-primary" />
              Enunciado de tu problema
            </label>
            <button
              type="button"
              aria-label="Cargar enunciado de ejemplo"
              className="min-h-[44px] inline-flex items-center text-body-sm text-secondary underline underline-offset-2 flex-shrink-0 active:scale-[0.98] transition-all duration-200"
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

          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-body-sm text-on-surface-variant">
              Te voy a hablar en <strong className="text-on-surface">{ETIQUETA_IDIOMA[idioma] || idioma}</strong>
            </span>
            <button
              type="button"
              onClick={onCambiarIdioma}
              className="min-h-[44px] inline-flex items-center text-body-sm text-secondary underline underline-offset-2 active:scale-[0.98] transition-all duration-200"
            >
              Cambiar
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputEnunciado.trim()}
            className="boton-degradado min-h-[52px] rounded-full text-title-md font-semibold shadow-elevation-2 disabled:opacity-50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Icono nombre="smart_toy" size={22} />
            Empezar, guiame paso a paso
          </button>
        </form>
      ) : (
        <SelectorTemaPractica onIniciarConTema={onIniciarConTema} />
      )}
    </div>
  );
}

const ETIQUETA_DIFICULTAD = { facil: "Fácil", medio: "Medio", dificil: "Difícil" };

// Catálogo de temas para practicar sin necesidad de escribir un enunciado
// propio ni pertenecer a ninguna clase — el tutor inventa un problema
// adecuado al tema y dificultad elegidos (ver sección 9 del plan).
function SelectorTemaPractica({ onIniciarConTema }) {
  const [temas, setTemas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [temaElegido, setTemaElegido] = useState(null);
  const [dificultad, setDificultad] = useState("medio");

  useEffect(() => {
    fetch("/api/temas")
      .then((res) => res.json())
      .then((data) => setTemas(data.temas || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p className="text-body-sm text-on-surface-variant p-4">Cargando temas...</p>;
  }

  return (
    <div className="flex flex-col gap-3 bg-surface-container-lowest rounded-2xl p-4 shadow-elevation-2">
      <span className="text-label-md font-mono text-on-surface-variant flex items-center gap-1.5">
        <Icono nombre="menu_book" size={16} className="text-primary" />
        ¿Qué tema querés practicar?
      </span>
      <div className="flex flex-col gap-2">
        {temas.map((tema) => (
          <button
            key={tema.id}
            type="button"
            onClick={() => setTemaElegido(tema)}
            className={`min-h-[52px] px-3.5 rounded-xl border-2 text-left flex items-center justify-between gap-2 transition-all duration-200 ${
              temaElegido?.id === tema.id
                ? "border-primary bg-primary-fixed text-on-primary-fixed"
                : "border-transparent bg-surface-container-low text-on-surface"
            }`}
          >
            <span className="text-body-md font-semibold">{tema.titulo}</span>
            {temaElegido?.id === tema.id && <Icono nombre="check_circle" size={18} />}
          </button>
        ))}
      </div>

      {temaElegido && (
        <>
          <span className="text-label-md font-mono text-on-surface-variant">Dificultad</span>
          <div className="flex gap-2">
            {Object.entries(ETIQUETA_DIFICULTAD).map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setDificultad(valor)}
                className={`flex-1 min-h-[44px] rounded-xl text-body-sm font-semibold transition-all duration-200 ${
                  dificultad === valor ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onIniciarConTema({ tema: temaElegido.titulo, dificultad })}
            className="boton-degradado min-h-[52px] rounded-full text-title-md font-semibold shadow-elevation-2 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Icono nombre="smart_toy" size={22} />
            Armame un problema de este tema
          </button>
        </>
      )}
    </div>
  );
}

function ConversacionTutor({
  estado,
  inputRespuesta,
  setInputRespuesta,
  onResponder,
  onElegirChip,
  onElegirOpcion,
  onPedirAyuda,
  onReiniciar,
  onAbrirSolucion,
  onCerrarSolucion,
  finalChatRef,
}) {
  const { fase, tema, datos, incognita, pasoActual, totalPasosEstimados, completado } = estado;
  const cargando = fase === "cargando";
  const modoQuiz = !completado && estado.requiereOpcion && estado.opciones.length > 0;
  const ultimoMensajeEsTutor = estado.historial[estado.historial.length - 1]?.autor === "tutor";
  const estadoTurnoActivo =
    estado.ultimaCorrecta === true ? "correcta" : estado.ultimaCorrecta === false ? "incorrecta" : "nueva";
  const [mostrarTeclado, setMostrarTeclado] = useState(false);

  function insertarFormula(latexConDolares) {
    setInputRespuesta((prev) => (prev ? `${prev} ${latexConDolares}` : latexConDolares));
    setMostrarTeclado(false);
  }

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

        <IndicadorProgreso pasoActual={pasoActual} totalPasos={totalPasosEstimados} racha={estado.racha} />

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
            <span className="font-mono font-bold text-body-sm text-right">
              <RenderizadorMatematico texto={incognita} />
            </span>
          </div>
        )}
      </div>

      {/* Chat de la conversación tutor <-> estudiante. El último mensaje del
          tutor (mientras no se respondió todavía) se resalta como "el paso
          de ahora" — el resto queda como historial de referencia, no como
          protagonista de la pantalla. */}
      <div className="flex flex-col gap-2.5">
        {estado.historial.slice(1).map((turno, i, arr) => {
          const esElUltimo = i === arr.length - 1;
          const activa = esElUltimo && turno.autor === "tutor" && !cargando && !completado;
          return (
            <BurbujaChat
              key={i}
              autor={turno.autor}
              texto={turno.texto}
              activa={activa}
              estadoTurno={activa ? estadoTurnoActivo : undefined}
            />
          );
        })}

        {!cargando && !completado && ultimoMensajeEsTutor && !modoQuiz && (
          <ChipsRespuesta opciones={estado.opcionesRespuesta} onElegir={onElegirChip} disabled={cargando} />
        )}

        {cargando && <TutorPensando etapa={estado.etapaPensando} />}

        {estado.ultimaCorrecta === false && estado.ultimaEsErrorFrecuente && estado.ultimaNormalizacion && (
          <div className="mensaje-nuevo flex items-start gap-2 p-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed text-body-sm shadow-elevation-1">
            <Icono nombre="groups" size={18} className="flex-shrink-0 mt-0.5" />
            <p>
              <strong>No sos el único/a:</strong> {estado.ultimaNormalizacion}
            </p>
          </div>
        )}
        <div ref={finalChatRef} />
      </div>

      {estado.pasosCerrados.length > 0 && (
        <button
          type="button"
          onClick={onAbrirSolucion}
          className="min-h-[44px] rounded-2xl bg-surface-container-low shadow-elevation-1 px-4 flex items-center gap-2 text-body-sm font-semibold text-on-surface-variant active:scale-[0.98] transition-all duration-200"
        >
          <Icono nombre="functions" size={18} className="text-primary" />
          Ver fórmulas confirmadas ({estado.pasosCerrados.length})
        </button>
      )}

      {estado.mostrarSolucion && (
        <ModalSolucion
          pasos={estado.pasosCerrados}
          resultadoFinal={completado ? estado.resultadoFinal : null}
          analogiaCotidiana={completado ? estado.analogiaCotidiana : ""}
          onCerrar={onCerrarSolucion}
        />
      )}

      {/* La pista queda escondida detrás de un toque a propósito: no se
          regala sin que el estudiante la pida. Se remonta colapsada cada
          vez que llega una pista nueva (key ligada al largo del historial). */}
      {!completado && estado.pistaActual && (
        <TarjetaPista key={`pista-${estado.historial.length}`} pista={estado.pistaActual} />
      )}

      {completado && estado.resultadoFinal && (
        <div className="celebrar flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-between gap-3 shadow-elevation-2">
            <span className="flex items-center gap-2 font-semibold text-body-sm uppercase tracking-wide">
              <Icono nombre="check_circle" size={22} className="text-tertiary" />
              Resuelto
            </span>
            <span className="font-mono font-bold text-title-lg">
              <RenderizadorMatematico texto={estado.resultadoFinal.valor} /> {estado.resultadoFinal.unidad || ""}
            </span>
          </div>
          {estado.analogiaCotidiana && (
            <div className="p-3.5 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-body-sm leading-relaxed flex items-start gap-2 shadow-elevation-1">
              <Icono nombre="local_pizza" size={18} className="flex-shrink-0 mt-0.5" />
              <p>
                <strong>Para que se entienda fácil:</strong> <RenderizadorMatematico texto={estado.analogiaCotidiana} />
              </p>
            </div>
          )}
          {estado.resultadoXp && <TarjetaXpGanada resultado={estado.resultadoXp} />}
          <button
            type="button"
            onClick={onReiniciar}
            className="boton-degradado min-h-[52px] rounded-full text-title-md font-semibold shadow-elevation-2 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
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
          <div className="max-w-[680px] mx-auto px-4 py-3 flex flex-col gap-2">
            {mostrarTeclado && !modoQuiz && (
              <TecladoMatematico onInsertar={insertarFormula} onCerrar={() => setMostrarTeclado(false)} />
            )}
            {modoQuiz ? (
              <div className="flex flex-col gap-2">
                {estado.opciones.map((opcion, i) => (
                  <OpcionQuiz
                    key={i}
                    letra={String.fromCharCode(65 + i)}
                    opcion={opcion}
                    estado={estado.opcionEstado[i] || "idle"}
                    disabled={cargando}
                    onResponder={() => onElegirOpcion(opcion, i)}
                  />
                ))}
              </div>
            ) : (
              <form onSubmit={onResponder} className="flex items-center gap-2 bg-surface-container-lowest rounded-2xl shadow-elevation-2 p-2">
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
                  className="boton-degradado min-w-[44px] min-h-[44px] rounded-full shadow-elevation-1 disabled:opacity-50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center flex-shrink-0"
                >
                  <Icono nombre="send" size={20} />
                </button>
              </form>
            )}
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={onPedirAyuda}
                disabled={cargando}
                aria-label="Mostrar la respuesta de este paso"
                className="min-h-[44px] flex items-center gap-1.5 px-3 rounded-full text-on-surface-variant text-body-sm font-medium hover:bg-surface-container-high disabled:opacity-50 active:scale-[0.98] transition-all duration-200"
              >
                <Icono nombre="visibility" size={16} />
                Mostrame este paso
              </button>
              {!modoQuiz && (
                <button
                  type="button"
                  onClick={() => setMostrarTeclado((v) => !v)}
                  disabled={cargando}
                  aria-label="Insertar una fórmula matemática"
                  className="min-h-[44px] flex items-center gap-1.5 px-3 rounded-full text-on-surface-variant text-body-sm font-medium hover:bg-surface-container-high disabled:opacity-50 active:scale-[0.98] transition-all duration-200"
                >
                  <Icono nombre="functions" size={16} />
                  Insertar fórmula
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
