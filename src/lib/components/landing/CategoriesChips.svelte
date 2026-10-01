<script lang="ts">
    import { useQuery } from "convex-svelte";
    import { api } from "$convex/_generated/api";

    const categoriesQuery = useQuery(api.categories.list, {});

    // Categorías reales ordenadas por 'order' (si existe) y luego por nombre.
    let categories = $derived(
        [...(categoriesQuery.data ?? [])].sort(
            (a, b) =>
                (a.order ?? Number.MAX_SAFE_INTEGER) -
                    (b.order ?? Number.MAX_SAFE_INTEGER) ||
                a.name.localeCompare(b.name),
        ),
    );
</script>

{#if categories.length > 0}
<div class="relative w-full overflow-hidden bg-background py-5 border-y border-border/50">
    <div class="flex w-max animate-marquee">
        <!-- List 1 -->
        <div class="flex gap-8 pr-8 shrink-0">
            {#each categories as cat (`cat1-${cat._id}`)}
                <a
                    href="/cataloge/productos?categoria={cat._id}"
                    class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-foreground border border-foreground text-background text-xs md:text-sm font-extrabold tracking-wider uppercase transition-all duration-300 hover:bg-primary hover:border-primary hover:text-primary-foreground hover:scale-105 cursor-pointer no-underline"
                >
                    <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    {cat.name}
                </a>
            {/each}
        </div>

        <!-- List 2 (Duplicate for loop) -->
        <div class="flex gap-8 pr-8 shrink-0">
            {#each categories as cat (`cat2-${cat._id}`)}
                <a
                    href="/cataloge/productos?categoria={cat._id}"
                    class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-foreground border border-foreground text-background text-xs md:text-sm font-extrabold tracking-wider uppercase transition-all duration-300 hover:bg-primary hover:border-primary hover:text-primary-foreground hover:scale-105 cursor-pointer no-underline"
                >
                    <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    {cat.name}
                </a>
            {/each}
        </div>
    </div>
</div>
{/if}

<style>
    @keyframes marquee {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(-50%);
        }
    }

    .animate-marquee {
        animation: marquee 35s linear infinite;
    }

    .animate-marquee:hover {
        animation-play-state: paused;
    }
</style>
