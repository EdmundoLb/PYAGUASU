"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";
import Encabezado from "@/components/Encabezado";
import Avatar from "@/components/Avatar";
import MascotaHero from "@/components/MascotaHero";
import { iconoDeTema } from "@/lib/ui/temas";
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
import PanelConceptos from "@/components/PanelConceptos";
import ModalConcepto from "@/components/ModalConcepto";
import TarjetaEnunciado from "@/components/TarjetaEnunciado";
import { detectarConceptos } from "@/lib/conceptos/glosario";
import { buscarConcepto } from "@/lib/conceptos";
import { extraerEscenaDeEnunciado } from "@/lib/fisica/escenaChoque";
import { PREGUNTAS_DIAGNOSTICO, calcularEstiloPredominante } from "@/lib/quiz/diagnostico";
import { reproducirSonidoCorrecto } from "@/lib/sonido";
import { guardarPerfilActivo, leerPerfilActivo, limpiarPerfilActivo } from "@/lib/identidad/perfilActivo";
import { guardarPreferencias, leerPreferencias } from "@/lib/identidad/preferencias";

// Líneas de ayuda de Paraguay que se muestran si el tutor detecta una señal
// de riesgo (campo `riesgo` del turno). ⚠️ Confirmar con la organización o
// el equipo docente antes de la demo que siguen vigentes.
const CONTACTOS_AYUDA = [
  { numero: "147", nombre: "Fono Ayuda — niñez y adolescencia (gratuito)" },
  { numero: "911", nombre: "Emergencias" },
];

// Al ELEGIR un perfil (forzarOnboarding) siempre se hace idioma → test de
// estilo de aprendizaje → ejercicio: el test es lo que adapta cómo explica
// el tutor, y el equipo quiere que se haga al entrar. Solo al RETOMAR (un
// refresh de página con el perfil ya abierto) se usan el idioma y el test
// recordados, para no repetirlos en medio de una sesión.
function estadoConPerfil(s, perfil, { forzarOnboarding = false } = {}) {
  const prefs = forzarOnboarding ? null : leerPreferencias(perfil.id);
  if (!prefs) {
    // Onboarding desde cero: nada del test de otro perfil puede arrastrarse.
    return {
      ...s,
      rolElegido: "alumno",
      perfilActivo: perfil,
      fase: "idioma",
      userLanguage: "",
      quizPasoActual: 0,
      quizCompleted: false,
      visualScore: 0,
      auditoryScore: 0,
      kinestheticScore: 0,
      learningLevel: "",
    };
  }
  return {
    ...s,
    rolElegido: "alumno",
    perfilActivo: perfil,
    userLanguage: prefs.userLanguage,
    learningLevel: prefs.learningLevel,
    quizCompleted: true,
    fase: "inicio",
  };
}

const EJEMPLO =
  "Un auto de 1200 kg viaja a 20 m/s sobre una pista horizontal sin fricción y choca de frente contra otro auto de 800 kg que se encuentra en reposo. Después del impacto, ambos quedan enganchados. ¿Cuál es la velocidad final del conjunto?";

// Lo que se ve en el chat (y recibe la IA en el historial) cuando el alumno
// toca "Mostrame este paso".
const TEXTO_PEDIR_AYUDA = "Mostrame este paso, por favor.";

const ESTADO_INICIAL = {
  fase: "rol", // retomando | rol | perfil | idioma | quiz | inicio | cargando | conversando | error
  rolElegido: "", // 'alumno' | 'docente' — elegido en PantallaRol
  perfilActivo: null, // perfil mock elegido en PantallaPerfil (sin login real)
  sesionTutorId: "", // id de la SesionTutor mock ligada a la conversación actual
  erroresSesion: 0, // total de intentos incorrectos en el problema actual (para XP)
  userLanguage: "", // 'jopara' | 'castellano' | 'guarani' — elegido en PantallaIdioma, bloquea el resto de la app
  quizPasoActual: 0,
  quizCompleted: false,
  visualScore: 0,
  auditoryScore: 0,
  kinestheticScore: 0,
  learningLevel: "", // 'visual' | 'auditor' | 'kinestesico', calculado al cerrar el test
  enunciado: "",
  historial: [], // [{ autor: 'estudiante' | 'tutor', texto, variableExplorable? }]
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
  ultimaFueAyuda: false, // el último turno fue "Mostrame este paso" (tarjeta neutra, no "Casi")
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
  // --- alcance (campos fueraDeTema / riesgo del turno) ---
  desviosSeguidos: 0, // turnos seguidos fuera de tema; a partir de 3 se muestra un banner amable
  mostrarAyudaRiesgo: false, // tarjeta con contactos de ayuda, hasta que el alumno la cierre
  ultimoPedido: null, // { tipo: "inicio" | "turno", args } — para "Reintentar" sin perder el problema
  escenaChoque: null, // { m1, v1, m2, v2, tipo } del ejercicio, para el simulador del panel "Conceptos"
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
  //
  // El store del server es solo en memoria: si se reinició (o, en
  // serverless, arrancó una instancia nueva), el perfil guardado acá ya no
  // existe allá y todo lo que dependa de él fallaría con "Perfil inválido".
  // Por eso se confirma contra el server antes de retomarlo; si no existe,
  // se olvida y se vuelve al selector de rol.
  useEffect(() => {
    const perfilGuardado = leerPerfilActivo();
    if (!perfilGuardado) return;
    if (perfilGuardado.rol === "docente") {
      router.push("/docente");
      return;
    }
    // Mientras se confirma se muestra "Cargando tu perfil..." en vez del
    // selector de rol: si no, el alumno podía empezar a elegir otro perfil
    // y la respuesta tardía (en `next dev` la primera compilación de la
    // ruta tarda segundos) lo sacaba de ahí a la fuerza.
    setEstado((s) => ({ ...s, fase: "retomando" }));
    let cancelado = false;
    fetch(`/api/progreso/${perfilGuardado.id}`)
      .then((res) => {
        if (res.status === 404) return null;
        return res.ok ? res.json().then((data) => data.perfil) : perfilGuardado;
      })
      // Sin conexión con el server no se puede confirmar: se retoma igual.
      .catch(() => perfilGuardado)
      .then((perfilVigente) => {
        if (cancelado) return;
        if (!perfilVigente) {
          limpiarPerfilActivo();
          setEstado((s) => (s.fase === "retomando" ? { ...s, fase: "rol" } : s));
          return;
        }
        setEstado((s) => (s.fase === "retomando" ? estadoConPerfil(s, perfilVigente) : s));
      });
    return () => {
      cancelado = true;
    };
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

  // Recuerda idioma + estilo de aprendizaje de este perfil (ver
  // lib/identidad/preferencias.js) una vez completado el onboarding.
  useEffect(() => {
    if (estado.perfilActivo && estado.quizCompleted && estado.userLanguage) {
      guardarPreferencias(estado.perfilActivo.id, {
        userLanguage: estado.userLanguage,
        learningLevel: estado.learningLevel,
      });
    }
  }, [estado.perfilActivo, estado.quizCompleted, estado.userLanguage, estado.learningLevel]);

  // Anima TutorPensando por etapas mientras se espera la respuesta del tutor.
  useEffect(() => {
    if (estado.fase !== "cargando") return;
    setEstado((s) => ({ ...s, etapaPensando: 0 }));
    const id = setInterval(() => {
      setEstado((s) => ({ ...s, etapaPensando: s.etapaPensando + 1 }));
    }, 800);
    return () => clearInterval(id);
  }, [estado.fase]);

  // Efecto aparte (no adentro del updater de setState, que debe quedar
  // puro): suena un "ding" cada vez que un paso nuevo se marca correcto.
  useEffect(() => {
    if (estado.ultimaCorrecta === true) reproducirSonidoCorrecto();
  }, [estado.ultimaCorrecta]);

  async function llamarTutor(payload) {
    // Sin conexión, fetch tira un TypeError genérico ("Failed to fetch"):
    // se reemplaza por un mensaje que el alumno entienda.
    const mensajeSinConexion = "Estás sin conexión a internet. Revisá tu señal y volvé a intentar.";
    if (typeof navigator !== "undefined" && navigator.onLine === false) throw new Error(mensajeSinConexion);
    let res;
    try {
      res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(mensajeSinConexion);
    }
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
    setEstado((s) => estadoConPerfil(s, perfil, { forzarOnboarding: true }));
  }

  // Olvida el perfil retomado y vuelve al selector de rol. Sin esto, la
  // única salida era Progreso → "Cerrar sesión", que no se ve durante el
  // onboarding.
  function cambiarPerfil() {
    limpiarPerfilActivo();
    setEstado(ESTADO_INICIAL);
  }

  // Si el test ya se hizo (ej. "Cambiar" idioma desde la pantalla de
  // inicio), no se repite: solo cambia el idioma.
  function seleccionarIdioma(userLanguage) {
    setEstado((s) => ({ ...s, userLanguage, fase: s.quizCompleted ? "inicio" : "quiz" }));
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
    setEstado((s) => ({
      ...s,
      fase: "cargando",
      error: "",
      ultimoPedido: { tipo: "inicio", args: { enunciadoPropio, temaSeleccionado, dificultadSeleccionada } },
    }));

    // La sesión de XP es secundaria: si falla (ej. el server se reinició y
    // ya no conoce este perfil), el alumno igual tiene que poder resolver
    // el problema — solo se queda sin sumar XP en este intento.
    const promesaSesion = iniciarSesionMock({
      alumnoId: estado.perfilActivo?.id,
      enunciado: enunciadoPropio || `Practicar: ${temaSeleccionado}`,
    }).catch((err) => {
      console.error("[gamificación] No se pudo iniciar la sesión de XP:", err);
      return null;
    });

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
        promesaSesion,
      ]);

      const enunciadoMostrado = enunciadoPropio || turno.enunciadoGenerado || `Practicar: ${temaSeleccionado}`;

      setEstado((s) => ({
        ...s,
        fase: "conversando",
        enunciado: enunciadoMostrado,
        sesionTutorId: sesion?.id || "",
        erroresSesion: 0,
        resultadoXp: null,
        historial: [
          { autor: "estudiante", texto: enunciadoMostrado },
          {
            autor: "tutor",
            texto: turno.mensaje,
            variableExplorable: turno.variableExplorable || null,
          },
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
        desviosSeguidos: turno.fueraDeTema ? 1 : 0,
        escenaChoque: turno.escenaChoque || null,
        mostrarAyudaRiesgo: Boolean(turno.riesgo),
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
      ultimoPedido: { tipo: "turno", args: { mensaje, pedirAyuda } },
      // El pedido de ayuda también queda como burbuja del alumno: así se ve
      // en el chat por qué el tutor muestra el paso, y en los turnos
      // siguientes la IA recibe ese contexto (antes veía dos mensajes
      // seguidos del tutor, sin el pedido en el medio).
      historial: [...s.historial, { autor: "estudiante", texto: pedirAyuda ? TEXTO_PEDIR_AYUDA : mensaje }],
      ultimaPista: "",
      ultimaCorrecta: null,
      ultimaFueAyuda: false,
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
      //
      // Solo un intento real equivocado cuenta como error (y corta la
      // racha): decir "estoy nervioso", "no sé", hacer una pregunta o
      // desviarse NO castiga el XP — la app se llama "sin miedo". Pedir
      // ayuda directa sí cuenta, porque el paso se reveló sin resolverlo.
      // Pedido de ayuda: el botón "Mostrar este paso" o escrito a mano
      // ("podés escribirme la fórmula", lo detecta el servidor).
      const fueAyuda = pedirAyuda || Boolean(turno.pedidoDeAyuda);
      const cuentaComoError = turno.correcta === false && (fueAyuda || turno.esIntento !== false);
      const erroresTotales = estado.erroresSesion + (cuentaComoError ? 1 : 0);
      const rachaTrasTurno = cuentaComoError ? 0 : turno.correcta === true ? estado.racha + 1 : estado.racha;

      setEstado((s) => {
        const nuevoHistorial = [
          ...s.historial,
          {
            autor: "tutor",
            texto: turno.mensaje,
            variableExplorable: turno.variableExplorable || null,
          },
        ];

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
          ultimaPista: turno.correcta === false && !fueAyuda ? turno.pista || "" : "",
          // Un turno que no fue intento (emoción, pregunta, desvío, pedido de
          // ayuda) queda neutro: no se pinta como respuesta incorrecta.
          ultimaCorrecta:
            turno.correcta === false && (fueAyuda || !cuentaComoError) ? null : turno.correcta ?? null,
          ultimaFueAyuda: fueAyuda,
          ultimaEsErrorFrecuente: turno.correcta === false && !fueAyuda && Boolean(turno.esErrorFrecuente),
          ultimaNormalizacion: turno.correcta === false && !fueAyuda ? turno.normalizacion || "" : "",
          proveedor: turno.proveedor,
          opcionesRespuesta: turno.opcionesRespuesta || [],
          requiereOpcion: Boolean(turno.requiereOpcion),
          opciones: turno.opciones || [],
          opcionEstado: {},
          pistaActual: turno.correcta === false && !fueAyuda ? turno.pista || null : null,
          racha: rachaTrasTurno,
          erroresSesion: erroresTotales,
          desviosSeguidos: turno.fueraDeTema ? s.desviosSeguidos + 1 : 0,
          mostrarAyudaRiesgo: s.mostrarAyudaRiesgo || Boolean(turno.riesgo),
        };
      });

      if (turno.completado && estado.sesionTutorId) {
        completarSesionMock({
          sesionId: estado.sesionTutorId,
          // El tema llega en el primer turno (los siguientes lo mandan vacío).
          temaDetectado: turno.tema || estado.tema,
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
      // Se saca la burbuja optimista del alumno: "Reintentar" la vuelve a
      // agregar, así no queda duplicada.
      setEstado((s) => ({ ...s, fase: "error", error: err.message, historial: s.historial.slice(0, -1) }));
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
  // Repite el último pedido que falló (ej. Gemini saturado) sin perder lo
  // que ya se resolvió del problema.
  function reintentar() {
    const pedido = estado.ultimoPedido;
    if (!pedido) return;
    if (pedido.tipo === "inicio") comenzarProblema(pedido.args);
    else enviarTurno(pedido.args);
  }

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

  const enConversacion = !["retomando", "rol", "perfil", "idioma", "quiz", "inicio"].includes(estado.fase);
  // El nav inferior solo se muestra fuera del "modo foco" de resolver un
  // problema (ahí ya hay una barra fija de input al pie — dos barras fijas
  // se pisarían) y nunca durante el onboarding.
  // "error" queda fuera a propósito: ahí la barra fija de input/reintento de
  // ConversacionTutor sigue mostrándose (para poder reintentar sin perder el
  // problema), y dos barras fijas al pie se pisarían.
  const mostrarNav = estado.fase === "inicio" || estado.completado;
  // Lo que el encabezado cuenta del Profe ("Pensando", "¡Bien ahí!"…).
  const estadoTutor =
    estado.fase === "cargando"
      ? "pensando"
      : enConversacion && estado.completado
        ? "resuelto"
        : enConversacion && estado.ultimaCorrecta === true
          ? "celebrando"
          : "listo";

  return (
    <>
      <Encabezado perfilActivo={estado.perfilActivo} claseActiva={claseActiva} estadoTutor={estadoTutor} />
      <main
        className={`flex-1 w-full ${estado.fase === "rol" ? "max-w-[1080px] sm:px-8" : "max-w-[680px]"} mx-auto px-4 pt-6 flex flex-col gap-5 ${
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

          {estado.fase === "retomando" && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center" role="status">
              <MascotaHero estado="pensando" size={96} />
              <p className="text-body-md text-on-surface-variant">Cargando tu perfil…</p>
            </div>
          )}

          {estado.fase === "idioma" && (
            <div className="flex flex-col gap-4">
              <AvisoPerfil perfil={estado.perfilActivo} onCambiar={cambiarPerfil} />
              <PantallaIdioma onSeleccionar={seleccionarIdioma} />
            </div>
          )}

          {estado.fase === "quiz" && (
            <PantallaQuizDiagnostico
              idioma={estado.userLanguage}
              indice={estado.quizPasoActual}
              onResponder={responderQuiz}
            />
          )}

          {estado.fase === "inicio" && (
            <PantallaInicio
              perfil={estado.perfilActivo}
              onCambiarPerfil={cambiarPerfil}
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
              onReintentar={reintentar}
              onAbrirSolucion={() => setEstado((s) => ({ ...s, mostrarSolucion: true }))}
              onCerrarSolucion={() => setEstado((s) => ({ ...s, mostrarSolucion: false }))}
              onCerrarAyudaRiesgo={() => setEstado((s) => ({ ...s, mostrarAyudaRiesgo: false }))}
              finalChatRef={finalChatRef}
            />
          )}
        </div>
      </main>
      {mostrarNav && estado.perfilActivo && <NavegacionInferior />}
    </>
  );
}

// "Entraste como X · Cambiar perfil": como el perfil se retoma solo desde
// localStorage, sin esto la única salida era Progreso → "Cerrar sesión".
function AvisoPerfil({ perfil, onCambiar }) {
  if (!perfil) return null;
  return (
    <div className="flex items-center justify-between gap-2 pl-1.5 pr-1 py-1 rounded-full bg-surface-container-lowest border border-surface-container-high shadow-elevation-1 self-start max-w-full">
      <span className="flex items-center gap-2 min-w-0 text-body-sm text-on-surface-variant">
        <Avatar nombre={perfil.nombre} size={28} />
        <span className="truncate">
          <strong className="text-on-surface">{perfil.nombre}</strong>
        </span>
      </span>
      <button
        type="button"
        onClick={onCambiar}
        className="min-h-[36px] inline-flex items-center gap-1 px-3 rounded-full text-label-md font-semibold text-secondary hover:bg-secondary-fixed flex-shrink-0 active:scale-[0.98] transition-all duration-200"
      >
        <Icono nombre="switch_account" size={16} />
        Cambiar
      </button>
    </div>
  );
}

const ETIQUETA_IDIOMA = { jopara: "Jopara", castellano: "Castellano", guarani: "Guaraní" };

function saludoSegunHora() {
  const hora = new Date().getHours();
  if (hora < 12) return "¡Buen día";
  if (hora < 19) return "¡Buenas tardes";
  return "¡Buenas noches";
}

function PantallaInicio({ perfil, onCambiarPerfil, inputEnunciado, setInputEnunciado, idioma, onCambiarIdioma, onIniciar, onIniciarConTema }) {
  const [modo, setModo] = useState("propio"); // "propio" | "tema"
  // Se calcula una sola vez al montar: el saludo depende de la hora local
  // (esta pantalla solo se monta en el cliente, después del onboarding).
  const [saludo] = useState(saludoSegunHora);
  const primerNombre = perfil?.nombre?.split(" ")[0] || "";

  return (
    <div className="escalonado flex flex-col gap-5">
      {/* Saludo + perfil + idioma en una franja compacta: antes eran tres
          bloques de texto que empujaban el formulario debajo del pliegue. */}
      <section className="flex items-center gap-4">
        <MascotaHero size={76} className="flex-shrink-0 -ml-1" />
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-[28px] sm:text-[32px] leading-[1.1] font-bold tracking-tight">
            {saludo}
            {primerNombre ? `, ${primerNombre}` : ""}!
          </h1>
          <p className="text-on-surface-variant text-body-md leading-snug">¿Qué problema de física resolvemos hoy?</p>
        </div>
      </section>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <AvisoPerfil perfil={perfil} onCambiar={onCambiarPerfil} />
        <button
          type="button"
          onClick={onCambiarIdioma}
          className="min-h-[36px] inline-flex items-center gap-1.5 pl-3 pr-2 rounded-full bg-surface-container-lowest border border-surface-container-high shadow-elevation-1 text-label-md text-on-surface-variant hover:text-on-surface active:scale-[0.98] transition-all duration-200"
          aria-label={`Idioma: ${ETIQUETA_IDIOMA[idioma] || idioma}. Cambiar idioma`}
        >
          <Icono nombre="translate" size={16} className="text-primary" />
          <strong className="text-on-surface font-semibold">{ETIQUETA_IDIOMA[idioma] || idioma}</strong>
          <Icono nombre="expand_more" size={16} />
        </button>
      </div>

      <div className="relative grid grid-cols-2 p-1 rounded-full bg-surface-container" role="tablist" aria-label="Cómo querés practicar">
        {/* Indicador que se desliza entre las dos pestañas */}
        <span
          aria-hidden="true"
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-primary-fixed shadow-elevation-1 transition-transform duration-300 ease-out ${
            modo === "tema" ? "translate-x-full" : ""
          }`}
        />
        {[
          { valor: "propio", icono: "edit_note", texto: "Mi problema" },
          { valor: "tema", icono: "auto_awesome", texto: "Elegir un tema" },
        ].map((t) => (
          <button
            key={t.valor}
            type="button"
            role="tab"
            aria-selected={modo === t.valor}
            onClick={() => setModo(t.valor)}
            className={`relative z-[1] min-h-[44px] rounded-full text-body-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 ${
              modo === t.valor ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icono nombre={t.icono} size={18} />
            {t.texto}
          </button>
        ))}
      </div>

      {modo === "propio" ? (
        <form
          key="propio"
          onSubmit={onIniciar}
          className="mensaje-nuevo flex flex-col gap-3 bg-surface-container-lowest rounded-3xl p-4 sm:p-5 shadow-elevation-2 border border-surface-container-high"
        >
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="enunciado" className="text-title-md font-semibold text-on-surface">
              Pegá o escribí el enunciado
            </label>
            <button
              type="button"
              aria-label="Cargar enunciado de ejemplo"
              className="min-h-[36px] inline-flex items-center gap-1 px-3 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-md font-semibold flex-shrink-0 active:scale-[0.98] transition-all duration-200"
              onClick={() => setInputEnunciado(EJEMPLO)}
            >
              <Icono nombre="lightbulb" size={15} />
              Ver un ejemplo
            </button>
          </div>
          <textarea
            id="enunciado"
            rows={4}
            value={inputEnunciado}
            onChange={(e) => setInputEnunciado(e.target.value)}
            onKeyDown={(e) => {
              // Ctrl/⌘ + Enter envía, para quien usa teclado.
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onIniciar(e);
            }}
            placeholder="Ej.: Un auto de 1200 kg viaja a 20 m/s y choca contra otro que está quieto…"
            className="w-full p-4 rounded-2xl bg-surface-container-low border-2 border-transparent text-on-surface placeholder:text-outline outline-none focus:border-primary/40 focus:bg-surface-container-lowest transition-all resize-none text-body-lg leading-relaxed"
          />

          <button
            type="submit"
            disabled={!inputEnunciado.trim()}
            className="boton-degradado min-h-[56px] rounded-full text-title-md font-semibold active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Empezar paso a paso
            <Icono nombre="arrow_forward" size={22} />
          </button>
          <p className="flex items-start gap-2 text-body-sm text-on-surface-variant leading-snug px-1">
            <Icono nombre="psychology" size={18} className="text-tertiary flex-shrink-0" />
            <span>
              <strong className="text-on-surface">No te doy todo resuelto.</strong> Vas a intentar cada paso vos; si te
              trabás, pedime ayuda cuando quieras.
            </span>
          </p>
        </form>
      ) : (
        <SelectorTemaPractica key="tema" onIniciarConTema={onIniciarConTema} />
      )}
    </div>
  );
}

const ETIQUETA_DIFICULTAD = { facil: "Fácil", medio: "Medio", dificil: "Difícil" };
const ICONO_DIFICULTAD = { facil: "signal_cellular_1_bar", medio: "signal_cellular_3_bar", dificil: "signal_cellular_4_bar" };
// Etiqueta de dificultad sugerida en cada tarjeta de tema (idea de las
// etiquetas "Nuevo"/"Gratis" de midu.dev).
const COLOR_DIFICULTAD = {
  facil: "bg-tertiary-fixed text-on-tertiary-fixed",
  medio: "bg-secondary-fixed text-on-secondary-fixed",
  dificil: "bg-error-container text-on-error-container",
};

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

  return (
    <div className="mensaje-nuevo flex flex-col gap-4 bg-surface-container-lowest rounded-3xl p-4 sm:p-5 shadow-elevation-2 border border-surface-container-high">
      <span className="text-title-md font-semibold text-on-surface">Elegí un tema y te armo un problema</span>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Tema">
        {cargando &&
          Array.from({ length: 5 }).map((_, i) => <span key={i} className="h-[120px] rounded-2xl esqueleto" aria-hidden="true" />)}
        {temas.map((tema) => {
          const elegido = temaElegido?.id === tema.id;
          return (
            <button
              key={tema.id}
              type="button"
              role="radio"
              aria-checked={elegido}
              onClick={() => {
                setTemaElegido(tema);
                // Arranca en la dificultad que sugiere el tema (antes siempre "Medio").
                if (ETIQUETA_DIFICULTAD[tema.dificultadSugerida]) setDificultad(tema.dificultadSugerida);
              }}
              className={`tarjeta-interactiva relative min-h-[120px] p-3 rounded-2xl border-2 text-left flex flex-col gap-2 ${
                elegido
                  ? "border-primary bg-primary-fixed text-on-primary-fixed shadow-elevation-2"
                  : "border-surface-container-high bg-surface-container-low text-on-surface"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  elegido ? "boton-degradado" : "bg-surface-container-lowest text-primary shadow-elevation-1"
                }`}
              >
                <Icono nombre={iconoDeTema(tema.titulo)} size={20} />
              </span>
              <span className="text-body-sm font-semibold leading-tight">{tema.titulo}</span>
              <span className="mt-auto flex flex-wrap gap-1">
                {ETIQUETA_DIFICULTAD[tema.dificultadSugerida] && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${COLOR_DIFICULTAD[tema.dificultadSugerida]}`}>
                    {ETIQUETA_DIFICULTAD[tema.dificultadSugerida]}
                  </span>
                )}
                {buscarConcepto({ tema: tema.titulo }) && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-primary-fixed text-on-primary-fixed">
                    <Icono nombre="science" size={11} />
                    Con simulador
                  </span>
                )}
              </span>
              {elegido && <Icono nombre="check_circle" size={20} className="absolute top-2.5 right-2.5 text-primary" />}
            </button>
          );
        })}
      </div>

      {temaElegido && (
        <div className="mensaje-nuevo flex flex-col gap-3">
          {temaElegido.descripcion && <p className="text-body-sm text-on-surface-variant">{temaElegido.descripcion}</p>}
          <div className="flex flex-col gap-1.5">
            <span className="text-label-md font-semibold text-on-surface-variant">Dificultad</span>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-surface-container" role="radiogroup" aria-label="Dificultad">
              {Object.entries(ETIQUETA_DIFICULTAD).map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={dificultad === valor}
                  onClick={() => setDificultad(valor)}
                  className={`min-h-[40px] rounded-full text-body-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1 ${
                    dificultad === valor ? "bg-primary-fixed text-primary shadow-elevation-1" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Icono nombre={ICONO_DIFICULTAD[valor]} size={16} />
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onIniciarConTema({ tema: temaElegido.titulo, dificultad })}
            className="boton-degradado min-h-[56px] rounded-full text-title-md font-semibold active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Icono nombre="auto_awesome" size={22} />
            Armame un problema
          </button>
        </div>
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
  onReintentar,
  onAbrirSolucion,
  onCerrarSolucion,
  onCerrarAyudaRiesgo,
  finalChatRef,
}) {
  const { fase, tema, datos, incognita, pasoActual, totalPasosEstimados, completado } = estado;
  const cargando = fase === "cargando";
  const modoQuiz = !completado && estado.requiereOpcion && estado.opciones.length > 0;
  const ultimoMensajeEsTutor = estado.historial[estado.historial.length - 1]?.autor === "tutor";
  const estadoTurnoActivo =
    estado.ultimaFueAyuda
      ? "ayuda"
      : estado.ultimaCorrecta === true
        ? "correcta"
        : estado.ultimaCorrecta === false
          ? "incorrecta"
          : "nueva";
  const [mostrarTeclado, setMostrarTeclado] = useState(false);
  // Material de conceptos del tema (lib/conceptos): solo si hay uno cargado
  // para el tema o el enunciado de este ejercicio.
  const concepto = buscarConcepto({ tema, enunciado: estado.enunciado });
  // Datos del choque de ESTE ejercicio (de la IA en el primer turno, o leídos
  // del enunciado si el ejercicio empezó antes de que existiera el campo).
  const escenaChoque = estado.escenaChoque || extraerEscenaDeEnunciado(estado.enunciado);
  // false (cerrado) o la pestaña con la que se abre el panel ("accion", "conceptos"…).
  const [mostrarConceptos, setMostrarConceptos] = useState(false);
  // Id del concepto (lib/conceptos/glosario.js) abierto desde un chip "Repasar".
  const [conceptoAbierto, setConceptoAbierto] = useState(null);

  function insertarFormula(latexConDolares) {
    setInputRespuesta((prev) => (prev ? `${prev} ${latexConDolares}` : latexConDolares));
    setMostrarTeclado(false);
  }

  // Primer turno en camino: todavía no hay enunciado ni datos que mostrar.
  // Antes se veía una tarjeta vacía (parecía roto); ahora el profe "piensa".
  if (cargando && estado.historial.length === 0) {
    return (
      <section className="flex flex-col items-center gap-5 py-12 text-center" role="status">
        <MascotaHero estado="pensando" size={112} />
        <div className="flex flex-col gap-1">
          <p className="text-title-lg font-semibold">Preparando tu problema…</p>
          <p className="text-body-sm text-on-surface-variant">Leo el enunciado y lo parto en pasos cortos para vos.</p>
        </div>
        <TutorPensando etapa={estado.etapaPensando} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 bg-surface-container-lowest rounded-3xl p-4 sm:p-5 shadow-elevation-2 border border-surface-container-high">
        {/* Enunciado arriba (antes no se veía durante el ejercicio) y debajo
            los datos, la incógnita y el progreso. */}
        <TarjetaEnunciado
          enunciado={estado.enunciado}
          tema={tema}
          accion={
            concepto && (
              <button
                type="button"
                onClick={() => setMostrarConceptos("accion")}
                className="concepto-disponible min-h-[40px] px-3.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-md font-semibold shadow-elevation-1 flex items-center gap-1.5 active:scale-[0.98] transition-all duration-200"
              >
                <Icono nombre="auto_stories" size={18} />
                Conceptos
              </button>
            )
          }
        />

        {mostrarConceptos && concepto && (
          <PanelConceptos
            concepto={concepto}
            escena={escenaChoque}
            enunciado={estado.enunciado}
            ejercicioTerminado={completado}
            pestanaInicial={typeof mostrarConceptos === "string" ? mostrarConceptos : "accion"}
            onCerrar={() => setMostrarConceptos(false)}
          />
        )}

        {conceptoAbierto && (
          <ModalConcepto
            id={conceptoAbierto}
            escena={escenaChoque}
            enunciado={estado.enunciado}
            ejercicioTerminado={completado}
            onCerrar={() => setConceptoAbierto(null)}
            onAbrirPanel={(pestana) => {
              setConceptoAbierto(null);
              setMostrarConceptos(pestana);
            }}
          />
        )}

        {Array.isArray(datos) && datos.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-label-sm font-mono uppercase tracking-wider text-on-surface-variant font-semibold">Datos del ejercicio</span>
            <div className="grid grid-cols-2 gap-2">
              {datos.map((d, i) => (
                <ChipDato key={i} etiqueta={d.etiqueta} valor={d.valor} />
              ))}
            </div>
          </div>
        )}

        {incognita && (
          <div className="p-3 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-between gap-2 border border-primary/15">
            <span className="flex items-center gap-1.5 font-semibold text-body-sm">
              <Icono nombre="search" size={18} />
              Incógnita
            </span>
            <span className="font-mono font-bold text-body-sm text-right">
              <RenderizadorMatematico texto={incognita} />
            </span>
          </div>
        )}

        <IndicadorProgreso pasoActual={pasoActual} totalPasos={totalPasosEstimados} racha={estado.racha} />
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
              variableExplorable={turno.variableExplorable}
              conceptos={concepto && turno.autor === "tutor" ? detectarConceptos(turno.texto) : []}
              onAbrirConcepto={setConceptoAbierto}
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
              <strong>No sos el único/a:</strong> <RenderizadorMatematico texto={estado.ultimaNormalizacion} />
            </p>
          </div>
        )}

        {/* Señal de riesgo: el tutor ya responde con calidez en su mensaje;
            esto suma contactos concretos, sin bloquear el chat. */}
        {estado.mostrarAyudaRiesgo && (
          <div role="alert" className="mensaje-nuevo flex flex-col gap-2 p-4 rounded-2xl bg-secondary-fixed text-on-secondary-fixed text-body-sm shadow-elevation-2">
            <div className="flex items-start gap-2">
              <Icono nombre="favorite" size={20} className="flex-shrink-0 mt-0.5" />
              <p>
                <strong>No estás solo/a.</strong> Si estás pasando por algo difícil, hablalo hoy con un adulto de confianza:
                tu familia, un profe o el orientador/a del colegio. También podés llamar gratis:
              </p>
            </div>
            <ul className="flex flex-col gap-1 pl-7">
              {CONTACTOS_AYUDA.map((c) => (
                <li key={c.numero}>
                  <a href={`tel:${c.numero}`} className="font-mono font-bold underline underline-offset-2">
                    {c.numero}
                  </a>{" "}
                  · {c.nombre}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onCerrarAyudaRiesgo}
              className="self-end min-h-[44px] px-3 rounded-full text-body-sm font-semibold hover:bg-black/5 active:scale-[0.98] transition-all duration-200"
            >
              Cerrar
            </button>
          </div>
        )}

        {!cargando && !completado && estado.desviosSeguidos >= 3 && (
          <div className="mensaje-nuevo flex items-center gap-2 p-3 rounded-xl bg-primary-fixed text-on-primary-fixed text-body-sm shadow-elevation-1">
            <Icono nombre="sports_score" size={18} className="flex-shrink-0" />
            <p>¿Volvemos al problema? 💪 Ya vas por el paso {pasoActual}, ¡te falta poco!</p>
          </div>
        )}
        <div ref={finalChatRef} />
      </div>

      {estado.pasosCerrados.length > 0 && (
        <button
          type="button"
          onClick={onAbrirSolucion}
          className="tarjeta-interactiva min-h-[48px] rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-1 px-4 flex items-center gap-2 text-body-sm font-semibold text-on-surface"
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
          <div className="superficie-marca relative overflow-hidden rounded-3xl p-6 pt-5 flex flex-col items-center gap-2 text-center shadow-elevation-3">
            <div className="cuadricula absolute inset-0 opacity-60 pointer-events-none" aria-hidden="true" />
            <MascotaHero estado="celebrando" size={104} className="relative" />
            <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 font-semibold text-label-md uppercase tracking-wider">
              <Icono nombre="check_circle" size={16} />
              ¡Lo resolviste!
            </span>
            <span className="relative font-mono font-bold text-[40px] leading-tight break-words max-w-full">
              <RenderizadorMatematico texto={estado.resultadoFinal.valor} /> {estado.resultadoFinal.unidad || ""}
            </span>
            {estado.pasosCerrados.length > 0 && (
              <span className="relative text-body-sm opacity-85">
                {estado.pasosCerrados.length === 1 ? "1 paso confirmado" : `${estado.pasosCerrados.length} pasos confirmados`}
                {estado.erroresSesion === 0 ? " · ¡sin errores!" : ""}
              </span>
            )}
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
            className="boton-degradado min-h-[56px] rounded-full text-title-md font-semibold active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Icono nombre="add" size={22} />
            Resolver otro problema
          </button>
        </div>
      )}

      {fase === "error" && (
        <div className="rounded-2xl bg-error-container text-on-error-container p-4 text-body-sm flex flex-col gap-3 shadow-elevation-1">
          <div className="flex items-start gap-2">
            <Icono nombre="error" size={20} className="flex-shrink-0 mt-0.5" />
            <p>
              <strong>No se pudo avanzar:</strong> {estado.error}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Reintentar repite el último pedido sin perder el problema;
                "Volver a empezar" es la salida siempre disponible (sin ella,
                si fallaba el primer turno el alumno quedaba en un chat vacío). */}
            {estado.ultimoPedido && (
              <button
                type="button"
                onClick={onReintentar}
                className="boton-degradado min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-full font-semibold shadow-elevation-1 active:scale-[0.98] transition-all duration-200"
              >
                <Icono nombre="refresh" size={18} />
                Reintentar
              </button>
            )}
            <button
              type="button"
              onClick={onReiniciar}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-full bg-surface-container-lowest text-on-surface font-semibold shadow-elevation-1 active:scale-[0.98] transition-all duration-200"
            >
              <Icono nombre="arrow_back" size={18} />
              Volver a empezar
            </button>
          </div>
        </div>
      )}

      {/* Sin historial (falló el primer turno) no hay un paso que responder:
          solo queda el botón de volver de arriba. */}
      {!completado && estado.historial.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-10 bg-surface/90 backdrop-blur-xl border-t border-surface-container-high/70 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom,0px)]">
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
              <form onSubmit={onResponder} className="flex items-center gap-2 bg-surface-container-lowest rounded-full shadow-elevation-2 border border-surface-container-high p-1.5 pl-2 focus-within:border-primary/40 transition-colors">
                <input
                  type="text"
                  value={inputRespuesta}
                  onChange={(e) => setInputRespuesta(e.target.value)}
                  placeholder="Escribí tu intento para este paso..."
                  disabled={cargando}
                  autoFocus
                  className="flex-1 min-w-0 px-3 py-2.5 bg-transparent text-on-surface placeholder:text-outline outline-none disabled:opacity-60 text-body-lg"
                />
                <button
                  type="submit"
                  disabled={cargando || !inputRespuesta.trim()}
                  aria-label="Enviar mi respuesta"
                  className="boton-degradado min-w-[48px] min-h-[48px] rounded-full disabled:opacity-50 active:scale-[0.95] transition-all duration-200 flex items-center justify-center flex-shrink-0"
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
