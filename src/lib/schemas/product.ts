import * as v from "valibot";

export const productSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("El nombre es requerido")),
  slug: v.optional(v.string(), ""),
  categoryId: v.pipe(v.string(), v.nonEmpty("La categoría es requerida")),
  imageUrl: v.pipe(v.string(), v.nonEmpty("La imagen es requerida")),
  usos: v.optional(v.string(), ""),
  preparacion: v.optional(v.string(), ""),
  actividad: v.optional(v.string(), ""),
  revisionTecnica: v.optional(v.string(), ""),
  medidas: v.optional(v.string(), ""),
  fotosDeEjemplos: v.optional(v.array(v.string()), []),
});

export type ProductSchema = typeof productSchema;
