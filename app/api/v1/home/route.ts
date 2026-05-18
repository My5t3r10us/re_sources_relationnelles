import { apiSuccess, apiError } from "@/lib/api-response";
import { getHomeData } from "@/lib/home-data";

export async function GET() {
  try {
    const data = await getHomeData();
    return apiSuccess(data);
  } catch {
    return apiError("INTERNAL_ERROR", "Erreur serveur", 500);
  }
}
