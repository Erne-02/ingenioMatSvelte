import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { ConvexHttpClient } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { api } from "$convex/_generated/api";

export const load: LayoutServerLoad = async ({ fetch, cookies, locals }) => {
  let session;
  try {
    session = await fetch("/api/auth/get-session", {
      headers: {
        cookie: cookies.toString(),
      },
    }).then((res) => res.json());
  } catch {
    redirect(303, "/login");
  }

  if (!session || !session.user) {
    redirect(303, "/login");
  }

  // Defensa en profundidad: verificar rol de administrador en Convex con la
  // identidad del usuario. La autorización real vive en las mutations, pero
  // esto evita que un usuario autenticado no-admin vea el panel.
  //
  // Caso bootstrap: si aún no existe NINGÚN admin, se permite el paso al primer
  // usuario autenticado; su primera mutación lo registrará como admin
  // (ver requireAdmin en src/convex/admins.ts).
  let isAdmin = false;
  let adminExists = true;
  try {
    const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
    if (locals.token) {
      client.setAuth(locals.token);
    }
    const adminStatus = await client.query(api.admins.status, {});
    isAdmin = adminStatus.isAdmin;
    adminExists = adminStatus.adminExists;
  } catch {
    redirect(303, "/login");
  }

  if (adminExists && !isAdmin) {
    redirect(303, "/login");
  }

  return { session };
};
