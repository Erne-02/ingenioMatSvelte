<script lang="ts">
    import { superForm, defaults } from "sveltekit-superforms";
    import { valibot } from "sveltekit-superforms/adapters";
    import * as v from "valibot";
    import { Upload, X, Plus } from "@lucide/svelte";

    import { toast } from "$lib/toast";
    import { productSchema, type ProductSchema } from "$lib/schemas/product";
    import { optimizeImage, createPreviewUrl, revokePreviewUrl } from "$lib/utils/imageOptimizer";

    // Componentes UI de shadcn-svelte
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Label } from "$lib/components/ui/label";
    import { Badge } from "$lib/components/ui/badge";
    import * as Select from "$lib/components/ui/select";

    interface Category {
        _id: string;
        name: string;
    }

    interface Props {
        product?: Partial<v.InferInput<ProductSchema>> | null;
        categories: Category[];
        onSave: (data: v.InferOutput<ProductSchema>) => Promise<void>;
        onCancel: () => void;
        generateUploadUrl: (params: Record<string, never>) => Promise<string>;
    }

    let {
        product,
        categories = [],
        onSave,
        onCancel,
        generateUploadUrl,
    }: Props = $props();

    // Valores por defecto neutros
    const initialValues = {
        name: "",
        slug: "",
        categoryId: "",
        imageUrl: "",
        usos: "",
        preparacion: "",
        actividad: "",
        revisionTecnica: "",
        medidas: "",
        fotosDeEjemplos: [],
    };

    // Configuración de Superforms
    const form = superForm(defaults(initialValues, valibot(productSchema)), {
        SPA: true,
        validators: valibot(productSchema),
        async onUpdate({ form: f }) {
            if (!f.valid) return;

            isSubmitting = true;
            try {
                let finalImageUrl = f.data.imageUrl;
                let finalExamplePhotos: string[] = [];

                // Carga de imagen principal si existe un archivo local
                if (imageFile) {
                    isUploading = true;
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
                            throw new Error("Error al subir la imagen");

                        const { storageId } = await response.json();
                        finalImageUrl = storageId;
                    } catch (err) {
                        toast.error("Error al procesar la imagen principal");
                        console.error(err);
                        return;
                    } finally {
                        isUploading = false;
                    }
                }

                // Carga de fotos de ejemplo si existen archivos locales
                if (examplePhotoFiles.length > 0) {
                    isUploading = true;
                    try {
                        const uploadPromises = examplePhotoFiles.map(async (file) => {
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
                        toast.error("Error al procesar las fotos de ejemplo");
                        console.error(err);
                        return;
                    } finally {
                        isUploading = false;
                    }
                }

                // Combinar fotos de ejemplo existentes con las nuevas
                const allExamplePhotos = [
                    ...(f.data.fotosDeEjemplos || []).map((photo: string) => normalizeStorageImage(photo)),
                    ...finalExamplePhotos
                ];

                // Slug automático
                const finalSlug =
                    f.data.slug?.trim() ||
                    f.data.name
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "");

                await onSave({
                    ...f.data,
                    imageUrl: normalizeStorageImage(finalImageUrl),
                    slug: finalSlug,
                    fotosDeEjemplos: allExamplePhotos,
                });
            } finally {
                isSubmitting = false;
            }
        },
    });

    const { form: formData, errors, enhance, reset } = form;

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

    // Estados UI de soporte mediante Runas ($state)
    let imageFile = $state<File | null>(null);
    let imagePreview = $state<string | null>(null);
    let isUploading = $state(false);
    let isSubmitting = $state(false);
    let examplePhotoFiles = $state<File[]>([]);
    let examplePhotoPreviews = $state<string[]>([]);

    // Inicializar el formulario con los datos del producto
    reset({
        data: {
            name: product?.name ?? "",
            slug: product?.slug ?? "",
            categoryId: product?.categoryId ?? "",
            imageUrl: product?.imageUrl ?? "",
            usos: product?.usos ?? "",
            preparacion: product?.preparacion ?? "",
            actividad: product?.actividad ?? "",
            revisionTecnica: product?.revisionTecnica ?? "",
            medidas: product?.medidas ?? "",
            fotosDeEjemplos: product?.fotosDeEjemplos ?? [],
        },
    });
    imagePreview = product?.imageUrl ?? null;
    imageFile = null;
    examplePhotoFiles = [];
    examplePhotoPreviews = [];

    // Cleanup al destruir el componente
    $effect(() => {
        return () => {
            if (imagePreview && !imagePreview.startsWith('http')) {
                revokePreviewUrl(imagePreview);
            }
            examplePhotoPreviews.forEach(url => {
                if (url && !url.startsWith('http')) {
                    revokePreviewUrl(url);
                }
            });
        };
    });

    // Labels seleccionados para los Selects de shadcn
    let selectedCategoryLabel = $derived(
        categories.find((c) => c._id === $formData.categoryId)?.name ??
            "Seleccionar categoría",
    );

    // Handlers de Imagen
    function handleImageChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            // Limpiar preview anterior si existe
            if (imagePreview && !imagePreview.startsWith('http')) {
                revokePreviewUrl(imagePreview);
            }
            
            imageFile = file;
            imagePreview = createPreviewUrl(file);
            $formData.imageUrl = "pending";
        }
    }

    function handleRemoveImage() {
        if (imagePreview && !imagePreview.startsWith('http')) {
            revokePreviewUrl(imagePreview);
        }
        imageFile = null;
        imagePreview = null;
        $formData.imageUrl = "";
    }

    function handleExamplePhotoChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach((file) => {
                examplePhotoFiles = [...examplePhotoFiles, file];
                const previewUrl = createPreviewUrl(file);
                examplePhotoPreviews = [...examplePhotoPreviews, previewUrl];
            });
        }
        // Reset the input
        target.value = "";
    }

    function handleRemoveExamplePhoto(index: number) {
        // Limpiar la URL del preview
        if (examplePhotoPreviews[index] && !examplePhotoPreviews[index].startsWith('http')) {
            revokePreviewUrl(examplePhotoPreviews[index]);
        }
        
        examplePhotoFiles = examplePhotoFiles.filter((_, i) => i !== index);
        examplePhotoPreviews = examplePhotoPreviews.filter((_, i) => i !== index);
    }
</script>

<form method="POST" use:enhance class="space-y-4">
    <!-- Nombre -->
    <div class="space-y-2">
        <Label for="name">Nombre</Label>
        <Input
            id="name"
            type="text"
            bind:value={$formData.name}
            placeholder="Ej. Mortero Grueso"
        />
        {#if $errors.name}
            <p class="text-sm text-destructive">{$errors.name}</p>
        {/if}
    </div>

    <!-- Slug -->
    <div class="space-y-2">
        <Label for="slug">Slug (URL amigable)</Label>
        <Input
            id="slug"
            type="text"
            bind:value={$formData.slug}
            placeholder="se-deja-vacio-para-autogenerar"
        />
        <p class="text-xs text-muted-foreground">
            Si se deja vacío, se generará automáticamente desde el nombre
        </p>
    </div>

    <!-- Categoría (shadcn Select) -->
    <div class="space-y-2">
        <div class="flex items-center justify-between">
            <Label>Categoría</Label>
            <a
                href="/admin/categories"
                target="_blank"
                class="text-xs text-primary hover:underline font-medium"
            >
                + Gestionar categorías
            </a>
        </div>
        <Select.Root
            type="single"
            value={$formData.categoryId}
            onValueChange={(v) => ($formData.categoryId = v)}
        >
            <Select.Trigger class="w-full">
                {selectedCategoryLabel}
            </Select.Trigger>
            <Select.Content>
                {#each categories as category (category._id)}
                    <Select.Item value={category._id} label={category.name}>
                        {category.name}
                    </Select.Item>
                {/each}
            </Select.Content>
        </Select.Root>
        {#if $errors.categoryId}
            <p class="text-sm text-destructive">{$errors.categoryId}</p>
        {/if}
    </div>

    <!-- Carga de Imagen -->
    <div class="space-y-2">
        <Label>Imagen</Label>

        {#if imagePreview}
            <div
                class="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border"
            >
                <img
                    src={imagePreview}
                    alt="Preview"
                    class="w-full h-full object-cover"
                />
                <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onclick={handleRemoveImage}
                    class="absolute top-2 right-2 backdrop-blur-sm bg-background/80 hover:bg-background"
                >
                    <X size={16} />
                </Button>
            </div>
        {:else}
            <div
                class="border-2 border-dashed border-border rounded-lg p-6 transition-colors hover:border-muted-foreground/50"
            >
                <label
                    for="image-upload"
                    class="flex flex-col items-center justify-center cursor-pointer"
                >
                    <Upload size={32} class="text-muted-foreground mb-2" />
                    <span class="text-sm text-muted-foreground font-medium"
                        >Click para subir imagen</span
                    >
                    <span class="text-xs text-muted-foreground/70 mt-1"
                        >PNG, JPG, WebP (máx. 5MB)</span
                    >
                </label>
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onchange={handleImageChange}
                    class="hidden"
                />
            </div>
        {/if}

        {#if $errors.imageUrl}
            <p class="text-sm text-destructive">{$errors.imageUrl}</p>
        {/if}
    </div>

    <!-- Ficha Técnica -->
    <div class="space-y-4 pt-4 border-t border-border">
        <h3 class="text-sm font-semibold text-foreground">Ficha Técnica</h3>
        
        <!-- Usos -->
        <div class="space-y-2">
            <Label for="usos">Usos</Label>
            <Textarea
                id="usos"
                bind:value={$formData.usos}
                placeholder="Describe los usos del producto..."
                rows={3}
            />
        </div>

        <!-- Preparación -->
        <div class="space-y-2">
            <Label for="preparacion">Preparación</Label>
            <Textarea
                id="preparacion"
                bind:value={$formData.preparacion}
                placeholder="Instrucciones de preparación..."
                rows={3}
            />
        </div>

        <!-- Actividad -->
        <div class="space-y-2">
            <Label for="actividad">Actividad</Label>
            <Textarea
                id="actividad"
                bind:value={$formData.actividad}
                placeholder="Describe la actividad o aplicación..."
                rows={3}
            />
        </div>

        <!-- Revisión Técnica -->
        <div class="space-y-2">
            <Label for="revisionTecnica">Revisión Técnica</Label>
            <Textarea
                id="revisionTecnica"
                bind:value={$formData.revisionTecnica}
                placeholder="Incluye la revisión técnica del producto..."
                rows={3}
            />
        </div>

        <!-- Medidas -->
        <div class="space-y-2">
            <Label for="medidas">Medidas</Label>
            <Textarea
                id="medidas"
                bind:value={$formData.medidas}
                placeholder="Dimensiones, capacidades, etc..."
                rows={2}
            />
        </div>

        <!-- Fotos de Ejemplos -->
        <div class="space-y-2">
            <Label>Fotos de Ejemplos</Label>
            <div class="space-y-2">
                {#if examplePhotoPreviews.length > 0}
                    <div class="grid grid-cols-3 gap-2">
                        {#each examplePhotoPreviews as photoUrl, index}
                            <div class="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                                <img
                                    src={photoUrl}
                                    alt="Foto de ejemplo {index + 1}"
                                    class="w-full h-full object-cover"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onclick={() => handleRemoveExamplePhoto(index)}
                                    class="absolute top-1 right-1 h-6 w-6"
                                >
                                    <X size={12} />
                                </Button>
                            </div>
                        {/each}
                    </div>
                {/if}
                
                {#if $formData.fotosDeEjemplos && $formData.fotosDeEjemplos.length > 0}
                    <p class="text-xs text-muted-foreground">
                        +{$formData.fotosDeEjemplos.length} fotos existentes se mantendrán
                    </p>
                {/if}
                
                <div
                    class="border-2 border-dashed border-border rounded-lg p-4 transition-colors hover:border-muted-foreground/50"
                >
                    <label
                        for="example-photos-upload"
                        class="flex flex-col items-center justify-center cursor-pointer"
                    >
                        <Plus size={24} class="text-muted-foreground mb-1" />
                        <span class="text-xs text-muted-foreground">Agregar foto de ejemplo</span>
                    </label>
                    <input
                        id="example-photos-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onchange={handleExamplePhotoChange}
                        class="hidden"
                    />
                </div>
            </div>
        </div>
    </div>

    <!-- Botones de Acción -->
    <div class="flex gap-3 pt-4">
        <Button
            type="button"
            variant="outline"
            onclick={onCancel}
            disabled={isUploading || isSubmitting}
            class="flex-1"
        >
            Cancelar
        </Button>

        <Button
            type="submit"
            disabled={isSubmitting || isUploading}
            class="flex-1"
        >
            {#if isUploading}
                Subiendo imagen...
            {:else if isSubmitting}
                Guardando...
            {:else if product}
                Actualizar
            {:else}
                Crear
            {/if}
        </Button>
    </div>
</form>
