<script lang="ts">
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import type { Id } from "$convex/_generated/dataModel";
    import { useQuery, useMutation } from "convex-svelte";
    import { api } from "$convex/_generated/api";
    import { ImagePlus, X } from "@lucide/svelte";
    import { optimizeImage, createPreviewUrl, revokePreviewUrl } from "$lib/utils/imageOptimizer";

    interface Service {
        _id?: Id<"services">;
        name: string;
        description: string;
        imageUrl: string;
        serviceTypeId: Id<"serviceTypes">;
        detalles?: string;
        fotosDeEjemplos?: string[];
        precioBase?: string;
        duracionEstimada?: string;
        areaDeCobertura?: string;
        requisitos?: string;
    }

    let { service, onClose, onSave } = $props<{
        service: Service | null;
        onClose: () => void;
        onSave: (data: { name: string; description: string; imageUrl: string; serviceTypeId: Id<"serviceTypes">; detalles?: string; fotosDeEjemplos?: string[]; precioBase?: string; duracionEstimada?: string; areaDeCobertura?: string; requisitos?: string }) => Promise<void>;
    }>();

    let serviceTypesQuery = useQuery(api.serviceTypes.list, {});
    let generateUploadUrl = useMutation(api.products.generateUploadUrl); // We can reuse the upload URL mutation from products if it exists

    let formData = $state({
        name: service?.name ?? "",
        description: service?.description ?? "",
        imageUrl: service?.imageUrl ?? "",
        serviceTypeId: service?.serviceTypeId ?? ("" as Id<"serviceTypes">),
        detalles: service?.detalles ?? "",
        fotosDeEjemplos: service?.fotosDeEjemplos ?? [],
        precioBase: service?.precioBase ?? "",
        duracionEstimada: service?.duracionEstimada ?? "",
        areaDeCobertura: service?.areaDeCobertura ?? "",
        requisitos: service?.requisitos ?? "",
    });

    function normalizeStorageImage(value: string): string {
        const cleanValue = value?.trim() ?? "";
        if (!cleanValue) return cleanValue;

        if (cleanValue.startsWith("/") || cleanValue.startsWith("blob:") || cleanValue.startsWith("data:")) {
            return cleanValue;
        }

        if (cleanValue.startsWith("http")) {
            try {
                const parsed = new URL(cleanValue);
                const storageMatch = parsed.pathname.match(/\/api\/storage\/([^?]+)/i);
                if (storageMatch?.[1]) {
                    return decodeURIComponent(storageMatch[1]);
                }
                return cleanValue;
            } catch {
                return cleanValue;
            }
        }

        return cleanValue.split("?")[0];
    }

    let isSubmitting = $state(false);
    let isUploading = $state(false);
    let fileInput: HTMLInputElement;
    let exampleImagesInput: HTMLInputElement;
    let imageFile = $state<File | null>(null);
    let previewUrl = $state(service?.imageUrl ?? "");
    let exampleImageFiles = $state<File[]>([]);
    let examplePreviewUrls = $state<string[]>([]);

    // Cleanup al destruir el componente
    $effect(() => {
        return () => {
            if (previewUrl && !previewUrl.startsWith('http')) {
                revokePreviewUrl(previewUrl);
            }
            examplePreviewUrls.forEach(url => {
                if (url && !url.startsWith('http')) {
                    revokePreviewUrl(url);
                }
            });
        };
    });

    function handleImageUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        // Limpiar preview anterior si existe
        if (previewUrl && !previewUrl.startsWith('http')) {
            revokePreviewUrl(previewUrl);
        }

        imageFile = file;
        previewUrl = createPreviewUrl(file);
        formData.imageUrl = "pending";
    }

    function handleExampleImagesUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            exampleImageFiles = [...exampleImageFiles, file];
            const previewUrl = createPreviewUrl(file);
            examplePreviewUrls = [...examplePreviewUrls, previewUrl];
        });

        if (exampleImagesInput) {
            exampleImagesInput.value = "";
        }
    }

    function removeExampleImage(index: number) {
        // Limpiar la URL del preview
        if (examplePreviewUrls[index] && !examplePreviewUrls[index].startsWith('http')) {
            revokePreviewUrl(examplePreviewUrls[index]);
        }
        
        exampleImageFiles = exampleImageFiles.filter((_, i) => i !== index);
        examplePreviewUrls = examplePreviewUrls.filter((_, i) => i !== index);
    }

    function removeMainImage() {
        if (previewUrl && !previewUrl.startsWith('http')) {
            revokePreviewUrl(previewUrl);
        }
        imageFile = null;
        previewUrl = "";
        formData.imageUrl = "";
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        isSubmitting = true;
        isUploading = true;
        
        try {
            let finalImageUrl = formData.imageUrl;
            let finalExamplePhotos: string[] = [];

            // Cargar imagen principal si existe un archivo local
            if (imageFile) {
                try {
                    const optimizedImage = await optimizeImage(imageFile, 0.8, 1200);

                    const uploadUrl = await generateUploadUrl({});
                    const response = await fetch(uploadUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": optimizedImage.type,
                        },
                        body: optimizedImage,
                    });

                    if (!response.ok)
                        throw new Error("Error al subir la imagen principal");

                    const { storageId } = await response.json();
                    finalImageUrl = storageId;
                } catch (err) {
                    console.error("Error al procesar la imagen principal:", err);
                    throw new Error("Error al procesar la imagen principal");
                }
            }

            // Cargar fotos de ejemplo si existen archivos locales
            if (exampleImageFiles.length > 0) {
                try {
                    const uploadPromises = exampleImageFiles.map(async (file) => {
                        const optimizedImage = await optimizeImage(file, 0.8, 800);
                        const uploadUrl = await generateUploadUrl({});
                        const response = await fetch(uploadUrl, {
                            method: "POST",
                            headers: {
                                "Content-Type": optimizedImage.type,
                            },
                            body: optimizedImage,
                        });

                        if (!response.ok)
                            throw new Error("Error al subir foto de ejemplo");

                        const { storageId } = await response.json();
                        return storageId;
                    });

                    finalExamplePhotos = await Promise.all(uploadPromises);
                } catch (err) {
                    console.error("Error al procesar las fotos de ejemplo:", err);
                    throw new Error("Error al procesar las fotos de ejemplo");
                }
            }

            // Combinar fotos de ejemplo existentes con las nuevas
            const allExamplePhotos = [
                ...(formData.fotosDeEjemplos || []).map((photo: string) => normalizeStorageImage(photo)),
                ...finalExamplePhotos
            ];

            await onSave({ 
                ...formData, 
                imageUrl: normalizeStorageImage(finalImageUrl),
                fotosDeEjemplos: allExamplePhotos
            });
        } finally {
            isSubmitting = false;
            isUploading = false;
        }
    }
</script>

<form onsubmit={handleSubmit} class="space-y-4">
    <div class="space-y-2">
        <Label for="name">Nombre</Label>
        <Input
            id="name"
            bind:value={formData.name}
            placeholder="Nombre del servicio"
            required
            disabled={isSubmitting}
        />
    </div>

    <div class="space-y-2">
        <Label for="serviceTypeId">Tipo de Servicio</Label>
        <select
            id="serviceTypeId"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            bind:value={formData.serviceTypeId}
            required
            disabled={isSubmitting || serviceTypesQuery.isLoading}
        >
            <option value="" disabled>Selecciona un tipo</option>
            {#if serviceTypesQuery.data}
                {#each serviceTypesQuery.data as type}
                    <option value={type._id}>{type.name}</option>
                {/each}
            {/if}
        </select>
    </div>

    <div class="space-y-2">
        <Label for="description">Descripción</Label>
        <Textarea
            id="description"
            bind:value={formData.description}
            placeholder="Detalles del servicio..."
            required
            disabled={isSubmitting}
        />
    </div>

    <div class="space-y-2">
        <Label for="detalles">Detalles Adicionales</Label>
        <Textarea
            id="detalles"
            bind:value={formData.detalles}
            placeholder="Información adicional específica del servicio..."
            disabled={isSubmitting}
        />
    </div>

    <div class="space-y-2">
        <Label for="precioBase">Precio Base</Label>
        <Input
            id="precioBase"
            bind:value={formData.precioBase}
            placeholder="Ej: $500.00"
            disabled={isSubmitting}
        />
    </div>

    <div class="space-y-2">
        <Label for="duracionEstimada">Duración Estimada</Label>
        <Input
            id="duracionEstimada"
            bind:value={formData.duracionEstimada}
            placeholder="Ej: 2-3 horas, 1 día, etc."
            disabled={isSubmitting}
        />
    </div>

    <div class="space-y-2">
        <Label for="areaDeCobertura">Área de Cobertura</Label>
        <Input
            id="areaDeCobertura"
            bind:value={formData.areaDeCobertura}
            placeholder="Ej: Ciudad de México, Zona Metropolitana, etc."
            disabled={isSubmitting}
        />
    </div>

    <div class="space-y-2">
        <Label for="requisitos">Requisitos</Label>
        <Textarea
            id="requisitos"
            bind:value={formData.requisitos}
            placeholder="Requisitos previos necesarios para el servicio..."
            disabled={isSubmitting}
        />
    </div>

    <div class="space-y-2">
        <Label>Imagen del servicio</Label>
        <div class="flex items-center gap-4">
            <input
                type="file"
                accept="image/*"
                class="hidden"
                bind:this={fileInput}
                onchange={handleImageUpload}
                disabled={isUploading || isSubmitting}
            />
            
            {#if previewUrl}
                <div class="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        class="w-full h-full object-cover"
                    />
                    <button
                        type="button"
                        class="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-black/70"
                        onclick={removeMainImage}
                    >
                        <X size={14} />
                    </button>
                </div>
            {:else}
                <button
                    type="button"
                    onclick={() => fileInput.click()}
                    disabled={isUploading || isSubmitting}
                    class="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                >
                    <ImagePlus size={24} class="mb-1" />
                    <span class="text-[10px]">
                        {isUploading ? "Procesando..." : "Subir imagen"}
                    </span>
                </button>
            {/if}
        </div>
    </div>

    <div class="space-y-2">
        <Label>Fotos de Ejemplos</Label>
        <div class="space-y-3">
            <input
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                bind:this={exampleImagesInput}
                onchange={handleExampleImagesUpload}
                disabled={isUploading || isSubmitting}
            />
            
            {#if examplePreviewUrls.length > 0}
                <div class="grid grid-cols-4 gap-2">
                    {#each examplePreviewUrls as url, index}
                        <div class="relative aspect-square rounded-lg overflow-hidden border border-border">
                            <img
                                src={url}
                                alt="Example {index + 1}"
                                class="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                class="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-black/70"
                                onclick={() => removeExampleImage(index)}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
            
            {#if formData.fotosDeEjemplos && formData.fotosDeEjemplos.length > 0}
                <p class="text-xs text-muted-foreground">
                    +{formData.fotosDeEjemplos.length} fotos existentes se mantendrán
                </p>
            {/if}
            
            <button
                type="button"
                onclick={() => exampleImagesInput.click()}
                disabled={isUploading || isSubmitting}
                class="w-full py-3 px-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
                <ImagePlus size={20} />
                <span>
                    {isUploading ? "Procesando..." : "Agregar fotos de ejemplos"}
                </span>
            </button>
        </div>
    </div>

    <div class="flex justify-end gap-3 pt-4">
        <Button variant="outline" type="button" onclick={onClose} disabled={isSubmitting || isUploading}>
            Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading || !formData.imageUrl}>
            {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
    </div>
</form>
