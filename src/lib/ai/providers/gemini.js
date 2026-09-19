import { GoogleGenAI } from '@google/genai';
import { TURNO_JSON_SCHEMA } from '../schema';
import {
  construirInstruccionSistema,
  construirMensajeInicial,
  construirMensajeEstudiante,
  construirPrefijoIdioma,
} from '../prompt';
import { conReintentos } from '../reintentar';

// 'gemini-flash-latest' devolvía 503 (alta demanda) al probarlo; confirmé a
// mano que 'gemini-3.6-flash' responde bien con esta key. Si ESE también
// está sobrecargado (pasó en pruebas reales), caemos a un modelo más chico
// que respondió al instante, para no perder la demo por un pico de tráfico
// del lado de Google. Ambos se pueden sobreescribir en .env.local.
const MODELO_GEMINI = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const MODELO_GEMINI_RESPALDO = process.env.GEMINI_MODEL_FALLBACK || 'gemini-flash-lite-latest';

function construirContents({ historial, mensajeNuevo }) {
  const contents = historial.map((turno) => ({
    role: turno.autor === 'tutor' ? 'model' : 'user',
    parts: [{ text: turno.texto }],
  }));
  contents.push({ role: 'user', parts: [{ text: mensajeNuevo }] });
  return contents;
}

async function pedirTurno(ai, modelo, { contents, materia }) {
  const respuesta = await conReintentos(() =>
    ai.models.generateContent({
      model: modelo,
      contents,
      config: {
        systemInstruction: construirInstruccionSistema({ materia }),
        responseMimeType: 'application/json',
        responseSchema: TURNO_JSON_SCHEMA,
        temperature: 0.4,
      },
    })
  );

  const texto = respuesta.text;
  if (!texto) {
    throw new Error(`Gemini (${modelo}) no devolvió contenido de texto.`);
  }

  return JSON.parse(texto);
}

export async function avanzarTurnoConGemini({ historial, idioma, materia, esInicial, enunciado, mensaje, pedirAyuda }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Falta GEMINI_API_KEY en .env.local');
  }

  const mensajeBase = esInicial
    ? construirMensajeInicial({ enunciado })
    : construirMensajeEstudiante({ texto: mensaje, pedirAyuda });
  const mensajeNuevo = `${mensajeBase}\n\n${construirPrefijoIdioma({ idioma })}`;

  const contents = construirContents({ historial, mensajeNuevo });
  const ai = new GoogleGenAI({ apiKey });

  try {
    return await pedirTurno(ai, MODELO_GEMINI, { contents, materia });
  } catch (errorPrincipal) {
    if (!MODELO_GEMINI_RESPALDO || MODELO_GEMINI_RESPALDO === MODELO_GEMINI) {
      throw errorPrincipal;
    }
    try {
      return await pedirTurno(ai, MODELO_GEMINI_RESPALDO, { contents, materia });
    } catch {
      throw errorPrincipal;
    }
  }
}
