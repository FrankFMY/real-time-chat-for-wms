<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import {
		X,
		Users,
		LogOut,
		Edit,
		Trash2,
		Plus,
		Crown,
		Shield,
		User as UserIcon,
		MoreVertical
	} from 'lucide-svelte';
	import type { Chat, User, ParticipantRole } from '$lib/types/chat';
	import AddParticipantsModal from './AddParticipantsModal.svelte';

	const dispatch = createEventDispatcher<{
		close: void;
		edit: void;
		leave: void;
		delete: void;
		addParticipant: { userId: string; role: ParticipantRole };
		removeParticipant: { userId: string };
		updateRole: { userId: string; role: ParticipantRole };
	}>();

	const {
		isOpen = false,
		chat = null,
		participants = [],
		currentUser = null,
		availableUsers = []
	} = $props<{
		isOpen?: boolean;
		chat?: Chat | null;
		participants?: User[];
		currentUser?: User | null;
		availableUsers?: User[];
	}>();

	// Состояние модальных окон
	let showAddParticipantsModal = $state(false);
	let showParticipantMenu = $state<string | null>(null);

	// Получаем роль текущего пользователя
	let currentUserRole = $derived(
		chat?.groupParticipants?.find(
			(gp: { userId: string; role: string }) => gp.userId === currentUser?.id
		)?.role || 'member'
	);

	// Проверяем права администратора
	let isAdmin = $derived(currentUserRole === 'admin');

	// Проверяем права модератора
	let isModerator = $derived(currentUserRole === 'admin' || currentUserRole === 'moderator');

	// Получаем участников группы с ролями
	let groupParticipants = $derived(
		participants
			.filter((user: User) => chat?.participants.includes(user.id))
			.map((user: User) => {
				const groupParticipant = chat?.groupParticipants?.find(
					(gp: { userId: string; role: string }) => gp.userId === user.id
				);
				return {
					...user,
					role: groupParticipant?.role || 'member',
					joinedAt: groupParticipant?.joinedAt || chat?.createdAt,
					addedBy: groupParticipant?.addedBy
				};
			})
	);

	// Закрываем модальное окно
	function close() {
		dispatch('close');
	}

	// Открываем редактирование группы
	function editGroup() {
		dispatch('edit');
	}

	// Покидаем группу
	function leaveGroup() {
		if (confirm('Вы уверены, что хотите покинуть группу?')) {
			dispatch('leave');
		}
	}

	// Удаляем группу
	function deleteGroup() {
		if (confirm('Вы уверены, что хотите удалить группу? Это действие нельзя отменить.')) {
			dispatch('delete');
		}
	}

	// Открываем модальное окно добавления участников
	function openAddParticipantsModal() {
		showAddParticipantsModal = true;
	}

	// Закрываем модальное окно добавления участников
	function closeAddParticipantsModal() {
		showAddParticipantsModal = false;
	}

	// Добавляем участника
	function handleAddParticipant(event: CustomEvent<{ userId: string; role: ParticipantRole }>) {
		dispatch('addParticipant', event.detail);
		closeAddParticipantsModal();
	}

	// Удаляем участника
	function removeParticipant(userId: string) {
		if (confirm('Вы уверены, что хотите удалить этого участника из группы?')) {
			dispatch('removeParticipant', { userId });
		}
	}

	// Изменяем роль участника
	function updateParticipantRole(userId: string, role: ParticipantRole) {
		dispatch('updateRole', { userId, role });
	}

	// Показываем/скрываем меню участника
	function toggleParticipantMenu(userId: string) {
		showParticipantMenu = showParticipantMenu === userId ? null : userId;
	}

	// Получаем иконку роли
	function getRoleIcon(role: ParticipantRole) {
		switch (role) {
			case 'admin':
				return Crown;
			case 'moderator':
				return Shield;
			default:
				return UserIcon;
		}
	}

	// Получаем цвет роли
	function getRoleColor(role: ParticipantRole) {
		switch (role) {
			case 'admin':
				return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
			case 'moderator':
				return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
			default:
				return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
		}
	}

	// Проверяем, может ли пользователь управлять участником
	function canManageParticipant(participantRole: ParticipantRole) {
		if (!isModerator) return false;
		if (isAdmin) return true;
		return participantRole === 'member'; // Модераторы могут управлять только обычными участниками
	}

	// Обработка клавиш
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && chat}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="group-info-title"
		tabindex="-1"
		onclick={close}
		onkeydown={(e) => e.key === 'Escape' && close()}
	>
		<div class="modal-content" role="document">
			<!-- Заголовок -->
			<header class="modal-header">
				<h2 id="group-info-title" class="modal-title">Информация о группе</h2>
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
				<!-- Информация о группе -->
				<div class="group-info">
					<div class="group-avatar-section">
						<img src={chat.avatar} alt={chat.name} class="group-avatar" />
						<div class="group-type-badge">
							<Users class="h-4 w-4" />
							Группа
						</div>
					</div>

					<div class="group-details">
						<h3 class="group-name">{chat.name}</h3>
						<p class="group-stats">
							{groupParticipants.length} участников
						</p>
						{#if chat.description}
							<p class="group-description">{chat.description}</p>
						{/if}
					</div>
				</div>

				<!-- Действия -->
				<div class="group-actions">
					{#if isAdmin}
						<button class="action-button" onclick={editGroup}>
							<Edit class="h-4 w-4" />
							Редактировать группу
						</button>
					{/if}

					{#if isAdmin}
						<button class="action-button" onclick={openAddParticipantsModal}>
							<Plus class="h-4 w-4" />
							Добавить участника
						</button>
					{/if}

					<button class="action-button danger" onclick={leaveGroup}>
						<LogOut class="h-4 w-4" />
						Покинуть группу
					</button>

					{#if isAdmin}
						<button class="action-button danger" onclick={deleteGroup}>
							<Trash2 class="h-4 w-4" />
							Удалить группу
						</button>
					{/if}
				</div>

				<!-- Список участников -->
				<div class="participants-section">
					<h4 class="section-title">
						<Users class="h-4 w-4" />
						Участники ({groupParticipants.length})
					</h4>

					<div class="participants-list">
						{#each groupParticipants as participant (participant.id)}
							{@const RoleIcon = getRoleIcon(participant.role)}
							{@const roleColor = getRoleColor(participant.role)}
							{@const canManage = canManageParticipant(participant.role)}
							{@const isCurrentUser = participant.id === currentUser?.id}

							<div class="participant-item">
								<img src={participant.avatar} alt={participant.name} class="participant-avatar" />
								<div class="participant-info">
									<div class="participant-header">
										<span class="participant-name">{participant.name}</span>
										<div class="participant-role-badge {roleColor}">
											<RoleIcon class="h-3 w-3" />
											<span
												>{participant.role === 'admin'
													? 'Админ'
													: participant.role === 'moderator'
														? 'Модератор'
														: 'Участник'}</span
											>
										</div>
									</div>
									<div class="participant-details">
										<span class="participant-status">{participant.status}</span>
										{#if isCurrentUser}
											<span class="participant-badge">Вы</span>
										{/if}
									</div>
								</div>

								{#if canManage && !isCurrentUser}
									<div class="participant-actions">
										<button
											class="action-menu-button"
											onclick={() => toggleParticipantMenu(participant.id)}
											title="Действия"
										>
											<MoreVertical class="h-4 w-4" />
										</button>

										{#if showParticipantMenu === participant.id}
											<div class="action-menu">
												{#if isAdmin}
													<button
														class="menu-item"
														onclick={() => updateParticipantRole(participant.id, 'admin')}
													>
														<Crown class="h-4 w-4" />
														Сделать администратором
													</button>
													<button
														class="menu-item"
														onclick={() => updateParticipantRole(participant.id, 'moderator')}
													>
														<Shield class="h-4 w-4" />
														Сделать модератором
													</button>
													<button
														class="menu-item"
														onclick={() => updateParticipantRole(participant.id, 'member')}
													>
														<UserIcon class="h-4 w-4" />
														Сделать участником
													</button>
												{/if}
												<button
													class="menu-item danger"
													onclick={() => removeParticipant(participant.id)}
												>
													<Trash2 class="h-4 w-4" />
													Удалить из группы
												</button>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Модальное окно добавления участников -->
	<AddParticipantsModal
		isOpen={showAddParticipantsModal}
		{availableUsers}
		existingParticipants={chat?.participants || []}
		{currentUserRole}
		on:add={handleAddParticipant}
		on:cancel={closeAddParticipantsModal}
	/>
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

	.modal-body {
		padding: 1.5rem;
	}

	.group-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.group-avatar-section {
		position: relative;
		flex-shrink: 0;
	}

	.group-avatar {
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid #e5e7eb;
	}

	.group-type-badge {
		position: absolute;
		bottom: -0.5rem;
		right: -0.5rem;
		background-color: #3b82f6;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.group-details {
		flex: 1;
	}

	.group-name {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.group-stats {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0 0 0.5rem 0;
	}

	.group-description {
		font-size: 0.875rem;
		color: #374151;
		margin: 0;
		line-height: 1.5;
	}

	.group-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background-color: #f3f4f6;
		color: #374151;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.action-button:hover {
		background-color: #e5e7eb;
	}

	.action-button.danger {
		background-color: #fef2f2;
		color: #dc2626;
	}

	.action-button.danger:hover {
		background-color: #fee2e2;
	}

	.participants-section {
		margin-top: 1rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
	}

	.participants-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.participant-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background-color: #f9fafb;
		border-radius: 0.5rem;
		transition: background-color 0.2s ease;
	}

	.participant-item:hover {
		background-color: #f3f4f6;
	}

	.participant-avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.participant-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.participant-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.participant-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #111827;
	}

	.participant-role-badge {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		border-radius: 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.participant-details {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.participant-status {
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: capitalize;
	}

	.participant-badge {
		background-color: #3b82f6;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.participant-actions {
		position: relative;
	}

	.action-menu-button {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		transition: all 0.2s;
	}

	.action-menu-button:hover {
		background-color: #f3f4f6;
		color: #374151;
	}

	.action-menu {
		position: absolute;
		top: 100%;
		right: 0;
		background-color: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		min-width: 200px;
		z-index: 10;
		overflow: hidden;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem;
		border: none;
		background: none;
		cursor: pointer;
		transition: background-color 0.2s;
		font-size: 0.875rem;
		color: #374151;
	}

	.menu-item:hover {
		background-color: #f3f4f6;
	}

	.menu-item.danger {
		color: #dc2626;
	}

	.menu-item.danger:hover {
		background-color: #fee2e2;
	}

	/* Темная тема */
	:global(.dark) .modal-content {
		background-color: #1f2937;
		color: #f9fafb;
	}

	:global(.dark) .modal-title {
		color: #f9fafb;
	}

	:global(.dark) .group-name {
		color: #f9fafb;
	}

	:global(.dark) .group-stats {
		color: #9ca3af;
	}

	:global(.dark) .group-description {
		color: #d1d5db;
	}

	:global(.dark) .action-button {
		background-color: #374151;
		color: #d1d5db;
	}

	:global(.dark) .action-button:hover {
		background-color: #4b5563;
	}

	:global(.dark) .action-button.danger {
		background-color: #7f1d1d;
		color: #fca5a5;
	}

	:global(.dark) .action-button.danger:hover {
		background-color: #991b1b;
	}

	:global(.dark) .section-title {
		color: #f9fafb;
	}

	:global(.dark) .participant-item {
		background-color: #374151;
	}

	:global(.dark) .participant-item:hover {
		background-color: #4b5563;
	}

	:global(.dark) .participant-name {
		color: #f9fafb;
	}

	:global(.dark) .participant-status {
		color: #9ca3af;
	}

	/* Адаптивность */
	@media (max-width: 640px) {
		.modal-content {
			margin: 1rem;
			max-height: calc(100vh - 2rem);
		}

		.group-info {
			flex-direction: column;
			text-align: center;
		}

		.group-actions {
			flex-direction: column;
		}

		.action-button {
			width: 100%;
			justify-content: center;
		}
	}
</style>
