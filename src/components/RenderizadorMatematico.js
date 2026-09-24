import { InlineMath } from "react-katex";

import { dividirEnTrozos } from "@/lib/ui/formulas";

// `longitudVisible` (opcional): para el efecto de "escribiendo" — muestra
// solo los primeros N caracteres del texto, pero cada fórmula aparece
// completa y ya renderizada cuando la escritura la alcanza, nunca como
// LaTeX crudo a medio escribir ("$\frac{1}{").
export default function RenderizadorMatematico({ texto, longitudVisible }) {
  if (!texto) return null;

  let restante = longitudVisible ?? Infinity;
  const elementos = [];
  for (const [i, trozo] of dividirEnTrozos(texto).entries()) {
    if (restante <= 0) break;
    if (trozo.formula) {
      if (restante < trozo.largo) break;
      elementos.push(
        <InlineMath
          key={i}
          math={trozo.valor}
          renderError={() => <span className="font-mono">{trozo.original}</span>}
        />
      );
    } else {
      elementos.push(<span key={i}>{trozo.valor.slice(0, restante)}</span>);
    }
    restante -= trozo.largo;
  }
  return <>{elementos}</>;
}

