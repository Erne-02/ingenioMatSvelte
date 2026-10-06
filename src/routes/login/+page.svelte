ñña<script lang="ts">
    import { goto } from "$app/navigation";
    import { superForm, defaults } from "sveltekit-superforms";
    import { valibot, valibotClient } from "sveltekit-superforms/adapters";
    import { loginSchema } from "$lib/schemas/auth";
    import { authClient } from "$lib/auth-client";
    import { toast } from "$lib/toast";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";

    let isSubmittingAuth = $state(false);

    // Inicializamos con defaults(valibot(loginSchema)) para forzar los tipos correctos en $form
    const { form, errors, enhance } = superForm(
        defaults(valibot(loginSchema)),
        {
            SPA: true,
            validators: valibotClient(loginSchema),
            async onUpdate({ form }) {
                if (!form.valid) return;

                isSubmittingAuth = true;
                try {
                    const result = await authClient.signIn.email({
                        email: form.data.email,
                        password: form.data.password,
                    });

                    if (result.error) {
                        toast.error(
                            result.error.message || "Error al iniciar sesión",
                        );
                    } else {
                        toast.success("Sesión iniciada correctamente");
                        await goto("/admin");
                    }
                } catch (err) {
                    toast.error("Ocurrió un error inesperado");
                } finally {
                    isSubmittingAuth = false;
                }
            },
        },
    );
</script>

<svelte:head>
    <title>Iniciar Sesión - Ingenio Mat</title>
</svelte:head>

<main class="min-h-screen flex items-center justify-center bg-background px-4">
    <div
        class="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-sm"
    >
        <div class="flex flex-col space-y-1.5 p-6 text-center">
            <img
                alt="Ingenio Mat logo"
                src="/WhatsApp Image 2026-06-18 at 18.35.29.svg"
                width="200"
                class="mx-auto"
            />
            <p class="text-sm text-muted-foreground">
                Inicia sesión en tu cuenta
            </p>
        </div>

        <div class="p-6 pt-0">
            <form method="POST" use:enhance class="grid gap-4">
                <!-- Email -->
                <div class="grid gap-2">
                    <label for="email" class="text-sm font-medium leading-none">
                        Email
                    </label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        bind:value={$form.email}
                        aria-invalid={$errors.email ? "true" : undefined}
                    />
                    {#if $errors.email}
                        <p class="text-sm font-medium text-destructive">
                            {$errors.email[0]}
                        </p>
                    {/if}
                </div>

                <!-- Contraseña -->
                <div class="grid gap-2">
                    <label
                        for="password"
                        class="text-sm font-medium leading-none"
                    >
                        Contraseña
                    </label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        bind:value={$form.password}
                        aria-invalid={$errors.password ? "true" : undefined}
                    />
                    {#if $errors.password}
                        <p class="text-sm font-medium text-destructive">
                            {$errors.password[0]}
                        </p>
                    {/if}
                </div>
                <!-- Botón de Envío -->
                <Button
                    type="submit"
                    disabled={isSubmittingAuth}
                    class="w-full"
                >
                    {#if isSubmittingAuth}
                        <span class="flex items-center justify-center gap-2">
                            <span
                                class="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-white dark:border-neutral-600 dark:border-t-neutral-900"
                            ></span>
                            <span>Por favor espera</span>
                        </span>
                    {:else}
                        Iniciar sesión
                    {/if}
                </Button>
            </form>
        </div>
    </div>
</main>
