import Icono from "./Icono";

export default function TutorEscribiendo() {
  return (
    <div className="mensaje-nuevo flex items-end gap-2 justify-start">
      <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0 shadow-elevation-1">
        <Icono nombre="school" size={16} />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-surface-container-lowest shadow-elevation-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-outline punto-escribiendo" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-outline punto-escribiendo" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-outline punto-escribiendo" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
