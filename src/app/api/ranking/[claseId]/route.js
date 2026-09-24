import { calcularRankingDeClase } from '@/lib/store/ranking';

export async function GET(request, { params }) {
  const { claseId } = await params;
  return Response.json({ ranking: calcularRankingDeClase(claseId) });
}
