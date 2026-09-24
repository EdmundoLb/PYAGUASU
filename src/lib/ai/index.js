import { avanzarTurnoConGemini } from './providers/gemini';
import { avanzarTurnoConClaude } from './providers/claude';
import { ICONOS_ESCENA_PERMITIDOS } from './schema';
import { verificarCalculo } from './verificacion';
import { repararEscapesEnObjeto } from '../latex/escapes';
import { esCierrePrematuro, anularCierre } from './cierre';
import { esFalsoIncorrecto, valorCorrectoDelPaso, quitarRespuestaDeSugerencias } from './evaluacion';
import {
  construirMensajeInicial,
  construirMensajeEstudiante,
  construirMensajeCorreccionEvaluacion,
  MENSAJE_CORRECCION_CALCULO,
} from './prompt';

// Defensa en profundidad: aunque el schema ya restringe "icono" a un enum,
// un proveedor podría no cumplirlo al 100% — un ícono desconocido se
// renderiza como texto literal roto, así que filtramos antes de mandarlo
// al frontend.
function sanearElementosEscena(elementos) {
  if (!Array.isArray(elementos)) return [];
  return elementos
    .filter((el) => el && ICONOS_ESCENA_PERMITIDOS.includes(el.icono) && el.etiqueta)
    .slice(0, 5);
}

const TENDENCIAS_VALIDAS = ['directa', 'inversa'];

// Misma defensa en profundidad que sanearElementosEscena: un rango roto
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

function limpiarMarcas(texto) {
  return typeof texto === 'string' ? texto.replace(PATRON_MARCA_INTERNA, '').trim() : texto;
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

  const proveedor = elegirProveedor();
  const avanzarConProveedor = proveedor === 'claude' ? avanzarTurnoConClaude : avanzarTurnoConGemini;
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

  // Defaults explícitos para los campos de interactividad opcional: el
  // modelo puede omitirlos, y el frontend no debería tener que adivinar.
  turno = limpiarMarcasDelTurno(turno);

  return {
    ...turno,
    fueraDeTema: Boolean(turno.fueraDeTema),
    riesgo: Boolean(turno.riesgo),
    // Si el modelo no lo informa, se asume intento (comportamiento previo).
    esIntento: turno.esIntento !== false,
    opcionesRespuesta: Array.isArray(turno.opcionesRespuesta) ? turno.opcionesRespuesta : [],
    requiereOpcion: Boolean(turno.requiereOpcion),
    opciones: Array.isArray(turno.opciones) ? turno.opciones : [],
    elementosEscena: sanearElementosEscena(turno.elementosEscena),
    variableExplorable: sanearVariableExplorable(turno.variableExplorable),
    proveedor,
  };
}
