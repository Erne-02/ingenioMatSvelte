<script lang="ts">
    import { useQuery, useMutation } from "convex-svelte";
    import { api } from "$convex/_generated/api";
    import type { Doc, Id } from "$convex/_generated/dataModel";
    import type { ProductSchema } from "$lib/schemas/product";
    import type { InferOutput } from "valibot";
    import { Plus } from "@lucide/svelte";
    import { toast } from "$lib/toast";

    // Componentes de UI
    import ProductCard from "$lib/components/ProductCard.svelte";
    import SearchAndFilters from "$lib/components/SearchAndFilters.svelte";
    import ProductForm from "$lib/components/ProductForm.svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";

    // Tipos extraídos del modelo de Convex y Schemas
    type Product = Doc<"products">;
    type ProductFormData = InferOutput<ProductSchema>;

    // --- Estado Local (Svelte 5 Runes) ---
    let showForm = $state(false);
    let editingProduct = $state<Product | null>(null);

    // Filtros
    let searchQuery = $state("");
    let filterCategory = $state("");
    let showFilters = $state(false);

    // --- Consultas y Mutaciones de Convex ---
    const productsQuery = useQuery(api.products.list, {});
    const categoriesQuery = useQuery(api.categories.list, {});

    const removeProduct = useMutation(api.products.remove);
    const createProduct = useMutation(api.products.create);
    const updateProduct = useMutation(api.products.update);
    const generateUploadUrl = useMutation(api.products.generateUploadUrl);
    const seedProducts = useMutation(api.products.seedProducts);

    let isSeeding = $state(false);

    async function handleSeed() {
        isSeeding = true;
        try {
            await seedProducts({});
            toast.success("Catálogo de productos e imágenes cargado con éxito");
        } catch (err) {
            console.error("Error al cargar productos iniciales:", err);
            toast.error("Error al cargar catálogo de prueba");
        } finally {
            isSeeding = false;
        }
    }

    // Helpers para nombres de sección/categoría

    function getCategoryName(
        categoryId: Id<"categories"> | string | null | undefined,
    ): string {
        if (!categoryId) return "Sin categoría";
        const category = categoriesQuery.data?.find(
            (c) => c._id === categoryId,
        );
        return category ? category.name : "Desconocida";
    }

    // --- Productos Filtrados (Derivado Reactivo) ---
    let filteredProducts = $derived.by(() => {
        const list = (productsQuery.data as Product[] | undefined) || [];
        return list.filter((product) => {
            if (
                searchQuery &&
                !product.name.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
                return false;
            }
            if (filterCategory && product.categoryId !== filterCategory) {
                return false;
            }
            return true;
        });
    });

    let hasActiveFilters = $derived(Boolean(filterCategory));

    function clearFilters() {
        filterCategory = "";
    }

    // --- Acciones ---
    async function handleDelete(id: Id<"products">) {
        if (confirm("¿Estás seguro de eliminar este producto?")) {
            try {
                await removeProduct({ id });
                toast.success("Producto eliminado");
            } catch (error) {
                toast.error("Error al eliminar producto");
            }
        }
    }

    function handleEdit(product: Product) {
        editingProduct = product;
        showForm = true;
    }

    function handleFormClose() {
        showForm = false;
        editingProduct = null;
    }

    // Firma ajustada para recibir los datos del formulario (ProductFormData)
    async function handleSave(data: ProductFormData) {
        try {
            const payload = {
                ...data,
                categoryId: data.categoryId as Id<"categories">,
            };

            if (editingProduct) {
                await updateProduct({
                    id: editingProduct._id,
                    ...payload,
                });
                toast.success("Producto actualizado");
            } else {
                await createProduct(payload);
                toast.success("Producto creado");
            }
            handleFormClose();
        } catch (error) {
            console.error("Error al guardar producto:", error);
            toast.error("Error al guardar producto");
        }
    }
</script>

<div class="p-6">
    <div class="max-w-7xl mx-auto">
        <!-- Encabezado y Filtros -->
        <div class="flex flex-col gap-4 mb-6">
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold tracking-widest font-sans">
                    Productos
                </h1>
                <Button
                    onclick={() => {
                        editingProduct = null;
                        showForm = true;
                    }}
                >
                    <Plus size={20} class="mr-2 inline-block" />
                    Nuevo producto
                </Button>
            </div>

            <SearchAndFilters
                bind:searchQuery
                bind:filterCategory
                categories={categoriesQuery.data || []}
                {hasActiveFilters}
                onClearFilters={clearFilters}
                {getCategoryName}
            />
        </div>

        <!-- Estado de Carga -->
        {#if productsQuery.isLoading}
            <div class="min-h-100 flex items-center justify-center">
                <div
                    class="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-neutral-100"
                ></div>
            </div>
        {:else}
            <!-- Grid de Productos -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {#each filteredProducts as product (product._id)}
                    <ProductCard
                        {product}
                        {getCategoryName}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                {/each}
            </div>

            <!-- Estado Vacío -->
            {#if filteredProducts.length === 0}
                <div class="text-center py-12 flex flex-col items-center justify-center">
                    <p class="text-muted-foreground tracking-wide mb-4">
                        {hasActiveFilters || searchQuery
                            ? "No se encontraron productos con los filtros aplicados"
                            : "No hay productos creados aún en el catálogo"}
                    </p>
                    {#if !hasActiveFilters && !searchQuery}
                        <Button
                            variant="outline"
                            onclick={handleSeed}
                            disabled={isSeeding}
                            class="cursor-pointer"
                        >
                            {isSeeding
                                ? "Generando productos con imágenes..."
                                : "Cargar catálogo inicial con imágenes"}
                        </Button>
                    {/if}
                </div>
            {/if}
        {/if}
    </div>

    <!-- Form Modal (Integración nativa con shadcn-svelte Dialog) -->
    <!-- Form Modal (Integración con scroll interno y límites de altura) -->
    <Dialog.Root
        bind:open={showForm}
        onOpenChange={(open) => {
            if (!open) handleFormClose();
        }}
    >
        <Dialog.Content
            class="flex max-h-[80vh] flex-col overflow-hidden sm:max-w-[600px] md:max-h-[95vh]"
        >
            <!-- Header Fijo -->
            <Dialog.Header class="shrink-0 pb-2">
                <Dialog.Title>
                    {editingProduct ? "Editar producto" : "Nuevo producto"}
                </Dialog.Title>
            </Dialog.Header>

            <!-- Contenedor Scrolleable del Formulario -->
            <div class="flex-1 overflow-y-auto pr-1">
                <ProductForm
                    product={editingProduct}
                    categories={categoriesQuery.data || []}
                    onSave={handleSave}
                    onCancel={handleFormClose}
                    {generateUploadUrl}
                />
            </div>
        </Dialog.Content>
    </Dialog.Root>
</div>
