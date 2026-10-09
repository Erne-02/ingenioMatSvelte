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
async function resolveProductImage(ctx: QueryCtx, product: Doc<"products">) {
  if (!product.imageUrl) return product;

  const cleanId = normalizeStorageReference(product.imageUrl);

  // Si es una ruta estática local (/images/..., /saco1.png) o una URL externa que no sea de Convex Storage
  if (cleanId.startsWith("/") || (cleanId.startsWith("http") && !cleanId.includes("/api/storage/"))) {
    return { ...product, imageUrl: cleanId };
  }

  try {
    const url = await ctx.storage.getUrl(cleanId as any);
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
        const cleanId = normalizeStorageReference(photoId);
        if (cleanId.startsWith("/") || (cleanId.startsWith("http") && !cleanId.includes("/api/storage/"))) {
          return cleanId;
        }

        const url = await ctx.storage.getUrl(cleanId as any);
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
    revisionTecnica: v.optional(v.string()),
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
      revisionTecnica: args.revisionTecnica,
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
    revisionTecnica: v.optional(v.string()),
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

    // 2. Sembrar o actualizar los productos de ejemplo sin borrar productos creados desde el panel.
    const demoProducts = [
      {
        name: "Cemento",
        slug: "cemento",
        imageUrl: "/images/products/cemento.png",
        categoryId: catMap["Morteros y Premezclas"],
        usos: "Ideal para fundaciones, vigas, columnas, muros estructurales y morteros de alta exigencia.",
        preparacion: "Mezclar en seco con áridos limpios antes de incorporar agua dosificada. Evitar exceso de líquido.",
        actividad: "Fraguado inicial rápido en 45 minutos y resistencia mecánica óptima a los 28 días.",
        revisionTecnica: "Revisión técnica: cemento de uso estructural para obra civil y albañilería, con resistencia y adherencia adecuadas para proyectos de construcción, morteros y elementos de concreto. Verificar dosificación y condiciones de almacenamiento antes del uso.",
        medidas: "Saco de 42.5 kg / Pallet de 40 sacos",
        fotosDeEjemplos: [
          "/images/products/cemento.png",
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
        name: "Cerámica Beauty Gris 45x45",
        slug: "ceramica-beauty-gris-45x45",
        imageUrl: "/images/products/cer%20Beauty%20gris%20de%2045x45.webp",
        categoryId: catMap["Terminaciones y Revestimientos"],
        usos: "Piso y revestimiento elegante para ambientes interiores con estilo moderno, minimalista y sobrio.",
        preparacion: "Instalar con mortero cola o adhesivo compatible y juntas uniformes para un acabado premium y duradero.",
        actividad: "Cerámica de formato 45x45 con acabado gris sofisticado, bajo mantenimiento y alta resistencia al desgaste diario.",
        medidas: "45 x 45 cm / formato estándar / ideal para baño, cocina, living y espacios de alta circulación",
        fotosDeEjemplos: [
          "/images/products/cer%20Beauty%20gris%20de%2045x45.webp",
        ],
      },
      {
        name: "Cerámica Varias Blancas 30x30",
        slug: "ceramica-varias-blancas-30x30",
        imageUrl: "/images/products/Cer%20varias%20blancas%20de%2030x30.webp",
        categoryId: catMap["Terminaciones y Revestimientos"],
        usos: "Revestimiento interior de alta luminosidad para cocina, baño, lavadero y espacios donde se desea un aspecto limpio y amplio.",
        preparacion: "Aplicar sobre superficie nivelada con adhesivo recomendado y respetar ancho de junta para un acabado uniforme.",
        actividad: "Cerámica blanca de 30x30 que aporta luminosidad, limpieza visual y buena resistencia a la humedad y al uso cotidiano.",
        medidas: "30 x 30 cm / ideal para revestimientos interiores / acabados amplios y minimalistas",
        fotosDeEjemplos: [
          "/images/products/Cer%20varias%20blancas%20de%2030x30.webp",
        ],
      },
      {
        name: "Lámpara de 30W",
        slug: "lampara-de-30w",
        imageUrl: "/images/products/lampara%20de%2030w.webp",
        categoryId: catMap["Luminarias"],
        usos: "Iluminación general de exteriores, estacionamientos, pasillos, bodegas, talleres y áreas de trabajo que requieren luz uniforme y eficiente.",
        preparacion: "Instalar en soporte compatible con la potencia seleccionada, conectar a la red eléctrica según la tensión y verificar la correcta ventilación del cuerpo lumínico.",
        actividad: "Dispositivo LED de alto rendimiento con consumo optimizado, larga vida útil y distribución uniforme de luz para uso continuo y seguro.",
        revisionTecnica: "Revisión técnica: luminaria LED de 30 W, diseñada para instalaciones interiores y exteriores con demanda de eficiencia energética y durabilidad. Debe verificarse potencia, temperatura de color, índice de reproducción cromática, grado de protección y cumplimento eléctrico según la normativa local antes de la conexión definitiva.",
        medidas: "Potencia 30 W / 220-240 V / temperatura de color 4000K-5000K / flujo luminoso según fabricante / carcasa resistente a condiciones ambientales",
        fotosDeEjemplos: [
          "/images/products/lampara%20de%2030w.webp",
        ],
      },
      {
        name: "Lámpara de 50W",
        slug: "lampara-de-50w",
        imageUrl: "/images/products/lampara%20de%2050%20w.png",
        categoryId: catMap["Luminarias"],
        usos: "Iluminación intensiva para patios, naves, estacionamientos, almacenes, áreas de carga y espacios abiertos con mayor requerimiento lumínico.",
        preparacion: "Montar sobre estructura o techo compatible con la carga, verificar conexiones eléctricas, protección contra humedad y mantener separación adecuada de materiales inflamables.",
        actividad: "Luminaria LED de 50 W con mayor salida lumínica, eficiencia energética y resistencia mecánica para operar en ambientes de trabajo intensivo.",
        revisionTecnica: "Revisión técnica: luminaria LED de 50 W para uso industrial y comercial, con alto rendimiento en ambientes de trabajo y exteriores. Se recomienda revisar potencia, temperatura de color, ángulo de haz, nivel IP y sistema de conexión para asegurar funcionamiento seguro, durabilidad y cumplimiento de la normativa eléctrica vigente.",
        medidas: "Potencia 50 W / 220-240 V / flujo luminoso elevado / temperatura de color 4000K-6500K / carcasa metalizada y resistencia a impactos",
        fotosDeEjemplos: [
          "/images/products/lampara%20de%2050%20w.png",
        ],
      },
      {
        name: "Tubería Eléctrica",
        slug: "tuberia-electrica",
        imageUrl: "/images/products/tuberia-electrica.png",
        categoryId: catMap["Tuberías y Canalizaciones"],
        usos: "Distribución eléctrica en instalaciones residenciales, comerciales e industriales, especialmente para proteger conductores en recorridos interiores y exteriores.",
        preparacion: "Instalar con accesorios compatibles, fijación segura y trazado conforme a la normativa eléctrica local; verificar curvas, empalmes y cajas de paso antes del cierre.",
        actividad: "Conduit flexible o rígido con alta resistencia mecánica, aislamiento térmico y protección contra golpes, abrasión y humedad ambiental.",
        revisionTecnica: "Revisión técnica: tubería eléctrica para protección y conducción de circuitos, diseñada para uso en instalaciones con requerimientos de seguridad, aislamiento y resistencia mecánica. Debe seleccionarse según calibre, diámetro, temperatura de servicio y cumplimiento de la normativa vigente. Verificar empalmes, fijaciones y puesta a tierra antes de energizar.",
        medidas: "Diámetro nominal 20 mm / 25 mm / 32 mm / Longitud estándar 50 m / material conduit flexible o rígido",
        fotosDeEjemplos: [
          "/images/products/tuberia-electrica.png",
        ],
      },
      {
        name: "Tubería Hidráulica",
        slug: "tuberia-hidraulica",
        imageUrl: "/images/products/tuberia-hidraulica.webp",
        categoryId: catMap["Tuberías y Canalizaciones"],
        usos: "Sistemas de agua potable, presión, drenaje y evacuación en viviendas, comercios, naves industriales y proyectos de infraestructura.",
        preparacion: "Cortar y empalmar con accesorios compatibles, asegurar la fijación y aplicar pruebas de presión antes de poner el sistema en servicio.",
        actividad: "Material diseñado para soportar presión, vibración y condiciones de servicio continuas, con alta resistencia a la abrasión y estabilidad térmica.",
        revisionTecnica: "Revisión técnica: tubería hidráulica para transporte de agua y servicios sanitarios, con resistencia a presión, temperatura y agentes químicos del entorno. Se recomienda validar diámetro, espesor, unión y protección según el proyecto y la normativa sanitaria aplicable.",
        medidas: "Diámetro nominal DN 20-110 mm / Presión nominal PN 10-16 / Longitud 6 m",
        fotosDeEjemplos: [
          "/images/products/tuberia-hidraulica.webp",
        ],
      },

      {
        name: "Arena Lavada",
        slug: "arena-lavada",
        imageUrl: "/images/products/arena lavada.png",
        categoryId: catMap["Áridos y Agregados"],
        usos: "Fabricación de concretos, morteros y acabados de albañilería, además de rellenos y capas base para pavimentos y preparación de superficie.",
        preparacion: "Verificar humedad y granulometría antes del uso; dosificar con cemento, agua y aditivos según la mezcla y la resistencia requerida.",
        actividad: "Granulometría uniforme, bajo contenido de arcilla y alta trabajabilidad que mejora la compacidad, resistencia y acabado final del concreto.",
        revisionTecnica: "Revisión técnica: arena lavada de granulometría controlada, limpia y libre de material orgánico o finos excesivos. Especificada para morteros, concretos y capas de acabados donde se requiere uniformidad, adherencia y resistencia mecánica. Debe controlarse contenido de humedad y graduación antes del mezclado.",
        medidas: "Granulometría 0-5 mm / material fino de cantera lavada / entrega por camión o bolsas según demanda",
        fotosDeEjemplos: [
          "/images/products/arena lavada.png",
        ],
      },
      {
        name: "Relleno",
        slug: "relleno",
        imageUrl: "/images/products/relleno.webp",
        categoryId: catMap["Áridos y Agregados"],
        usos: "Capa de apoyo, nivelación, compactación y relleno estructural en obras de cimentación, vías, patios y excavaciones.",
        preparacion: "Extender en capas controladas y compactar con maquinaria apropiada para garantizar estabilidad, drenaje y resistencia al asentamiento.",
        actividad: "Material granular de alta resistencia al aplastamiento, ideal para conformar bases, terraplenes y elevación de nivel de terreno.",
        revisionTecnica: "Revisión técnica: material granular para relleno y compactación, con gradación y resistencia adecuadas para capas de subrasante y base. Su uso debe ir acompañado de compactación controlada para prevenir asentamientos, erosión y pérdida de nivelación en la obra.",
        medidas: "Granulometría variable según proyecto / material de piedra triturada o grava de relleno / presentación por camión o bolsas",
        fotosDeEjemplos: [
          "/images/products/relleno.webp",
        ],
      },
      {
        name: "Racilla",
        slug: "racilla",
        imageUrl: "/images/products/racilla.webp",
        categoryId: catMap["Áridos y Agregados"],
        usos: "Concreto, morteros, carpeta asfáltica, drenajes y trabajos de relleno donde se requiere estabilidad y buena adherencia.",
        preparacion: "Dosificar según resistencia del concreto y nivel de acabado requerido; controlar humedad y proporciones para evitar segregación.",
        actividad: "Agregado de tamaño intermedio con buena resistencia a la compresión, trabajabilidad y capacidad de conformar mezclas homogéneas.",
        revisionTecnica: "Revisión técnica: racilla con granulometría estable y baja presencia de finos, recomendada para morteros y concretos de uso estructural y de acabado. Debe verificarse gradación, limpieza y proporción para asegurar resistencia, durabilidad y estabilidad en la mezcla final.",
        medidas: "Granulometría 3-12 mm / material de cantera o grava triturada / entrega por camión o bolsas según volumen",
        fotosDeEjemplos: [
          "/images/products/racilla.webp",
        ],
      },
      {
        name: "Hidrato de Cal",
        slug: "hidrato-de-cal",
        imageUrl: "/images/products/hidrato de cal.png",
        categoryId: catMap["Áridos y Agregados"],
        usos: "Preparación de morteros, estabilización de suelos, acabados y mejoras de plasticidad en mezclas de construcción y obra civil.",
        preparacion: "Mezclar con agua y agregados según dosificación; usar en proporciones adecuadas para mejorar trabajabilidad y resistencia del mortero.",
        actividad: "Aumenta la plasticidad y adherencia, mejora la trabajabilidad y favorece la resistencia final de morteros y capas de preparación.",
        revisionTecnica: "Revisión técnica: hidrato de cal para uso en morteros, estabilización y acabados, con capacidad de mejorar la fluidez, adherencia y resistencia a la carbonatación. Debe almacenarse bajo condiciones secas y verificarse la pureza y finura del producto antes de su mezcla.",
        medidas: "Material en polvo / uso para morteros y estabilización / presentación en sacos de 25 kg o según requerimiento",
        fotosDeEjemplos: [
          "/images/products/hidrato de cal.png",
        ],
      },
      {
        name: "Hormigón Premezclado",
        slug: "hormigon-premezclado",
        imageUrl: "/images/products/Premezcla.png",
        categoryId: catMap["Morteros y Premezclas"],
        usos: "Fabricación de elementos estructurales, muros y pavimentos.",
        preparacion: "Mezclar con agua según la dosificación recomendada.",
        actividad: "Uso general para obra civil y acabados.",
        medidas: "25 kg",
        fotosDeEjemplos: [
          "/images/products/Premezcla.png",
        ],
      },
      {
        name: "Mortero Calfín",
        slug: "mortero-calfin",
        imageUrl: "/images/products/Calfin.png",
        categoryId: catMap["Morteros y Premezclas"],
        usos: "Enlucidos, revoques y revestimientos interiores y exteriores.",
        preparacion: "Mezclar con agua hasta lograr una pasta uniforme.",
        actividad: "Alta adherencia y trabajabilidad.",
        medidas: "25 kg / 40 kg",
        fotosDeEjemplos: [
          "/images/products/Calfin.png",
        ],
      },
      {
        name: "Mortero Calcol",
        slug: "mortero-calcol",
        imageUrl: "/images/products/Calgru.png",
        categoryId: catMap["Morteros y Premezclas"],
        usos: "Aplicación en albañilería y revestimientos.",
        preparacion: "Preparar con agua y aplicar en capas según recomendación.",
        actividad: "Rendimiento y resistencia para obra.",
        medidas: "25 kg / 40 kg",
        fotosDeEjemplos: [
          "/images/products/Calgru.png",
        ],
      },
      {
        name: "Mortero Grueso",
        slug: "mortero-grueso",
        imageUrl: "/images/products/grueso.png",
        categoryId: catMap["Morteros y Premezclas"],
        usos: "Revestimientos gruesos, rellenos y trabajos de albañilería.",
        preparacion: "Aplicar en capas y mezclar con agua según dosificación.",
        actividad: "Ideal para reparaciones y acabados resistentes.",
        medidas: "25 kg",
        fotosDeEjemplos: [
          "/images/products/grueso.png",
        ],
      },
    ];

    let inserted = 0;
    for (const prod of demoProducts) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", prod.slug))
        .first() ?? (prod.slug === "cemento"
        ? await ctx.db
            .query("products")
            .withIndex("by_slug", (q) => q.eq("slug", "cemento-portland-especial"))
            .first()
        : null);

      if (!existing) {
        await ctx.db.insert("products", prod);
        inserted++;
      } else {
        await ctx.db.patch(existing._id, {
          name: prod.name,
          slug: prod.slug,
          imageUrl: prod.imageUrl,
          usos: prod.usos,
          preparacion: prod.preparacion,
          actividad: prod.actividad,
          revisionTecnica: prod.revisionTecnica,
          medidas: prod.medidas,
          fotosDeEjemplos: prod.fotosDeEjemplos,
        });
      }
    }

    return { success: true, inserted, total: demoProducts.length };
  },
});
