---
name: ingenio-mat-catalog
description: Estructura de imágenes y catálogo de productos para IngenioMat en SvelteKit 2 + Svelte 5 + Convex
metadata:
  type: project
---

# Catálogo de Productos y Estructura de Imágenes - IngenioMat

## 1. Estructura de Imágenes en SvelteKit
En SvelteKit la carpeta estática pública es `static/` (los archivos en `static/` se sirven directamente en la raíz `/`).

```bash
static/
└── images/
    └── products/
        ├── placeholder.svg                     # Fallback visual elegante cuando no hay imagen
        ├── cemento-portland.png               # Materiales de Construcción (Saco cemento)
        ├── bateria-solar-litio.png            # Energía Solar (Batería 48V)
        ├── techos-zinc-ondulado.png           # Materiales de Construcción (Zinc)
        ├── falso-techo-pvc.png                # Materiales de Construcción (Cielorraso PVC)
        ├── losas-ceramicas.png                # Materiales de Construcción (Pisos cerámicos)
        ├── perfil-aluminio.png                # Perfilería y Aluminio (Ventanas y perfiles)
        └── manguera-construccion.png          # Materiales de Construcción (Mangueras)
```

## 2. Resolución de Imágenes en Convex Backend
En `src/convex/products.ts` y `src/convex/services.ts`, los helpers `resolveProductImage` y `resolveExamplePhotos` admiten:
1. **Rutas estáticas locales**: `/images/products/...` o `/saco1.png`.
2. **URLs externas**: `https://...` (por ejemplo imágenes alojadas en CDN/Unsplash).
3. **Storage IDs de Convex**: Subidas dinámicas desde el panel de administración a través de `generateUploadUrl`.

## 3. Componentes Clave
- **Ficha Técnica**: `src/lib/components/ui/product-ficha-tecnica.svelte` (Svelte 5 Runes: `$props()`, `$derived()`).
- **Tarjeta de Producto (Cliente)**: `src/lib/components/ProductCardCustomer.svelte` (con lazy loading, fallback con `placeholder.svg` y badges).
- **Tarjeta de Producto (Admin)**: `src/lib/components/ProductCard.svelte`.
- **Vista de Detalle**: `src/routes/cataloge/productos/[slug]/+page.svelte` (con galería interactiva de miniaturas, visor principal y ficha técnica).
- **Semillero de Datos**: Mutación `api.products.seedProducts` en `src/convex/products.ts` para cargar automáticamente productos de ejemplo con imágenes y fichas técnicas.