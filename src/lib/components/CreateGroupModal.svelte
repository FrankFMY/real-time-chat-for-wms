<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, Plus, Upload, Check } from 'lucide-svelte';
	import type { User } from '$lib/types/chat';

	const dispatch = createEventDispatcher<{
		create: { name: string; participants: string[]; avatar?: string };
		cancel: void;
	}>();

	const { isOpen = false, availableUsers = [] } = $props<{
		isOpen?: boolean;
		availableUsers?: User[];
	}>();

	let groupName = $state('');
	let selectedParticipants = $state<string[]>([]);
	let groupAvatar = $state<string>('');
	let searchQuery = $state('');
	let showAvatarUpload = $state(false);
	let isCreating = $state(false);

	// Фильтруем пользователей по поисковому запросу
	let filteredUsers = $derived(
		availableUsers.filter(
			(user: User) =>
				!selectedParticipants.includes(user.id) &&
				user.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	// Получаем выбранных участников
	let selectedUsers = $derived(
		availableUsers.filter((user: User) => selectedParticipants.includes(user.id))
	);

	// Генерируем аватар по умолчанию
	function generateDefaultAvatar(name: string): string {
		const colors = [
			'#3B82F6',
			'#EF4444',
			'#10B981',
			'#F59E0B',
			'#8B5CF6',
			'#EC4899',
			'#06B6D4',
			'#84CC16',
			'#F97316',
			'#6366F1'
		];
		const color = colors[name.length % colors.length];
		const initials = name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);

		return `data:image/svg+xml,${encodeURIComponent(`
			<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
				<rect width="100" height="100" fill="${color}"/>
				<text x="50" y="50" font-family="Arial, sans-serif" font-size="32" 
					fill="white" text-anchor="middle" dy=".3em">${initials}</text>
			</svg>
		`)}`;
	}

	// Добавляем участника
	function addParticipant(userId: string) {
		if (!selectedParticipants.includes(userId)) {
			selectedParticipants = [...selectedParticipants, userId];
		}
		searchQuery = '';
	}

	// Удаляем участника
	function removeParticipant(userId: string) {
		selectedParticipants = selectedParticipants.filter((id) => id !== userId);
	}

	// Обработка загрузки аватара
	function handleAvatarUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			if (file.type.startsWith('image/')) {
				const reader = new FileReader();
				reader.onload = (e) => {
					groupAvatar = e.target?.result as string;
				};
				reader.readAsDataURL(file);
			}
		}
		showAvatarUpload = false;
	}

	// Создаем группу
	async function createGroup() {
		if (!groupName.trim() || selectedParticipants.length === 0) return;

		isCreating = true;

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: groupName.trim(),
					participants: selectedParticipants,
					type: 'group',
					avatar: groupAvatar || generateDefaultAvatar(groupName)
				})
			});

			if (response.ok) {
				const { chat } = await response.json();
				dispatch('create', {
					name: chat.name,
					participants: chat.participants.map((p: User) => p.id),
					avatar: chat.avatar
				});
				resetForm();
			} else {
				const error = await response.json();
				alert(error.error || 'Ошибка при создании группы');
			}
		} catch (error) {
			console.error('Error creating group:', error);
			alert('Ошибка при создании группы');
		} finally {
			isCreating = false;
		}
	}

	// Отменяем создание
	function cancel() {
		resetForm();
		dispatch('cancel');
	}

	// Сбрасываем форму
	function resetForm() {
		groupName = '';
		selectedParticipants = [];
		groupAvatar = '';
		searchQuery = '';
		showAvatarUpload = false;
		isCreating = false;
	}

	// Обработка клавиш
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			cancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="create-group-title"
		tabindex="-1"
		onclick={cancel}
		onkeydown={(e) => e.key === 'Escape' && cancel()}
	>
		<div class="modal-content" role="document">
			<!-- Заголовок -->
			<header class="modal-header">
				<h2 id="create-group-title" class="modal-title">Создать групповой чат</h2>
				<button
					class="close-button"
					onclick={cancel}
					title="Закрыть"
					aria-label="Закрыть модальное окно"
				>
					<X class="h-5 w-5" />
				</button>
			</header>

			<!-- Форма -->
			<form
				class="modal-form"
				onsubmit={(e) => {
					e.preventDefault();
					createGroup();
				}}
			>
				<!-- Название группы -->
				<div class="form-group">
					<label for="group-name" class="form-label"> Название группы * </label>
					<input
						id="group-name"
						type="text"
						bind:value={groupName}
						placeholder="Введите название группы"
						class="form-input"
						required
						maxlength="50"
					/>
				</div>

				<!-- Аватар группы -->
				<div class="form-group">
					<label for="avatar-section" class="form-label">Аватар группы</label>
					<div class="avatar-section" id="avatar-section">
						<div class="avatar-preview">
							<img
								src={groupAvatar || generateDefaultAvatar(groupName || 'Группа')}
								alt="Аватар группы"
								class="group-avatar"
							/>
						</div>
						<div class="avatar-actions">
							<button type="button" class="btn-secondary" onclick={() => (showAvatarUpload = true)}>
								<Upload class="h-4 w-4" />
								Загрузить
							</button>
							{#if groupAvatar}
								<button type="button" class="btn-secondary" onclick={() => (groupAvatar = '')}>
									Сбросить
								</button>
							{/if}
						</div>
					</div>

					{#if showAvatarUpload}
						<div class="avatar-upload">
							<input
								type="file"
								accept="image/*"
								onchange={handleAvatarUpload}
								class="file-input"
								id="avatar-upload"
							/>
							<label for="avatar-upload" class="file-label"> Выберите изображение </label>
						</div>
					{/if}
				</div>

				<!-- Участники -->
				<div class="form-group">
					<label for="participants-section" class="form-label">
						Участники ({selectedParticipants.length})
					</label>

					<!-- Выбранные участники -->
					{#if selectedUsers.length > 0}
						<div class="selected-participants" id="participants-section">
							{#each selectedUsers as user (user.id)}
								<div class="participant-item">
									<img src={user.avatar} alt={user.name} class="participant-avatar" />
									<span class="participant-name">{user.name}</span>
									<button
										type="button"
										class="remove-participant"
										onclick={() => removeParticipant(user.id)}
										title="Удалить участника"
									>
										<X class="h-4 w-4" />
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Поиск участников -->
					<div class="search-section">
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Поиск пользователей..."
							class="search-input"
						/>
					</div>

					<!-- Список доступных пользователей -->
					<div class="users-list">
						{#if filteredUsers.length > 0}
							{#each filteredUsers as user (user.id)}
								<button type="button" class="user-item" onclick={() => addParticipant(user.id)}>
									<img src={user.avatar} alt={user.name} class="user-avatar" />
									<div class="user-info">
										<span class="user-name">{user.name}</span>
										<span class="user-status">{user.status}</span>
									</div>
									<Plus class="add-icon h-4 w-4" />
								</button>
							{/each}
						{:else if searchQuery}
							<div class="no-results">Пользователи не найдены</div>
						{:else}
							<div class="no-results">Все пользователи уже добавлены</div>
						{/if}
					</div>
				</div>

				<!-- Действия -->
				<div class="modal-actions">
					<button type="button" class="btn-secondary" onclick={cancel} disabled={isCreating}>
						Отмена
					</button>
					<button
						type="submit"
						class="btn-primary"
						disabled={!groupName.trim() || selectedParticipants.length === 0 || isCreating}
					>
						{#if isCreating}
							Создание...
						{:else}
							<Check class="h-4 w-4" />
							Создать группу
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 0.75rem;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 1.5rem 0 1.5rem;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.close-button {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.375rem;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background-color: #f3f4f6;
		color: #374151;
	}

	.modal-form {
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.avatar-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.avatar-preview {
		flex-shrink: 0;
	}

	.group-avatar {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid #e5e7eb;
	}

	.avatar-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-secondary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: #f3f4f6;
		color: #374151;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary:hover {
		background-color: #e5e7eb;
	}

	.avatar-upload {
		margin-top: 1rem;
		padding: 1rem;
		border: 2px dashed #d1d5db;
		border-radius: 0.375rem;
		text-align: center;
	}

	.file-input {
		display: none;
	}

	.file-label {
		display: inline-block;
		padding: 0.5rem 1rem;
		background-color: #3b82f6;
		color: white;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s ease;
	}

	.file-label:hover {
		background-color: #2563eb;
	}

	.selected-participants {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background-color: #f9fafb;
		border-radius: 0.375rem;
		min-height: 3rem;
	}

	.participant-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		background-color: white;
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		font-size: 0.875rem;
	}

	.participant-avatar {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.participant-name {
		color: #374151;
	}

	.remove-participant {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 0.125rem;
		border-radius: 0.25rem;
		transition: all 0.2s ease;
	}

	.remove-participant:hover {
		background-color: #f3f4f6;
		color: #dc2626;
	}

	.search-section {
		margin-bottom: 1rem;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.users-list {
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
	}

	.user-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: none;
		border: none;
		width: 100%;
		cursor: pointer;
		transition: background-color 0.2s ease;
		text-align: left;
	}

	.user-item:hover {
		background-color: #f9fafb;
	}

	.user-avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.user-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #111827;
	}

	.user-status {
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: capitalize;
	}

	.no-results {
		padding: 1rem;
		text-align: center;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}

	.btn-primary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.btn-primary:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}

	/* Темная тема */
	:global(.dark) .modal-content {
		background-color: #1f2937;
		color: #f9fafb;
	}

	:global(.dark) .modal-title {
		color: #f9fafb;
	}

	:global(.dark) .form-label {
		color: #d1d5db;
	}

	:global(.dark) .form-input {
		background-color: #374151;
		border-color: #4b5563;
		color: #f9fafb;
	}

	:global(.dark) .form-input:focus {
		border-color: #3b82f6;
	}

	:global(.dark) .group-avatar {
		border-color: #4b5563;
	}

	:global(.dark) .btn-secondary {
		background-color: #374151;
		color: #d1d5db;
	}

	:global(.dark) .btn-secondary:hover {
		background-color: #4b5563;
	}

	:global(.dark) .selected-participants {
		background-color: #374151;
	}

	:global(.dark) .participant-item {
		background-color: #4b5563;
		border-color: #6b7280;
	}

	:global(.dark) .participant-name {
		color: #d1d5db;
	}

	:global(.dark) .search-input {
		background-color: #374151;
		border-color: #4b5563;
		color: #f9fafb;
	}

	:global(.dark) .users-list {
		border-color: #4b5563;
	}

	:global(.dark) .user-item:hover {
		background-color: #374151;
	}

	:global(.dark) .user-name {
		color: #f9fafb;
	}

	:global(.dark) .user-status {
		color: #9ca3af;
	}

	:global(.dark) .no-results {
		color: #9ca3af;
	}

	/* Адаптивность */
	@media (max-width: 640px) {
		.modal-content {
			margin: 1rem;
			max-height: calc(100vh - 2rem);
		}

		.avatar-section {
			flex-direction: column;
			align-items: flex-start;
		}

		.modal-actions {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
			justify-content: center;
		}
	}
</style>
