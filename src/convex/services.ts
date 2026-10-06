import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { type Doc } from "./_generated/dataModel.d";
import { requireAdmin } from "./admins";

function normalizeStorageReference(value: string): string {
  const cleanValue = value.trim();
  if (!cleanValue) return cleanValue;

  if (cleanValue.startsWith("/") || cleanValue.startsWith("blob:") || cleanValue.startsWith("data:")) {
    return cleanValue;
  }

  if (cleanValue.startsWith("http")) {
    try {
      const parsed = new URL(cleanValue);
      const storageMatch = parsed.pathname.match(/\/api\/storage\/([^?]+)/i);
      if (storageMatch?.[1]) {
        return decodeURIComponent(storageMatch[1]);
      }
      return cleanValue;
    } catch {
      return cleanValue;
    }
  }

  return cleanValue.split("?")[0];
}

// Helper interno para resolver la URL del storage o mantener rutas locales/externas
async function resolveServiceImage(ctx: QueryCtx, service: Doc<"services">) {
  if (!service.imageUrl) return service;

  const cleanId = normalizeStorageReference(service.imageUrl);
  if (cleanId.startsWith("/") || (cleanId.startsWith("http") && !cleanId.includes("/api/storage/"))) {
    return { ...service, imageUrl: cleanId };
  }

  try {
    const url = await ctx.storage.getUrl(cleanId as any);
    return { ...service, imageUrl: url ?? cleanId };
  } catch (error) {
    return { ...service, imageUrl: cleanId };
  }
}

// Helper para resolver URLs de fotos de ejemplos
async function resolveServiceExampleImages(ctx: QueryCtx, service: Doc<"services">) {
  if (!service.fotosDeEjemplos || service.fotosDeEjemplos.length === 0) return service;

  const resolvedUrls = await Promise.all(
    service.fotosDeEjemplos.map(async (imageId) => {
      const cleanId = normalizeStorageReference(imageId);
      if (cleanId.startsWith("/") || (cleanId.startsWith("http") && !cleanId.includes("/api/storage/"))) {
        return cleanId;
      }

      try {
        const url = await ctx.storage.getUrl(cleanId as any);
        return url ?? cleanId;
      } catch (error) {
        return cleanId;
      }
    })
  );

  return { ...service, fotosDeEjemplos: resolvedUrls.filter((url): url is string => !!url) };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const services = await ctx.db.query("services").collect();
    return await Promise.all(
      services.map(async (service) => {
        const withMainImage = await resolveServiceImage(ctx, service);
        return await resolveServiceExampleImages(ctx, withMainImage);
      }),
    );
  },
});

export const getById = query({
  args: { id: v.id("services") },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.id);
    if (!service) return null;
    const withMainImage = await resolveServiceImage(ctx, service);
    return await resolveServiceExampleImages(ctx, withMainImage);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    imageUrl: v.string(),
    serviceTypeId: v.id("serviceTypes"),
    detalles: v.optional(v.string()),
    fotosDeEjemplos: v.optional(v.array(v.string())),
    precioBase: v.optional(v.string()),
    duracionEstimada: v.optional(v.string()),
    areaDeCobertura: v.optional(v.string()),
    requisitos: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const newService = {
      name: args.name,
      description: args.description,
      imageUrl: args.imageUrl,
      serviceTypeId: args.serviceTypeId,
      detalles: args.detalles,
      fotosDeEjemplos: args.fotosDeEjemplos,
      precioBase: args.precioBase,
      duracionEstimada: args.duracionEstimada,
      areaDeCobertura: args.areaDeCobertura,
      requisitos: args.requisitos,
    };
    const id = await ctx.db.insert("services", newService);
    return { id };
  },
});

export const update = mutation({
  args: {
    id: v.id("services"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    serviceTypeId: v.optional(v.id("serviceTypes")),
    detalles: v.optional(v.string()),
    fotosDeEjemplos: v.optional(v.array(v.string())),
    precioBase: v.optional(v.string()),
    duracionEstimada: v.optional(v.string()),
    areaDeCobertura: v.optional(v.string()),
    requisitos: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: {
    id: v.id("services"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
