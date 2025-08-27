<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { Send, X, RotateCcw, Edit, History, CheckCircle } from 'lucide-svelte';
	import type { Message, MessageEditHistory } from '$lib/types/chat';

	const dispatch = createEventDispatcher<{
		save: { messageId: string; content: string };
		cancel: { messageId: string };
		showHistory: { messageId: string };
	}>();

	const { message, currentUserId, editTimeLimit = 15 } = $props<{
		message: Message;
		currentUserId: string;
		editTimeLimit?: number;
	}>();

	let editedContent = $state(message.content);
	let isEditing = $state(false);
	let showHistory = $state(false);
	let timeLeft = $state<number | null>(null);
	let editTimer: NodeJS.Timeout | null = null;

	// Проверяем, можно ли редактировать сообщение
	let canEdit = $derived(message.senderId === currentUserId && 
		(!message.editedAt || 
			(Date.now() - message.editedAt.getTime()) < editTimeLimit * 60 * 1000));

	// Форматирование оставшегося времени
	let timeLeftFormatted = $derived(timeLeft !== null ? 
		`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : null);

	onMount(() => {
		if (browser && message.editedAt) {
			updateTimeLeft();
			editTimer = setInterval(updateTimeLeft, 1000);
		}

		return () => {
			if (editTimer) {
				clearInterval(editTimer);
			}
		};
	});

	function updateTimeLeft() {
		if (!message.editedAt) return;
		
		const elapsed = Date.now() - message.editedAt.getTime();
		const limitMs = editTimeLimit * 60 * 1000;
		const remaining = Math.max(0, Math.floor((limitMs - elapsed) / 1000));
		
		timeLeft = remaining > 0 ? remaining : null;
		
		if (remaining <= 0 && editTimer) {
			clearInterval(editTimer);
		}
	}

	function startEditing() {
		if (!canEdit) return;
		isEditing = true;
		editedContent = message.content;
	}

	function cancelEditing() {
		isEditing = false;
		editedContent = message.content;
		dispatch('cancel', { messageId: message.id });
	}

	function saveEdit() {
		if (!editedContent.trim() || editedContent === message.content) {
			cancelEditing();
			return;
		}

		dispatch('save', { 
			messageId: message.id, 
			content: editedContent.trim() 
		});
		isEditing = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			saveEdit();
		} else if (event.key === 'Escape') {
			cancelEditing();
		}
	}

	function showEditHistory() {
		dispatch('showHistory', { messageId: message.id });
	}

	function restoreVersion(historyItem: MessageEditHistory) {
		editedContent = historyItem.content;
		saveEdit();
	}
</script>

<div class="message-editor">
	{#if isEditing}
		<!-- Режим редактирования -->
		<div class="edit-mode">
			<div class="edit-header">
				<span class="edit-label">Редактирование сообщения</span>
				{#if timeLeftFormatted}
					<span class="time-left">Осталось: {timeLeftFormatted}</span>
				{/if}
			</div>
			
			<div class="edit-content">
				<textarea
					bind:value={editedContent}
					onkeydown={handleKeydown}
					class="edit-textarea"
					placeholder="Введите текст сообщения..."
					rows="1"
					autofocus
				></textarea>
				
				<div class="edit-actions">
					<button
						class="btn-save"
						onclick={saveEdit}
						disabled={!editedContent.trim() || editedContent === message.content}
						title="Сохранить изменения"
					>
						<Send class="h-4 w-4" />
					</button>
					<button
						class="btn-cancel"
						onclick={cancelEditing}
						title="Отменить редактирование"
					>
						<X class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	{:else}
		<!-- Обычный режим отображения -->
		<div class="message-content">
			{message.content}
			{#if message.edited}
				<span class="edited-indicator" title="Сообщение отредактировано">
					<CheckCircle class="h-3 w-3" />
					отредактировано
				</span>
			{/if}
		</div>
		
		<!-- Кнопки действий -->
		{#if message.senderId === currentUserId}
			<div class="message-actions">
				{#if canEdit}
					<button
						class="action-btn"
						onclick={startEditing}
						title="Редактировать сообщение"
					>
						<Edit class="h-3 w-3 mr-1" />
						Редактировать
					</button>
				{/if}
				
				{#if message.editHistory && message.editHistory.length > 0}
					<button
						class="action-btn"
						onclick={showEditHistory}
						title="История изменений"
					>
						<History class="h-3 w-3 mr-1" />
						История
					</button>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- История изменений -->
	{#if showHistory && message.editHistory && message.editHistory.length > 0}
		<div class="edit-history">
			<div class="history-header">
				<h4>История изменений</h4>
				<button class="close-btn" onclick={() => showHistory = false}>
					<X class="h-4 w-4" />
				</button>
			</div>
			
			<div class="history-list">
				{#each message.editHistory as historyItem, index (historyItem.id)}
					<div class="history-item">
						<div class="history-content">
							<p class="history-text">{historyItem.content}</p>
							<div class="history-meta">
								<span class="history-time">
									{new Date(historyItem.editedAt).toLocaleString('ru-RU')}
								</span>
								{#if canEdit && index < message.editHistory!.length - 1}
									<button
										class="restore-btn"
										onclick={() => restoreVersion(historyItem)}
										title="Восстановить эту версию"
									>
										<RotateCcw class="h-3 w-3" />
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.message-editor {
		position: relative;
		width: 100%;
	}

	.edit-mode {
		border: 1px solid #3b82f6;
		border-radius: 0.5rem;
		background-color: rgba(59, 130, 246, 0.05);
		padding: 0.75rem;
	}

	.edit-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.edit-label {
		font-weight: 500;
		color: #3b82f6;
	}

	.time-left {
		color: #ef4444;
		font-weight: 500;
	}

	.edit-content {
		display: flex;
		gap: 0.5rem;
		align-items: flex-end;
	}

	.edit-textarea {
		flex: 1;
		min-height: 2.5rem;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		resize: vertical;
		font-family: inherit;
		font-size: 0.875rem;
		background-color: white;
		color: #1f2937;
	}

	.edit-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.edit-actions {
		display: flex;
		gap: 0.25rem;
	}

	.btn-save,
	.btn-cancel {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-save {
		background-color: #3b82f6;
		color: white;
	}

	.btn-save:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.btn-save:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}

	.btn-cancel {
		background-color: #6b7280;
		color: white;
	}

	.btn-cancel:hover {
		background-color: #4b5563;
	}

	.message-content {
		position: relative;
	}

	.edited-indicator {
		font-size: 0.75rem;
		color: #ffffff;
		font-weight: 600;
		margin-left: 0.5rem;
		background-color: #059669;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: 1px solid #047857;
		box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.edited-indicator:hover {
		background-color: #047857;
		border-color: #065f46;
		box-shadow: 0 3px 6px rgba(5, 150, 105, 0.4);
		transform: translateY(-1px);
	}

	.message-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
		opacity: 0.8;
		transition: opacity 0.2s ease;
		background-color: rgba(255, 255, 255, 0.95);
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		backdrop-filter: blur(8px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.message-editor:hover .message-actions {
		opacity: 1;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.action-btn {
		display: flex;
		align-items: center;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #374151;
		background-color: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.action-btn:hover {
		background-color: #e5e7eb;
		color: #1f2937;
		border-color: #9ca3af;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.edit-history {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 1000;
		background-color: white;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		margin-top: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.history-header h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin: 0;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background: none;
		color: #6b7280;
		cursor: pointer;
		border-radius: 0.25rem;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background-color: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	.history-list {
		padding: 0.5rem;
	}

	.history-item {
		padding: 0.5rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.history-item:last-child {
		border-bottom: none;
	}

	.history-text {
		font-size: 0.875rem;
		color: #374151;
		margin: 0 0 0.25rem 0;
		line-height: 1.4;
	}

	.history-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.restore-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border: none;
		background-color: #3b82f6;
		color: white;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.restore-btn:hover {
		background-color: #2563eb;
	}

	/* Темная тема */
	:global(.dark) .edit-textarea {
		background-color: #374151;
		border-color: #4b5563;
		color: #f9fafb;
	}

	:global(.dark) .edit-textarea:focus {
		border-color: #3b82f6;
	}

	:global(.dark) .edit-history {
		background-color: #374151;
		border-color: #4b5563;
	}

	:global(.dark) .history-header {
		border-bottom-color: #4b5563;
	}

	:global(.dark) .history-header h4 {
		color: #f9fafb;
	}

	:global(.dark) .history-item {
		border-bottom-color: #4b5563;
	}

	:global(.dark) .history-text {
		color: #f9fafb;
	}

	:global(.dark) .message-actions {
		background-color: rgba(31, 41, 55, 0.95);
		border-color: rgba(255, 255, 255, 0.15);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	:global(.dark) .message-editor:hover .message-actions {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	:global(.dark) .action-btn {
		background-color: #4b5563;
		border-color: #6b7280;
		color: #f9fafb;
	}

	:global(.dark) .action-btn:hover {
		background-color: #6b7280;
		color: #ffffff;
		border-color: #9ca3af;
	}

	:global(.dark) .edited-indicator {
		background-color: #10b981;
		color: #ffffff;
		border-color: #059669;
		box-shadow: 0 2px 4px rgba(16, 185, 129, 0.4);
	}

	:global(.dark) .edited-indicator:hover {
		background-color: #059669;
		border-color: #047857;
		box-shadow: 0 3px 6px rgba(16, 185, 129, 0.5);
	}

	:global(.dark) .close-btn:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: #f9fafb;
	}
</style>
