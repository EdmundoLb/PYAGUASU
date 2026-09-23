import Anthropic from '@anthropic-ai/sdk';
import { TURNO_JSON_SCHEMA, TURNO_TOOL_NAME } from '../schema';
import {
  construirInstruccionSistema,
  construirMensajeInicial,
  construirMensajeEstudiante,
  construirPrefijoIdioma,
} from '../prompt';
import { conReintentos } from '../reintentar';

const MODELO_CLAUDE = process.env.CLAUDE_MODEL || 'claude-sonnet-5';

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

  const client = new Anthropic({ apiKey });

  const respuesta = await conReintentos(() =>
    client.messages.create({
      model: MODELO_CLAUDE,
      max_tokens: 2048,
      system: construirInstruccionSistema({ materia, learningLevel }),
      messages: construirMessages({ historial, mensajeNuevo }),
      tools: [
        {
          name: TURNO_TOOL_NAME,
          description: 'Entrega la respuesta estructurada de este turno del tutor.',
          input_schema: TURNO_JSON_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: TURNO_TOOL_NAME },
    })
  );

  const bloqueHerramienta = respuesta.content.find(
    (bloque) => bloque.type === 'tool_use' && bloque.name === TURNO_TOOL_NAME
  );

  if (!bloqueHerramienta) {
    throw new Error('Claude no devolvió el turno estructurado esperado.');
  }

  return bloqueHerramienta.input;
}
