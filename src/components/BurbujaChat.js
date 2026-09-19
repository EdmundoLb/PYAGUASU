import Icono from "./Icono";

export default function BurbujaChat({ autor, texto }) {
  const esTutor = autor === "tutor";

  return (
    <div className={`mensaje-nuevo flex items-end gap-2 ${esTutor ? "justify-start" : "justify-end"}`}>
      {esTutor && (
        <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0 shadow-elevation-1">
          <Icono nombre="school" size={16} />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 text-body-md leading-relaxed shadow-elevation-1 ${
          esTutor
            ? "bg-surface-container-lowest text-on-surface rounded-2xl rounded-bl-sm"
            : "bg-primary text-on-primary rounded-2xl rounded-br-sm"
        }`}
      >
        {texto}
      </div>
    </div>
  );
}
