<script lang="ts">
    import { Plus, Edit, Trash2 } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { toast } from "$lib/toast";
    import ServiceTypeForm from "$lib/components/ServiceTypeForm.svelte";
    import { useQuery, useMutation } from "convex-svelte";
    import { api } from "$convex/_generated/api";
    import type { Doc, Id } from "$convex/_generated/dataModel";

    type ServiceType = Doc<"serviceTypes">;

    const serviceTypesQuery = useQuery(api.serviceTypes.list, {});
    const createServiceTypeMutation = useMutation(api.serviceTypes.create);
    const updateServiceTypeMutation = useMutation(api.serviceTypes.update);
    const removeServiceTypeMutation = useMutation(api.serviceTypes.remove);

    let showForm = $state(false);
    let editingServiceType = $state<ServiceType | null>(null);

    async function handleDelete(id: Id<"serviceTypes">) {
        if (confirm("¿Estás seguro de eliminar este tipo de servicio?")) {
            try {
                await removeServiceTypeMutation({ id });
                toast.success("Tipo de servicio eliminado");
            } catch (error: any) {
                if (error?.message?.includes("servicios asignados")) {
                    toast.error("No se puede eliminar: tiene servicios");
                } else {
                    toast.error("Error al eliminar tipo de servicio");
                }
            }
        }
    }

    function handleEdit(serviceType: ServiceType) {
        editingServiceType = serviceType;
        showForm = true;
    }

    function handleFormClose() {
        showForm = false;
        editingServiceType = null;
    }

    async function handleSave(data: { name: string }) {
        try {
            if (editingServiceType) {
                await updateServiceTypeMutation({
                    id: editingServiceType._id,
                    ...data,
                });
                toast.success("Tipo de servicio actualizado");
            } else {
                await createServiceTypeMutation(data);
                toast.success("Tipo de servicio creado");
            }
            handleFormClose();
        } catch (error) {
            toast.error("Error al guardar tipo de servicio");
        }
    }
</script>

<div class="p-6">
    <div class="mx-auto max-w-7xl">
        <div class="mb-6 flex items-center justify-between">
            <h1 class="font-sans text-2xl font-bold tracking-widest">
                Tipos de Servicio
            </h1>
            <Button onclick={() => (showForm = true)} class="gap-2">
                <Plus size={20} />
                Nuevo tipo
            </Button>
        </div>

        {#if serviceTypesQuery.isLoading}
            <div class="py-12 text-center text-muted-foreground">
                Cargando tipos de servicio...
            </div>
        {:else}
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {#if serviceTypesQuery.data}
                    {#each serviceTypesQuery.data as serviceType (serviceType._id)}
                        <Card.Root class="flex flex-col justify-between">
                            <Card.Header>
                                <Card.Title>{serviceType.name}</Card.Title>
                            </Card.Header>
                            <Card.Footer
                                class="flex gap-2 justify-between border-t border-border/40 pt-3"
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => handleEdit(serviceType)}
                                    class="gap-1.5"
                                >
                                    <Edit size={16} />
                                    Editar
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onclick={() => handleDelete(serviceType._id)}
                                    class="gap-1.5"
                                >
                                    <Trash2 size={16} />
                                    Eliminar
                                </Button>
                            </Card.Footer>
                        </Card.Root>
                    {/each}
                {/if}
            </div>

            {#if !serviceTypesQuery.data || serviceTypesQuery.data.length === 0}
                <div class="py-12 text-center">
                    <p class="text-muted-foreground tracking-wide">
                        No hay tipos de servicio creados aún
                    </p>
                </div>
            {/if}
        {/if}
    </div>

    {#if showForm}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
            <div
                class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-xl"
            >
                <h2 class="mb-6 font-kanit text-xl font-bold tracking-widest">
                    {editingServiceType ? "Editar tipo de servicio" : "Nuevo tipo de servicio"}
                </h2>

                <ServiceTypeForm
                    serviceType={editingServiceType}
                    onClose={handleFormClose}
                    onSave={handleSave}
                />
            </div>
        </div>
    {/if}
</div>
