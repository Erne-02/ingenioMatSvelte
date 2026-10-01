import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./admins";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const types = await ctx.db.query("serviceTypes").collect();
    return types;
  },
});

export const getById = query({
  args: { id: v.id("serviceTypes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const newType = {
      name: args.name,
    };
    const id = await ctx.db.insert("serviceTypes", newType);
    return { id };
  },
});

export const update = mutation({
  args: {
    id: v.id("serviceTypes"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: {
    id: v.id("serviceTypes"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Verificar si hay servicios con este tipo
    const servicesWithType = await ctx.db
      .query("services")
      .withIndex("by_serviceType", (q) => q.eq("serviceTypeId", args.id))
      .collect();

    if (servicesWithType.length > 0) {
      throw new Error("El tipo de servicio tiene servicios asignados");
    }

    await ctx.db.delete(args.id);
  },
});
