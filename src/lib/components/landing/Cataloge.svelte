<script lang="ts">
    import { Check, ChevronRight, Blocks, Sun, Frame } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button";

    // Datos del catálogo
    const catalogItems = [
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

        <!-- Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each catalogItems as item (item.id)}
                <div
                    class="bg-[#f5f0e8] bg-white text-card-foreground rounded-3xl overflow-hidden flex flex-col transition-all duration-400 hover:scale-102 group cursor-pointer"
                >
                    <!-- Category Icon Header -->
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
