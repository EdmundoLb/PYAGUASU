# Néike Pyahureko — webapp

Tutor de Física con IA generativa en castellano y guaraní jopara, para el
Hackathon Kyhyje'ỹ IA. Next.js (App Router) + Tailwind v4, con una capa de
IA desacoplada que hoy usa Gemini y que puede pasar a Claude cambiando una
variable de entorno.

El nombre del producto es **Néike Pyahureko**; el tutor de IA se presenta
dentro del chat como **"Profe Física"** (personaje/mascota, no el nombre de
la app — mismo patrón que "Duo" en Duolingo). El nombre completo todavía
tiene que pasar por el lingüista del equipo antes de la demo, igual que el
vocabulario jopara.

**Es un tutor socrático, no un solucionador**: la IA nunca entrega la
resolución completa de una. Parte el problema en micro-pasos, le pregunta
al estudiante uno por uno, evalúa su intento (correcto → confirma y muestra
recién esa fórmula / incorrecto → da una pista sin resolver por él) y solo
al final arma el resultado completo. Hay un botón "Mostrame este paso" para
cuando el estudiante se traba de verdad. Esto es a propósito: es lo que pide
la rúbrica del hackathon (enseñar/corregir, no traducir ni resolver de una).

## Cómo arrancar

1. Instalar dependencias (ya hecho si acaban de clonar, si no: `npm install`).
2. Copiar `.env.local.example` a `.env.local` y completar `GEMINI_API_KEY`
   con una key de [Google AI Studio](https://aistudio.google.com/apikey).
3. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Abrir [http://localhost:3000](http://localhost:3000), escribir un problema
   de física y probar la resolución paso a paso.

## Cómo pasar de Gemini a Claude

Cuando tengan la API key de Anthropic:

1. Agregar `ANTHROPIC_API_KEY=...` en `.env.local`.
2. Cambiar `AI_PROVIDER=claude` en `.env.local` (o dejarlo vacío: si las dos
   keys están presentes, por defecto gana Gemini — ver `src/lib/ai/index.js`).

No hace falta tocar ningún componente de la interfaz: la ruta
`POST /api/tutor` y la página siguen iguales.

## Estructura relevante

```
src/
  app/
    page.js             -> pantalla de chat con el tutor (pregunta -> intento -> feedback)
    api/tutor/route.js  -> endpoint que avanza UN turno de la conversación
  lib/ai/
    index.js             -> elige el proveedor (gemini | claude) y valida el turno
    prompt.js             -> reglas del tutor socrático + borrador de jopara
    schema.js             -> forma estructurada de un turno (TURNO_JSON_SCHEMA)
    reintentar.js          -> reintentos + backoff para 429/503/529 transitorios
    providers/gemini.js    -> incluye modelo de respaldo si el principal está saturado
    providers/claude.js
```

### Cómo funciona un turno

El cliente (`page.js`) mantiene el `historial` completo de la conversación
en memoria (`{ autor: 'estudiante' | 'tutor', texto }`) y lo reenvía entero
en cada request — el servidor es *stateless*, no hay base de datos ni
sesión. `POST /api/tutor` recibe:

- Primer turno: `{ esInicial: true, enunciado, idioma, historial: [] }` — la
  IA identifica tema/datos/incógnita y plantea SOLO la primera pregunta
  guía, sin resolver nada.
- Turnos siguientes: `{ esInicial: false, mensaje, idioma, historial, pedirAyuda? }`
  — la IA evalúa el intento del estudiante para el paso actual y responde
  con `correcta`, `mensaje` (feedback), `pista` (si se equivocó) o
  `formula` (si ese paso ya se cerró), hasta llegar a `completado: true`
  con `resultadoFinal` y `analogiaCotidiana`.

## Pendiente crítico (ver informe del proyecto)

- **Vocabulario de guaraní jopara**: `src/lib/ai/prompt.js` tiene un
  `VOCABULARIO_JOPARA_BORRADOR` escrito como punto de partida técnico, NO
  validado por un hablante/lingüista. Es tarea P0 del rol de lingüista del
  equipo revisarlo y ampliarlo antes de cualquier demo.
- **Validación docente de contenido**: falta que un profesor de Física
  revise las respuestas generadas para los temas que se vayan sumando.
- **Modo offline**: este MVP todavía depende 100% de la conexión a internet
  para llamar a la IA. Es la siguiente tarea grande (service worker +
  contenido cacheado) según la lista de prioridades ya acordada.
