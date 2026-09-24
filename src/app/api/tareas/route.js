import { listarTareasDeAlumno } from '@/lib/store/clases';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const alumnoId = searchParams.get('alumnoId');
  if (!alumnoId) {
    return Response.json({ error: 'Falta alumnoId.' }, { status: 400 });
  }
  return Response.json({ tareas: listarTareasDeAlumno(alumnoId) });
}
