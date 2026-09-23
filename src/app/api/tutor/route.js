import { avanzarTurno } from '@/lib/ai';
import { construirSolicitudProblemaGenerado } from '@/lib/ai/prompt';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body inválido, se esperaba JSON.' }, { status: 400 });
  }

  const {
    idioma,
    materia,
    esInicial,
    enunciado,
    mensaje,
    pedirAyuda,
    historial,
    learningLevel,
    // Presentes solo cuando el alumno eligió "Elegir un tema para
    // practicar" en vez de traer su propio enunciado (ver PantallaInicio).
    temaSeleccionado,
    dificultadSeleccionada,
  } = body || {};
  const NIVELES_APRENDIZAJE_VALIDOS = ['visual', 'auditor', 'kinestesico'];
  const tieneEnunciadoPropio = typeof enunciado === 'string' && enunciado.trim();

  if (esInicial && !tieneEnunciadoPropio && !temaSeleccionado) {
    return Response.json({ error: 'Falta el enunciado del problema o un tema para generar uno.' }, { status: 400 });
  }
  if (!esInicial && !pedirAyuda && (typeof mensaje !== 'string' || !mensaje.trim())) {
    return Response.json({ error: 'Falta la respuesta del estudiante.' }, { status: 400 });
  }

  const enunciadoFinal = tieneEnunciadoPropio
    ? enunciado
    : esInicial && temaSeleccionado
      ? construirSolicitudProblemaGenerado({ tema: temaSeleccionado, dificultad: dificultadSeleccionada })
      : enunciado || '';

  try {
    const turno = await avanzarTurno({
      historial: Array.isArray(historial) ? historial : [],
      idioma: idioma === 'castellano' ? 'castellano' : 'jopara',
      materia: materia || 'Física',
      esInicial: Boolean(esInicial),
      enunciado: enunciadoFinal,
      mensaje: mensaje || '',
      pedirAyuda: Boolean(pedirAyuda),
      learningLevel: NIVELES_APRENDIZAJE_VALIDOS.includes(learningLevel) ? learningLevel : '',
    });
    return Response.json(turno);
  } catch (error) {
    console.error('[api/tutor] Error al avanzar el turno:', error);
    return Response.json(
      { error: error.message || 'Error interno al avanzar el turno.' },
      { status: 502 }
    );
  }
}
