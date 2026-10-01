import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { type Doc } from "./_generated/dataModel.d";
import { requireAdmin } from "./admins";

// Helper interno para resolver la URL del storage o mantener rutas locales/externas
async function resolveProductImage(ctx: QueryCtx, product: Doc<"products">) {
  if (!product.imageUrl) return product;

  const cleanId = product.imageUrl.trim();

  // Si es una ruta estática local (/images/..., /saco1.png) o una URL externa que no sea de Convex Storage
  if (cleanId.startsWith("/") || (cleanId.startsWith("http") && !cleanId.includes("/api/storage/"))) {
    return { ...product, imageUrl: cleanId };
  }

  let storageId = cleanId;
  if (storageId.startsWith("http")) {
    storageId = storageId.split("/api/storage/")[1] || storageId;
  }

  try {
    const url = await ctx.storage.getUrl(storageId as any);
    return { ...product, imageUrl: url ?? cleanId };
  } catch (error) {
    console.error(
      `[Convex] Error resolviendo imagen para '${cleanId}':`,
      error,
    );
    return { ...product, imageUrl: cleanId };
  }
}

// Helper para resolver las URLs de las fotos de ejemplo
async function resolveExamplePhotos(ctx: QueryCtx, product: Doc<"products">) {
  if (!product.fotosDeEjemplos || product.fotosDeEjemplos.length === 0) {
    return product;
  }

  try {
    const resolvedPhotos = await Promise.all(
      product.fotosDeEjemplos.map(async (photoId) => {
        const cleanId = photoId.trim();
        if (cleanId.startsWith("/") || (cleanId.startsWith("http") && !cleanId.includes("/api/storage/"))) {
          return cleanId;
        }

        let storageId = cleanId;
        if (storageId.startsWith("http")) {
          storageId = storageId.split("/api/storage/")[1] || storageId;
        }
        const url = await ctx.storage.getUrl(storageId as any);
        return url ?? cleanId;
      })
    );

    return {
      ...product,
      fotosDeEjemplos: resolvedPhotos.filter((url): url is string => !!url)
    };
  } catch (error) {
    console.error(
      `[Convex] Error resolviendo fotos de ejemplo:`,
      error,
    );
    return product;
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return await Promise.all(
      products.map(async (product) => {
        const withMainImage = await resolveProductImage(ctx, product);
        return await resolveExamplePhotos(ctx, withMainImage);
      }),
    );
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    const withMainImage = await resolveProductImage(ctx, product);
    return await resolveExamplePhotos(ctx, withMainImage);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!product) return null;
    const withMainImage = await resolveProductImage(ctx, product);
    return await resolveExamplePhotos(ctx, withMainImage);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    imageUrl: v.string(),
    categoryId: v.id("categories"),
    slug: v.string(),
    usos: v.optional(v.string()),
    preparacion: v.optional(v.string()),
    actividad: v.optional(v.string()),
    medidas: v.optional(v.string()),
    fotosDeEjemplos: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) {
      throw new Error("El slug ya está en uso por otro producto.");
    }

    const newProduct = {
      name: args.name,
      imageUrl: args.imageUrl,
      categoryId: args.categoryId,
      slug: args.slug,
      usos: args.usos,
      preparacion: args.preparacion,
      actividad: args.actividad,
      medidas: args.medidas,
      fotosDeEjemplos: args.fotosDeEjemplos,
    };
    const id = await ctx.db.insert("products", newProduct);
    return { id };
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    slug: v.optional(v.string()),
    usos: v.optional(v.string()),
    preparacion: v.optional(v.string()),
    actividad: v.optional(v.string()),
    medidas: v.optional(v.string()),
    fotosDeEjemplos: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;

    if (updates.slug !== undefined) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug!))
        .first();
      if (existing && existing._id !== id) {
        throw new Error("El slug ya está en uso por otro producto.");
      }
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const seedProducts = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    // 1. Asegurar las 6 categorías oficiales
    const officialNames = [
      "Morteros y Premezclas",
      "Tuberías y Canalizaciones",
      "Áridos y Agregados",
      "Terminaciones y Revestimientos",
      "Luminarias",
      "Otros",
    ];

    const existingCategories = await ctx.db.query("categories").collect();
    const catMap: Record<string, any> = {};

    for (const name of officialNames) {
      const found = existingCategories.find(
        (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim(),
      );
      if (!found) {
        const id = await ctx.db.insert("categories", { name });
        catMap[name] = id;
      } else {
        catMap[name] = found._id;
      }
    }

    // 2. Sembrar productos con imágenes locales preparados para las categorías oficiales
    const demoProducts = [
      {
        name: "Cemento Portland Especial",
        slug: "cemento-portland-especial",
        imageUrl: "/images/products/cemento-portland.png",
        categoryId: catMap["Morteros y Premezclas"],
        usos: "Ideal para fundaciones, vigas, columnas, muros estructurales y morteros de alta exigencia.",
        preparacion: "Mezclar en seco con áridos limpios antes de incorporar agua dosificada. Evitar exceso de líquido.",
        actividad: "Fraguado inicial rápido en 45 minutos y resistencia mecánica óptima a los 28 días.",
        medidas: "Saco de 42.5 kg / Pallet de 40 sacos",
        fotosDeEjemplos: [
          "/images/products/cemento-portland.png",
          "/images/products/losas-ceramicas.png",
        ],
      },
      {
        name: "Batería Solar de Litio 48V 100Ah",
        slug: "bateria-solar-litio-48v",
        imageUrl: "/images/products/bateria-solar-litio.png",
        categoryId: catMap["Otros"],
        usos: "Almacenamiento energético para sistemas solares residenciales, comerciales e híbridos.",
        preparacion: "Instalación en pared o rack ventilado. Conectar a inversor compatible mediante cableado certificado.",
        actividad: "Ciclo de vida superior a 6000 ciclos con 80% DoD. BMS inteligente integrado.",
        medidas: "48V 100Ah (4.8 kWh) / 442 x 480 x 133 mm / 42 kg",
        fotosDeEjemplos: [
          "/images/products/bateria-solar-litio.png",
        ],
      },
      {
        name: "Planchas de Zinc Ondulado Galvanizado",
        slug: "planchas-zinc-ondulado",
        imageUrl: "/images/products/techos-zinc-ondulado.png",
        categoryId: catMap["Terminaciones y Revestimientos"],
        usos: "Cubiertas de techos resistentes a la intemperie para viviendas, naves industriales y galpones.",
        preparacion: "Fijación con tornillos autoperforantes con arandela de neopreno sobre correas de madera o metal.",
        actividad: "Recubrimiento galvanizado de alta durabilidad contra la corrosión marina y lluvias intensas.",
        medidas: "3.66 m x 0.85 m / Espesor 0.30 mm",
        fotosDeEjemplos: [
          "/images/products/techos-zinc-ondulado.png",
        ],
      },
      {
        name: "Paneles de Falso Techo PVC",
        slug: "paneles-falso-techo-pvc",
        imageUrl: "/images/products/falso-techo-pvc.png",
        categoryId: catMap["Terminaciones y Revestimientos"],
        usos: "Revestimiento estético de techos interiores para residencias, oficinas y locales comerciales.",
        preparacion: "Montaje machihembrado sobre perfiles perimetrales galvanizados o listones de madera.",
        actividad: "Aislante térmico y acústico, 100% impermeable, lavable y autoextinguible.",
        medidas: "Tablillas de 5.95 m x 20 cm / Espesor 7 mm",
        fotosDeEjemplos: [
          "/images/products/falso-techo-pvc.png",
        ],
      },
      {
        name: "Losas Cerámicas de Tráfico Alto",
        slug: "losas-ceramicas-trafico-alto",
        imageUrl: "/images/products/losas-ceramicas.png",
        categoryId: catMap["Terminaciones y Revestimientos"],
        usos: "Pavimentos de interiores y terrazas exteriores con alta resistencia al desgaste.",
        preparacion: "Instalar sobre carpeta nivelada utilizando mortero cola porcelánico y juntas mínimas de 2 mm.",
        actividad: "Baja absorción de agua (<0.5%), resistencia al rayado y acabado antideslizante.",
        medidas: "Formato 60 x 60 cm / Caja de 1.44 m²",
        fotosDeEjemplos: [
          "/images/products/losas-ceramicas.png",
        ],
      },
      {
        name: "Perfiles de Aluminio Estructural",
        slug: "perfiles-aluminio-estructural",
        imageUrl: "/images/products/perfil-aluminio.png",
        categoryId: catMap["Terminaciones y Revestimientos"],
        usos: "Fabricación de ventanería europea, puertas corredizas, mamparas y divisiones de oficinas.",
        preparacion: "Corte a inglete y ensamble mecánico con escuadras de precisión y empaques de estanqueidad.",
        actividad: "Aleación 6063-T5 con anodizado superior de 15 micras o acabado electrostático blanco/negro.",
        medidas: "Barras de 6.00 m / Series 20, 25 y 45",
        fotosDeEjemplos: [
          "/images/products/perfil-aluminio.png",
        ],
      },
      {
        name: "Manguera Flexible Reforzada",
        slug: "manguera-flexible-reforzada",
        imageUrl: "/images/products/manguera-construccion.png",
        categoryId: catMap["Tuberías y Canalizaciones"],
        usos: "Conducción de agua a presión en obras, riego y drenajes industriales.",
        preparacion: "Conectar con acoples rápidos y abrazaderas de acero inoxidable sin estrangular la tubería.",
        actividad: "Refuerzo trenzado con resistencia hasta 15 bar y protección contra rayos UV.",
        medidas: "Rollo de 50 m / Diámetro 3/4 pulgada",
        fotosDeEjemplos: [
          "/images/products/manguera-construccion.png",
        ],
      },
    ];

    let inserted = 0;
    for (const prod of demoProducts) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", prod.slug))
        .first();

      if (!existing) {
        await ctx.db.insert("products", prod);
        inserted++;
      } else {
        await ctx.db.patch(existing._id, {
          imageUrl: prod.imageUrl,
          usos: prod.usos,
          preparacion: prod.preparacion,
          actividad: prod.actividad,
          medidas: prod.medidas,
          fotosDeEjemplos: prod.fotosDeEjemplos,
        });
      }
    }

    return { success: true, inserted, total: demoProducts.length };
  },
});
