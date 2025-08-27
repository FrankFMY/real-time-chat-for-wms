<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Trash2, Edit3, X, Check, Copy, Share2 } from 'lucide-svelte';
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	import type { Message } from '$lib/types/chat';

	const dispatch = createEventDispatcher<{
		save: { messageId: string; content: string };
		cancel: { messageId: string };
		showHistory: { messageId: string };
		reply: { messageId: string };
		delete: { messageId: string };
		copy: { messageId: string; content: string };
		forward: { messageId: string; content: string };
	}>();

	// Props interface removed as it's not used

	let { message, currentUserId, editTimeLimit = 15 } = $props();

	let isEditing = $state(false);
	let editedContent = $state(message.content);
	let showDeleteConfirm = $state(false);
	let showContextMenu = $state(false);
	let contextMenuPosition = $state({ x: 0, y: 0 });

	// Проверяем, можно ли редактировать сообщение
	let canEdit = $derived(
		editTimeLimit === 0 ||
			new Date() < new Date(message.timestamp.getTime() + editTimeLimit * 60 * 1000)
	);

	// Проверяем, является ли сообщение собственным
	let isOwnMessage = $derived(message.senderId === currentUserId);

	// Начинаем редактирование
	function startEdit() {
		if (!canEdit) return;
		isEditing = true;
		editedContent = message.content;
	}

	// Отменяем редактирование
	function cancelEdit() {
		isEditing = false;
		editedContent = message.content;
		dispatch('cancel', { messageId: message.id });
	}

	// Сохраняем изменения
	function saveEdit() {
		if (!editedContent.trim()) return;

		dispatch('save', { messageId: message.id, content: editedContent.trim() });
		isEditing = false;
	}

	// Показываем историю изменений (заглушка)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function showHistory() {
		// TODO: Implement history functionality
		console.log('History functionality not implemented yet');
	}

	// Отвечаем на сообщение
	function replyToMessage() {
		dispatch('reply', { messageId: message.id });
	}

	// Удаляем сообщение
	function deleteMessage() {
		dispatch('delete', { messageId: message.id });
		showDeleteConfirm = false;
	}

	// Копируем текст сообщения
	function copyMessage() {
		try {
			if (typeof navigator !== 'undefined' && navigator.clipboard) {
				navigator.clipboard.writeText(message.content).catch(() => {
					// Fallback для браузеров без поддержки clipboard API
					console.warn('Clipboard API не поддерживается');
				});
			}
		} catch (error) {
			console.warn('Ошибка при копировании в буфер обмена:', error);
		}
		dispatch('copy', { messageId: message.id, content: message.content });
		showContextMenu = false;
	}

	// Пересылаем сообщение
	function forwardMessage() {
		dispatch('forward', { messageId: message.id, content: message.content });
		showContextMenu = false;
	}

	// Показываем контекстное меню
	function showContextMenuHandler(event: MouseEvent) {
		event.preventDefault();
		contextMenuPosition = { x: event.clientX, y: event.clientY };
		showContextMenu = true;
	}

	// Обработчик клавиш
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (isEditing) {
				cancelEdit();
			} else if (showContextMenu) {
				showContextMenu = false;
			}
		}
	}

	// Обработчик кликов для скрытия контекстного меню
	function handleClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.context-menu') && !target.closest('.message-content')) {
			showContextMenu = false;
		}
	}

	// Обработчик клавиатуры для оверлея
	function handleOverlayKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			showDeleteConfirm = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} onclick={handleClick} />

<div class="message-editor" role="region">
	{#if isEditing}
		<!-- Режим редактирования -->
		<div class="edit-mode">
			<textarea
				bind:value={editedContent}
				class="edit-textarea"
				placeholder="Редактировать сообщение..."
				onkeydown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						saveEdit();
					} else if (e.key === 'Escape') {
						e.preventDefault();
						cancelEdit();
					}
				}}
				aria-label="Редактировать сообщение"
			></textarea>
			<div class="edit-actions">
				<button
					class="btn-icon btn-success"
					onclick={saveEdit}
					title="Сохранить"
					aria-label="Сохранить изменения"
				>
					<Check class="h-4 w-4" aria-hidden="true" />
				</button>
				<button
					class="btn-icon btn-secondary"
					onclick={cancelEdit}
					title="Отменить"
					aria-label="Отменить редактирование"
				>
					<X class="h-4 w-4" aria-hidden="true" />
				</button>
			</div>
		</div>
	{:else}
		<!-- Обычный режим отображения -->
		<button
			class="message-content"
			role="textbox"
			tabindex="0"
			oncontextmenu={showContextMenuHandler}
			onclick={() => {
				// Можно добавить действие по умолчанию
			}}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					// Можно добавить действие по умолчанию
				}
			}}
			aria-label="Сообщение"
		>
			{message.content}
			{#if message.edited}
				<span class="edited-indicator">(отредактировано)</span>
			{/if}
		</button>

		<!-- Действия с сообщением -->
		{#if isOwnMessage}
			<div class="message-actions" role="toolbar" aria-label="Действия с сообщением">
				{#if canEdit}
					<button
						class="btn-icon"
						onclick={startEdit}
						title="Редактировать"
						aria-label="Редактировать сообщение"
					>
						<Edit3 class="h-3 w-3" aria-hidden="true" />
					</button>
				{/if}
				<button
					class="btn-icon"
					onclick={replyToMessage}
					title="Ответить"
					aria-label="Ответить на сообщение"
				>
					<Share2 class="h-3 w-3" aria-hidden="true" />
				</button>
				<button
					class="btn-icon"
					onclick={copyMessage}
					title="Копировать"
					aria-label="Копировать сообщение"
				>
					<Copy class="h-3 w-3" aria-hidden="true" />
				</button>
				<button
					class="btn-icon btn-danger"
					onclick={() => (showDeleteConfirm = true)}
					title="Удалить"
					aria-label="Удалить сообщение"
				>
					<Trash2 class="h-3 w-3" aria-hidden="true" />
				</button>
			</div>
		{:else}
			<div class="message-actions" role="toolbar" aria-label="Действия с сообщением">
				<button
					class="btn-icon"
					onclick={replyToMessage}
					title="Ответить"
					aria-label="Ответить на сообщение"
				>
					<Share2 class="h-3 w-3" aria-hidden="true" />
				</button>
				<button
					class="btn-icon"
					onclick={copyMessage}
					title="Копировать"
					aria-label="Копировать сообщение"
				>
					<Copy class="h-3 w-3" aria-hidden="true" />
				</button>
				<button
					class="btn-icon"
					onclick={forwardMessage}
					title="Переслать"
					aria-label="Переслать сообщение"
				>
					<Share2 class="h-3 w-3" aria-hidden="true" />
				</button>
			</div>
		{/if}
	{/if}

	<!-- Диалог подтверждения удаления -->
	{#if showDeleteConfirm}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
		<div
			class="delete-confirm-overlay"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-confirm-title"
			tabindex="-1"
			onclick={() => (showDeleteConfirm = false)}
			onkeydown={handleOverlayKeydown}
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div class="delete-confirm-modal" role="document" onclick={(e) => e.stopPropagation()}>
				<h3 id="delete-confirm-title">Удалить сообщение?</h3>
				<p>Это действие нельзя отменить.</p>
				<div class="delete-confirm-actions">
					<button
						class="btn btn-secondary"
						onclick={() => (showDeleteConfirm = false)}
						aria-label="Отменить удаление"
					>
						Отмена
					</button>
					<button class="btn btn-danger" onclick={deleteMessage} aria-label="Подтвердить удаление">
						Удалить
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Контекстное меню -->
	{#if showContextMenu}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="context-menu"
			style="left: {contextMenuPosition.x}px; top: {contextMenuPosition.y}px;"
			role="menu"
			aria-label="Контекстное меню"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<button
				class="context-menu-item"
				onclick={copyMessage}
				role="menuitem"
				aria-label="Копировать сообщение"
			>
				<Copy class="h-4 w-4" aria-hidden="true" />
				Копировать
			</button>
			<button
				class="context-menu-item"
				onclick={replyToMessage}
				role="menuitem"
				aria-label="Ответить на сообщение"
			>
				<Share2 class="h-4 w-4" aria-hidden="true" />
				Ответить
			</button>
			<button
				class="context-menu-item"
				onclick={forwardMessage}
				role="menuitem"
				aria-label="Переслать сообщение"
			>
				<Share2 class="h-4 w-4" aria-hidden="true" />
				Переслать
			</button>
			{#if isOwnMessage}
				<hr class="context-menu-divider" aria-hidden="true" />
				{#if canEdit}
					<button
						class="context-menu-item"
						onclick={startEdit}
						role="menuitem"
						aria-label="Редактировать сообщение"
					>
						<Edit3 class="h-4 w-4" aria-hidden="true" />
						Редактировать
					</button>
				{/if}
				<button
					class="context-menu-item text-red-600"
					onclick={() => (showDeleteConfirm = true)}
					role="menuitem"
					aria-label="Удалить сообщение"
				>
					<Trash2 class="h-4 w-4" aria-hidden="true" />
					Удалить
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.message-editor {
		position: relative;
		width: 100%;
	}

	.message-content {
		word-wrap: break-word;
		white-space: pre-wrap;
		cursor: pointer;
		background: none;
		border: none;
		text-align: left;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
		width: 100%;
		padding: 0;
		margin: 0;
	}

	.message-content:hover {
		background-color: rgba(0, 0, 0, 0.02);
		border-radius: 4px;
		padding: 2px;
		margin: -2px;
	}

	.message-content:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.edited-indicator {
		font-size: 0.75rem;
		color: #9ca3af;
		font-style: italic;
		margin-left: 0.5rem;
		font-weight: 500;
		opacity: 0.8;
	}

	.message-actions {
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.2s ease;
		margin-top: 0.25rem;
	}

	.message-editor:hover .message-actions {
		opacity: 1;
	}

	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		border: none;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 4px;
		cursor: pointer;
		color: #4b5563;
		transition: all 0.2s ease;
	}

	.btn-icon:hover {
		background-color: rgba(0, 0, 0, 0.15);
		color: #1f2937;
	}

	.btn-icon:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.btn-icon.btn-danger {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}

	.btn-icon.btn-danger:hover {
		background-color: rgba(239, 68, 68, 0.2);
		color: #b91c1c;
	}

	.btn-icon.btn-success {
		background: rgba(34, 197, 94, 0.1);
		color: #16a34a;
	}

	.btn-icon.btn-success:hover {
		background-color: rgba(34, 197, 94, 0.2);
		color: #15803d;
	}

	.btn-icon.btn-secondary {
		background: rgba(107, 114, 128, 0.1);
		color: #4b5563;
	}

	.btn-icon.btn-secondary:hover {
		background-color: rgba(107, 114, 128, 0.2);
		color: #374151;
	}

	.edit-mode {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.edit-textarea {
		width: 100%;
		min-height: 60px;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		resize: vertical;
		font-family: inherit;
		font-size: inherit;
		line-height: 1.5;
	}

	.edit-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.edit-actions {
		display: flex;
		gap: 0.25rem;
		justify-content: flex-end;
	}

	.delete-confirm-overlay {
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

	.delete-confirm-modal {
		background: white;
		padding: 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		max-width: 400px;
		width: 90%;
	}

	.delete-confirm-modal h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.delete-confirm-modal p {
		margin: 0 0 1rem 0;
		color: #6b7280;
	}

	.delete-confirm-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.btn-secondary {
		background-color: #f3f4f6;
		color: #374151;
	}

	.btn-secondary:hover {
		background-color: #e5e7eb;
	}

	.btn-danger {
		background-color: #dc2626;
		color: white;
	}

	.btn-danger:hover {
		background-color: #b91c1c;
	}

	.context-menu {
		position: fixed;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
		padding: 0.5rem 0;
		z-index: 1000;
		min-width: 160px;
	}

	.context-menu-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		cursor: pointer;
		font-size: 0.875rem;
		color: #374151;
		transition: background-color 0.2s ease;
	}

	.context-menu-item:hover {
		background-color: #f3f4f6;
	}

	.context-menu-item:focus {
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
	}

	.context-menu-divider {
		margin: 0.25rem 0;
		border: none;
		border-top: 1px solid #e5e7eb;
	}

	/* Темная тема */
	:global(.dark) .message-content:hover {
		background-color: rgba(255, 255, 255, 0.05);
	}

	:global(.dark) .btn-icon {
		background: rgba(255, 255, 255, 0.1);
		color: #d1d5db;
	}

	:global(.dark) .btn-icon:hover {
		background-color: rgba(255, 255, 255, 0.2);
		color: #f9fafb;
	}

	:global(.dark) .edit-textarea {
		background-color: #374151;
		border-color: #4b5563;
		color: #f9fafb;
	}

	:global(.dark) .edit-textarea:focus {
		border-color: #3b82f6;
	}

	:global(.dark) .delete-confirm-modal {
		background-color: #1f2937;
		color: #f9fafb;
	}

	:global(.dark) .delete-confirm-modal h3 {
		color: #f9fafb;
	}

	:global(.dark) .delete-confirm-modal p {
		color: #9ca3af;
	}

	:global(.dark) .btn-secondary {
		background-color: #374151;
		color: #d1d5db;
	}

	:global(.dark) .btn-secondary:hover {
		background-color: #4b5563;
	}

	:global(.dark) .context-menu {
		background-color: #1f2937;
		border-color: #374151;
	}

	:global(.dark) .context-menu-item {
		color: #d1d5db;
	}

	:global(.dark) .context-menu-item:hover {
		background-color: #374151;
	}

	:global(.dark) .context-menu-divider {
		border-color: #374151;
	}

	:global(.dark) .edited-indicator {
		color: #d1d5db;
		opacity: 0.9;
	}

	:global(.dark) .btn-icon.btn-danger {
		background: rgba(239, 68, 68, 0.2);
		color: #fca5a5;
	}

	:global(.dark) .btn-icon.btn-danger:hover {
		background-color: rgba(239, 68, 68, 0.3);
		color: #fecaca;
	}

	:global(.dark) .btn-icon.btn-success {
		background: rgba(34, 197, 94, 0.2);
		color: #86efac;
	}

	:global(.dark) .btn-icon.btn-success:hover {
		background-color: rgba(34, 197, 94, 0.3);
		color: #bbf7d0;
	}

	:global(.dark) .btn-icon.btn-secondary {
		background: rgba(156, 163, 175, 0.2);
		color: #d1d5db;
	}

	:global(.dark) .btn-icon.btn-secondary:hover {
		background-color: rgba(156, 163, 175, 0.3);
		color: #e5e7eb;
	}
</style>
