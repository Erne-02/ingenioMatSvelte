<script lang="ts">
    import { Check, ChevronRight, ChevronLeft, Blocks, Sun, Frame, Package } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button";

    // ─────────────────────────────────────────────────────────────────────────────
    // CÓMO AÑADIR IMÁGENES A CUALQUIER CATEGORÍA
    // ─────────────────────────────────────────────────────────────────────────────
    // 1. Guarda la imagen en:  static/images/products/<nombre-del-archivo>.png
    // 2. En el objeto de la categoría, añade la propiedad "images" con un array:
    //       images: [
    //         { src: "/images/products/<archivo>.png", label: "Nombre del producto" },
    //         { src: "/images/products/<archivo2>.png", label: "Otro producto" },
    //       ]
    // 3. Si tienes más de 1 imagen, el carrusel aparece automáticamente con
    //    flechas de navegación ‹ › y puntos indicadores.
    // 4. Si NO defines "images", la card muestra el ícono como antes.
    // ─────────────────────────────────────────────────────────────────────────────

    type ProductImage = { src: string; label: string };

    type CatalogItem = {
        id: string;
        title: string;
        desc: string;
        icon: any;
        gradient: string;
        iconColor: string;
        items: string[];
        /** Array de imágenes de productos — activa el carrusel (opcional) */
        images?: ProductImage[];
    };

    const catalogItems: CatalogItem[] = [
        // ══════════════════════════════════════════════════════════════════════
        // CATEGORÍA: Morteros y Premezclas  ← CON imágenes reales de productos
        // ══════════════════════════════════════════════════════════════════════
        {
            id: "morteros",
            title: "Morteros y Premezclas",
            desc: "Mezclas industriales de alta resistencia para enlucidos, revocos, nivelaciones y hormigón estructural.",
            icon: Package,
            gradient: "from-red-500/20 via-rose-500/10 to-orange-500/20",
            iconColor: "text-red-600 dark:text-red-400",
            // ▼ PARA AÑADIR MÁS IMÁGENES: agrega otro objeto { src, label } al array ▼
            // IMPORTANTE: guarda cada imagen en static/images/products/ con el nombre indicado
            images: [
                { src: "/images/products/Calfin.png",    label: "MorteroCalfín" },
                { src: "/images/products/Calgru.png",    label: "Mortero Cola" },
                { src: "/images/products/fino.png",      label: "MorteroFino" },
                { src: "/images/products/grueso.png",    label: "MorteroGrueso" },
                { src: "/images/products/Premezcla.png", label: "Premezcla IngenioMAT – 40 kg" },
                { src: "/images/products/cola.png",      label: "MorteroCola" },
            ],
            items: [
                "MorterCalfín – Mortero fino de cal para fachadas",
                "MorterCalcol – Revocos, enlucidos y acabados",
                "Hormigón Premezclado – Elementos estructurales",
                "Premezcla 40 kg – Mayor rendimiento y adherencia",
            ],
        },
        // ══════════════════════════════════════════════════════════════════════
        // CATEGORÍA: Materiales de Construcción  ← sin imágenes aún (solo ícono)
        // Para añadir imágenes: agrega la propiedad "images" igual que arriba
        // ══════════════════════════════════════════════════════════════════════
        {
            id: "materiales",
            title: "Materiales de Construcción",
            desc: "Bases sólidas, áridos y acero certificado para todo tipo de cimientos y estructuras.",
            icon: Blocks,
            gradient: "from-amber-500/20 via-orange-500/10 to-yellow-500/20",
            iconColor: "text-amber-600 dark:text-amber-400",
            items: [
                "Cemento Gris de Alta Resistencia",
                "Arena Lavada y Gravilla Seleccionada",
                "Mortero Seco y Cal Hidratada",
                "Acero Estructural y Varillas",
            ],
        },
        // ══════════════════════════════════════════════════════════════════════
        // CATEGORÍA: Energía Solar  ← sin imágenes aún
        // ══════════════════════════════════════════════════════════════════════
        {
            id: "energia",
            title: "Energía Solar y Almacenamiento",
            desc: "Autonomía energética total con paneles solares monocristalinos y bancos de baterías de litio.",
            icon: Sun,
            gradient: "from-sky-500/20 via-blue-500/10 to-indigo-500/20",
            iconColor: "text-sky-600 dark:text-sky-400",
            items: [
                "Paneles Solares Monocristalinos de Alta Gama",
                "Baterías de Litio LiFePO4 para Respaldo",
                "Inversores Híbridos Inteligentes con App",
                "Estudio de Consumo y Diseño a Medida",
            ],
        },
        // ══════════════════════════════════════════════════════════════════════
        // CATEGORÍA: Carpintería de Aluminio  ← sin imágenes aún
        // ══════════════════════════════════════════════════════════════════════
        {
            id: "carpinteria",
            title: "Carpintería de Aluminio",
            desc: "Cerramientos de alta precisión, ventanas y puertas diseñadas para el máximo confort acústico y térmico.",
            icon: Frame,
            gradient: "from-slate-500/20 via-zinc-500/10 to-gray-500/20",
            iconColor: "text-slate-600 dark:text-slate-400",
            items: [
                "Ventanas Batientes y Corredizas a Medida",
                "Mamparas de Vidrio Templado Premium",
                "Puertas de Aluminio de Alta Seguridad",
                "Fachadas de Vidrio Comercial y Residencial",
            ],
        },
    ];

    // ─── Estado de carrusel — $state() es obligatorio en Svelte 5 ───────────────
    let carouselIndex: Record<string, number> = $state(
        Object.fromEntries(catalogItems.filter(i => i.images).map(i => [i.id, 0]))
    );

    function prevSlide(id: string, total: number) {
        carouselIndex[id] = (carouselIndex[id] - 1 + total) % total;
    }
    function nextSlide(id: string, total: number) {
        carouselIndex[id] = (carouselIndex[id] + 1) % total;
    }
    function goToSlide(id: string, idx: number) {
        carouselIndex[id] = idx;
    }
</script>

<section
    id="catalogo"
    class="py-20 bg-[#f5f0e8] dark:bg-background rounded-b-4xl mx-2 md:mx-4"
>
    <div class="max-w-7xl mx-auto mt-20 px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span
                class="text-xs font-bold uppercase tracking-widest text-primary"
            >
                Nuestro Catálogo
            </span>
            <h2
                class="display-title text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground"
            >
                Líneas de Productos y Soluciones Certificadas
            </h2>
            <div class="w-16 h-1 bg-primary mx-auto rounded"></div>
        </div>

        <!-- Cards Grid — 2 cols en md, 4 cols en xl para acomodar la nueva categoría -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {#each catalogItems as item (item.id)}
                <div
                    class="bg-white dark:bg-card text-card-foreground rounded-3xl overflow-hidden flex flex-col transition-all duration-400 hover:scale-[1.02] hover:shadow-xl group cursor-pointer"
                >
                    <!-- ── Encabezado: carrusel si hay images[], si no muestra el ícono ── -->
                    {#if item.images && item.images.length > 0}
                        <!-- CARRUSEL DE IMÁGENES DE PRODUCTOS -->
                        <div class="h-56 relative overflow-hidden shrink-0 rounded-t-3xl bg-gray-100 dark:bg-gray-800">
                            {#each item.images as img, idx}
                                <img
                                    src={img.src}
                                    alt={img.label}
                                    class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 {idx === carouselIndex[item.id] ? 'opacity-100' : 'opacity-0'}"
                                />
                            {/each}

                            <!-- Etiqueta del producto actual -->
                            <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-end justify-between">
                                <span class="text-xs text-white font-medium truncate max-w-[70%]">
                                    {item.images[carouselIndex[item.id]].label}
                                </span>
                                <span class="text-xs text-white/70">
                                    {carouselIndex[item.id] + 1} / {item.images.length}
                                </span>
                            </div>

                            <!-- Botones prev / next (solo si hay más de 1 imagen) -->
                            {#if item.images.length > 1}
                                <button
                                    onclick={(e) => { e.stopPropagation(); prevSlide(item.id, item.images!.length); }}
                                    class="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                                    aria-label="Imagen anterior"
                                >
                                    <ChevronLeft class="w-4 h-4" />
                                </button>
                                <button
                                    onclick={(e) => { e.stopPropagation(); nextSlide(item.id, item.images!.length); }}
                                    class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                                    aria-label="Imagen siguiente"
                                >
                                    <ChevronRight class="w-4 h-4" />
                                </button>

                                <!-- Dots indicadores -->
                                <div class="absolute top-2 inset-x-0 flex justify-center gap-1.5">
                                    {#each item.images as _, dotIdx}
                                        <button
                                            onclick={(e) => { e.stopPropagation(); goToSlide(item.id, dotIdx); }}
                                            class="w-1.5 h-1.5 rounded-full transition-all duration-300 {dotIdx === carouselIndex[item.id] ? 'bg-white w-3' : 'bg-white/50'}"
                                            aria-label="Ir a imagen {dotIdx + 1}"
                                        ></button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <!-- ÍCONO (categorías sin imágenes) -->
                        <div
                            class="h-56 relative overflow-hidden shrink-0 rounded-t-3xl bg-gradient-to-br {item.gradient} flex items-center justify-center"
                        >
                            <item.icon class="w-20 h-20 {item.iconColor} opacity-80 transition-transform duration-700 group-hover:scale-110" />
                            <div
                                class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent flex items-end p-5"
                            >
                                <span
                                    class="text-xs uppercase tracking-wider text-foreground/80 bg-white/70 dark:bg-black/40 dark:text-white backdrop-blur-sm px-2.5 py-1 rounded-full"
                                >
                                    Ver Catálogo
                                </span>
                            </div>
                        </div>
                    {/if}

                    <!-- Content -->
                    <div class="p-6 flex flex-col flex-grow text-left">
                        <h3
                            class="text-xl text-foreground mb-1 group-hover:text-primary transition-colors"
                        >
                            {item.title}
                        </h3>
                        <p class="text-xs text-muted-foreground mb-4">
                            {item.desc}
                        </p>

                        <!-- List of sub-items -->
                        <ul class="space-y-2 mb-6 flex-grow">
                            {#each item.items as sub, sIdx (sIdx)}
                                <li
                                    class="flex items-center gap-2 text-sm text-foreground/80"
                                >
                                    <Check
                                        class="w-4 h-4 text-primary shrink-0"
                                    />
                                    <span>{sub}</span>
                                </li>
                            {/each}
                        </ul>

                        <a href="/cataloge" class="no-underline mt-auto block w-full">
                            <Button
                                class="w-full text-white rounded-xl bg-primary dark:bg-accent justify-between px-5"
                            >
                                Ver Catálogo <ChevronRight
                                    class="w-4 h-4"
                                />
                            </Button>
                        </a>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>
