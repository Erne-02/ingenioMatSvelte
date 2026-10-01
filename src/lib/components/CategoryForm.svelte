<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";

    interface Category {
        _id: string;
        name: string;
        description?: string;
        order?: number;
    }

    interface Props {
        category?: Category | null;
        onClose: () => void;
        onSave: (data: {
            name: string;
            description?: string;
            order?: number;
        }) => Promise<void>;
    }

    let { category = null, onClose, onSave }: Props = $props();

    // 1. Estado local editable para los inputs
    let name = $state("");
    let description = $state("");
    let order = $state<number | undefined>(undefined);
    let error = $state<string | null>(null);
    let isSubmitting = $state(false);

    // 2. Sincronizamos los campos cuando cambie la prop 'category'
    $effect(() => {
        name = category?.name ?? "";
        description = category?.description ?? "";
        order = category?.order;
    });

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();

        if (!name.trim()) {
            error = "El nombre es requerido";
            return;
        }

        error = null;
        isSubmitting = true;

        try {
            await onSave({
                name: name.trim(),
                description: description.trim() || undefined,
                order:
                    order === undefined || Number.isNaN(order)
                        ? undefined
                        : order,
            });
        } finally {
            isSubmitting = false;
        }
    }
</script>

<form onsubmit={handleSubmit} class="space-y-4">
    <div class="space-y-2">
        <Label for="name">Nombre</Label>
        <Input
            id="name"
            bind:value={name}
            placeholder="Ej. Entrantes"
            disabled={isSubmitting}
            oninput={() => (error = null)}
        />
        {#if error}
            <p class="text-sm font-medium text-destructive">{error}</p>
        {/if}
    </div>

    <div class="space-y-2">
        <Label for="description">Descripción (opcional)</Label>
        <Input
            id="description"
            bind:value={description}
            placeholder="Breve descripción de la categoría"
            disabled={isSubmitting}
        />
    </div>

    <div class="space-y-2">
        <Label for="order">Orden (opcional)</Label>
        <Input
            id="order"
            type="number"
            bind:value={order}
            placeholder="Ej. 1"
            disabled={isSubmitting}
        />
    </div>

    <div class="flex gap-3 pt-4">
        <Button
            type="button"
            variant="outline"
            onclick={onClose}
            disabled={isSubmitting}
            class="flex-1"
        >
            Cancelar
        </Button>
        <Button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            class="flex-1"
        >
            {#if isSubmitting}
                Guardando...
            {:else if category}
                Actualizar
            {:else}
                Crear
            {/if}
        </Button>
    </div>
</form>
