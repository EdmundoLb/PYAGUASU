# Néike Pyahureko — webapp

Tutor de Física con IA generativa en jopara y guaraní paraguayo completo,
para el Hackathon Kyhyje'ỹ IA. Next.js (App Router) + Tailwind v4, con una
capa de IA desacoplada que hoy usa Gemini y que puede pasar a Claude
cambiando una variable de entorno.

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

4. Abrir [http://localhost:3000](http://localhost:3000). El primer uso pasa
   por: elegir idioma (jopara/guaraní) → test rápido de 3 preguntas de estilo
   de aprendizaje → recién ahí la pantalla para escribir el problema.

## Flujo de onboarding (antes de la primera pregunta de física)

1. **`PantallaIdioma`**: elige entre "jopara" (mezcla con castellano) o
   "guaraní" (completo, sin mezclar) — bloquea el resto de la app hasta
   elegir. Se guarda en `appState.userLanguage`.
2. **`PantallaQuizDiagnostico`**: 3 preguntas situacionales (`src/lib/quiz/diagnostico.js`,
   `PREGUNTAS_DIAGNOSTICO`) basadas en VAK + Felder-Silverman. Cada opción
   suma un punto a `visualScore` / `auditoryScore` / `kinestheticScore`; al
   terminar se calcula el canal predominante (`calcularEstiloPredominante`)
   y se guarda en `appState.learningLevel` (`'visual' | 'auditor' | 'kinestesico'`).
3. Ese `learningLevel` viaja en cada request a `/api/tutor` y se inyecta en
   el prompt vía `construirContextoAprendizaje` — cambia CÓMO explica la IA
   (diagramas ASCII / narración / retos con datos reales), nunca el
   contenido. **Importante**: ese texto de contexto nunca nombra la
   categoría ("visual", "kinestésico", etc.) — un LLM tiende a repetir
   palabras salientes de sus propias instrucciones, así que si la palabra no
   está en el prompt, no puede filtrarse a la respuesta. Si se edita ese
   archivo, mantener esa restricción.
4. "Resolver otro problema" reinicia solo el problema, no el idioma ni el
   resultado del test (se piden una sola vez por sesión de la app, no por
   ejercicio).

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
    page.js             -> fase idioma/quiz/inicio/conversando + pantalla de chat con el tutor
    api/tutor/route.js  -> endpoint que avanza UN turno de la conversación
  components/
    PantallaIdioma.js          -> paso 1 del onboarding: elegir jopara/guaraní
    PantallaQuizDiagnostico.js -> paso 2 del onboarding: test VAK/Felder-Silverman
    BurbujaChat.js              -> el último mensaje del tutor se resalta como
                                    "tarjeta de lección" (activa=true), coloreada
                                    según el último resultado (nueva/correcta/incorrecta)
  lib/
    quiz/diagnostico.js  -> preguntas del test + cálculo de estilo + contexto para la IA
    ai/
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

- Primer turno: `{ esInicial: true, enunciado, idioma, learningLevel, historial: [] }`
  — la IA identifica tema/datos/incógnita y plantea SOLO la primera pregunta
  guía, sin resolver nada.
- Turnos siguientes: `{ esInicial: false, mensaje, idioma, learningLevel, historial, pedirAyuda? }`
  — la IA evalúa el intento del estudiante para el paso actual y responde
  con `correcta`, `mensaje` (feedback), `pista` (si se equivocó) o
  `formula` (si ese paso ya se cerró), hasta llegar a `completado: true`
  con `resultadoFinal` y `analogiaCotidiana`.
- `idioma` es `'jopara'` o `'guarani'` (`route.js` cae a `'jopara'` si viene
  cualquier otro valor). `learningLevel` es `'visual' | 'auditor' | 'kinestesico'`
  o `''` si el test todavía no se completó.

## Pendiente crítico (ver informe del proyecto)

- **Vocabulario de guaraní jopara y guaraní completo**: `src/lib/ai/prompt.js`
  (`VOCABULARIO_JOPARA_BORRADOR`) y `src/lib/quiz/diagnostico.js` (las 3
  preguntas del test, traducidas a mano) son un punto de partida técnico, NO
  validado por un hablante/lingüista. Es tarea P0 del rol de lingüista del
  equipo revisarlos antes de cualquier demo. Se intentó regenerar las
  traducciones del test con la API de Gemini y salieron peor (guaraní mal
  formado) que el borrador manual — no usar ese atajo sin revisión humana.
- **Vocabulario ofensivo en guaraní**: la IA en algún momento usó "tavy"
  (insulto leve, "tonto/boludo") al dirigirse al estudiante. Se agregó una
  prohibición explícita en el prompt (punto 5 de `construirInstruccionSistema`),
  pero como es un LLM no hay garantía absoluta — conviene que alguien
  guaraní-hablante revise transcripciones reales antes de la demo.
- **Cuota gratuita de Gemini**: la key de `.env.local` está en el tier
  gratuito, limitado a 20 requests/día en `gemini-3.6-flash` (ver
  `GEMINI_MODEL_FALLBACK` en `providers/gemini.js` para el modelo de
  respaldo). Se agotó varias veces solo probando durante el desarrollo —
  riesgo real de quedarse sin cuota en medio de la demo. Conseguir una key
  con tier pagado antes del hackathon.
- **Validación docente de contenido**: falta que un profesor de Física
  revise las respuestas generadas para los temas que se vayan sumando.
- **Modo offline**: este MVP todavía depende 100% de la conexión a internet
  para llamar a la IA. Es la siguiente tarea grande (service worker +
  contenido cacheado) según la lista de prioridades ya acordada.
