// Lógica pura (sin JSX) para separar fórmulas del texto del tutor; la usa
// src/components/RenderizadorMatematico.js.

import { repararEscapesLatex } from "@/lib/latex/escapes";

// Separa segmentos "$...$" (fórmulas) del resto del texto plano. El tutor
// de IA escribe fórmulas cortas en una sola línea envueltas en $...$ (ver
// "FORMATO DEL TEXTO" en lib/ai/prompt.js) — nunca bloques $$...$$, porque
// esto vive dentro de una burbuja de chat angosta.
const PATRON_FORMULA = /(\$[^$\n]+\$)/g;

// Respaldo para cuando el modelo se olvida de los $ y escribe, por ejemplo,
// "la fórmula es d = v_0 \cdot t + \frac{1}{2} a t^2": sin esto se veía el
// LaTeX crudo. Solo se activa si hay una señal inequívoca de LaTeX (un
// comando como \frac o un subíndice/exponente), y toma como fórmula la
// racha de "palabras matemáticas" alrededor de esa señal.
const SENAL_LATEX = /\\[a-zA-Z]+|[A-Za-z0-9}][_^]/;
const CARACTERES_MATEMATICOS = /^[A-Za-z0-9.,+\-*/=(){}\\^_·'|<>]+$/;

function esPalabraMatematica(nucleo) {
  if (!nucleo) return false;
  if (SENAL_LATEX.test(nucleo)) return true;
  // Una sola letra (variable: "a", "t") o algo con dígitos/operadores
  // ("20", "=", "+", "m/s"). Palabras de 2+ letras solas ("de", "acá") no.
  if (/^[A-Za-z]$/.test(nucleo)) return true;
  return CARACTERES_MATEMATICOS.test(nucleo) && /[^A-Za-z]/.test(nucleo);
}

function trozosSinDolares(texto) {
  if (!SENAL_LATEX.test(texto)) return [{ formula: false, valor: texto }];

  // Índices pares: palabras; impares: espacios.
  const piezas = texto.split(/(\s+)/);
  const palabras = [];
  for (let i = 0; i < piezas.length; i += 2) {
    const [, nucleo, cola] = /^(.*?)([.,;:!?]*)$/.exec(piezas[i]);
    palabras.push({ i, nucleo, cola, mat: esPalabraMatematica(nucleo), fuerte: SENAL_LATEX.test(nucleo) });
  }

  const trozos = [];
  let textoPendiente = "";
  let p = 0;
  while (p < palabras.length) {
    // Racha de palabras matemáticas; la puntuación final corta la racha.
    let fin = p;
    if (palabras[p].mat) {
      while (fin + 1 < palabras.length && palabras[fin + 1].mat && !palabras[fin].cola) fin++;
    }
    const racha = palabras.slice(p, fin + 1);
    if (palabras[p].mat && racha.some((w) => w.fuerte)) {
      if (textoPendiente) trozos.push({ formula: false, valor: textoPendiente });
      const ultima = palabras[fin];
      const formula = piezas.slice(palabras[p].i, ultima.i).join("") + ultima.nucleo;
      trozos.push({ formula: true, valor: formula, largo: formula.length });
      textoPendiente = ultima.cola + (piezas[ultima.i + 1] || "");
    } else {
      for (const w of racha) textoPendiente += piezas[w.i] + (piezas[w.i + 1] || "");
    }
    p = fin + 1;
  }
  if (textoPendiente) trozos.push({ formula: false, valor: textoPendiente });
  return trozos;
}

// Divide el texto en trozos { formula, valor, largo }, donde `largo` es
// cuántos caracteres ocupa el trozo en el texto original (sirve para la
// animación de escritura).
// El texto se repara primero (ver lib/latex/escapes.js): así también se ven
// bien los mensajes que ya llegaron dañados al chat abierto.
export function dividirEnTrozos(texto) {
  return repararEscapesLatex(texto).split(PATRON_FORMULA).flatMap((parte) => {
    if (parte.startsWith("$") && parte.endsWith("$") && parte.length > 2) {
      return [{ formula: true, valor: parte.slice(1, -1), largo: parte.length, original: parte }];
    }
    return trozosSinDolares(parte).map((t) => ({ ...t, largo: t.valor.length, original: t.valor }));
  });
}
