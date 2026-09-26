# Py'aguasu IA — webapp

Tutor de Física con IA generativa en castellano y jopara,
para el Hackathon Kyhyje'ỹ IA. Next.js (App Router) + Tailwind v4, con una
capa de IA desacoplada que hoy usa Gemini y que puede pasar a Claude
cambiando una variable de entorno.

El nombre del producto es **Py'aguasu IA** (*py'aguasu*: "valiente" en
guaraní, en la línea del lema del hackathon, *kyhyje'ỹ* = "sin miedo");
el tutor de IA se presenta dentro del chat como **"Profe Física"**
(personaje/mascota, no el nombre de la app — mismo patrón que "Duo" en
Duolingo). El vocabulario jopara/guaraní que usa el tutor todavía tiene que
pasar por el lingüista del equipo antes de la demo (ver "Pendiente crítico"
más abajo).

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
   por: elegir rol (alumno/docente) → elegir perfil → elegir idioma
   (jopara/castellano/guaraní) → test rápido de 3 preguntas de estilo de
   aprendizaje → recién ahí la pantalla para escribir el problema. Cada vez
   que se elige un perfil se hace de nuevo el test (es lo que adapta cómo
   explica el tutor); solo al recargar la página con el perfil ya abierto se
   retoma directo en la pantalla del problema.

5. Correr las pruebas automáticas (vitest, no llaman a ninguna IA real):

   ```bash
   npm test
   ```

## Flujo de onboarding (antes de la primera pregunta de física)

1. **`PantallaIdioma`**: elige entre "jopara" (mezcla con castellano,
   **recomendado**: es el requisito indefectible de la guía del hackathon),
   "castellano" (español simple, la alternativa que pide la guía) o
   "guaraní" (guaraní completo) — bloquea el resto de la app hasta elegir.
   Se guarda en `estado.userLanguage`.
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
   resultado del test. Al elegir un perfil siempre se hace idioma → test;
   el resultado se guarda por perfil en `localStorage`
   (`src/lib/identidad/preferencias.js`) solo para retomar tras recargar la
   página. "Cambiar" idioma no repite el test.

## Panel "Conceptos" (material del docente)

En la pantalla del ejercicio aparece un botón **Conceptos** cuando el tema o
el enunciado corresponden a un tema con material cargado (hoy: choques y
cantidad de movimiento, desde `CONCEPTO.pdf`). Abre un panel con:

- **Ver en acción**: simulador de choque animado (`SimuladorChoque.js`):
  masas y velocidades ajustables, choque "quedan enganchados" o "rebotan",
  onda de impacto y sonido, y barras que muestran que $p_f = p_i$.
- **Conceptos**, **Fórmulas** (con unidades) y un **Ejemplo** resuelto con
  números distintos del ejercicio de práctica (no regala la respuesta).

Además, cuando el tutor menciona un concepto (ej. "velocidad final", "choque
inelástico"), debajo de su mensaje aparece un chip **Repasar: …** que abre un
modal con ese concepto aplicado al ejercicio: explicación, fórmula, "En tu
ejercicio" (datos del alumno, resultados en "?" hasta terminar, e inciso al que
corresponde) y acceso al simulador. La detección es determinística
(`src/lib/conceptos/glosario.js`), sin costo de IA.

El contenido vive en `src/lib/conceptos/` como datos: el profesor puede
revisarlo ahí, y para sumar otro tema se agrega un archivo y se registra en
`src/lib/conceptos/index.js`. La física del simulador está en
`src/lib/fisica/choques.js` (con pruebas).

## Vocabulario jopara (base del equipo)

El tutor usa la **base léxica del equipo** como referencia principal:
`src/lib/ai/jopara/base_jopara_tutor.json` (léxico, morfología, términos que
no se traducen, errores a evitar y plantillas del corrector). El lingüista
la actualiza ahí y el prompt se regenera solo (`src/lib/ai/jopara/guia.js`,
en versión compacta; las entradas "Validar" no se usan). Se incluye solo
cuando el idioma es jopara o guaraní. Los errores que se pueden corregir
automáticamente van en `src/lib/ai/vocabulario.js`.

## Velocidad de respuesta

Medido con el prompt real (26/09): el modelo principal es
`gemini-3.8-flash` con "pensamiento" `LOW` → ~3-4 s por turno (antes
~12-14 s). Se puede cambiar con `GEMINI_MODEL` y `GEMINI_THINKING` en
`.env.local` (ver `.env.local.example`). Los controles del servidor
(cuentas, evaluación, unidades, cierre prematuro) cubren los errores típicos
de razonar menos.

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
    PantallaIdioma.js          -> paso 1 del onboarding: elegir jopara/castellano/guaraní
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
en cada request — el tutor es *stateless*. (El progreso, XP y clases viven
en un store en memoria del servidor, `src/lib/store/`, que se pierde al
reiniciarlo: es un mock para la demo.) `POST /api/tutor` recibe:

- Primer turno: `{ esInicial: true, enunciado, idioma, learningLevel, historial: [] }`
  — la IA identifica tema/datos/incógnita y plantea SOLO la primera pregunta
  guía, sin resolver nada.
- Turnos siguientes: `{ esInicial: false, mensaje, idioma, learningLevel, historial, pedirAyuda? }`
  — la IA evalúa el intento del estudiante para el paso actual y responde
  con `correcta`, `mensaje` (feedback), `pista` (si se equivocó) o
  `formula` (si ese paso ya se cerró), hasta llegar a `completado: true`
  con `resultadoFinal` y `analogiaCotidiana`. Cada turno trae además
  `fueraDeTema`, `riesgo` (muestra contactos de ayuda) y `esIntento`
  (solo los intentos reales cuentan como error para el XP: un "estoy
  nervioso" o un "no sé" no castigan).
- `idioma` es `'jopara'`, `'castellano'` o `'guarani'` (`route.js` cae a
  `'jopara'` si viene cualquier otro valor). `learningLevel` es `'visual' | 'auditor' | 'kinestesico'`
  o `''` si el test todavía no se completó.

## Pendiente crítico (ver informe del proyecto)

- **Vocabulario de guaraní jopara**: `src/lib/ai/prompt.js`
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
