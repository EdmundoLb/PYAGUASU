// Esquema de UN TURNO de la conversación tutor↔estudiante. La IA nunca
// entrega la resolución completa de una: cada llamada avanza (o no) un solo
// micro-paso, según si la respuesta del estudiante en ese paso fue correcta.

export const TURNO_JSON_SCHEMA = {
  type: 'object',
  properties: {
    tema: {
      type: 'string',
      description: 'Nombre corto del tema (ej. "Cantidad de movimiento"). Repetilo en cada turno.',
    },
    datos: {
      type: 'array',
      description: 'Datos conocidos extraídos del enunciado original. Repetilo en cada turno.',
      items: {
        type: 'object',
        properties: {
          etiqueta: { type: 'string' },
          valor: { type: 'string' },
        },
        required: ['etiqueta', 'valor'],
      },
    },
    incognita: {
      type: 'string',
      description: 'Qué se está buscando calcular. Repetilo en cada turno.',
    },
    correcta: {
      type: 'boolean',
      description:
        'Si este turno evalúa una respuesta del estudiante: true si acertó el paso actual, false si no. Si este es el primer turno (todavía no respondió nada), no incluyas este campo.',
    },
    mensaje: {
      type: 'string',
      description:
        'Lo que le decís al estudiante en este turno: la pregunta guía del paso actual (si es turno inicial o avanzás de paso), o la retroalimentación sobre su intento (si estás evaluando una respuesta). Tono cálido, nunca punitivo.',
    },
    pista: {
      type: 'string',
      description: 'Solo si correcta=false: una pista concreta que ayude sin resolver el paso por el estudiante.',
    },
    esErrorFrecuente: {
      type: 'boolean',
      description:
        'Solo si correcta=false: true SOLO si este error puntual corresponde a una confusión conceptual conocida y típica de este tema (ej. confundir masa con peso, velocidad con aceleración, energía cinética con cantidad de movimiento). false si es un error de cálculo suelto o no reconocés un patrón típico. No inventes que es frecuente si no estás seguro/a: una falsa alarma le resta credibilidad al mensaje.',
    },
    normalizacion: {
      type: 'string',
      description:
        'Solo si esErrorFrecuente=true: una frase breve y cálida (banco de errores comunes) que (1) le diga al estudiante que no es el único/a que se confunde ahí, y (2) explique en una línea por qué ese error es tentador o tiene sentido pensarlo así, ANTES de darle la pista. Cadena vacía en cualquier otro caso.',
    },
    formula: {
      type: 'string',
      description:
        'Fórmula o cálculo YA CONFIRMADO de un paso que se acaba de cerrar (porque el estudiante acertó o pidió ayuda directa). Vacío si en este turno todavía no corresponde revelar ninguna fórmula.',
    },
    pasoActual: {
      type: 'integer',
      description: 'Número del micro-paso en el que está parado el estudiante ahora mismo (empieza en 1).',
    },
    totalPasosEstimados: {
      type: 'integer',
      description: 'Estimación de cuántos micro-pasos tiene este problema (máximo 5).',
    },
    completado: {
      type: 'boolean',
      description: 'true solo cuando el último paso ya se cerró y hay resultado final.',
    },
    resultadoFinal: {
      type: 'object',
      description: 'Solo presente si completado=true.',
      properties: {
        valor: { type: 'string' },
        unidad: { type: 'string' },
      },
    },
    analogiaCotidiana: {
      type: 'string',
      description:
        'OBLIGATORIO cuando completado=true: una analogía cotidiana real (idealmente de Paraguay) del resultado final. Cadena vacía "" en cualquier otro turno.',
    },
  },
  required: [
    'tema',
    'incognita',
    'mensaje',
    'pasoActual',
    'totalPasosEstimados',
    'completado',
    'analogiaCotidiana',
  ],
};

export const TURNO_TOOL_NAME = 'entregar_turno';
