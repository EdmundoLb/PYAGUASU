import { avanzarTurnoConGemini } from './providers/gemini';
import { avanzarTurnoConClaude } from './providers/claude';
import { verificarCalculo } from './verificacion';
import { repararEscapesEnObjeto } from '../latex/escapes';
import { esCierrePrematuro, anularCierre } from './cierre';
import { corregirVocabulario } from './vocabulario';
import { esPedidoDeAyudaExplicito } from './pedidos';
import { sanearEscena, extraerEscenaDeEnunciado } from '../fisica/escenaChoque';
import {
  esFalsoIncorrecto,
  valorCorrectoDelPaso,
  quitarRespuestaDeSugerencias,
  avanzoSinUnidad,
  reveloResultado,
  estaPidiendoUnidad,
  opcionesDeUnidad,
} from './evaluacion';
import {
  construirMensajeInicial,
  construirMensajeEstudiante,
  construirMensajeCorreccionEvaluacion,
  construirMensajeCorreccionUnidad,
  MENSAJE_CORRECCION_CALCULO,
  MENSAJE_CORRECCION_REVELACION,
} from './prompt';

// Defensa en profundidad: aunque el schema ya restringe "icono" a un enum,
// un proveedor podría no cumplirlo al 100% — un ícono desconocido se
// renderiza como texto literal roto, así que filtramos antes de mandarlo
// al frontend.
const TENDENCIAS_VALIDAS = ['directa', 'inversa'];

// Defensa en profundidad: un rango roto
// (min >= max, o el valor actual afuera del rango) haría que el slider del
// frontend no tenga sentido — mejor no mostrar nada a mostrar algo inválido.
function sanearVariableExplorable(variable) {
  if (!variable || typeof variable !== 'object') return null;
  const { etiqueta, valorActual, valorMin, valorMax, tendencia } = variable;
  if (!etiqueta || !TENDENCIAS_VALIDAS.includes(tendencia)) return null;
  if (
    typeof valorActual !== 'number' ||
    typeof valorMin !== 'number' ||
    typeof valorMax !== 'number' ||
    valorMin >= valorMax ||
    valorActual < valorMin ||
    valorActual > valorMax
  ) {
    return null;
  }
  return variable;
}

// Las marcas internas del prompt ([GENERAR_PROBLEMA], [AYUDA_DIRECTA],
// [SISTEMA_INTERNO]) nunca deberían llegar al estudiante — el prompt ya lo
// prohíbe, pero en una prueba real el modelo igual escribió
// "ejerure chéve [GENERAR_PROBLEMA]". Se filtran de todo texto visible.
const PATRON_MARCA_INTERNA = /\s*\[(?:GENERAR_PROBLEMA|AYUDA_DIRECTA|SISTEMA_INTERNO)\]/g;

// Además de las marcas, aplica las correcciones de vocabulario jopara
// (ver vocabulario.js) a cada texto visible.
function limpiarMarcas(texto) {
  return typeof texto === 'string' ? corregirVocabulario(texto.replace(PATRON_MARCA_INTERNA, '').trim()) : texto;
}

const CAMPOS_TEXTO_VISIBLE = ['mensaje', 'pista', 'normalizacion', 'analogiaCotidiana', 'enunciadoGenerado', 'formula'];

function limpiarMarcasDelTurno(turno) {
  const limpio = { ...turno };
  for (const campo of CAMPOS_TEXTO_VISIBLE) limpio[campo] = limpiarMarcas(limpio[campo]);
  if (Array.isArray(limpio.opcionesRespuesta)) {
    limpio.opcionesRespuesta = limpio.opcionesRespuesta.map(limpiarMarcas).filter(Boolean);
  }
  if (Array.isArray(limpio.opciones)) {
    limpio.opciones = limpio.opciones.map((o) => (o ? { ...o, texto: limpiarMarcas(o.texto) } : o));
  }
  return limpio;
}

// AI_PROVIDER en .env.local decide qué modelo se usa, sin tocar código.
function elegirProveedor() {
  const configurado = process.env.AI_PROVIDER;
  if (configurado === 'gemini' || configurado === 'claude') return configurado;

  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'claude';

  throw new Error(
    'No hay ninguna API key configurada. Agregá GEMINI_API_KEY o ANTHROPIC_API_KEY en .env.local'
  );
}

// Avanza UN turno de la conversación tutor↔estudiante.
//
// - Primer turno de un problema nuevo: esInicial=true, enunciado=texto del
//   problema, historial=[].
// - Turnos siguientes: esInicial=false, mensaje=intento de respuesta del
//   estudiante al paso actual, historial=todos los turnos previos
//   ({ autor: 'estudiante' | 'tutor', texto }), pedirAyuda=true si el
//   estudiante pidió ver la respuesta de ese paso directamente.
export async function avanzarTurno({
  historial = [],
  idioma = 'jopara',
  materia = 'Física',
  esInicial = false,
  enunciado = '',
  mensaje = '',
  pedirAyuda = false,
  learningLevel = '',
}) {
  if (esInicial && !enunciado.trim()) {
    throw new Error('El enunciado del problema está vacío.');
  }
  if (!esInicial && !pedirAyuda && !mensaje.trim()) {
    throw new Error('Falta la respuesta del estudiante.');
  }

  // "Podés escribirme la fórmula" escrito a mano = tocar "Mostrame este
  // paso" (ver pedidos.js): el modelo recibe [AYUDA_DIRECTA] + el texto.
  const pedidoDeAyuda = !esInicial && !pedirAyuda && esPedidoDeAyudaExplicito(mensaje);
  if (pedidoDeAyuda) pedirAyuda = true;

  const proveedor = elegirProveedor();
  const avanzarPrincipal = proveedor === 'claude' ? avanzarTurnoConClaude : avanzarTurnoConGemini;
  // Respaldo entre proveedores: si el principal falla (ej. Gemini saturado
  // con 503) y hay key del otro proveedor, se usa ese en vez de mostrarle
  // un error al alumno.
  const avanzarRespaldo =
    proveedor === 'gemini' && process.env.ANTHROPIC_API_KEY
      ? avanzarTurnoConClaude
      : proveedor === 'claude' && process.env.GEMINI_API_KEY
        ? avanzarTurnoConGemini
        : null;
  const avanzarConProveedor = async (args) => {
    try {
      return await avanzarPrincipal(args);
    } catch (error) {
      if (!avanzarRespaldo) throw error;
      console.warn(`[ia] ${proveedor} falló (${error.message?.slice(0, 120)}); usando el otro proveedor.`);
      return avanzarRespaldo(args);
    }
  };
  // Toda respuesta del modelo pasa por la reparación de LaTeX (ver
  // lib/latex/escapes.js), incluido el reintento de corrección de abajo.
  const avanzar = async (args) => repararEscapesEnObjeto(await avanzarConProveedor(args));

  let turno = await avanzar({ historial, idioma, materia, esInicial, enunciado, mensaje, pedirAyuda, learningLevel });

  // Pide UNA corrección silenciosa: se le muestra al modelo su propio turno
  // fallido seguido de un mensaje [SISTEMA_INTERNO], antes de mostrarle nada
  // al estudiante — nunca se expone el intento fallido ni el mensaje interno
  // en el chat real. Devuelve null si el reintento falla.
  async function pedirCorreccion(turnoFallido, mensajeInterno, etiqueta) {
    try {
      const mensajeEstudianteOriginal = esInicial
        ? construirMensajeInicial({ enunciado })
        : construirMensajeEstudiante({ texto: mensaje, pedirAyuda });
      return await avanzar({
        historial: [
          ...historial,
          { autor: 'estudiante', texto: mensajeEstudianteOriginal },
          { autor: 'tutor', texto: turnoFallido.mensaje },
        ],
        idioma,
        materia,
        esInicial: false,
        enunciado: '',
        mensaje: mensajeInterno,
        pedirAyuda: false,
        learningLevel,
      });
    } catch (error) {
      console.error(`[${etiqueta}] Falló el reintento de corrección:`, error);
      return null;
    }
  }

  // Verificación aritmética: el modelo puede "razonar bien" y aun así fallar
  // una cuenta simple. Se recalcula de verdad con mathjs (verificacion.js).
  const chequeo = turno.verificacion ? verificarCalculo(turno.verificacion) : null;
  if (chequeo?.verificable && !chequeo.ok) {
    console.warn(
      `[verificación matemática] "${turno.verificacion.expresion}" = ${turno.verificacion.resultado} según el modelo, pero da ${chequeo.valorCalculado}. Reintentando corrección...`
    );
    const turnoCorregido = await pedirCorreccion(turno, MENSAJE_CORRECCION_CALCULO, 'verificación matemática');
    const chequeo2 = turnoCorregido?.verificacion ? verificarCalculo(turnoCorregido.verificacion) : null;
    if (turnoCorregido && (!chequeo2?.verificable || chequeo2.ok)) {
      turno = turnoCorregido;
    } else if (turnoCorregido) {
      console.error('[verificación matemática] El reintento de corrección también falló matemáticamente; se muestra igual.');
    }
  }

  // Falso "incorrecto" (ver evaluacion.js): el estudiante dio el valor
  // correcto del paso y el modelo igual le dijo "¡Casi!". Se le pide que
  // reevalúe; solo se usa la corrección si ahora sí lo marca correcto.
  if (esFalsoIncorrecto({ turno, mensaje, pedirAyuda })) {
    const correcto = valorCorrectoDelPaso(turno);
    console.warn(
      `[evaluación] "${mensaje}" coincide con el valor correcto del paso (${correcto}) pero el modelo lo marcó incorrecto. Reintentando...`
    );
    const turnoCorregido = await pedirCorreccion(
      turno,
      construirMensajeCorreccionEvaluacion({ respuestaEstudiante: mensaje, valorCorrecto: correcto }),
      'evaluación'
    );
    if (turnoCorregido?.correcta === true) {
      turno = turnoCorregido;
    } else if (turnoCorregido) {
      console.error('[evaluación] El reintento siguió marcándolo incorrecto; se muestra el turno original.');
    }
  }

  // Número correcto SIN unidad y el modelo igual avanzó de paso (ver
  // evaluacion.js): se le pide que no avance y pida la unidad. Solo se usa
  // la corrección si efectivamente no avanzó.
  if (avanzoSinUnidad({ turno, mensaje, pedirAyuda })) {
    const unidad = turno.verificacionRespuesta.unidad.trim();
    console.warn(`[unidades] "${mensaje}" sin unidad (${unidad}) y el modelo avanzó igual. Reintentando...`);
    const turnoCorregido = await pedirCorreccion(
      turno,
      construirMensajeCorreccionUnidad({ respuestaEstudiante: mensaje, unidad }),
      'unidades'
    );
    if (turnoCorregido && turnoCorregido.correcta !== true && !turnoCorregido.completado) {
      turno = { ...turnoCorregido, esIntento: false };
    } else if (turnoCorregido) {
      console.error('[unidades] El reintento volvió a avanzar sin unidad; se muestra el turno original.');
    }
  }

  // Intento fallido pero el tutor reveló el resultado del paso (ver
  // evaluacion.js): se le pide que lo rehaga como pista. Solo se usa la
  // corrección si ya no revela el resultado.
  if (reveloResultado({ turno, mensaje, historial, pedirAyuda })) {
    console.warn(`[escalera de pistas] "${mensaje}" fue incorrecto y el tutor reveló el resultado (${valorCorrectoDelPaso(turno)}). Reintentando...`);
    const turnoCorregido = await pedirCorreccion(turno, MENSAJE_CORRECCION_REVELACION, 'escalera de pistas');
    const sigueRevelando = turnoCorregido && reveloResultado({ turno: { ...turnoCorregido, verificacionRespuesta: turno.verificacionRespuesta }, mensaje, historial, pedirAyuda });
    if (turnoCorregido && turnoCorregido.correcta === false && !sigueRevelando) {
      turno = { ...turnoCorregido, verificacionRespuesta: turno.verificacionRespuesta };
    } else if (turnoCorregido) {
      console.error('[escalera de pistas] El reintento volvió a revelar el resultado; se muestra el turno original.');
    }
  }

  // Una fórmula "confirmada" solo corresponde a un paso cerrado (acierto o
  // "Mostrame este paso"): en un intento fallido no se agrega a "Ver fórmulas
  // confirmadas", donde quedaría a la vista la cuenta resuelta.
  if (turno.correcta === false && !pedirAyuda && turno.formula) {
    turno = { ...turno, formula: '' };
  }

  // Pidiendo la unidad: si el modelo no ofreció opciones para tocar, se
  // arman desde la unidad del paso (la correcta + distractores).
  if (estaPidiendoUnidad({ turno, mensaje, pedirAyuda }) && (!Array.isArray(turno.opcionesRespuesta) || turno.opcionesRespuesta.length < 2)) {
    turno = { ...turno, opcionesRespuesta: opcionesDeUnidad(turno.verificacionRespuesta.unidad.trim()) };
  }

  // Si sigue en el mismo paso, las sugerencias no pueden regalar la respuesta.
  turno = quitarRespuestaDeSugerencias(turno);

  // Cierre prematuro (ver cierre.js): el modelo dio el resultado final sin
  // que el estudiante haya hecho el último cálculo. Se anula el cierre y
  // queda el mensaje, que ya le pide ese cálculo.
  if (esCierrePrematuro({ turno, historial, mensaje, pedirAyuda })) {
    console.warn(
      `[cierre prematuro] resultado ${turno.resultadoFinal?.valor} sin que el estudiante lo haya calculado; se anula el cierre.`
    );
    turno = anularCierre(turno);
  }

  // Datos del choque para el simulador del panel "Conceptos" (solo primer
  // turno): lo que dijo la IA, validado contra el enunciado, o si no, lo que
  // se lee del enunciado directamente (ver lib/fisica/escenaChoque.js).
  let escenaChoque = null;
  if (esInicial) {
    const textoEnunciado = turno.enunciadoGenerado || enunciado;
    escenaChoque = sanearEscena(turno.escenaChoque, textoEnunciado) || extraerEscenaDeEnunciado(textoEnunciado);
  }

  // Defaults explícitos para los campos de interactividad opcional: el
  // modelo puede omitirlos, y el frontend no debería tener que adivinar.
  turno = limpiarMarcasDelTurno(turno);

  return {
    ...turno,
    fueraDeTema: Boolean(turno.fueraDeTema),
    riesgo: Boolean(turno.riesgo),
    // Si el modelo no lo informa, se asume intento (comportamiento previo).
    esIntento: pedidoDeAyuda ? false : turno.esIntento !== false,
    // Para que el cliente lo trate igual que el botón "Mostrame este paso".
    pedidoDeAyuda,
    escenaChoque,
    opcionesRespuesta: Array.isArray(turno.opcionesRespuesta) ? turno.opcionesRespuesta : [],
    requiereOpcion: Boolean(turno.requiereOpcion),
    opciones: Array.isArray(turno.opciones) ? turno.opciones : [],
    variableExplorable: sanearVariableExplorable(turno.variableExplorable),
    proveedor,
  };
}
