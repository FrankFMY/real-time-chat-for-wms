<script lang="ts">
	import { Reply, X } from 'lucide-svelte';
	import type { ReplyMessage } from '$lib/types/chat';

	const { replyMessage, onRemove } = $props<{
		replyMessage: ReplyMessage;
		onRemove?: () => void;
	}>();

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

	function truncateContent(content: string, maxLength: number = 100): string {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}
</script>

<div class="message-reply">
	<div class="reply-header">
		<Reply class="h-3 w-3" />
		<span class="reply-label">Ответ на сообщение</span>
		{#if onRemove}
			<button class="remove-reply" onclick={onRemove} title="Убрать ответ">
				<X class="h-3 w-3" />
			</button>
		{/if}
	</div>
	
	<div class="reply-content">
		<div class="reply-sender">
			{replyMessage.senderName}
		</div>
		<div class="reply-text">
			{truncateContent(replyMessage.content)}
		</div>
		{#if replyMessage.attachments && replyMessage.attachments.length > 0}
			<div class="reply-attachments">
				📎 {replyMessage.attachments.length} вложение(й)
			</div>
		{/if}
		<div class="reply-time">
			{formatTime(replyMessage.timestamp)}
		</div>
	</div>
</div>

<style>
	.message-reply {
		border-left: 3px solid #3b82f6;
		background-color: rgba(59, 130, 246, 0.05);
		border-radius: 0.375rem;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		position: relative;
	}

	.reply-header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 0.25rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.reply-label {
		font-weight: 500;
		color: #3b82f6;
	}

	.remove-reply {
		margin-left: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border: none;
		background: none;
		color: #6b7280;
		cursor: pointer;
		border-radius: 0.25rem;
		transition: all 0.2s ease;
	}

	.remove-reply:hover {
		background-color: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	.reply-content {
		font-size: 0.875rem;
	}

	.reply-sender {
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.125rem;
	}

	.reply-text {
		color: #6b7280;
		line-height: 1.4;
		margin-bottom: 0.25rem;
	}

	.reply-attachments {
		font-size: 0.75rem;
		color: #6b7280;
		margin-bottom: 0.125rem;
	}

	.reply-time {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	/* Темная тема */
	:global(.dark) .message-reply {
		background-color: rgba(59, 130, 246, 0.1);
	}

	:global(.dark) .reply-sender {
		color: #f9fafb;
	}

	:global(.dark) .reply-text {
		color: #d1d5db;
	}

	:global(.dark) .reply-attachments {
		color: #d1d5db;
	}

	:global(.dark) .reply-time {
		color: #9ca3af;
	}

	:global(.dark) .remove-reply:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: #f9fafb;
	}
</style>
