import { avanzarTurno } from '@/lib/ai';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body inválido, se esperaba JSON.' }, { status: 400 });
  }

  const { idioma, materia, esInicial, enunciado, mensaje, pedirAyuda, historial, learningLevel } = body || {};
  const NIVELES_APRENDIZAJE_VALIDOS = ['visual', 'auditor', 'kinestesico'];

  if (esInicial && (typeof enunciado !== 'string' || !enunciado.trim())) {
    return Response.json({ error: 'Falta el enunciado del problema.' }, { status: 400 });
  }
  if (!esInicial && !pedirAyuda && (typeof mensaje !== 'string' || !mensaje.trim())) {
    return Response.json({ error: 'Falta la respuesta del estudiante.' }, { status: 400 });
  }

  try {
    const turno = await avanzarTurno({
      historial: Array.isArray(historial) ? historial : [],
      idioma: idioma === 'guarani' ? 'guarani' : 'jopara',
      materia: materia || 'Física',
      esInicial: Boolean(esInicial),
      enunciado: enunciado || '',
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
