<script lang="ts">
    import { Edit, Trash2, Ruler, Image as ImageIcon, Package, Eye } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import type { Doc, Id } from "$convex/_generated/dataModel";

    // Usamos directamente el tipo del documento generado por Convex
    export type Product = Doc<"products">;

    interface Props {
        product: Product;
        getCategoryName: (
            categoryId: Id<"categories"> | string | null | undefined,
        ) => string;
        onEdit: (product: Product) => void;
        onDelete: (id: Id<"products">) => void;
    }

    let { product, getCategoryName, onEdit, onDelete }: Props = $props();
</script>

<Card.Root
    class="group relative overflow-hidden flex flex-col p-0 transition-all duration-200 hover:shadow-lg hover:border-primary/30 border-border/60"
>
    <!-- Imagen del Producto con overlay compacto y fallback -->
    <div class="relative w-full h-36 shrink-0 overflow-hidden bg-muted m-0 p-0 flex items-center justify-center">
        {#if product.imageUrl}
            <img
                src={product.imageUrl}
                alt={product.name}
                class="block w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        
        <!-- Indicador de fotos de ejemplos -->
        {#if product.fotosDeEjemplos && product.fotosDeEjemplos.length > 0}
            <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                <ImageIcon size={10} class="text-white" />
                <span class="text-[10px] text-white font-medium">{product.fotosDeEjemplos.length}</span>
            </div>
        {/if}
    </div>

    <!-- Contenido -->
    <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
        <!-- Bloque Superior: Nombre + Categoría -->
        <div class="space-y-2">
            <div class="flex items-start justify-between gap-2">
                <h3
                    class="font-semibold text-sm leading-tight line-clamp-2 text-foreground min-h-[2rem]"
                    title={product.name}
                >
                    {product.name}
                </h3>
            </div>

            <!-- Badge de Categoría -->
            {#if product.categoryId}
                <Badge
                    variant="secondary"
                    class="font-normal text-[10px] px-2 py-0.5 h-5 w-fit"
                >
                    {getCategoryName(product.categoryId)}
                </Badge>
            {/if}
        </div>

        <!-- Información adicional compacta -->
        <div class="space-y-1.5 text-[10px] text-muted-foreground">
            {#if product.medidas}
                <div class="flex items-center gap-1.5">
                    <Ruler size={10} class="shrink-0" />
                    <span class="line-clamp-1" title={product.medidas}>{product.medidas}</span>
                </div>
            {/if}
            
            {#if product.usos}
                <div class="flex items-center gap-1.5">
                    <Eye size={10} class="shrink-0" />
                    <span class="line-clamp-1" title={product.usos}>{product.usos}</span>
                </div>
            {/if}
            
            {#if product.actividad}
                <div class="flex items-center gap-1.5">
                    <Package size={10} class="shrink-0" />
                    <span class="line-clamp-1" title={product.actividad}>{product.actividad}</span>
                </div>
            {/if}
        </div>

        <!-- Footer / Acciones -->
        <div class="pt-2 flex items-center justify-between gap-2 border-t border-border/40 mt-auto">
            <!-- Contador de campos adicionales -->
            <div class="flex items-center gap-1 text-[10px] text-muted-foreground">
                {#if product.preparacion || product.fotosDeEjemplos}
                    <span class="bg-primary/5 px-1.5 py-0.5 rounded">
                        +{(product.preparacion ? 1 : 0) + (product.fotosDeEjemplos?.length || 0)} campos
                    </span>
                {/if}
            </div>

            <!-- Botones -->
            <div class="flex items-center gap-1 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => onEdit(product)}
                    class="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-primary/10"
                    title="Editar producto"
                >
                    <Edit size={13} />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => onDelete(product._id)}
                    class="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Eliminar producto"
                >
                    <Trash2 size={13} />
                </Button>
            </div>
        </div>
    </div>
</Card.Root>
