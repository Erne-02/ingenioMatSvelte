<script lang="ts">
    import type { PageData } from "./$types";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import {
        Package,
        ArrowLeft,
        ShieldCheck,
        Truck,
        MessageSquare,
        Printer,
        Globe,
        CheckCircle2,
        FileText
    } from "@lucide/svelte";
    import ProductFichaTecnica from "$lib/components/ui/product-ficha-tecnica.svelte";

    let { data }: { data: PageData } = $props();
    let product = $derived(data.product);
    let category = $derived(data.category);

    let activeImage = $state<string | null>(null);

    // Imagen actual a mostrar
    let currentImage = $derived(activeImage || product?.imageUrl || "/images/products/placeholder.svg");

    // Todas las fotos disponibles para galería
    let allPhotos = $derived.by(() => {
        const list: string[] = [];
        if (product?.imageUrl) list.push(product.imageUrl);
        if (product?.fotosDeEjemplos && product.fotosDeEjemplos.length > 0) {
            product.fotosDeEjemplos.forEach((p) => {
                if (!list.includes(p)) list.push(p);
            });
        }
        return list;
    });

    let skuCode = $derived(
        `ING-${product?.slug ? product.slug.toUpperCase().slice(0, 8) : "PROD"}`
    );
</script>

<svelte:head>
    <title>{product.name} | Catálogo Oficial IngenioMat</title>
    <meta name="description" content="Especificaciones técnicas y suministro de {product.name}. Calidad certificada y despacho para proyectos de construcción e ingeniería." />
</svelte:head>

<!-- Navegación de retorno (oculta al imprimir) -->
<div class="mb-6 print:hidden">
    <a
        href="/cataloge/productos"
        class="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
    >
        <ArrowLeft size={16} class="mr-2" />
        Volver al catálogo completo
    </a>
</div>

<div class="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm print:border-none print:shadow-none">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <!-- Imagen y Galería Interactiva -->
        <div
            class="bg-muted/30 relative flex flex-col items-center justify-between p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-border/70 print:p-0 print:border-none"
        >
            <div class="relative w-full flex-1 flex items-center justify-center min-h-[340px] max-h-[480px] overflow-hidden rounded-2xl bg-background/80 p-6 border border-border/60 shadow-inner">
                <img
                    src={currentImage}
                    alt={product.name}
                    class="max-w-full max-h-[420px] object-contain drop-shadow-md rounded-lg transition-all duration-300"
                    onerror={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = "/images/products/placeholder.svg";
                    }}
                />
            </div>

            <!-- Miniaturas interactiva de galería (oculta al imprimir) -->
            {#if allPhotos.length > 1}
                <div class="w-full mt-6 print:hidden">
                    <p class="text-xs text-muted-foreground font-semibold mb-2.5">
                        Galería y fotos de aplicación ({allPhotos.length}):
                    </p>
                    <div class="flex items-center gap-2.5 overflow-x-auto pb-1 max-w-full">
                        {#each allPhotos as photo}
                            <button
                                type="button"
                                onclick={() => { activeImage = photo; }}
                                class="w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer {currentImage === photo ? 'border-primary ring-2 ring-primary/30 scale-105 shadow-sm' : 'border-border/70 opacity-70 hover:opacity-100 hover:border-primary/50'}"
                            >
                                <img
                                    src={photo}
                                    alt="Miniatura"
                                    class="w-full h-full object-cover"
                                    onerror={(e) => {
                                        const target = e.currentTarget as HTMLImageElement;
                                        target.src = "/images/products/placeholder.svg";
                                    }}
                                />
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>

        <!-- Detalles y Acciones Comerciales -->
        <div class="p-8 lg:p-12 flex flex-col justify-between">
            <div>
                <!-- Categoría y Código SKU -->
                <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                    {#if category}
                        <Badge variant="secondary" class="text-xs py-1 px-3 font-semibold uppercase tracking-wider">
                            {category.name}
                        </Badge>
                    {/if}
                    <span class="text-xs font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/50">
                        REF: {skuCode}
                    </span>
                </div>

                <h1
                    class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight"
                >
                    {product.name}
                </h1>

                <!-- Ficha Técnica Profesional -->
                <ProductFichaTecnica product={product} showAll={true} />

                <!-- Fotos de Ejemplos en Obra (Galería complementaria) -->
                {#if product.fotosDeEjemplos && product.fotosDeEjemplos.length > 0}
                    <div class="pt-6 border-t border-border mt-6 print:hidden">
                        <h3 class="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <CheckCircle2 size={16} class="text-primary" />
                            Aplicaciones y Ejemplos en Obra Real
                        </h3>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {#each product.fotosDeEjemplos as photoUrl}
                                <button
                                    type="button"
                                    onclick={() => { activeImage = photoUrl; window.scrollTo({ top: 140, behavior: 'smooth' }); }}
                                    class="aspect-square rounded-xl overflow-hidden bg-muted border border-border group hover:border-primary/60 transition-all cursor-pointer relative"
                                >
                                    <img
                                        src={photoUrl}
                                        alt="Foto de ejemplo"
                                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onerror={(e) => {
                                            const target = e.currentTarget as HTMLImageElement;
                                            target.src = "/images/products/placeholder.svg";
                                        }}
                                    />
                                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <span class="text-[11px] font-semibold text-white bg-black/70 px-2.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            Ver en grande
                                        </span>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Acciones y Cotización Internacional -->
            <div class="mt-8 pt-6 border-t border-border space-y-4 print:hidden">
                <!-- Botones Principales -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <a
                        href="https://wa.me/?text={encodeURIComponent(`Hola IngenioMat, me interesa solicitar cotización y consultar disponibilidad de suministro/exportación para el producto: ${product.name} (Ref: ${skuCode})`)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all text-sm cursor-pointer flex-1"
                    >
                        <MessageSquare size={18} />
                        Solicitar Cotización Internacional
                    </a>

                    <button
                        type="button"
                        onclick={() => window.print()}
                        class="inline-flex items-center justify-center gap-2 px-5 py-3.5 border border-border hover:bg-muted text-foreground font-medium rounded-xl transition-colors text-sm cursor-pointer"
                        title="Imprimir o guardar ficha en formato PDF"
                    >
                        <Printer size={18} />
                        Imprimir / PDF
                    </button>
                </div>

                <!-- Insignias de Confianza para compradores internacionales -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe size={15} class="text-primary shrink-0" />
                        <span>Suministro y Despacho</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck size={15} class="text-primary shrink-0" />
                        <span>Calidad Certificada</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText size={15} class="text-primary shrink-0" />
                        <span>Asesoría Técnica y Proforma</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
