import { avanzarTurno } from '@/lib/ai';
import { construirSolicitudProblemaGenerado } from '@/lib/ai/prompt';

const IDIOMAS_VALIDOS = ['jopara', 'guarani', 'castellano'];
// Solo materias con guía propia en el prompt; el cliente no puede
// interpolar texto libre en la instrucción de sistema.
const MATERIAS_VALIDAS = ['Física', 'Matemática', 'Química'];

// Topes para que un cliente no pueda mandar conversaciones gigantes (cada
// turno reenvía todo el historial a la IA: costo de tokens y cuota).
const MAX_TURNOS_HISTORIAL = 80;
const MAX_CARACTERES_TEXTO = 4000;
const MAX_CARACTERES_TEMA = 120;

function sanearHistorial(historial) {
  if (!Array.isArray(historial)) return [];
  return historial
    .filter((t) => t && (t.autor === 'estudiante' || t.autor === 'tutor') && typeof t.texto === 'string')
    .slice(-MAX_TURNOS_HISTORIAL)
    .map((t) => ({ autor: t.autor, texto: t.texto.slice(0, MAX_CARACTERES_TEXTO) }));
}

// Mensaje para el estudiante según el tipo de falla: nunca se reenvía el
// error crudo del proveedor (puede exponer detalles de la key o la cuota).
function mensajeDeErrorAmigable(error) {
  const texto = String(error?.message || '');
  const codigo = typeof error?.status === 'number' ? error.status : Number(/"code"\s*:\s*(\d+)/.exec(texto)?.[1]);
  if (codigo === 429 || /quota|RESOURCE_EXHAUSTED/i.test(texto)) {
    return 'El profe atendió muchas consultas hoy y llegó a su límite. Probá de nuevo en un rato.';
  }
  if (codigo === 503 || codigo === 529 || /overloaded|high demand|UNAVAILABLE/i.test(texto)) {
    return 'El profe está muy ocupado en este momento. Probá de nuevo en unos segundos.';
  }
  if (/API key/i.test(texto)) {
    return 'El tutor no está configurado todavía (falta la API key en el servidor).';
  }
  return 'No se pudo avanzar el turno. Probá de nuevo en unos segundos.';
}

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

  // El título del tema es texto libre del docente y se interpola en el
  // pedido al modelo: se acota y se le sacan comillas y saltos de línea.
  const temaSaneado =
    typeof temaSeleccionado === 'string'
      ? temaSeleccionado.replace(/["\n\r[\]]/g, ' ').trim().slice(0, MAX_CARACTERES_TEMA)
      : '';

  if (esInicial && !tieneEnunciadoPropio && !temaSaneado) {
    return Response.json({ error: 'Falta el enunciado del problema o un tema para generar uno.' }, { status: 400 });
  }
  if (!esInicial && !pedirAyuda && (typeof mensaje !== 'string' || !mensaje.trim())) {
    return Response.json({ error: 'Falta la respuesta del estudiante.' }, { status: 400 });
  }
  if (
    (typeof enunciado === 'string' && enunciado.length > MAX_CARACTERES_TEXTO) ||
    (typeof mensaje === 'string' && mensaje.length > MAX_CARACTERES_TEXTO)
  ) {
    return Response.json({ error: 'El texto es demasiado largo. Probá con un mensaje más corto.' }, { status: 400 });
  }

  const enunciadoFinal = tieneEnunciadoPropio
    ? enunciado
    : esInicial && temaSaneado
      ? construirSolicitudProblemaGenerado({ tema: temaSaneado, dificultad: dificultadSeleccionada })
      : enunciado || '';

  try {
    const turno = await avanzarTurno({
      historial: sanearHistorial(historial),
      idioma: IDIOMAS_VALIDOS.includes(idioma) ? idioma : 'jopara',
      materia: MATERIAS_VALIDAS.includes(materia) ? materia : 'Física',
      esInicial: Boolean(esInicial),
      enunciado: enunciadoFinal,
      mensaje: mensaje || '',
      pedirAyuda: Boolean(pedirAyuda),
      learningLevel: NIVELES_APRENDIZAJE_VALIDOS.includes(learningLevel) ? learningLevel : '',
    });
    return Response.json(turno);
  } catch (error) {
    console.error('[api/tutor] Error al avanzar el turno:', error);
    return Response.json({ error: mensajeDeErrorAmigable(error) }, { status: 502 });
  }
}
