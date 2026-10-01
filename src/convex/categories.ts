import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./admins";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories;
  },
});

export const getById = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const newCategory = {
      name: args.name,
      description: args.description,
      order: args.order,
    };
    const id = await ctx.db.insert("categories", newCategory);
    return { id };
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Verificar si hay productos con esta categoría
    const productsWithCategory = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .collect();

    if (productsWithCategory.length > 0) {
      throw new Error("La categoría tiene productos asignados");
    }

    await ctx.db.delete(args.id);
  },
});

export const seedOfficial = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const officialCategories = [
      "Morteros y Premezclas",
      "Tuberías y Canalizaciones",
      "Áridos y Agregados",
      "Terminaciones y Revestimientos",
      "Luminarias",
      "Otros",
    ];

    const existingCategories = await ctx.db.query("categories").collect();
    let createdCount = 0;

    for (const name of officialCategories) {
      const exists = existingCategories.some(
        (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim(),
      );
      if (!exists) {
        await ctx.db.insert("categories", { name });
        createdCount++;
      }
    }

    return { success: true, createdCount };
  },
});
