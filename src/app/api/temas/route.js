import { listarTemasPoblados } from '@/lib/store/temas';

export async function GET() {
  return Response.json({ temas: listarTemasPoblados() });
}
