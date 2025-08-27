<script lang="ts">
	import { loginSchema, type LoginInput } from '$lib/schemas/auth';
	import { validateWithZod } from '$lib/utils/errors';
	import { cn } from '$lib/utils/cn';
	import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import type { User } from '$lib/types/chat';
	import { authApi, authUtils } from '$lib/utils/api';

	const dispatch = createEventDispatcher<{
		login: { user: User; csrfToken: string };
		error: { message: string };
	}>();

	// Состояние формы
	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let showPassword = $state(false);
	let errors = $state<Record<string, string>>({});

	// Валидация в реальном времени
	let emailError = $derived(errors.email || '');
	let passwordError = $derived(errors.password || '');

	// Функция для валидации поля
	function validateField(field: keyof LoginInput, value: string): void {
		const fieldSchema = loginSchema.pick({ [field]: true });
		const result = validateWithZod(fieldSchema, { [field]: value });

		if (result.error) {
			errors = { ...errors, [field]: result.error.message };
		} else {
			const newErrors = { ...errors };
			delete newErrors[field];
			errors = newErrors;
		}
	}

	// Обработчики изменения полей
	function handleEmailChange(e: Event) {
		const target = e.target as HTMLInputElement;
		email = target.value;
		validateField('email', email);
	}

	function handlePasswordChange(e: Event) {
		const target = e.target as HTMLInputElement;
		password = target.value;
		validateField('password', password);
	}

	// Функция для отправки формы
	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (isLoading) return;

		// Валидируем всю форму
		const formData = { email, password };
		const result = validateWithZod(loginSchema, formData);

		if (result.error) {
			// Преобразуем ошибки Zod в объект ошибок
			const fieldErrors: Record<string, string> = {};
			if (result.error.errors && Array.isArray(result.error.errors)) {
				result.error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
					const field = err.path[0] as string;
					fieldErrors[field] = err.message;
				});
			}
			errors = fieldErrors;
			return;
		}

		isLoading = true;
		errors = {};

		try {
			// Используем API утилиты для входа
			const response = await authApi.login(formData);

			if (!response.success || response.error) {
				dispatch('error', { message: response.error || 'Ошибка входа' });
				return;
			}

			// Обновляем CSRF токен
			if (response.data?.csrfToken) {
				authUtils.updateCSRFToken(response.data.csrfToken);
			}

			// Успешный вход
			dispatch('login', { 
				user: response.data!.user as User, 
				csrfToken: response.data!.csrfToken 
			});

		} catch {
			dispatch('error', { message: 'Произошла ошибка при входе' });
		} finally {
			isLoading = false;
		}
	}

	// Функция для переключения видимости пароля
	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6">
	<div>
		<label for="email" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
			Email
		</label>
		<div class="relative">
			<Mail class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
			<input
				id="email"
				type="email"
				bind:value={email}
				oninput={handleEmailChange}
				placeholder="Введите ваш email"
				class={cn('input pl-10', emailError && 'border-red-500 focus:ring-red-500')}
				disabled={isLoading}
				required
			/>
		</div>
		{#if emailError}
			<p class="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>
		{/if}
	</div>

	<div>
		<label for="password" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
			Пароль
		</label>
		<div class="relative">
			<Lock class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
			<input
				id="password"
				type={showPassword ? 'text' : 'password'}
				bind:value={password}
				oninput={handlePasswordChange}
				placeholder="Введите ваш пароль"
				class={cn('input pr-10 pl-10', passwordError && 'border-red-500 focus:ring-red-500')}
				disabled={isLoading}
				required
			/>
			<button
				type="button"
				onclick={togglePasswordVisibility}
				class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
				disabled={isLoading}
			>
				{#if showPassword}
					<EyeOff class="h-4 w-4" />
				{:else}
					<Eye class="h-4 w-4" />
				{/if}
			</button>
		</div>
		{#if passwordError}
			<p class="mt-1 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
		{/if}
	</div>

	<div class="flex items-center justify-between">
		<div class="flex items-center">
			<input
				id="remember-me"
				name="remember-me"
				type="checkbox"
				class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
			/>
			<label for="remember-me" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
				Запомнить меня
			</label>
		</div>

		<div class="text-sm">
			<button
				type="button"
				class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
			>
				Забыли пароль?
			</button>
		</div>
	</div>

	<div>
		<button
			type="submit"
			disabled={isLoading}
			class="btn btn-primary flex w-full items-center justify-center"
		>
			{#if isLoading}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				Вход...
			{:else}
				Войти
			{/if}
		</button>
	</div>

	<div class="text-center">
		<p class="text-sm text-gray-600 dark:text-gray-400">
			Нет аккаунта? 
			<button
				type="button"
				class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
			>
				Зарегистрироваться
			</button>
		</p>
	</div>
</form>
