import { avanzarTurnoConGemini } from './providers/gemini';
import { avanzarTurnoConClaude } from './providers/claude';

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
}) {
  if (esInicial && !enunciado.trim()) {
    throw new Error('El enunciado del problema está vacío.');
  }
  if (!esInicial && !pedirAyuda && !mensaje.trim()) {
    throw new Error('Falta la respuesta del estudiante.');
  }

  const proveedor = elegirProveedor();
  const avanzar = proveedor === 'claude' ? avanzarTurnoConClaude : avanzarTurnoConGemini;

  const turno = await avanzar({ historial, idioma, materia, esInicial, enunciado, mensaje, pedirAyuda });
  return { ...turno, proveedor };
}
