import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./admins";

// Obtener todas las ofertas (para el admin)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("offers").order("desc").collect();
  },
});

// Obtener todas las ofertas activas (para el banner rotativo)
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("offers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Crear una oferta
export const create = mutation({
  args: {
    text: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("offers", {
      text: args.text,
      isActive: args.isActive,
    });
  },
});

// Actualizar una oferta
export const update = mutation({
  args: {
    id: v.id("offers"),
    text: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Eliminar una oferta
export const remove = mutation({
  args: { id: v.id("offers") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

