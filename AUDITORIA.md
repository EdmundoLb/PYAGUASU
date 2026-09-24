# Informe de auditoría — Py'aguasu IA (webapp)

**Fecha:** 2026-09-24 · **Rama:** `pyaguasu2` (commit `26581e2`) · **Alcance:** todo `src/`, `public/sw.js`, configuración y dependencias.

## Resumen ejecutivo

El proyecto está **bien estructurado para un MVP de hackathon**: la capa de IA está desacoplada del proveedor, el prompt pedagógico es sólido y detallado, hay verificación aritmética de los cálculos del modelo con mathjs, reintentos con backoff, saneamiento de la salida del modelo y un código muy bien comentado. Build, lint y `npm audit` pasan limpios.

Había **dos bugs que rompían la demo**; ya están corregidos y verificados en el navegador (ver C1 y C2):

1. **El panel docente y el ranking se caen apenas cargan** (bucle infinito de React).
2. **Un alumno recién creado queda bloqueado si el servidor se reinicia** (o, en Vercel, cada vez que arranca una instancia nueva).

| Área | Nota | Comentario |
|---|---|---|
| Arquitectura y legibilidad | 8/10 | Capas claras (store / ai / gamificación / UI), comentarios que explican el *porqué*. |
| Lógica de IA y pedagogía | 8/10 | Prompt socrático bien pensado; verificación matemática en el servidor. |
| Corrección funcional | 7/10 | Los 2 bugs críticos ya están corregidos; quedan varios menores. |
| Seguridad | 3/10 | Aceptable para una demo, **no apta para producción**: sin autenticación ni límites. |
| Pruebas | 0 → 6/10 | No había ningún test; esta auditoría agrega 58. |
| Despliegue / operación | 4/10 | Store en memoria incompatible con serverless; cuota gratuita de Gemini. |

## Pruebas realizadas

| Prueba | Resultado |
|---|---|
| `next build` (producción) | ✅ Compila, 15 páginas / 13 rutas de API |
| `eslint` | ✅ 0 errores, 2 advertencias menores |
| `npm audit --omit=dev` | ✅ 0 vulnerabilidades |
| **Suite nueva `npm test` (vitest)**: 65 pruebas | ✅ 65/65 pasan |
| Servidor de producción + `curl` sobre las APIs | ✅ Funcionan; se confirmó el bug de perfil tras reinicio |
| Navegador (Chrome) sobre `/docente` y `/ranking` | ❌ Se caían con React error #185 → ✅ corregido |
| Llamada real a `/api/tutor` (Gemini) | ✅ Responde; ❌ se filtró una etiqueta interna (ver M3) |

La suite nueva está en `tests/` y cubre: niveles/XP, insignias, quiz de diagnóstico, verificación matemática, reintentos, construcción del prompt, schema, `avanzarTurno` con un proveedor simulado (saneamiento y reintento de corrección), repositorios del store, rutas de la API y `perfilActivo`. Las pruebas que llevan los prefijos **`[BUG]`** o **`[SEGURIDAD]`** *documentan el comportamiento defectuoso actual*: cuando se corrija un hallazgo, hay que invertir la aserción de su prueba.

Cómo correrla: `npm test`

---

## Hallazgos

### 🔴 Críticos (rompen la demo)

**✅ RESUELTO — C1. `/docente`, `/docente/clases/[id]`, `/docente/clases/nueva` y `/ranking` se caen con "Maximum update depth exceeded".**
`src/lib/identidad/perfilActivo.js` → `leerPerfilActivo()` hace `JSON.parse` en cada llamada y devuelve un objeto nuevo cada vez. Esas páginas la pasan como `getSnapshot` a `useSyncExternalStore`, que exige que el valor sea el mismo (`Object.is`) mientras el store no cambie. React detecta un "cambio" en cada render y entra en un bucle infinito.
*Verificado en Chrome:* pantalla "This page couldn't load" y React error #185 en la consola. Además, al entrar a `/ranking` escribiendo la URL, el primer render (snapshot del servidor = `null`) dispara `router.replace('/')` antes de leer el perfil.
*Arreglo:* cachear el snapshot usando el string crudo como clave (si `localStorage.getItem` devuelve el mismo string, devolver el mismo objeto), y distinguir entre "todavía no hidrató" y "no hay perfil" antes de redirigir.

**✅ RESUELTO — C2. Un perfil creado en la sesión deja de existir cuando el servidor se reinicia, y el alumno queda trabado.**
El store vive en memoria (`db.js`) y el perfil elegido se guarda en `localStorage`. Después de un reinicio, `POST /api/sesiones/iniciar` responde `{"error":"Perfil de alumno inválido."}` (*verificado*). Como `comenzarProblema` (`src/app/page.js:236`) usa `Promise.all` con la llamada al tutor, **falla el problema entero** y la UI queda en la fase `error` sin botón para volver: el input sigue visible y, si el alumno escribe, se manda un turno sin enunciado.
En Vercel (serverless) esto pasa todo el tiempo: cada instancia tiene su propia memoria.
*Arreglo:* que la sesión de XP no bloquee al tutor (`Promise.allSettled`, o iniciar la sesión aparte); si el perfil no existe, limpiar `localStorage` y volver al selector; agregar un botón "Volver" en la fase de error. A mediano plazo, usar una base de datos real (SQLite/Turso, Supabase, Vercel KV).

### 🟠 Altos (seguridad)

**S1. No hay autenticación ni autorización en ninguna API.** Cualquiera puede listar perfiles, crear clases, crear tareas en la clase de otro docente y ver el detalle de cualquier clase. Las pruebas lo demuestran:
- Un tercero lleva a "Luis Acosta" del último al 1er puesto del ranking con 20 pares iniciar/completar, sin resolver nada.
- Se puede crear una tarea con `xpRecompensa: 1000000` en cualquier clase.
- El servidor confía en `errores` enviado por el cliente: se aceptan valores negativos y se puede mandar siempre `0` para cobrar el bonus y la insignia "Impecable".

Para una demo alcanza con saberlo, pero hay que decirlo si alguien pregunta. *Mínimo razonable:* que el servidor calcule los errores (a partir de los turnos que ya pasan por `/api/tutor`), validar que `creadaPorId` sea el docente dueño de la clase y acotar `xpRecompensa`.

**🟡 PARCIAL — S2. `/api/tutor` es un proxy abierto y sin límites a la API de IA paga.** No tiene rate limiting ni tope de tamaño para `historial`/`mensaje` (una prueba mandó 5000 mensajes y fue aceptado). Encima, el cliente controla `materia` (se interpola en el system prompt) y todo el `historial`, **incluidos los turnos con autor `tutor`**, así que se pueden fabricar respuestas previas del "profe" para sacarlo de su rol. Con la cuota gratuita de 20 requests/día, cualquiera que encuentre la URL puede dejar la demo sin IA.
*Arreglo:* rate limit por IP, tope de turnos y de caracteres, lista blanca de `materia` y, como mínimo, verificar que el historial alterne entre estudiante y tutor.

**✅ RESUELTO — S3. Los errores internos del proveedor se muestran al usuario** (`src/app/api/tutor/route.js:57` devuelve `error.message` tal cual). Pueden exponer detalles de la cuota, del modelo o de la configuración. Conviene loguearlos en el servidor y devolver un mensaje genérico.

### 🟡 Medios

**✅ RESUELTO — M1. La expresión de `verificacion` se evalúa con `mathjs.evaluate` sin restricciones.** El comentario dice "solo + - * / ^ ( )", pero se acepta todo el lenguaje de mathjs (`ones()`, `sum()`, matrices…). La expresión viene del modelo, que el alumno puede influenciar, y una matriz gigante bloquea el servidor. *Arreglo:* validar con una regex `^[\d\s.+\-*/^()eE]+$` antes de evaluar.

**M2. Las respuestas correctas del quiz de opción múltiple llegan al navegador.** `opciones[].correcta` va en el JSON, así que un alumno puede verlas con las DevTools. Es aceptable en un MVP; si importa, que el servidor evalúe la opción elegida.

**✅ RESUELTO — M3. Se filtran etiquetas internas del prompt.** En una prueba real, ante un saludo, el tutor respondió: *"…ejerure chéve [GENERAR_PROBLEMA]…"*. Conviene agregar al prompt una regla del estilo "nunca menciones etiquetas entre corchetes" y/o filtrar `\[[A-Z_]+\]` en la respuesta.

**✅ RESUELTO — M4. El título del tema (texto libre del docente) se interpola sin escapar** en el pedido `[GENERAR_PROBLEMA]` (`prompt.js`, `construirSolicitudProblemaGenerado`). Es un vector de prompt injection de bajo impacto.

**✅ RESUELTO — M5. Mensajes "fuera de tema" o emocionales cuentan como error para el XP.** El prompt manda `correcta=false` en esos casos, y `page.js:339` suma un error por cada `correcta === false`. Si un alumno dice "estoy nervioso", pierde el bonus "sin errores" y la insignia "Impecable", lo que contradice la intención pedagógica. *Arreglo:* no contar el error si `fueraDeTema` es verdadero o si el paso no cambió por un pedido de ayuda.

**Nota sobre S2 (2026-09-24):** ya hay tope de 80 turnos y 4000 caracteres por texto, lista blanca de `materia` e `idioma`, y el historial se sanea (solo autores `estudiante`/`tutor`). **No** se agregó rate limit por IP a propósito: en un aula todos los celulares suelen salir por la misma IP, y un límite por IP bloquearía la demo. La protección real de la cuota es una key paga.

**M6. Integridad de datos del store.**
- Cuando un alumno se cambia de clase, no se lo saca de `alumnosIds` de la anterior y queda en los dos rankings (probado).
- Se puede crear una tarea con un tema que pertenece a otra clase (probado).
- La "racha" suma 1 por sesión y no cuenta días consecutivos: 5 problemas seguidos ya dan "Racha de fuego" (probado), aunque la descripción de la insignia dice otra cosa.
- Faltan límites de largo en nombres y títulos (se aceptó un nombre de 100.000 caracteres).

### 🟢 Bajos / mantenimiento

- **✅ RESUELTO — README desactualizado:** dice que los idiomas son "jopara/castellano", pero el código usa `jopara | guarani` (la API convierte cualquier otro valor en `jopara`). También dice "no hay base de datos ni sesión", y hoy existe el store de gamificación.
- **No hay headers de seguridad** (CSP, `X-Frame-Options`, `X-Content-Type-Options`), y `X-Powered-By: Next.js` está expuesto. Se puede agregar `headers()` y `poweredByHeader: false` en `next.config.mjs`.
- **Advertencias de lint:** `display=block` en la fuente (está justificado en un comentario) y un `eslint-disable` sin uso en `TecladoMatematico.js:43`.
- En `SelectorTemaPractica`, si `/api/temas` falla, la lista queda vacía sin ningún mensaje.
- `clases.js` genera el código de invitación con `Math.random` y 4 caracteres, sin comprobar colisiones. Para un MVP alcanza.
- **✅ RESUELTO — El Service Worker rompía `npm run dev`.** `sw.js` cachea `/_next/static/*` con "caché primero", asumiendo que esos nombres llevan hash del contenido. En `next dev` no lo llevan (Turbopack mantiene nombres como `src_xxx._.js` aunque cambie el código), así que el navegador ejecutaba JS viejo mezclado con el runtime nuevo: `Internal Next.js error: Router action dispatched before initialization` y cambios que no aparecían. *Arreglo:* el SW solo se registra en producción, en desarrollo se desinstala solo y el caché pasó a `v3` para descartar lo que había quedado.

### ✅ Lo que está bien hecho

- La salida de la IA se renderiza como texto React y KaTeX (con `trust` desactivado): **no hay XSS**, y no aparece `dangerouslySetInnerHTML` en ningún lado.
- `.env.local` está ignorado por git y no hay secretos commiteados.
- Defensa en profundidad sobre la salida del modelo (`sanearElementosEscena`, `sanearVariableExplorable`).
- Verificación aritmética con un reintento silencioso: una muy buena idea, y tiene pruebas.
- Reintentos con backoff y un modelo de respaldo para Gemini.
- `completarSesion` es idempotente (no se cobra XP dos veces por doble clic).
- Las reglas de prompt (no nombrar el estilo de aprendizaje y prohibir "tavy") están ahora cubiertas por pruebas automáticas.

---

## Prioridades recomendadas

| # | Acción | Esfuerzo |
|---|---|---|
| 1 | ~~Arreglar C1~~ ✅ hecho | — |
| 2 | ~~Arreglar C2~~ ✅ hecho | — |
| 3 | ~~Topes de tamaño en `/api/tutor` (S2) y mensaje de error genérico (S3)~~ ✅ hecho · falta rate limit (ver S2) | — |
| 4 | ~~Regex antes de `mathjs.evaluate` (M1) y filtrar etiquetas `[...]` (M3)~~ ✅ hecho | — |
| 5 | ~~Que un mensaje fuera de tema no cuente como error (M5)~~ ✅ hecho | — |
| 6 | ~~Actualizar el README~~ ✅ hecho | — |
| 7 | Post-hackathon: base de datos real + autenticación (S1, C2 de fondo) | días |

Pendientes que ya conoce el equipo y que esta auditoría confirma: revisión del jopara/guaraní por un hablante nativo, key paga de Gemini (en esta auditoría se usó 1 request real de la cuota) y revisión del contenido por un docente de Física.

---

## Cumplimiento de la guía del participante (revisión del 24/09)

Contrastado contra `guia-participante-kyhyjey-ia.pdf` (rúbrica, sección 8, y orientaciones de diseño, sección 4.2).

| Requisito de la guía | Estado | Qué se hizo / qué falta |
|---|---|---|
| Jopara como idioma **esencial** y castellano como **alternativa** (§4.1) | ✅ | Se recuperó la opción castellano, que se había perdido en el merge `26581e2`: prompt, pantalla y test de diagnóstico. Jopara aparece primero y marcado "Recomendado". Se mantiene la opción "guaraní completo". |
| No es solo un traductor (§2) | ✅ | Tutor socrático paso a paso. |
| Reducir el miedo a equivocarse (§4.2, 25 pts) | ✅ | Ahora "estoy nervioso", "no sé", las preguntas y los desvíos **no cuentan como error** ni pintan la burbuja de rojo (campo `esIntento`). |
| Espacio de práctica **sin exposición ante compañeros** (§4.2) | ⚠️ | El ranking público por XP va en sentido contrario. Decisión de producto pendiente: ocultarlo, hacerlo opcional o mostrar solo el progreso propio. |
| Señales de riesgo | ✅ | `fueraDeTema` y `riesgo` no estaban en el schema, así que Gemini nunca los devolvía. Ahora sí: con `riesgo` aparece una tarjeta de ayuda (147 Fono Ayuda y 911, **a confirmar con la organización**); con 3 desvíos seguidos, un banner "¿Volvemos al problema?". |
| Interfaz simple (§4.2) | ✅ | El idioma y el test se recuerdan por perfil y ya no se piden en cada apertura. "Cambiar perfil" está visible. |
| Modo con conectividad limitada o nula (§4.2, lo pide más del 93%) | ❌ | Solo hay un mensaje claro de "sin conexión". Sin internet el tutor no funciona. Propuesta para el pitch y la continuidad: un banco de problemas con pistas pregeneradas y validadas por los docentes, guardado en el celular. |
| Contenido validado por profesores (20 pts) | ⚠️ | Pendiente: usar las validaciones del día 1 (17:00) y del día 2 (17:30). |
| Calidad del jopara, validada por el lingüista (20 pts) | ⚠️ | Pendiente: `GUIA_JOPARA` en `prompt.js` y los textos de `diagnostico.js`. Revisar también la ortografía de los ejemplos ("ko'ág̃a", "hag̃ua"). |
| Terminología de los textos del MEC (§4.3) | ⚠️ | Cuando la organización comparta los libros, sumar al prompt un glosario con sus términos. |
| Funcionalidad de punta a punta (15 pts) | ⚠️ | Funciona, pero depende de la cuota gratuita de Gemini (20 consultas por día). **Conseguir una key paga o usar Claude antes de la demo.** |

Nombre del producto cambiado a **Py'aguasu IA** en el encabezado, el título, el manifest de la PWA y el README. Las menciones al *hackathon* Kyhyje'ỹ IA se mantienen.
