import { api } from "$convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params }) => {
  const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
  
  try {
    const product = await client.query(api.products.getBySlug, { slug: params.slug });
    
    if (!product) {
      throw error(404, "Producto no encontrado");
    }

    const categories = await client.query(api.categories.list);
    const category = categories?.find(c => c._id === product.categoryId);

    return {
      product,
      category
    };
  } catch (err) {
    // Re-lanzar los errores HTTP de SvelteKit (p. ej. 404) sin convertirlos en 500
    if (err && typeof err === "object" && "status" in err) throw err;
    console.error("Error loading product detail:", err);
    throw error(500, "Error al cargar el producto");
  }
};
