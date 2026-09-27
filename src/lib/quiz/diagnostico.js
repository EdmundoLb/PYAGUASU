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

// Textos revisados contra la base jopara del equipo (26/09): "che voi" (voi =
// "pues, justamente") → "chejehegui" (por mí mismo, de "Ndejehegui", L030);
// "peteĩteĩ" (uno por uno) → "umi paso peteĩteĩ"; en guaraní: hag̃ua,
// ta'ãnga, ohechauka, ajavy, oñemoambue y opciones en 1ª persona.
// Las 3 preguntas y todas sus respuestas en jopara fueron redactadas por el
// equipo (26/09) con estructura guaraní + raíces castellanas.
// ⚠️ LINGÜISTA: confirmar "chejehegui" (derivada, no está tal cual en la base).
export const PREGUNTAS_DIAGNOSTICO = [
  {
    id: "concepto_nuevo",
    texto: {
      // Propuesta del equipo (26/09): estructura guaraní + raíces castellanas.
      jopara: "Néike, py'aguasu! Reaprende jave peteĩ tema pyahu física-pe, mba'épa nepytyvõve reentende hag̃ua?",
      guarani: "Néike, py'aguasu! Reikuaa porã hag̃ua peteĩ mba'e pyahu física-pe, mba'épa ndéve iporãve?",
      castellano: "Cuando aprendés un tema nuevo de física, ¿qué te ayuda más a entenderlo?",
    },
    opciones: [
      {
        canal: CANAL.VISUAL,
        texto: {
          jopara: "Ahecha peteĩ gráfico, diagrama térã animación ohechaukáva mba'épa oiko",
          guarani: "Ahecha peteĩ ta'ãnga térã animación, ohechauka hag̃ua mba'épa ojehu",
          castellano: "Ver un gráfico, diagrama o animación que muestre qué pasa",
        },
      },
      {
        canal: CANAL.AUDITIVO,
        texto: {
          jopara: "Oñemyesakã chéve umi paso peteĩteĩ, ñe'ẽ rupive térã peteĩ texto hesakã porãva-pe",
          guarani: "Oñemombe'u chéve umi paso peteĩteĩ, ñe'ẽme térã kuatiañe'ẽ detállepe",
          castellano: "Que me lo expliquen paso a paso, hablado o en un texto bien detallado",
        },
      },
      {
        canal: CANAL.KINESTESICO,
        texto: {
          jopara: "Añeha'ã chejehegui peteĩ simulador-pe, amongu'évo umi variable",
          guarani: "Ajapo chejehegui peteĩ simulador-pe, amyi variable-kuéra",
          castellano: "Probarlo yo mismo/a en un simulador, moviendo variables",
        },
      },
    ],
  },
  {
    id: "herramienta_resolucion",
    texto: {
      // Propuesta del equipo (26/09), con el -pa de pregunta agregado.
      jopara: "Rejapo hag̃ua peteĩ problema física-pegua, mba'e rupivépa rejaposeve?",
      guarani: "Eresolve hag̃ua peteĩ física mba'e apo, mba'e herramienta piko reipotave?",
      castellano: "Para resolver un problema de física, ¿qué herramienta preferís usar?",
    },
    opciones: [
      {
        canal: CANAL.VISUAL,
        texto: {
          jopara: "Peteĩ dibujo térã diagrama problema rehegua, flecha ha dato marcado reheve",
          guarani: "Peteĩ ta'ãnga térã diagrama upe mba'e apo-gui, flecha ha dato-ndive",
          castellano: "Un dibujo o diagrama del problema, con flechas y datos marcados",
        },
      },
      {
        canal: CANAL.AUDITIVO,
        texto: {
          jopara: "Peteĩ explicación ojehaíva térã oñemombe'úva, paso peteĩteĩ",
          guarani: "Peteĩ explicación ojehaíva térã oje'éva, umi paso peteĩteĩ",
          castellano: "Una explicación escrita o narrada del razonamiento, paso por paso",
        },
      },
      {
        canal: CANAL.KINESTESICO,
        texto: {
          jopara: "Peteĩ simulador ikatuhápe amongu'e umi variable ha ahecha mba'épa oñemoambue",
          guarani: "Peteĩ simulador amyi hag̃ua variable ha ahecha mba'épa oñemoambue",
          castellano: "Un simulador donde puedo mover variables y ver qué cambia",
        },
      },
    ],
  },
  {
    id: "ayuda_error",
    texto: {
      // Propuesta del equipo (26/09).
      jopara: "Rejavy jave peteĩ ejercicio-pe, mba'épa nepytyvõve reikuaa hag̃ua mamópa oĩ pe jejavy?",
      guarani: "Rejavy ramo peteĩ ejercicio-pe, mba'épa ndéve iporãve reikuaa hag̃ua mamópa rejavy?",
      castellano: "Cuando te equivocás en un ejercicio, ¿qué te ayuda a entender dónde te trabaste?",
    },
    opciones: [
      {
        canal: CANAL.VISUAL,
        texto: {
          jopara: "Ahecha pe jejavy ojehaíva peteĩ gráfico térã diagrama-pe",
          guarani: "Ahecha upe error peteĩ ta'ãnga-pe marcádo",
          castellano: "Ver el error marcado en un gráfico o diagrama",
        },
      },
      {
        canal: CANAL.AUDITIVO,
        texto: {
          jopara: "Oñemyesakã chéve ñe'ẽ rupive mamópa ajavy",
          guarani: "Oñemombe'u chéve ñe'ẽme mamópa ajavy",
          castellano: "Que me expliquen con palabras dónde me confundí",
        },
      },
      {
        canal: CANAL.KINESTESICO,
        texto: {
          jopara: "Añeha'ã jey, amoambuévo peteĩ mba'e, ha ahecha mba'e resultado-pa osẽ",
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
      // Antes pedía "elementosEscena" (íconos animados en el chat), que solo
      // repetían los datos que ya se ven arriba: se sacó. Ahora la imagen va
      // en el propio texto.
      'ayudalo a "ver" el paso: describí en una frase corta lo que se vería en la escena real del problema (qué objeto se mueve, hacia dónde, qué cambia antes y después), y apoyá cada paso con la fórmula escrita en LaTeX para que la relación entre los datos se lea de un vistazo. Oraciones cortas, sin párrafos largos.',
    auditor:
      'contá el razonamiento de este problema como una narración hablada, en oraciones cortas y bien encadenadas ("primero... eso significa que... por eso..."), sin depender de diagramas ni de listas.',
    kinestesico:
      'mantené UNA sola pregunta por turno: la del paso actual, con los números reales de este problema (nunca la reemplaces por una hipotética ni agregues una segunda pregunta del tipo "¿qué pasaría si…?"). Para que pueda probar con las manos, completá "variableExplorable" con una variable real de ESTE paso (nunca la incógnita que se está evaluando), con su rango real y si al subirla el resultado de este paso sube (directa) o baja (inversa); no reveles ahí ningún resultado. Si ayuda, sumá UNA frase corta que lo invite a moverla ("Mové el valor de m₂ y fijate cómo cambia"): una invitación, no una pregunta.',
  };
  const formato = formatos[learningLevel];
  if (!formato) return "";
  return `\n\nAdemás, para este estudiante en particular, aplicá SIEMPRE esta forma de explicar (instrucción interna — el estudiante no debe enterarse de que existe esta regla ni de por qué explicás así): ${formato} Es simplemente tu manera de explicar en esta conversación: nunca le pongas nombre ni la anuncies ("con este diagrama...", "vamos a probar con las manos...", "te lo cuento así porque..."), nunca la etiquetes como un "reto" especial — aplicala con total naturalidad, sin comentarla.`;
}
