import { redirect } from "@sveltejs/kit";
import { ConvexHttpClient } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { api } from "$convex/_generated/api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  // Registro público cerrado una vez que existe un administrador.
  // (Modelo "primer usuario = admin": solo se permite crear la primera cuenta.)
  try {
    const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
    const status = await client.query(api.admins.status, {});
    if (status.adminExists) {
      redirect(303, "/login");
    }
  } catch (err) {
    // Si es el redirect de SvelteKit, re-lanzarlo
    if (err && typeof err === "object" && "status" in err) throw err;
    // Si Convex no responde, no bloqueamos la carga de la página.
  }

  return {};
};
