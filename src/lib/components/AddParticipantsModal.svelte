<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, Search, User as UserIcon, Crown, Shield } from 'lucide-svelte';
	import type { User, ParticipantRole } from '$lib/types/chat';

	const dispatch = createEventDispatcher<{
		add: { userId: string; role: ParticipantRole };
		cancel: void;
	}>();

	const {
		isOpen = false,
		availableUsers = [],
		existingParticipants = [],
		currentUserRole = 'member'
	} = $props<{
		isOpen?: boolean;
		availableUsers?: User[];
		existingParticipants?: string[];
		currentUserRole?: ParticipantRole;
	}>();

	let searchQuery = $state('');
	let selectedUserId = $state<string>('');
	let selectedRole = $state<ParticipantRole>('member');
	let isAdding = $state(false);

	// Фильтруем пользователей, исключая уже добавленных
	let filteredUsers = $derived(
		availableUsers.filter(
			(user: User) =>
				!existingParticipants.includes(user.id) &&
				user.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	// Получаем выбранного пользователя (используется в шаблоне)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let selectedUser = $derived(availableUsers.find((user: User) => user.id === selectedUserId));

	// Проверяем права на добавление участников
	let canAddParticipants = $derived(currentUserRole === 'admin');

	// Закрываем модальное окно
	function close() {
		dispatch('cancel');
	}

	// Выбираем пользователя
	function selectUser(userId: string) {
		selectedUserId = userId;
	}

	// Добавляем участника
	async function addParticipant() {
		if (!selectedUserId || !canAddParticipants) return;

		isAdding = true;
		try {
			dispatch('add', { userId: selectedUserId, role: selectedRole });
			close();
		} catch (error) {
			console.error('Error adding participant:', error);
		} finally {
			isAdding = false;
		}
	}

	// Обработка клавиш
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="add-participants-title"
		tabindex="-1"
		onclick={close}
		onkeydown={(e) => e.key === 'Escape' && close()}
	>
		<div class="modal-content" role="document">
			<!-- Заголовок -->
			<header class="modal-header">
				<h2 id="add-participants-title" class="modal-title">Добавить участника</h2>
				<button
					class="close-button"
					onclick={close}
					title="Закрыть"
					aria-label="Закрыть модальное окно"
				>
					<X class="h-5 w-5" />
				</button>
			</header>

			<!-- Содержимое -->
			<div class="modal-body">
				{#if !canAddParticipants}
					<div class="permission-warning">
						<Shield class="h-6 w-6 text-orange-500" />
						<p>Только администраторы могут добавлять участников в группу</p>
					</div>
				{:else}
					<!-- Поиск пользователей -->
					<div class="search-section">
						<div class="search-input-wrapper">
							<Search class="h-4 w-4 text-gray-400" />
							<input
								type="text"
								placeholder="Поиск пользователей..."
								bind:value={searchQuery}
								class="search-input"
							/>
						</div>
					</div>

					<!-- Список пользователей -->
					<div class="users-list">
						{#if filteredUsers.length === 0}
							<div class="empty-state">
								<UserIcon class="h-8 w-8 text-gray-400" />
								<p>Пользователи не найдены</p>
							</div>
						{:else}
							{#each filteredUsers as user (user.id)}
								<button
									class="user-item {selectedUserId === user.id ? 'selected' : ''}"
									onclick={() => selectUser(user.id)}
								>
									<img src={user.avatar} alt={user.name} class="user-avatar" />
									<div class="user-info">
										<h3 class="user-name">{user.name}</h3>
										<p class="user-email">{user.email}</p>
									</div>
									{#if selectedUserId === user.id}
										<div class="check-icon">
											<X class="h-4 w-4" />
										</div>
									{/if}
								</button>
							{/each}
						{/if}
					</div>

					<!-- Выбор роли -->
					{#if selectedUserId}
						<div class="role-selection">
							<h3 class="role-title">Роль участника:</h3>
							<div class="role-options">
								<label class="role-option">
									<input type="radio" bind:group={selectedRole} value="member" class="role-radio" />
									<div class="role-content">
										<UserIcon class="h-4 w-4" />
										<span>Участник</span>
									</div>
								</label>
								<label class="role-option">
									<input
										type="radio"
										bind:group={selectedRole}
										value="moderator"
										class="role-radio"
									/>
									<div class="role-content">
										<Shield class="h-4 w-4" />
										<span>Модератор</span>
									</div>
								</label>
								<label class="role-option">
									<input type="radio" bind:group={selectedRole} value="admin" class="role-radio" />
									<div class="role-content">
										<Crown class="h-4 w-4" />
										<span>Администратор</span>
									</div>
								</label>
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Действия -->
			<footer class="modal-footer">
				<button class="btn btn-secondary" onclick={close}> Отмена </button>
				{#if canAddParticipants && selectedUserId}
					<button class="btn btn-primary" onclick={addParticipant} disabled={isAdding}>
						{isAdding ? 'Добавление...' : 'Добавить участника'}
					</button>
				{/if}
			</footer>
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
	}

	.modal-content {
		background-color: white;
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	/* Темная тема */
	:global(.dark) .modal-content {
		background-color: #1f2937;
		color: #f9fafb;
	}

	:global(.dark) .modal-header {
		border-color: #374151;
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
	}

	.close-button {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		transition: all 0.2s;
	}

	.close-button:hover {
		background-color: #f3f4f6;
		color: #374151;
	}

	:global(.dark) .close-button:hover {
		background-color: #374151;
		color: #f9fafb;
	}

	.modal-body {
		padding: 1.5rem;
		flex: 1;
		overflow-y: auto;
	}

	.permission-warning {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background-color: #fef3c7;
		border: 1px solid #f59e0b;
		border-radius: 0.5rem;
		color: #92400e;
	}

	:global(.dark) .permission-warning {
		background-color: #451a03;
		border-color: #f59e0b;
		color: #fbbf24;
	}

	.search-section {
		margin-bottom: 1.5rem;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		background-color: white;
	}

	:global(.dark) .search-input {
		background-color: #374151;
		border-color: #4b5563;
		color: #f9fafb;
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.search-input-wrapper :global(svg) {
		position: absolute;
		left: 0.75rem;
		pointer-events: none;
	}

	.users-list {
		max-height: 300px;
		overflow-y: auto;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	:global(.dark) .users-list {
		border-color: #374151;
	}

	.user-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border: none;
		background: none;
		width: 100%;
		cursor: pointer;
		transition: background-color 0.2s;
		border-bottom: 1px solid #f3f4f6;
	}

	:global(.dark) .user-item {
		border-color: #374151;
	}

	.user-item:last-child {
		border-bottom: none;
	}

	.user-item:hover {
		background-color: #f9fafb;
	}

	:global(.dark) .user-item:hover {
		background-color: #374151;
	}

	.user-item.selected {
		background-color: #dbeafe;
	}

	:global(.dark) .user-item.selected {
		background-color: #1e3a8a;
	}

	.user-avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999px;
		object-fit: cover;
	}

	.user-info {
		flex: 1;
		text-align: left;
	}

	.user-name {
		font-weight: 500;
		margin: 0 0 0.25rem 0;
		font-size: 0.875rem;
	}

	.user-email {
		margin: 0;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.check-icon {
		color: #3b82f6;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		color: #6b7280;
		text-align: center;
	}

	.empty-state p {
		margin: 0.5rem 0 0 0;
		font-size: 0.875rem;
	}

	.role-selection {
		margin-top: 1.5rem;
	}

	.role-title {
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0 0 0.75rem 0;
	}

	.role-options {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.role-option {
		display: flex;
		align-items: center;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.375rem;
		transition: background-color 0.2s;
	}

	.role-option:hover {
		background-color: #f3f4f6;
	}

	:global(.dark) .role-option:hover {
		background-color: #374151;
	}

	.role-radio {
		margin-right: 0.75rem;
	}

	.role-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	:global(.dark) .modal-footer {
		border-color: #374151;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.btn-secondary {
		background-color: #e5e7eb;
		color: #374151;
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: #d1d5db;
	}

	:global(.dark) .btn-secondary {
		background-color: #374151;
		color: #f9fafb;
	}

	:global(.dark) .btn-secondary:hover:not(:disabled) {
		background-color: #4b5563;
	}
</style>
