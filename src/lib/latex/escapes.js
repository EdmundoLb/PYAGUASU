// Reparación de LaTeX dañado por el escape de JSON.
//
// La IA devuelve cada turno como JSON, donde "\t", "\f", "\b", "\r" y "\n"
// son escapes válidos (tabulación, form feed, etc.). Si el modelo escribe
// "\text" o "\times" sin duplicar la barra, JSON.parse los convierte en
// TAB + "ext" / TAB + "imes", y el alumno ve "3extkg imes" en vez de
// "3 kg ×". Pasa de forma intermitente, así que se repara acá en vez de
// confiar en que el modelo nunca se equivoque.

// Un carácter de control pegado a letras nunca aparece en un mensaje de
// chat normal: es un comando de LaTeX cuya barra se comió el JSON.
const CONTROL_ANTES_DE_LETRA = /[\t\f\b\r\v](?=[a-zA-Z])/g;
const RESTAURAR = { '\t': '\\t', '\f': '\\f', '\b': '\\b', '\r': '\\r', '\v': '\\v' };

// "\n" sí puede ser un salto de línea legítimo, así que solo se repara
// delante de comandos de LaTeX que empiezan con n (\neq, \nu, \nabla,
// \not, \neg) seguidos de algo que no sea letra.
const SALTO_ANTES_DE_COMANDO_N = /\n(?=(?:eq|u|abla|ot|eg)(?![a-zA-Z]))/g;

export function repararEscapesLatex(texto) {
  if (typeof texto !== 'string') return texto;
  return texto
    .replace(CONTROL_ANTES_DE_LETRA, (c) => RESTAURAR[c])
    .replace(SALTO_ANTES_DE_COMANDO_N, '\\n');
}

// Aplica la reparación a todos los strings de un turno (mensaje, pista,
// datos, opciones, resultado, etiquetas...), sin importar dónde estén.
export function repararEscapesEnObjeto(valor) {
  if (typeof valor === 'string') return repararEscapesLatex(valor);
  if (Array.isArray(valor)) return valor.map(repararEscapesEnObjeto);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, repararEscapesEnObjeto(v)]));
  }
  return valor;
}

// Para JSON crudo que ni siquiera parsea: "\cdot", "\sqrt", "\Delta"...
// son escapes inválidos en JSON y hacen fallar JSON.parse (el turno entero
// se perdía). Se duplica la barra de todo escape que JSON no reconoce.
export function repararEscapesInvalidosEnJson(crudo) {
  return crudo.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
}
