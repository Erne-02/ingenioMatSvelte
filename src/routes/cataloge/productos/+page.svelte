<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { ChevronRight, Home, Package, Search, Layers } from "@lucide/svelte";
    import ProductCardCustomer from "$lib/components/ProductCardCustomer.svelte";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import type { Doc, Id } from "$convex/_generated/dataModel";

    interface PageData {
        products: Doc<"products">[];
        categories: Doc<"categories">[];
    }

    let { data }: { data: PageData } = $props();

    // Estado de filtros (la categoría puede venir preseleccionada desde la URL,
    // p. ej. al llegar desde los chips de categorías del inicio)
    let searchQuery = $state("");
    let filterCategory = $state(page.url.searchParams.get("categoria") ?? "");

    // Productos filtrados
    let filteredProducts = $derived.by(() => {
        if (!data.products) return [];

        return data.products.filter((product: Doc<"products">) => {
            const matchesSearch = searchQuery === "" ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = filterCategory === "" ||
                product.categoryId === filterCategory;

            return matchesSearch && matchesCategory;
        });
    });

    // Helper para obtener nombre de categoría
    function getCategoryName(categoryId: Id<"categories"> | string | null | undefined): string {
        if (!categoryId || !data.categories) return "Sin categoría";
        const category = data.categories.find((cat) => cat._id === categoryId);
        return category?.name || "Sin categoría";
    }

    // Verificar si hay filtros activos
    let hasActiveFilters = $derived(searchQuery !== "" || filterCategory !== "");

    // Limpiar filtros
    function clearFilters() {
        searchQuery = "";
        filterCategory = "";
    }

    // Scroll al top al cargar
    onMount(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
</script>

<svelte:head>
    <title>Catálogo Oficial de Productos | IngenioMat</title>
    <meta
        name="description"
        content="Explora nuestro catálogo completo de materiales de construcción, tuberías, morteros, terminaciones y luminarias para obras y proyectos."
    />
</svelte:head>

<!-- Barra de Búsqueda y Selector de Categorías Visibles -->
<div class="mb-10 space-y-5">
    <!-- Buscador Principal -->
    <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div class="relative w-full sm:max-w-md">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
            <Input
                type="text"
                placeholder="Buscar por nombre de producto..."
                bind:value={searchQuery}
                class="pl-10 h-11 bg-card rounded-xl border-border/70 shadow-sm"
            />
            {#if searchQuery}
                <button
                    type="button"
                    onclick={() => searchQuery = ""}
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 text-xs cursor-pointer"
                >
                    ✕
                </button>
            {/if}
        </div>

        {#if hasActiveFilters}
            <Button
                variant="ghost"
                size="sm"
                onclick={clearFilters}
                class="text-xs text-primary hover:text-primary/80 gap-1.5 cursor-pointer self-end sm:self-auto"
            >
                Limpiar filtros ({filteredProducts.length} encontrados)
            </Button>
        {/if}
    </div>

    <!-- Pestañas Horizontales de Categorías Oficiales (Visibles e interactivas) -->
    <div class="space-y-2.5">
        <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers size={14} class="text-primary" />
                Categorías del Catálogo
            </span>
            <span class="text-xs text-muted-foreground font-medium">
                {filterCategory ? `Filtrando por: ${getCategoryName(filterCategory)}` : "Mostrando todas las categorías"}
            </span>
        </div>

        <div class="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
            <!-- Botón 'Todas las Categorías' -->
            <button
                type="button"
                onclick={() => filterCategory = ""}
                class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-2 {filterCategory === '' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]' : 'bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/40'}"
            >
                Todas
                <span class="text-[11px] px-1.5 py-0.5 rounded-full {filterCategory === '' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
                    {data.products?.length || 0}
                </span>
            </button>

            <!-- Píldoras de las 6 Categorías Oficiales -->
            {#each (data.categories ?? []) as category (category._id)}
                {@const count = data.products?.filter(p => p.categoryId === category._id).length || 0}
                <button
                    type="button"
                    onclick={() => filterCategory = category._id}
                    class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-2 {filterCategory === category._id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]' : 'bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/40'}"
                >
                    {category.name}
                    <span class="text-[11px] px-1.5 py-0.5 rounded-full {filterCategory === category._id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
                        {count}
                    </span>
                </button>
            {/each}
        </div>
    </div>
</div>

<!-- Grid de Productos -->
{#if filteredProducts.length === 0}
    <div class="text-center py-20 bg-card border border-border/60 rounded-3xl p-8">
        <Package class="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 class="text-lg font-bold text-foreground mb-2">
            No se encontraron productos en esta categoría
        </h3>
        <p class="text-muted-foreground text-sm max-w-md mx-auto">
            {hasActiveFilters
                ? "Prueba seleccionando otra categoría o limpiando la búsqueda para ver más productos."
                : "No hay productos registrados en este momento."}
        </p>
        {#if hasActiveFilters}
            <Button
                variant="outline"
                onclick={clearFilters}
                class="mt-5 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
            >
                Ver todos los productos ({data.products?.length || 0})
            </Button>
        {/if}
    </div>
{:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each filteredProducts as product (product._id)}
            <ProductCardCustomer
                {product}
                {getCategoryName}
            />
        {/each}
    </div>

    <!-- Contador de resultados -->
    <div class="mt-10 text-center text-xs text-muted-foreground">
        Mostrando {filteredProducts.length} de {data.products?.length || 0} productos
        {#if filterCategory}
            en la categoría <span class="font-semibold text-foreground">"{getCategoryName(filterCategory)}"</span>
        {/if}
    </div>
{/if}
