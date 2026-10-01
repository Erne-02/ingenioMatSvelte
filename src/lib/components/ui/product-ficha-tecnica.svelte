<script lang="ts">
  import type { Doc } from "$convex/_generated/dataModel";
  import { Wrench, ClipboardList, Zap, Ruler } from "@lucide/svelte";

  interface Props {
    product: Doc<"products"> | any;
    showAll?: boolean;
  }

  let { product, showAll = true }: Props = $props();

  let fichaData = $derived({
    usos: product?.usos || "Información disponible bajo solicitud técnica.",
    preparacion: product?.preparacion || "Consultar manual de aplicación y dosificación.",
    actividad: product?.actividad || "Cumple estándares de control de calidad industrial.",
    medidas: product?.medidas || "Empaque estándar de fábrica.",
  });

  function scrollToFicha() {
    const el = document.getElementById("ficha-tecnica");
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: "smooth"
      });
    }
  }
</script>

<div id="ficha-tecnica" class="bg-card text-card-foreground rounded-2xl border border-border/70 shadow-sm overflow-hidden my-4 print:border-none print:shadow-none print:p-0">
  <!-- Cabecera de la Ficha Técnica -->
  <div class="px-6 py-4 bg-muted/40 border-b border-border/70 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
      <h3 class="text-base sm:text-lg font-bold tracking-tight text-foreground">
        Ficha Técnica y Especificaciones
      </h3>
    </div>
    <span class="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground bg-background px-2.5 py-1 rounded-md border border-border/60">
      Estándar de Calidad
    </span>
  </div>

  <div class="p-6">
    {#if showAll}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Usos y Aplicaciones -->
        <div class="bg-background/80 rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-colors">
          <div class="flex items-center gap-2 mb-2 text-primary">
            <Wrench size={16} />
            <h4 class="text-xs font-bold uppercase tracking-wider text-foreground">
              Usos y Aplicaciones en Obra
            </h4>
          </div>
          <p class="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            {fichaData.usos}
          </p>
        </div>

        <!-- Preparación y Mezcla -->
        <div class="bg-background/80 rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-colors">
          <div class="flex items-center gap-2 mb-2 text-primary">
            <ClipboardList size={16} />
            <h4 class="text-xs font-bold uppercase tracking-wider text-foreground">
              Preparación y Montaje
            </h4>
          </div>
          <p class="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            {fichaData.preparacion}
          </p>
        </div>

        <!-- Rendimiento y Actividad -->
        <div class="bg-background/80 rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-colors">
          <div class="flex items-center gap-2 mb-2 text-primary">
            <Zap size={16} />
            <h4 class="text-xs font-bold uppercase tracking-wider text-foreground">
              Rendimiento y Resistencia
            </h4>
          </div>
          <p class="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            {fichaData.actividad}
          </p>
        </div>

        <!-- Medidas y Embalaje Logístico -->
        <div class="bg-background/80 rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-colors">
          <div class="flex items-center gap-2 mb-2 text-primary">
            <Ruler size={16} />
            <h4 class="text-xs font-bold uppercase tracking-wider text-foreground">
              Dimensiones y Embalaje Logístico
            </h4>
          </div>
          <p class="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            {fichaData.medidas}
          </p>
        </div>
      </div>
    {:else}
      <!-- Versión compacta para tarjetas o resúmenes -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">USOS PRINCIPALES</p>
          <p class="text-xs font-medium text-foreground">{fichaData.usos.split('\n')[0]}</p>
        </div>
        <div>
          <p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">FORMATO / MEDIDAS</p>
          <p class="text-xs font-medium text-foreground">{fichaData.medidas.split('\n')[0]}</p>
        </div>
      </div>
    {/if}
  </div>

  {#if !showAll}
    <div class="px-6 pb-4">
      <button
        type="button"
        onclick={scrollToFicha}
        class="text-primary font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all text-xs cursor-pointer"
      >
        Consultar especificaciones completas
        <span class="text-base">→</span>
      </button>
    </div>
  {/if}
</div>