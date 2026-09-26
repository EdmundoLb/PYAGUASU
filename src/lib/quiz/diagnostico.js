// Test de diagnóstico de ESTILO DE APRENDIZAJE (no es un examen de física):
// mide por qué canal entiende mejor el estudiante, combinando el modelo VAK
// (Visual / Auditivo / Kinestésico) con las dimensiones sensorial-activa de
// Felder-Silverman, para que el tutor de física adapte el FORMATO de sus
// explicaciones — nunca el contenido, que siempre debe seguir siendo correcto.
//
// ⚠️ IMPORTANTE PARA EL EQUIPO: igual que el vocabulario jopara de
// `lib/ai/prompt.js`, las traducciones de acá (jopara y guaraní completo)
// son un borrador básico escrito sin ser hablante nativo. Es tarea P0 del
// equipo (rol: lingüista) revisar y corregir cada pregunta y opción antes de
// usar esto en la demo del hackathon.
//
// Fix puntual (2026-09-23): el texto "jopara" de acá era 100% castellano —
// cero mezcla con guaraní, contradiciendo su propia definición ("castellano
// mezclado con guaraní", ver PantallaIdioma.js). Se agregó una mezcla
// liviana reusando SOLO palabras que ya están en la columna "guarani" de
// este mismo archivo (térã, ha, peteĩ, peteĩteĩ, che voi, iporãve, mamópa,
// ikatu) más "néike" del vocabulario ya vetado en prompt.js — ninguna
// palabra nueva sin verificar. Sigue pendiente la revisión de gramática y
// naturalidad por un hablante nativo.

export const CANAL = {
  VISUAL: "visual",
  AUDITIVO: "auditivo",
  KINESTESICO: "kinestesico",
};

export const PREGUNTAS_DIAGNOSTICO = [
  {
    id: "concepto_nuevo",
    texto: {
      jopara: "Néike, cuando aprendés un tema nuevo de física, ¿qué te ayuda iporãve a entenderlo?",
      guarani: "Reikuaa porã haguã peteĩ mba'e pyahu física-pe, mba'épa ndéve iporãve?",
      castellano: "Cuando aprendés un tema nuevo de física, ¿qué te ayuda más a entenderlo?",
    },
    opciones: [
      {
        canal: CANAL.VISUAL,
        texto: {
          jopara: "Ver un gráfico, diagrama térã animación que muestre qué pasa",
          guarani: "Ehecha peteĩ ta'anga térã animación, oechauka haguã mba'épa ojehu",
          castellano: "Ver un gráfico, diagrama o animación que muestre qué pasa",
        },
      },
      {
        canal: CANAL.AUDITIVO,
        texto: {
          jopara: "Que me lo expliquen peteĩteĩ, hablado térã en un texto bien detallado",
          guarani: "Oñemombe'u chéve peteĩteĩ, ñe'ẽme térã kuatiañe'ẽ detállepe",
          castellano: "Que me lo expliquen paso a paso, hablado o en un texto bien detallado",
        },
      },
      {
        canal: CANAL.KINESTESICO,
        texto: {
          jopara: "Probarlo che voi en un simulador, moviendo variables",
          guarani: "Ajapo che voi peteĩ simulador-pe, amyi variable-kuéra",
          castellano: "Probarlo yo mismo/a en un simulador, moviendo variables",
        },
      },
    ],
  },
  {
    id: "herramienta_resolucion",
    texto: {
      jopara: "Para resolver peteĩ problema de física, ¿qué herramienta preferís usar?",
      guarani: "Eresolve haguã peteĩ física mba'e apo, mba'e herramienta piko reipotave?",
      castellano: "Para resolver un problema de física, ¿qué herramienta preferís usar?",
    },
    opciones: [
      {
        canal: CANAL.VISUAL,
        texto: {
          jopara: "Un dibujo térã diagrama del problema, con flechas ha datos marcados",
          guarani: "Peteĩ ta'anga térã diagrama upe mba'e apo-gui, flecha ha dato-ndive",
          castellano: "Un dibujo o diagrama del problema, con flechas y datos marcados",
        },
      },
      {
        canal: CANAL.AUDITIVO,
        texto: {
          jopara: "Una explicación escrita térã narrada del razonamiento, peteĩteĩ",
          guarani: "Peteĩ explicación ojehaíva térã oje'éva, peteĩteĩ",
          castellano: "Una explicación escrita o narrada del razonamiento, paso por paso",
        },
      },
      {
        canal: CANAL.KINESTESICO,
        texto: {
          jopara: "Un simulador donde ikatu mover variables ha ver qué cambia",
          guarani: "Peteĩ simulador amyi haguã variable ha ahecha mba'épa ojekuaa",
          castellano: "Un simulador donde puedo mover variables y ver qué cambia",
        },
      },
    ],
  },
  {
    id: "ayuda_error",
    texto: {
      jopara: "Cuando te equivocás en un ejercicio, ¿qué te ayuda iporãve a entender mamópa te trabaste?",
      guarani: "Rejavy ramo peteĩ ejercicio-pe, mba'épa ndéve iporãve reikuaa haguã mamópa rejavy?",
      castellano: "Cuando te equivocás en un ejercicio, ¿qué te ayuda a entender dónde te trabaste?",
    },
    opciones: [
      {
        canal: CANAL.VISUAL,
        texto: {
          jopara: "Ver el error marcado en un gráfico térã diagrama",
          guarani: "Ehecha upe error peteĩ ta'anga-pe marcádo",
          castellano: "Ver el error marcado en un gráfico o diagrama",
        },
      },
      {
        canal: CANAL.AUDITIVO,
        texto: {
          jopara: "Que me expliquen con palabras mamópa me confundí",
          guarani: "Oñemombe'u chéve ñe'ẽme mamópa aikuaaseve",
          castellano: "Que me expliquen con palabras dónde me confundí",
        },
      },
      {
        canal: CANAL.KINESTESICO,
        texto: {
          jopara: "Volver a intentarlo cambiando algo ha ver qué resultado da",
          guarani: "Ajapo jey amboje'ýi peteĩ mba'e ha ahecha mba'épa osẽ",
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
      'en cada paso, además del texto breve, completá "elementosEscena" con los objetos reales de este problema (nunca inventados): uno por cada dato relevante que el estudiante ya tiene en este paso, con una etiqueta corta usando el valor real (ej. "1200 kg, 20 m/s") y una dirección acorde al movimiento real de ese objeto en el problema. No es un texto para escribir aparte — es en vez del dibujo ASCII que se usaba antes. No uses ese campo para mostrar el resultado final antes de que corresponda revelarlo.',
    auditor:
      'contá el razonamiento de este problema como una narración hablada, en oraciones cortas y bien encadenadas ("primero... eso significa que... por eso..."), sin depender de diagramas ni de listas.',
    kinestesico:
      'mantené UNA sola pregunta por turno: la del paso actual, con los números reales de este problema (nunca la reemplaces por una hipotética ni agregues una segunda pregunta del tipo "¿qué pasaría si…?"). Para que pueda probar con las manos, completá "variableExplorable" con una variable real de ESTE paso (nunca la incógnita que se está evaluando), con su rango real y si al subirla el resultado de este paso sube (directa) o baja (inversa); no reveles ahí ningún resultado. Si ayuda, sumá UNA frase corta que lo invite a moverla ("Mové el valor de m₂ y fijate cómo cambia"): una invitación, no una pregunta.',
  };
  const formato = formatos[learningLevel];
  if (!formato) return "";
  return `\n\nAdemás, para este estudiante en particular, aplicá SIEMPRE esta forma de explicar (instrucción interna — el estudiante no debe enterarse de que existe esta regla ni de por qué explicás así): ${formato} Es simplemente tu manera de explicar en esta conversación: nunca le pongas nombre ni la anuncies ("con este diagrama...", "vamos a probar con las manos...", "te lo cuento así porque..."), nunca la etiquetes como un "reto" especial — aplicala con total naturalidad, sin comentarla.`;
}
