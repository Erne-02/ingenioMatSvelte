<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { ArrowRight, Ruler, Lightbulb, Zap, Package } from "@lucide/svelte";
    import type { Doc, Id } from "$convex/_generated/dataModel";

    export type Product = Doc<"products">;

    interface Props {
        product: Product;
        getCategoryName: (
            categoryId: Id<"categories"> | string | null | undefined,
        ) => string;
    }

    let { product, getCategoryName }: Props = $props();
</script>

<a href={`/cataloge/productos/${product.slug}`} class="block no-underline">
    <Card.Root
        class="group relative overflow-hidden flex flex-col p-0 transition-all duration-300 hover:shadow-xl hover:border-primary/50 cursor-pointer h-full border-border/50"
    >
        <!-- Imagen del Producto con Overlay y Fallback -->
        <div class="relative w-full h-56 shrink-0 overflow-hidden bg-muted m-0 p-0 flex items-center justify-center">
            {#if product.imageUrl}
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                    class="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onerror={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = "/images/products/placeholder.svg";
                    }}
                />
            {:else}
                <img
                    src="/images/products/placeholder.svg"
                    alt={product.name}
                    class="w-full h-full object-cover opacity-70"
                />
            {/if}

            <!-- Overlay con información -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

            <!-- Categoría Badge en overlay -->
            {#if product.categoryId}
                <div class="absolute top-3 left-3">
                    <Badge
                        variant="secondary"
                        class="font-medium text-xs px-3 py-1.5 bg-white/90 backdrop-blur-sm text-foreground border-0 shadow-md"
                    >
                        {getCategoryName(product.categoryId)}
                    </Badge>
                </div>
            {/if}

            <!-- Medidas Badge en overlay -->
            {#if product.medidas}
                <div class="absolute top-3 right-3">
                    <Badge
                        variant="outline"
                        class="font-medium text-xs px-3 py-1.5 bg-white/90 backdrop-blur-sm text-foreground border-0 shadow-md flex items-center gap-1"
                    >
                        <Ruler size={12} />
                        {product.medidas}
                    </Badge>
                </div>
            {/if}
        </div>

        <!-- Contenido -->
        <div class="p-5 flex-1 flex flex-col space-y-4 bg-gradient-to-b from-card to-card/95">
            <!-- Nombre y Categoría -->
            <div>
                {#if product.categoryId}
                    <span class="text-[11px] font-bold uppercase tracking-wider text-primary mb-1.5 block">
                        {getCategoryName(product.categoryId)}
                    </span>
                {/if}
                <h3
                    class="font-bold text-lg leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors"
                    title={product.name}
                >
                    {product.name}
                </h3>
            </div>

            <!-- Características destacadas -->
            <div class="space-y-2.5 flex-1">
                {#if product.usos}
                    <div class="flex items-start gap-2">
                        <div class="bg-primary/10 p-1.5 rounded-lg text-primary shrink-0 mt-0.5">
                            <Lightbulb size={14} />
                        </div>
                        <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed" title={product.usos}>
                            {product.usos}
                        </p>
                    </div>
                {/if}

                {#if product.preparacion}
                    <div class="flex items-start gap-2">
                        <div class="bg-primary/10 p-1.5 rounded-lg text-primary shrink-0 mt-0.5">
                            <Zap size={14} />
                        </div>
                        <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed" title={product.preparacion}>
                            {product.preparacion}
                        </p>
                    </div>
                {/if}

                {#if product.actividad}
                    <div class="flex items-start gap-2">
                        <div class="bg-primary/10 p-1.5 rounded-lg text-primary shrink-0 mt-0.5">
                            <Package size={14} />
                        </div>
                        <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed" title={product.actividad}>
                            {product.actividad}
                        </p>
                    </div>
                {/if}
            </div>

            <!-- Indicador de fotos de ejemplos -->
            {#if product.fotosDeEjemplos && product.fotosDeEjemplos.length > 0}
                <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div class="flex -space-x-1">
                        {#each product.fotosDeEjemplos.slice(0, 3) as foto}
                            <div class="w-5 h-5 rounded-full bg-primary/20 border-2 border-card" />
                        {/each}
                    </div>
                    <span>+{product.fotosDeEjemplos.length} fotos</span>
                </div>
            {/if}

            <!-- Footer con CTA -->
            <div class="pt-3 border-t border-border/50 flex items-center justify-between">
                <span class="text-xs font-medium text-primary">Ver detalles</span>
                <div class="bg-primary/10 p-1.5 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <ArrowRight size={16} class="group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </div>
    </Card.Root>
</a>
