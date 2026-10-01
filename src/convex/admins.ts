import { query, type MutationCtx } from "./_generated/server";

/**
 * Autorización de administrador.
 *
 * Modelo: el PRIMER usuario autenticado que ejecuta una acción de admin queda
 * registrado como administrador (patrón "primer usuario = admin"). A partir de
 * ahí, solo los ids presentes en la tabla `admins` pueden escribir.
 *
 * El identificador de usuario es `ctx.auth.getUserIdentity().subject`, estable
 * y provisto por el plugin de Convex de better-auth.
 */
export async function requireAdmin(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("No autenticado");
  }
  const userId = identity.subject;

  const admins = await ctx.db.query("admins").collect();

  // Bootstrap: si todavía no hay ningún admin, este usuario se convierte en el primero.
  if (admins.length === 0) {
    await ctx.db.insert("admins", { userId });
    return userId;
  }

  if (!admins.some((a) => a.userId === userId)) {
    throw new Error("No autorizado: se requiere ser administrador");
  }

  return userId;
}

/**
 * Estado de administración para los guards de UI (lectura, sin bootstrap).
 */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const admins = await ctx.db.query("admins").collect();
    const adminExists = admins.length > 0;
    const isAdmin =
      !!identity && admins.some((a) => a.userId === identity.subject);
    return {
      authenticated: !!identity,
      isAdmin,
      adminExists,
    };
  },
});
