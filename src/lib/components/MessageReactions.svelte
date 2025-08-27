<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Reaction } from '$lib/types/chat';

	const dispatch = createEventDispatcher<{
		addReaction: { messageId: string; emoji: string };
		removeReaction: { messageId: string; emoji: string };
	}>();

	export let messageId: string;
	export let reactions: Reaction[] = [];
	export let currentUserId: string = '1'; // Временно хардкодим для демо

	// Доступные реакции
	const availableReactions = ['👍', '👎', '❤️', '😄', '😮', '😢', '😡'];

	// Группируем реакции по эмодзи
	$: reactionGroups = availableReactions.map(emoji => ({
		emoji,
		count: reactions.filter(r => r.emoji === emoji).length,
		hasReacted: reactions.some(r => r.emoji === emoji && r.userId === currentUserId)
	}));

	// Показываем только реакции с количеством > 0
	$: visibleReactions = reactionGroups.filter(group => group.count > 0);

	function handleReactionClick(emoji: string) {
		const hasReacted = reactions.some(r => r.emoji === emoji && r.userId === currentUserId);
		
		if (hasReacted) {
			dispatch('removeReaction', { messageId, emoji });
		} else {
			dispatch('addReaction', { messageId, emoji });
		}
	}

	function handleReactionHover(emoji: string) {
		// Можно добавить tooltip с именами пользователей
	}
</script>

<div class="message-reactions">
	<!-- Существующие реакции -->
	{#if visibleReactions.length > 0}
		<div class="existing-reactions">
			{#each visibleReactions as group (group.emoji)}
				<button
					class="reaction-button {group.hasReacted ? 'reacted' : ''}"
					onclick={() => handleReactionClick(group.emoji)}
					onmouseenter={() => handleReactionHover(group.emoji)}
					title="{group.emoji} {group.count}"
				>
					<span class="emoji">{group.emoji}</span>
					{#if group.count > 1}
						<span class="count">{group.count}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Кнопка добавления новых реакций -->
	<div class="add-reaction">
		<button class="add-reaction-button" title="Добавить реакцию">
			<span class="emoji">😊</span>
		</button>
		
		<!-- Выпадающее меню с реакциями -->
		<div class="reactions-menu">
			{#each availableReactions as emoji (emoji)}
				<button
					class="reaction-option"
					onclick={() => handleReactionClick(emoji)}
					title="Добавить {emoji}"
				>
					{emoji}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.message-reactions {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-top: 4px;
	}

	.existing-reactions {
		display: flex;
		gap: 2px;
	}

	.reaction-button {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 2px 6px;
		border: 1px solid transparent;
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.05);
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 12px;
	}

	.reaction-button:hover {
		background: rgba(0, 0, 0, 0.1);
		transform: scale(1.05);
	}

	.reaction-button.reacted {
		background: rgba(59, 130, 246, 0.1);
		border-color: rgba(59, 130, 246, 0.3);
		color: rgb(59, 130, 246);
	}

	.emoji {
		font-size: 14px;
	}

	.count {
		font-size: 11px;
		font-weight: 500;
	}

	.add-reaction {
		position: relative;
	}

	.add-reaction-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: 1px solid transparent;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		opacity: 0.6;
	}

	.add-reaction-button:hover {
		background: rgba(0, 0, 0, 0.05);
		opacity: 1;
	}

	.reactions-menu {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 4px;
		padding: 8px;
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		opacity: 0;
		visibility: hidden;
		transition: all 0.2s ease;
		z-index: 1000;
	}

	.add-reaction:hover .reactions-menu {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) translateY(-4px);
	}

	.reaction-option {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 16px;
	}

	.reaction-option:hover {
		background: rgba(0, 0, 0, 0.05);
		transform: scale(1.2);
	}

	/* Темная тема */
	:global(.dark) .reaction-button {
		background: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .reaction-button:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	:global(.dark) .add-reaction-button:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .reactions-menu {
		background: rgb(31, 41, 55);
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .reaction-option:hover {
		background: rgba(255, 255, 255, 0.1);
	}
</style>
