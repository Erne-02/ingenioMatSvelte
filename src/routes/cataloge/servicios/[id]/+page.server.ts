import { api } from "$convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params }) => {
  const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
  
  try {
    // Para servicios, params.id es el _id de Convex
    // En Convex, la validación falla si el ID no tiene formato correcto
    const service = await client.query(api.services.getById, { id: params.id as any });
    
    if (!service) {
      throw error(404, "Servicio no encontrado");
    }

    const serviceTypes = await client.query(api.serviceTypes.list);
    const serviceType = serviceTypes?.find(t => t._id === service.serviceTypeId);

    return {
      service,
      serviceType
    };
  } catch (err) {
    // Re-lanzar los errores HTTP de SvelteKit (p. ej. 404) sin convertirlos en 500
    if (err && typeof err === "object" && "status" in err) throw err;
    console.error("Error loading service detail:", err);
    throw error(500, "Error al cargar el servicio");
  }
};
