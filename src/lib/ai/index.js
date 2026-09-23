import { avanzarTurnoConGemini } from './providers/gemini';
import { avanzarTurnoConClaude } from './providers/claude';
import { verificarCalculo } from './verificacion';
import { construirMensajeInicial, construirMensajeEstudiante, MENSAJE_CORRECCION_CALCULO } from './prompt';

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
  const avanzar = proveedor === 'claude' ? avanzarTurnoConClaude : avanzarTurnoConGemini;

  let turno = await avanzar({ historial, idioma, materia, esInicial, enunciado, mensaje, pedirAyuda, learningLevel });

  // Verificación aritmética: el modelo puede "razonar bien" y aun así fallar
  // una cuenta simple. Se recalcula de verdad con mathjs (verificacion.js) y,
  // si no cierra, se le pide UNA corrección silenciosa antes de mostrarle
  // nada al estudiante — nunca se expone el intento fallido ni este mensaje
  // interno en el chat real.
  const chequeo = turno.verificacion ? verificarCalculo(turno.verificacion) : null;
  if (chequeo?.verificable && !chequeo.ok) {
    console.warn(
      `[verificación matemática] "${turno.verificacion.expresion}" = ${turno.verificacion.resultado} según el modelo, pero da ${chequeo.valorCalculado}. Reintentando corrección...`
    );
    try {
      const mensajeEstudianteOriginal = esInicial
        ? construirMensajeInicial({ enunciado })
        : construirMensajeEstudiante({ texto: mensaje, pedirAyuda });
      const historialConIntentoFallido = [
        ...historial,
        { autor: 'estudiante', texto: mensajeEstudianteOriginal },
        { autor: 'tutor', texto: turno.mensaje },
      ];
      const turnoCorregido = await avanzar({
        historial: historialConIntentoFallido,
        idioma,
        materia,
        esInicial: false,
        enunciado: '',
        mensaje: MENSAJE_CORRECCION_CALCULO,
        pedirAyuda: false,
        learningLevel,
      });
      const chequeo2 = turnoCorregido.verificacion ? verificarCalculo(turnoCorregido.verificacion) : null;
      if (!chequeo2?.verificable || chequeo2.ok) {
        turno = turnoCorregido;
      } else {
        console.error('[verificación matemática] El reintento de corrección también falló matemáticamente; se muestra igual.');
      }
    } catch (error) {
      console.error('[verificación matemática] Falló el reintento de corrección:', error);
    }
  }

  // Defaults explícitos para los campos de interactividad opcional: el
  // modelo puede omitirlos, y el frontend no debería tener que adivinar.
  return {
    ...turno,
    opcionesRespuesta: Array.isArray(turno.opcionesRespuesta) ? turno.opcionesRespuesta : [],
    requiereOpcion: Boolean(turno.requiereOpcion),
    opciones: Array.isArray(turno.opciones) ? turno.opciones : [],
    proveedor,
  };
}
