// Test de diagnóstico de ESTILO DE APRENDIZAJE (no es un examen de física):
// mide por qué canal entiende mejor el estudiante, combinando el modelo VAK
// (Visual / Auditivo / Kinestésico) con las dimensiones sensorial-activa de
// Felder-Silverman, para que el tutor de física adapte el FORMATO de sus
// explicaciones — nunca el contenido, que siempre debe seguir siendo correcto.
//
// ⚠️ IMPORTANTE PARA EL EQUIPO: el vocabulario jopara del tutor
// (`lib/ai/prompt.js`) sigue siendo un borrador básico escrito sin ser
// hablante nativo. Es tarea P0 del equipo (rol: lingüista) revisarlo antes
// de usar esto en la demo del hackathon. Las preguntas de este test están en
// castellano simple en ambos idiomas (el modo "jopara" solo afecta cómo
// habla el tutor en el chat, no el texto de este quiz).

export const CANAL = {
  VISUAL: "visual",
  AUDITIVO: "auditivo",
  KINESTESICO: "kinestesico",
};

export const PREGUNTAS_DIAGNOSTICO = [
  {
    id: "concepto_nuevo",
    texto: {
      jopara: "Cuando aprendés un tema nuevo de física, ¿qué te ayuda más a entenderlo?",
      castellano: "Cuando aprendés un tema nuevo de física, ¿qué te ayuda más a entenderlo?",
    },
    opciones: [
      {
        canal: CANAL.VISUAL,
        texto: {
          jopara: "Ver un gráfico, diagrama o animación que muestre qué pasa",
          castellano: "Ver un gráfico, diagrama o animación que muestre qué pasa",
        },
      },
      {
        canal: CANAL.AUDITIVO,
        texto: {
          jopara: "Que me lo expliquen paso a paso, hablado o en un texto bien detallado",
          castellano: "Que me lo expliquen paso a paso, hablado o en un texto bien detallado",
        },
      },
      {
        canal: CANAL.KINESTESICO,
        texto: {
          jopara: "Probarlo yo mismo/a en un simulador, moviendo variables",
          castellano: "Probarlo yo mismo/a en un simulador, moviendo variables",
        },
      },
    ],
  },
  {
    id: "herramienta_resolucion",
    texto: {
      jopara: "Para resolver un problema de física, ¿qué herramienta preferís usar?",
      castellano: "Para resolver un problema de física, ¿qué herramienta preferís usar?",
    },
    opciones: [
      {
        canal: CANAL.VISUAL,
        texto: {
          jopara: "Un dibujo o diagrama del problema, con flechas y datos marcados",
          castellano: "Un dibujo o diagrama del problema, con flechas y datos marcados",
        },
      },
      {
        canal: CANAL.AUDITIVO,
        texto: {
          jopara: "Una explicación escrita o narrada del razonamiento, paso por paso",
          castellano: "Una explicación escrita o narrada del razonamiento, paso por paso",
        },
      },
      {
        canal: CANAL.KINESTESICO,
        texto: {
          jopara: "Un simulador donde puedo mover variables y ver qué cambia",
          castellano: "Un simulador donde puedo mover variables y ver qué cambia",
        },
      },
    ],
  },
  {
    id: "ayuda_error",
    texto: {
      jopara: "Cuando te equivocás en un ejercicio, ¿qué te ayuda a entender dónde te trabaste?",
      castellano: "Cuando te equivocás en un ejercicio, ¿qué te ayuda a entender dónde te trabaste?",
    },
    opciones: [
      {
        canal: CANAL.VISUAL,
        texto: {
          jopara: "Ver el error marcado en un gráfico o diagrama",
          castellano: "Ver el error marcado en un gráfico o diagrama",
        },
      },
      {
        canal: CANAL.AUDITIVO,
        texto: {
          jopara: "Que me expliquen con palabras dónde me confundí",
          castellano: "Que me expliquen con palabras dónde me confundí",
        },
      },
      {
        canal: CANAL.KINESTESICO,
        texto: {
          jopara: "Volver a intentarlo cambiando algo y ver qué resultado da",
          castellano: "Volver a intentarlo cambiando algo y ver qué resultado da",
        },
      },
    ],
  },
];

// Desempate cuando dos o más canales terminan con el mismo puntaje: visual >
// auditor > kinestésico. Es un orden arbitrario, documentado acá para que
// sea predecible (nunca azar).
export function calcularEstiloPredominante({ visualScore = 0, auditoryScore = 0, kinestheticScore = 0 }) {
  const puntajes = [
    { estilo: "visual", puntaje: visualScore },
    { estilo: "auditor", puntaje: auditoryScore },
    { estilo: "kinestesico", puntaje: kinestheticScore },
  ];
  return puntajes.reduce((mejor, actual) => (actual.puntaje > mejor.puntaje ? actual : mejor)).estilo;
}

// Instrucciones de FORMATO que se agregan a la instrucción de sistema de la
// IA, en función del canal por el que el estudiante entiende mejor (test
// interno, nunca visible para el estudiante). A propósito estas reglas NUNCA
// nombran la categoría (nada de "visual", "auditivo", "kinestésico", "reto
// kinestésico", "estilo de aprendizaje", "test VAK"): un modelo de lenguaje
// tiende a repetir palabras salientes de sus propias instrucciones, así que
// si el texto de acá nunca contiene esas palabras, el tutor no tiene de
// dónde copiarlas. Nunca cambia el contenido físico/matemático, que siempre
// debe ser correcto y verificable — solo cambia CÓMO se presenta.
export function construirContextoAprendizaje(learningLevel) {
  const formatos = {
    visual:
      'en cada paso, además del texto, dibujá la situación con un diagrama hecho con caracteres ASCII (flechas →↑↓, círculos, cajas) usando los datos y variables REALES de este problema (nunca un ejemplo inventado), y describí posiciones/direcciones en términos espaciales concretos ("a la izquierda", "hacia arriba").',
    auditor:
      'contá el razonamiento de este problema como una narración hablada, en oraciones cortas y bien encadenadas ("primero... eso significa que... por eso..."), sin depender de diagramas ni de listas.',
    kinestesico:
      'en vez de solo preguntar un dato, invitá a probar algo concreto con los números reales de este problema (ej. "¿qué pasaría con el resultado si m₂ fuera 0 en vez de 800 kg?"), nunca con una frase genérica tipo "cambiá un valor cualquiera". La pregunta tiene que seguir haciendo avanzar el razonamiento, nunca pedir que repita datos que ya tiene a la vista.',
  };
  const formato = formatos[learningLevel];
  if (!formato) return "";
  return `\n\nAdemás, para este estudiante en particular, aplicá SIEMPRE esta forma de explicar (instrucción interna — el estudiante no debe enterarse de que existe esta regla ni de por qué explicás así): ${formato} Es simplemente tu manera de explicar en esta conversación: nunca le pongas nombre ni la anuncies ("con este diagrama...", "vamos a probar con las manos...", "te lo cuento así porque..."), nunca la etiquetes como un "reto" especial — aplicala con total naturalidad, sin comentarla.`;
}
