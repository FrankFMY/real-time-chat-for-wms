<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
	import { AlertCircle, CheckCircle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import type { User } from '$lib/types/chat';

	// Состояние
	let errorMessage = $state('');
	let successMessage = $state('');

	// Обработчики событий формы
	function handleLogin(event: CustomEvent<{ user: User; csrfToken: string }>) {
		const { user, csrfToken } = event.detail;

		// НЕ сохраняем токены в localStorage - они теперь в httpOnly cookies!
		// Только сохраняем CSRF токен для последующих запросов
		sessionStorage.setItem('csrfToken', csrfToken);

		successMessage = `Добро пожаловать, ${user.name}! Перенаправление на главную страницу...`;
		errorMessage = '';

		// Перенаправляем на главную страницу
		setTimeout(() => {
			goto('/');
		}, 1000);
	}

	function handleError(event: CustomEvent<{ message: string }>) {
		errorMessage = event.detail.message;
		successMessage = '';
	}

	// Демо данные для входа
	const demoCredentials = [
		{ email: 'alexey@example.com', password: 'password123' },
		{ email: 'maria@example.com', password: 'password123' },
		{ email: 'dmitry@example.com', password: 'password123' }
	];
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900"
>
	<div class="w-full max-w-md space-y-8">
		<div>
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
				<svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
					/>
				</svg>
			</div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
				Вход в чат
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
				Войдите в свой аккаунт для продолжения
			</p>
		</div>

		<!-- Сообщения об ошибках и успехе -->
		{#if errorMessage}
			<div
				class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
			>
				<div class="flex">
					<AlertCircle class="h-5 w-5 text-red-400" />
					<div class="ml-3">
						<p class="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if successMessage}
			<div
				class="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
			>
				<div class="flex">
					<CheckCircle class="h-5 w-5 text-green-400" />
					<div class="ml-3">
						<p class="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Демо аккаунты -->
		<div
			class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
		>
			<h3 class="mb-2 text-sm font-medium text-blue-800 dark:text-blue-200">
				Демо аккаунты для тестирования:
			</h3>
			<div class="space-y-1">
				{#each demoCredentials as credential (credential.email)}
					<div class="text-xs text-blue-700 dark:text-blue-300">
						<strong>Email:</strong>
						{credential.email} | <strong>Пароль:</strong>
						{credential.password}
					</div>
				{/each}
			</div>
		</div>

		<!-- Форма входа -->
		<div
			class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			<LoginForm on:login={handleLogin} on:error={handleError} />
		</div>

		<!-- Дополнительная информация -->
		<div class="text-center">
			<p class="text-xs text-gray-500 dark:text-gray-400">
				Это демо-версия чата с безопасной аутентификацией. Токены хранятся в httpOnly cookies.
			</p>
		</div>
	</div>
</div>
