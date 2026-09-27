import Anthropic from '@anthropic-ai/sdk';
import { TURNO_JSON_SCHEMA, TURNO_TOOL_NAME } from '../schema';
import {
  construirInstruccionSistema,
  construirMensajeInicial,
  construirMensajeEstudiante,
  construirPrefijoIdioma,
} from '../prompt';

// Claude es el respaldo de Gemini (ver elegirProveedor/avanzarConProveedor en
// ../index.js): se usa cuando Gemini falla y hay ANTHROPIC_API_KEY, o como
// principal con AI_PROVIDER=claude. Opus 5 elegido tras probar con la API real
// (27/09): sigue mejor la guía jopara que Sonnet 5 ("mboýpa ovale", 3 a 5
// toques de guaraní) con la misma velocidad (~5-8 s por turno).
const MODELO_CLAUDE = process.env.CLAUDE_MODEL || 'claude-opus-5';

// El modelo "piensa" antes de responder y ese pensamiento cuenta dentro de
// max_tokens: con el límite viejo (2048) el turno podía cortarse antes de
// llegar a la herramienta y el alumno veía un error.
const MAX_TOKENS = 16000;

// Poco pensamiento = respuesta rápida, como GEMINI_THINKING=LOW en Gemini:
// un turno del tutor es corto y el alumno está esperando.
const ESFUERZO = process.env.CLAUDE_EFFORT || 'low';

function construirMessages({ historial, mensajeNuevo }) {
  const messages = historial.map((turno) => ({
    role: turno.autor === 'tutor' ? 'assistant' : 'user',
    content: turno.texto,
  }));
  messages.push({ role: 'user', content: mensajeNuevo });
  return messages;
}

export async function avanzarTurnoConClaude({ historial, idioma, materia, esInicial, enunciado, mensaje, pedirAyuda, learningLevel }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Falta ANTHROPIC_API_KEY en .env.local');
  }

  const mensajeBase = esInicial
    ? construirMensajeInicial({ enunciado })
    : construirMensajeEstudiante({ texto: mensaje, pedirAyuda });
  const mensajeNuevo = `${mensajeBase}\n\n${construirPrefijoIdioma({ idioma })}`;

  // Los reintentos ante sobrecarga (429, 529, 5xx, cortes de red) los hace el
  // propio SDK. timeout: si Claude no responde en 45 s, mejor avisar que
  // dejar al alumno esperando.
  const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 45_000 });

  const respuesta = await client.beta.messages.create({
    // Si un filtro de seguridad rechaza el turno, Anthropic lo vuelve a correr
    // en otro modelo de Claude (elegido según el motivo) en vez de devolver
    // el rechazo. "default" evita tener que mantener una lista de modelos.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    model: MODELO_CLAUDE,
    max_tokens: MAX_TOKENS,
    output_config: { effort: ESFUERZO },
    // Caché automática: las instrucciones del tutor son largas (incluyen la
    // base jopara) y se repiten en cada turno del mismo problema; con la
    // caché no se cobran completas cada vez.
    cache_control: { type: 'ephemeral' },
    system: construirInstruccionSistema({ materia, learningLevel, idioma }),
    messages: construirMessages({ historial, mensajeNuevo }),
    tools: [
      {
        name: TURNO_TOOL_NAME,
        description: 'Entrega la respuesta estructurada de este turno del tutor.',
        input_schema: TURNO_JSON_SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: TURNO_TOOL_NAME },
  });

  // Se revisa por qué terminó ANTES de leer el contenido: si se cortó, el
  // turno de la herramienta puede venir a medias. Un "refusal" acá significa
  // que también rechazó el modelo de respaldo.
  if (respuesta.stop_reason === 'refusal') {
    throw new Error('Claude no quiso responder este turno (rechazo de seguridad).');
  }
  if (respuesta.stop_reason === 'max_tokens') {
    throw new Error('La respuesta de Claude se cortó antes de terminar el turno.');
  }

  const bloqueHerramienta = respuesta.content.find(
    (bloque) => bloque.type === 'tool_use' && bloque.name === TURNO_TOOL_NAME
  );

  if (!bloqueHerramienta) {
    throw new Error('Claude no devolvió el turno estructurado esperado.');
  }

  return bloqueHerramienta.input;
}
