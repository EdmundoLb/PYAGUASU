import { InlineMath } from "react-katex";

// Separa segmentos "$...$" (fórmulas) del resto del texto plano. El tutor
// de IA escribe fórmulas cortas en una sola línea envueltas en $...$ (ver
// regla 6b en lib/ai/prompt.js) — nunca bloques $$...$$, porque esto vive
// dentro de una burbuja de chat angosta.
const PATRON_FORMULA = /(\$[^$\n]+\$)/g;

export default function RenderizadorMatematico({ texto }) {
  if (!texto) return null;

  const partes = texto.split(PATRON_FORMULA);

  return (
    <>
      {partes.map((parte, i) => {
        if (parte.startsWith("$") && parte.endsWith("$") && parte.length > 2) {
          const formula = parte.slice(1, -1);
          return (
            <InlineMath
              key={i}
              math={formula}
              renderError={() => <span className="font-mono">{parte}</span>}
            />
          );
        }
        return <span key={i}>{parte}</span>;
      })}
    </>
  );
}
