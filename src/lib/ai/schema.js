// Esquema de UN TURNO de la conversación tutor↔estudiante. La IA nunca
// entrega la resolución completa de una: cada llamada avanza (o no) un solo
// micro-paso, según si la respuesta del estudiante en ese paso fue correcta.

import { CAMPOS_ALCANCE_SCHEMA } from './prompt';

// Íconos de Material Symbols permitidos en "elementosEscena" (ver más abajo).
// Whitelist cerrada a propósito: así la IA nunca puede "inventar" una
// ligatura que no exista y termine mostrándose como texto roto en pantalla.
export const ICONOS_ESCENA_PERMITIDOS = [
  'directions_car',
  'local_shipping',
  'directions_bike',
  'train',
  'flight',
  'directions_walk',
  'directions_run',
  'sports_soccer',
  'circle',
  'square',
  'anchor',
  'block',
  'straighten',
  'height',
  'speed',
  'scale',
  'timer',
  'bolt',
  'arrow_forward',
  'arrow_back',
  'arrow_upward',
  'arrow_downward',
];

export const TURNO_JSON_SCHEMA = {
  type: 'object',
  properties: {
    tema: {
      type: 'string',
      description: 'Nombre corto del tema (ej. "Cantidad de movimiento"). SOLO en el primer turno; en los siguientes, cadena vacía (la app ya lo tiene).',
    },
    datos: {
      type: 'array',
      description: 'Datos conocidos extraídos del enunciado original. SOLO en el primer turno; en los siguientes, array vacío (la app ya los tiene).',
      items: {
        type: 'object',
        properties: {
          etiqueta: { type: 'string' },
          valor: {
            type: 'string',
            description: 'Si es un valor numérico con unidad o una expresión, envolvela en $...$ (ej. "$1200\\text{ kg}$"); si es solo texto descriptivo, dejalo en texto plano.',
          },
        },
        required: ['etiqueta', 'valor'],
      },
    },
    incognita: {
      type: 'string',
      description: 'Qué se está buscando calcular. SOLO en el primer turno; en los siguientes, cadena vacía. Si es una variable o expresión, envolvela en $...$ (ej. "$v_f$").',
    },
    correcta: {
      type: 'boolean',
      description:
        'OBLIGATORIO en todo turno que no sea el primero: true si el estudiante acertó el paso actual, false si no. No lo omitas aunque el mensaje del estudiante parezca solo un dato o una preparación — siempre está respondiendo tu pregunta guía anterior. Solo se omite en el primerísimo turno de la conversación (cuando el mensaje es el enunciado del problema).',
    },
    mensaje: {
      type: 'string',
      description:
        'Lo que le decís al estudiante en este turno: la pregunta guía del paso actual (si es turno inicial o avanzás de paso), o la retroalimentación sobre su intento (si estás evaluando una respuesta). Tono cálido, nunca punitivo.',
    },
    esIntento: {
      type: 'boolean',
      description:
        'En todo turno que no sea el primero: true SOLO si el mensaje del estudiante fue un intento real de responder la pregunta guía (acierte o no). false si fue "no sé", un pedido de ayuda, una pregunta, un desvío, algo emocional o una señal de riesgo. Solo los intentos cuentan como error en su progreso.',
    },
    // Clasificación de alcance (ver sección ALCANCE del prompt). Sin estos
    // campos en el schema, Gemini nunca los devolvía aunque el prompt los
    // pidiera: la salida estructurada solo incluye propiedades declaradas.
    ...CAMPOS_ALCANCE_SCHEMA,
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
        'Fórmula o cálculo YA CONFIRMADO de un paso que se acaba de cerrar (porque el estudiante acertó o pidió ayuda directa). Vacío si en este turno todavía no corresponde revelar ninguna fórmula. Envolvé la fórmula completa en $...$ (LaTeX simple, una sola línea, ej. "$v = \\frac{d}{t} = \\frac{100\\text{ m}}{8\\text{ s}} = 12.5\\text{ m/s}$"). Cada dato reemplazado lleva su unidad, no solo el resultado.',
    },
    opcionesRespuesta: {
      type: 'array',
      description:
        'OPCIONAL: 2 a 4 respuestas cortas sugeridas como atajo (chips), para que el estudiante pueda tocar en vez de escribir. Son solo sugerencias de texto libre, no se evalúan por sí mismas — al tocar una se envía como si el estudiante la hubiera escrito. Usalo con moderación, no en todos los turnos. Array vacío si no aplica.',
      items: {
        type: 'string',
        description: 'Si incluye una fórmula o variable, envolvela en $...$ (ej. "$a = 4\\text{ m/s}^2$").',
      },
    },
    requiereOpcion: {
      type: 'boolean',
      description:
        'true SOLO cuando este paso es puramente conceptual (identificar un principio, una fórmula, un concepto) y preferís plantearlo como opción múltiple en vez de respuesta libre. NUNCA lo uses para un paso que requiere que el estudiante haga un cálculo numérico — ahí siempre respuesta libre (false). Por defecto false.',
    },
    opciones: {
      type: 'array',
      description:
        'Solo si requiereOpcion=true: entre 3 y 4 opciones de respuesta. Exactamente UNA debe tener correcta=true. Marcá errorComun=true en cualquier distractor que represente una confusión conceptual típica del tema (mismo criterio que esErrorFrecuente).',
      items: {
        type: 'object',
        properties: {
          texto: {
            type: 'string',
            description: 'Si la opción es o contiene una fórmula, envolvela en $...$ (ej. "$v = \\frac{d}{t}$"). Nunca LaTeX sin dólares.',
          },
          correcta: { type: 'boolean' },
          errorComun: { type: 'boolean' },
        },
        required: ['texto', 'correcta'],
      },
    },
    elementosEscena: {
      type: 'array',
      description:
        'OPCIONAL. Representación de la escena física de ESTE paso como objetos reales del problema (nunca inventados), solo para turnos donde tu instrucción de estilo te indique explícitamente usarla — en cualquier otro caso, array vacío. Máximo 5 elementos, uno por objeto/dato relevante YA conocido en este paso. Nunca incluyas acá el resultado final antes de que corresponda revelarlo.',
      items: {
        type: 'object',
        properties: {
          icono: { type: 'string', enum: ICONOS_ESCENA_PERMITIDOS },
          etiqueta: { type: 'string', description: 'Texto corto, ej. "1200 kg, 20 m/s".' },
          direccion: { type: 'string', enum: ['izquierda', 'derecha', 'arriba', 'abajo', 'ninguna'] },
        },
        required: ['icono', 'etiqueta', 'direccion'],
      },
    },
    variableExplorable: {
      type: 'object',
      description:
        'OPCIONAL. Solo para turnos donde tu instrucción de estilo te indique explícitamente usarlo — en cualquier otro caso, omitilo. UNA variable real de este problema (nunca inventada) que el estudiante pueda mover con un control para intuir cómo afecta el resultado de ESTE paso, sin revelarlo. Nunca ofrezcas como explorable la incógnita que se está evaluando en este paso — elegí un dato de entrada relacionado.',
      properties: {
        etiqueta: { type: 'string', description: 'Nombre corto, ej. "Masa del auto 2 (m₂)".' },
        valorActual: { type: 'number' },
        valorMin: { type: 'number' },
        valorMax: { type: 'number' },
        unidad: { type: 'string' },
        tendencia: {
          type: 'string',
          enum: ['directa', 'inversa'],
          description:
            'directa: al subir esta variable, la magnitud del resultado de este paso también sube. inversa: al subir esta variable, baja.',
        },
      },
      required: ['etiqueta', 'valorActual', 'valorMin', 'valorMax', 'tendencia'],
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
        valor: { type: 'string', description: 'Envolvelo en $...$ si es un valor/expresión (ej. "$12.5$").' },
        unidad: {
          type: 'string',
          description: 'Unidad del resultado (ej. "m/s", "kg·m/s", "N"). Obligatoria en Física: cadena vacía SOLO si la magnitud es adimensional (ej. un coeficiente de fricción).',
        },
      },
      required: ['valor', 'unidad'],
    },
    analogiaCotidiana: {
      type: 'string',
      description:
        'OBLIGATORIO cuando completado=true: una analogía cotidiana real (idealmente de Paraguay) del resultado final. Cadena vacía "" en cualquier otro turno.',
    },
    verificacion: {
      type: 'object',
      description:
        'Presente SIEMPRE que "formula" o "resultadoFinal" traigan un cálculo numérico nuevo en este turno (se omite en pasos puramente conceptuales, sin ningún número nuevo). Es la MISMA cuenta que ya pusiste en "formula"/"resultadoFinal", pero en formato de calculadora simple (sin LaTeX, sin unidades en el texto), para que el servidor la verifique automáticamente con una librería matemática.',
      properties: {
        expresion: {
          type: 'string',
          description: 'La cuenta en texto plano, evaluable tal cual. Ej. "100/8" o "0.5*1200*20*20". Solo números y operadores + - * / ^ ( ).',
        },
        resultado: {
          type: 'number',
          description: 'El número al que llegaste con esa cuenta (sin unidad), tal como lo usaste en tu respuesta.',
        },
      },
      required: ['expresion', 'resultado'],
    },
    verificacionRespuesta: {
      type: 'object',
      description:
        'En todo turno que evalúa una respuesta NUMÉRICA del estudiante (no en el primer turno ni en pasos conceptuales): la cuenta cuyo resultado es la respuesta CORRECTA del paso que el estudiante acaba de responder. El servidor la calcula y la compara con lo que escribió el estudiante, para detectar si lo evaluaste mal.',
      properties: {
        expresion: {
          type: 'string',
          description: 'Solo números y operadores + - * / ^ ( ), sin unidades ni LaTeX. Ej. "10 + (-30)" o "5*2".',
        },
        unidad: {
          type: 'string',
          description: 'Unidad de la respuesta correcta de ese paso, en texto plano (ej. "kg·m/s", "m/s", "N"). Cadena vacía si la magnitud no tiene unidad.',
        },
      },
      required: ['expresion'],
    },
    escenaChoque: {
      type: 'object',
      description:
        'SOLO en el primer turno y SOLO si el problema es un choque frontal entre dos cuerpos: sus datos, tal como están en el enunciado (no inventes ninguno). Velocidades con signo: positivo = sentido del primer cuerpo; si el segundo viene a su encuentro o en sentido contrario, su velocidad es negativa; en reposo = 0. En cualquier otro caso, omitilo.',
      properties: {
        m1: { type: 'number', description: 'Masa del primer cuerpo, en kg.' },
        v1: { type: 'number', description: 'Velocidad del primer cuerpo, en m/s.' },
        m2: { type: 'number', description: 'Masa del segundo cuerpo, en kg.' },
        v2: { type: 'number', description: 'Velocidad del segundo cuerpo, en m/s, con signo.' },
        tipo: { type: 'string', enum: ['inelastico', 'elastico'] },
      },
      required: ['m1', 'v1', 'm2', 'v2', 'tipo'],
    },
    enunciadoGenerado: {
      type: 'string',
      description:
        'OBLIGATORIO solo en el turno inicial cuando el estudiante NO trajo un enunciado propio, sino que te pidió practicar un tema y vos inventaste el problema: el enunciado completo que inventaste, para mostrárselo tal cual como si él lo hubiera escrito. Cadena vacía en cualquier otro caso (incluido cuando el estudiante sí trajo su propio enunciado).',
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
    'fueraDeTema',
    'riesgo',
  ],
};

export const TURNO_TOOL_NAME = 'entregar_turno';
