<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Search, X, ArrowUp } from 'lucide-svelte';
	import type { Message, ReplyMessage } from '$lib/types/chat';

	const dispatch = createEventDispatcher<{
		select: { message: ReplyMessage };
		cancel: void;
	}>();

	const { messages, currentUserId, onClose } = $props<{
		messages: Message[];
		currentUserId: string;
		onClose: () => void;
	}>();

	let searchQuery = $state('');
	let filteredMessages = $derived(
		messages
			.filter(msg => 
				msg.type === 'text' && 
				msg.content.toLowerCase().includes(searchQuery.toLowerCase())
			)
			.slice(-20) // Показываем последние 20 сообщений
			.reverse()
	);

	function selectMessage(message: Message) {
		const replyMessage: ReplyMessage = {
			id: message.id,
			content: message.content,
			senderId: message.senderId,
			senderName: message.senderId === currentUserId ? 'Вы' : 'Пользователь', // В реальном приложении получаем имя из users
			timestamp: message.timestamp,
			type: message.type,
			attachments: message.attachments
		};

		dispatch('select', { message: replyMessage });
		onClose();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	function formatTime(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'только что';
		if (minutes < 60) return `${minutes} мин назад`;
		if (hours < 24) return `${hours} ч назад`;
		if (days < 7) return `${days} дн назад`;
		return date.toLocaleDateString('ru-RU');
	}

	function truncateContent(content: string, maxLength: number = 80): string {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}
</script>

<div class="reply-selector-overlay" onclick={onClose}>
	<div class="reply-selector" onclick={(e) => e.stopPropagation()}>
		<div class="selector-header">
			<h3>Выберите сообщение для ответа</h3>
			<button class="close-btn" onclick={onClose} title="Закрыть">
				<X class="h-4 w-4" />
			</button>
		</div>

		<div class="search-container">
			<div class="search-input-wrapper">
				<Search class="h-4 w-4 search-icon" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Поиск по сообщениям..."
					class="search-input"
					onkeydown={handleKeydown}
					autofocus
				/>
			</div>
		</div>

		<div class="messages-list">
			{#if filteredMessages.length === 0}
				<div class="no-messages">
					{#if searchQuery}
						Сообщения не найдены
					{:else}
						Нет сообщений для ответа
					{/if}
				</div>
			{:else}
				{#each filteredMessages as message (message.id)}
					<div 
						class="message-item" 
						onclick={() => selectMessage(message)}
						title="Нажмите для выбора"
					>
						<div class="message-header">
							<span class="sender-name">
								{message.senderId === currentUserId ? 'Вы' : 'Пользователь'}
							</span>
							<span class="message-time">
								{formatTime(message.timestamp)}
							</span>
						</div>
						<div class="message-content">
							{truncateContent(message.content)}
						</div>
						{#if message.attachments && message.attachments.length > 0}
							<div class="message-attachments">
								📎 {message.attachments.length} вложение(й)
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<div class="selector-footer">
			<button class="cancel-btn" onclick={onClose}>
				Отмена
			</button>
		</div>
	</div>
</div>

<style>
	.reply-selector-overlay {
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
		backdrop-filter: blur(4px);
	}

	.reply-selector {
		background-color: white;
		border-radius: 0.75rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		width: 90%;
		max-width: 500px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	.selector-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.selector-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
		margin: 0;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		background: none;
		color: #6b7280;
		cursor: pointer;
		border-radius: 0.375rem;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background-color: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	.search-container {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		color: #9ca3af;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 0.75rem 0.75rem 2.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		background-color: #f9fafb;
		color: #374151;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		background-color: white;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.messages-list {
		flex: 1;
		overflow-y: auto;
		max-height: 400px;
		padding: 0.5rem;
	}

	.message-item {
		padding: 0.75rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid transparent;
	}

	.message-item:hover {
		background-color: #f3f4f6;
		border-color: #e5e7eb;
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.sender-name {
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}

	.message-time {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.message-content {
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.4;
		margin-bottom: 0.25rem;
	}

	.message-attachments {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.no-messages {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.selector-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #e5e7eb;
		display: flex;
		justify-content: flex-end;
	}

	.cancel-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		background-color: white;
		color: #374151;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-btn:hover {
		background-color: #f9fafb;
		border-color: #9ca3af;
	}

	/* Темная тема */
	:global(.dark) .reply-selector {
		background-color: #374151;
		border: 1px solid #4b5563;
	}

	:global(.dark) .selector-header {
		border-bottom-color: #4b5563;
	}

	:global(.dark) .selector-header h3 {
		color: #f9fafb;
	}

	:global(.dark) .close-btn:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: #f9fafb;
	}

	:global(.dark) .search-container {
		border-bottom-color: #4b5563;
	}

	:global(.dark) .search-input {
		background-color: #4b5563;
		border-color: #6b7280;
		color: #f9fafb;
	}

	:global(.dark) .search-input:focus {
		background-color: #374151;
		border-color: #3b82f6;
	}

	:global(.dark) .message-item:hover {
		background-color: #4b5563;
		border-color: #6b7280;
	}

	:global(.dark) .sender-name {
		color: #f9fafb;
	}

	:global(.dark) .message-content {
		color: #d1d5db;
	}

	:global(.dark) .selector-footer {
		border-top-color: #4b5563;
	}

	:global(.dark) .cancel-btn {
		background-color: #4b5563;
		border-color: #6b7280;
		color: #f9fafb;
	}

	:global(.dark) .cancel-btn:hover {
		background-color: #6b7280;
		border-color: #9ca3af;
	}
</style>
