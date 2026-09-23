import { obtenerProgresoAlumno } from '@/lib/store/sesiones';

export async function GET(request, { params }) {
  const { alumnoId } = await params;
  const progreso = obtenerProgresoAlumno(alumnoId);
  if (!progreso) {
    return Response.json({ error: 'Perfil inexistente.' }, { status: 404 });
  }
  return Response.json(progreso);
}
