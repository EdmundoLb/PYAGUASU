import { Lexend, JetBrains_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";

const lexend = Lexend({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Kyhyje'ỹ IA",
  description:
    "Tutor de Física con IA generativa en castellano y jopara, que te guía paso a paso en vez de resolver todo por vos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kyhyje'ỹ IA",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#00248f",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${lexend.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* Material Symbols es una fuente de ligaduras: el HTML dice
            "waving_hand" y la fuente lo convierte en el ícono. Con
            display=optional (el default de Google Fonts) el navegador le da
            un plazo brevísimo antes del primer render y, si no llega, se
            queda con el texto crudo para SIEMPRE en esa carga de página —
            justo lo que se ve en conexiones lentas o cache fría. Con
            display=block el texto queda invisible unos ms en vez de
            mostrarse feo, y el preconnect acelera que llegue a tiempo. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Material Symbols has no next/font/google entry; this link already lives in the root layout, so it loads globally like pages/_document.js would. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
