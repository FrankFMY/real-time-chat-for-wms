<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, Send, Search } from 'lucide-svelte';
	import type { Chat, Message } from '$lib/types/chat';

	const dispatch = createEventDispatcher<{
		forward: { chatId: string; message: Message };
		cancel: void;
	}>();

	// Props interface removed as it's not used

	let { message, chats, isOpen } = $props();

	let searchQuery = $state('');
	let selectedChatId = $state<string | null>(null);

	// Фильтруем чаты по поисковому запросу
	let filteredChats = $derived(
		searchQuery.trim()
			? chats.filter((chat: Chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: chats
	);

	// Выбираем чат для пересылки
	function selectChat(chatId: string) {
		selectedChatId = chatId;
	}

	// Пересылаем сообщение
	function forwardMessage() {
		if (!selectedChatId) return;

		dispatch('forward', { chatId: selectedChatId, message });
		closeModal();
	}

	// Закрываем модальное окно
	function closeModal() {
		dispatch('cancel');
		searchQuery = '';
		selectedChatId = null;
	}

	// Обработчик клавиш
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	// Обработчик клавиатуры для оверлея
	function handleOverlayKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
	<div
		class="forward-modal-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="forward-modal-title"
		tabindex="-1"
		onclick={closeModal}
		onkeydown={handleOverlayKeydown}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="forward-modal" role="document" onclick={(e) => e.stopPropagation()}>
			<!-- Заголовок -->
			<header class="forward-header">
				<h3 id="forward-modal-title">Переслать сообщение</h3>
				<button
					class="close-btn"
					onclick={closeModal}
					title="Закрыть"
					aria-label="Закрыть модальное окно"
				>
					<X class="h-5 w-5" />
				</button>
			</header>

			<!-- Предварительный просмотр сообщения -->
			<section class="message-preview">
				<div class="preview-header">
					<span class="preview-label">Сообщение для пересылки:</span>
				</div>
				<div class="preview-content">
					{message.content}
				</div>
			</section>

			<!-- Поиск чатов -->
			<section class="search-section">
				<div class="search-input-wrapper">
					<Search
						class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
						aria-hidden="true"
					/>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Поиск чатов..."
						class="search-input"
						aria-label="Поиск чатов"
					/>
				</div>
			</section>

			<!-- Список чатов -->
			<div class="chats-list" role="listbox" aria-label="Список чатов">
				{#if filteredChats.length === 0}
					<div class="no-results">
						{#if searchQuery}
							<p>Чаты не найдены</p>
						{:else}
							<p>Нет доступных чатов</p>
						{/if}
					</div>
				{:else}
					{#each filteredChats as chat (chat.id)}
						<button
							class="chat-item {selectedChatId === chat.id ? 'selected' : ''}"
							onclick={() => selectChat(chat.id)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									selectChat(chat.id);
								}
							}}
							role="option"
							aria-selected={selectedChatId === chat.id}
							aria-label="Выбрать чат {chat.name}"
						>
							<div class="chat-avatar">
								<img src={chat.avatar || '/default-avatar.png'} alt={chat.name} />
							</div>
							<div class="chat-info">
								<div class="chat-name">{chat.name}</div>
								<div class="chat-type">
									{chat.type === 'direct'
										? 'Личный чат'
										: chat.type === 'group'
											? 'Группа'
											: 'Канал'}
								</div>
							</div>
							{#if selectedChatId === chat.id}
								<div class="selected-indicator" aria-hidden="true">
									<div class="checkmark"></div>
								</div>
							{/if}
						</button>
					{/each}
				{/if}
			</div>

			<!-- Действия -->
			<footer class="forward-actions">
				<button class="btn btn-secondary" onclick={closeModal}> Отмена </button>
				<button
					class="btn btn-primary"
					onclick={forwardMessage}
					disabled={!selectedChatId}
					aria-label="Переслать сообщение"
				>
					<Send class="h-4 w-4" aria-hidden="true" />
					Переслать
				</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.forward-modal-overlay {
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

	.forward-modal {
		background: white;
		border-radius: 0.75rem;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	.forward-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 1.5rem 1rem 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.forward-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		border-radius: 0.375rem;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background-color: #f3f4f6;
		color: #374151;
	}

	.close-btn:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.message-preview {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.preview-header {
		margin-bottom: 0.5rem;
	}

	.preview-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.preview-content {
		padding: 0.75rem;
		background-color: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: #374151;
		line-height: 1.5;
		word-wrap: break-word;
	}

	.search-section {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.search-input-wrapper {
		position: relative;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem 0.5rem 2.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background-color: white;
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.chats-list {
		flex: 1;
		overflow-y: auto;
		max-height: 300px;
		padding: 0.5rem 0;
	}

	.chat-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1.5rem;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.chat-item:hover {
		background-color: #f9fafb;
	}

	.chat-item:focus {
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
	}

	.chat-item.selected {
		background-color: #eff6ff;
	}

	.chat-avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
	}

	.chat-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.chat-info {
		flex: 1;
		min-width: 0;
	}

	.chat-name {
		font-weight: 500;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.chat-type {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.selected-indicator {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background-color: #3b82f6;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.checkmark {
		width: 0.5rem;
		height: 0.5rem;
		border: 2px solid white;
		border-top: none;
		border-left: none;
		transform: rotate(45deg);
	}

	.no-results {
		padding: 2rem 1.5rem;
		text-align: center;
		color: #6b7280;
	}

	.forward-actions {
		display: flex;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid #e5e7eb;
		justify-content: flex-end;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.btn-secondary {
		background-color: #f3f4f6;
		color: #374151;
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: #e5e7eb;
	}

	.btn-primary {
		background-color: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	/* Темная тема */
	:global(.dark) .forward-modal {
		background-color: #1f2937;
		color: #f9fafb;
	}

	:global(.dark) .forward-header {
		border-bottom-color: #374151;
	}

	:global(.dark) .forward-header h3 {
		color: #f9fafb;
	}

	:global(.dark) .close-btn {
		color: #9ca3af;
	}

	:global(.dark) .close-btn:hover {
		background-color: #374151;
		color: #d1d5db;
	}

	:global(.dark) .message-preview {
		border-bottom-color: #374151;
	}

	:global(.dark) .preview-label {
		color: #d1d5db;
	}

	:global(.dark) .preview-content {
		background-color: #374151;
		border-color: #4b5563;
		color: #d1d5db;
	}

	:global(.dark) .search-section {
		border-bottom-color: #374151;
	}

	:global(.dark) .search-input {
		background-color: #374151;
		border-color: #4b5563;
		color: #f9fafb;
	}

	:global(.dark) .search-input:focus {
		border-color: #3b82f6;
	}

	:global(.dark) .chat-item:hover {
		background-color: #374151;
	}

	:global(.dark) .chat-item.selected {
		background-color: #1e3a8a;
	}

	:global(.dark) .chat-name {
		color: #f9fafb;
	}

	:global(.dark) .chat-type {
		color: #9ca3af;
	}

	:global(.dark) .no-results {
		color: #9ca3af;
	}

	:global(.dark) .forward-actions {
		border-top-color: #374151;
	}

	:global(.dark) .btn-secondary {
		background-color: #374151;
		color: #d1d5db;
	}

	:global(.dark) .btn-secondary:hover:not(:disabled) {
		background-color: #4b5563;
	}
</style>
