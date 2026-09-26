import { GoogleGenAI } from '@google/genai';
import { TURNO_JSON_SCHEMA } from '../schema';
import {
  construirInstruccionSistema,
  construirMensajeInicial,
  construirMensajeEstudiante,
  construirPrefijoIdioma,
} from '../prompt';
import { conReintentos, obtenerCodigoHttp } from '../reintentar';
import { repararEscapesInvalidosEnJson } from '../../latex/escapes';

// En los picos de demanda Google responde 503 ("high demand") por modelo,
// y en el tier gratuito pasa seguido: el 25/09 se probaron uno por uno y
// estaban todos saturados a la vez. Por eso hay una CADENA de respaldos
// (no uno solo): si un modelo está saturado se pasa al siguiente, dentro de
// un tiempo máximo para no dejar al alumno esperando de más.
//
// .env.local: GEMINI_MODEL (principal) y GEMINI_MODEL_FALLBACK (lista
// separada por comas). gemini-2.5-* ya no está habilitado para keys nuevas.
// Principal: gemini-3.8-flash. Medido el 26/09 con el prompt real (primer
// turno de un choque): 6,2 s vs 12,6 s de gemini-3.6-flash (piensa la mitad
// de tokens antes de responder), con igual o mejor calidad.
const MODELO_GEMINI = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const MODELOS_RESPALDO = (
  process.env.GEMINI_MODEL_FALLBACK ||
  'gemini-3.6-flash,gemini-3.7-flash,gemini-3.5-flash,gemini-flash-lite-latest,gemini-3.5-flash-lite'
)
  .split(',')
  .map((m) => m.trim())
  .filter((m) => m && m !== MODELO_GEMINI);

// Tiempo máximo recorriendo la cadena (algunos 503 tardan hasta ~6 s en
// volver). Pasado este tiempo se devuelve el error y el alumno puede tocar
// "Reintentar".
const TIEMPO_MAXIMO_MS = 25000;

// 503/429/529: modelo saturado o con límite momentáneo. 404: modelo no
// habilitado para esta key. En ambos casos conviene probar el siguiente;
// cualquier otro error (key inválida, pedido mal formado) se corta ahí.
function convieneProbarOtroModelo(error) {
  return [404, 429, 503, 529].includes(obtenerCodigoHttp(error));
}

function construirContents({ historial, mensajeNuevo }) {
  const contents = historial.map((turno) => ({
    role: turno.autor === 'tutor' ? 'model' : 'user',
    parts: [{ text: turno.texto }],
  }));
  contents.push({ role: 'user', parts: [{ text: mensajeNuevo }] });
  return contents;
}

// Nivel de "pensamiento" interno del modelo antes de responder: es lo que más
// pesa en la demora. Medido el 26/09 con el prompt real y la base jopara
// (gemini-3.8-flash): normal ≈ 12-14 s por turno, LOW ≈ 3 s, con jopara y
// evaluación correctos. Los controles del servidor (verificación de cuentas,
// evaluación, unidades, cierre prematuro) cubren los errores típicos de
// razonar menos. .env.local: GEMINI_THINKING = LOW | MEDIUM | HIGH | normal.
const NIVEL_PENSAMIENTO = (process.env.GEMINI_THINKING || 'LOW').toUpperCase();

function configuracion({ materia, learningLevel, idioma }, conPensamiento) {
  const config = {
    systemInstruction: construirInstruccionSistema({ materia, learningLevel, idioma }),
    responseMimeType: 'application/json',
    responseSchema: TURNO_JSON_SCHEMA,
    temperature: 0.4,
  };
  if (conPensamiento && NIVEL_PENSAMIENTO !== 'NORMAL') config.thinkingConfig = { thinkingLevel: NIVEL_PENSAMIENTO };
  return config;
}

async function pedirTurno(ai, modelo, datos, intentos) {
  const generar = (conPensamiento) =>
    conReintentos(() => ai.models.generateContent({ model: modelo, contents: datos.contents, config: configuracion(datos, conPensamiento) }), {
      intentos,
    });
  let respuesta;
  try {
    respuesta = await generar(true);
  } catch (error) {
    // Un modelo de respaldo que no admite el nivel de pensamiento responde
    // 400: se reintenta sin esa opción en vez de cortar la cadena.
    if (obtenerCodigoHttp(error) !== 400 || !/think/i.test(String(error?.message))) throw error;
    respuesta = await generar(false);
  }

  const texto = respuesta.text;
  if (!texto) {
    throw new Error(`Gemini (${modelo}) no devolvió contenido de texto.`);
  }

  try {
    return JSON.parse(texto);
  } catch (error) {
    // LaTeX con barra simple ("\cdot", "\sqrt") es un escape inválido en
    // JSON: en vez de perder el turno entero, se repara y se reintenta.
    try {
      return JSON.parse(repararEscapesInvalidosEnJson(texto));
    } catch {
      throw error;
    }
  }
}

export async function avanzarTurnoConGemini({ historial, idioma, materia, esInicial, enunciado, mensaje, pedirAyuda, learningLevel }) {
  // GEMINI_API_KEY acepta varias keys separadas por coma: la cuota del tier
  // gratuito es por key, así que la segunda sirve de respaldo si la primera
  // se queda sin cuota o sin respuesta.
  const apiKeys = (process.env.GEMINI_API_KEY || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (apiKeys.length === 0) {
    throw new Error('Falta GEMINI_API_KEY en .env.local');
  }

  const mensajeBase = esInicial
    ? construirMensajeInicial({ enunciado })
    : construirMensajeEstudiante({ texto: mensaje, pedirAyuda });
  const mensajeNuevo = `${mensajeBase}\n\n${construirPrefijoIdioma({ idioma })}`;

  const contents = construirContents({ historial, mensajeNuevo });

  const limite = Date.now() + TIEMPO_MAXIMO_MS;
  const cadena = [MODELO_GEMINI, ...MODELOS_RESPALDO];
  let primerError;
  for (const [k, apiKey] of apiKeys.entries()) {
    const ai = new GoogleGenAI({ apiKey });
    for (const [i, modelo] of cadena.entries()) {
      if ((k > 0 || i > 0) && Date.now() > limite) throw primerError;
      try {
        // El principal de la primera key se reintenta (los picos suelen
        // durar segundos); el resto, una vez cada uno para recorrer rápido.
        return await pedirTurno(ai, modelo, { contents, materia, learningLevel, idioma }, k === 0 && i === 0 ? 2 : 1);
      } catch (error) {
        primerError ??= error;
        console.warn(`[gemini] key ${k + 1}, ${modelo} falló (${obtenerCodigoHttp(error) ?? error.message}); probando el siguiente...`);
        if (!convieneProbarOtroModelo(error)) break; // ej. key inválida: pasar a la siguiente key
      }
    }
  }
  throw primerError;
}
