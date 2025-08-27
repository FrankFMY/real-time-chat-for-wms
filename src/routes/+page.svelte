<script lang="ts">
	import { get } from 'svelte/store';
	import { browser } from '$app/environment';
	import { formatDistanceToNow } from 'date-fns';
	import { ru } from 'date-fns/locale';
	import {
		Search,
		Send,
		Paperclip,
		Smile,
		Phone,
		Video,
		Info,
		ChevronLeft,
		Menu
	} from 'lucide-svelte';

	// WebSocket stores
	import {
		chats,
		activeChatId,
		activeChat,
		activeChatMessages,
		activeChatTyping,
		chatActions,
		initializeWebSocket,
		cleanupWebSocket,
		messages
	} from '$lib/stores/websocket';

	// API сервисы
	import { loadChats, loadMessages, sendMessage as apiSendMessage } from '$lib/services/chatApi';

	// Моковые данные для демо (в реальном приложении будут из аутентификации)
	import { mockUsers, mockChats, mockMessages } from '$lib/mock-data';

	// Текущий пользователь (в реальном приложении будет из аутентификации)
	const currentUser = mockUsers[0];

	// Состояние
	let messageText = $state('');
	let showSidebar = $state(true);
	let typingTimeout: NodeJS.Timeout | null = null;
	let initialized = $state(false);

	// Загрузка данных
	async function loadInitialData() {
		if (!browser) return;
		
		try {
			// Загружаем чаты
			const chatsData = await loadChats();
			chats.set(chatsData);

			// Если есть чаты, выбираем первый
									if (chatsData.length > 0 && !get(activeChatId)) {
							activeChatId.set(chatsData[0]?.id || '');
						}
		} catch (error) {
			console.error('Error loading initial data:', error);
			// Fallback на моковые данные
			console.log('Using mock data as fallback');
			chats.set(mockChats);
			
			// Если есть чаты, выбираем первый
									if (mockChats.length > 0 && !get(activeChatId)) {
							activeChatId.set(mockChats[0]?.id || '');
						}
		}
	}

	// Загрузка сообщений для активного чата
	async function loadChatMessages(chatId: string) {
		if (!browser) return;
		
		try {
			const { messages: chatMessages } = await loadMessages(chatId);
			
			// Обновляем сообщения в store
			messages.update(current => ({
				...current,
				[chatId]: chatMessages
			}));
		} catch (error) {
			console.error('Error loading chat messages:', error);
			// Fallback на моковые данные
			console.log('Using mock messages as fallback');
			const chatMessages = mockMessages.filter(msg => msg.chatId === chatId);
			
			messages.update(current => ({
				...current,
				[chatId]: chatMessages
			}));
		}
	}

	// Отправка сообщения
	async function sendMessage() {
		if (!browser || !messageText.trim() || !currentUser || !get(activeChatId)) return;

		const chatId = get(activeChatId)!;
		const content = messageText.trim();

		try {
			// Отправляем через WebSocket для real-time
			chatActions.sendMessage(chatId, content);
			
			// Также отправляем через API для надежности
			await apiSendMessage(chatId, content);
			
			messageText = '';
		} catch (error) {
			console.error('Error sending message:', error);
		}
	}

	// Обработка печатания
	function handleTyping() {
		if (!browser || !get(activeChatId)) return;

		const chatId = get(activeChatId)!;
		
		// Начинаем печатание
		chatActions.startTyping(chatId);

		// Очищаем предыдущий таймаут
		if (typingTimeout) {
			clearTimeout(typingTimeout);
		}

		// Устанавливаем таймаут для остановки печатания
		typingTimeout = setTimeout(() => {
			chatActions.stopTyping(chatId);
		}, 2000);
	}

	// Переключение чата
	async function selectChat(chatId: string) {
		if (!browser) return;
		
		console.log('Selecting chat:', chatId);
		activeChatId.set(chatId);
		
		// Присоединяемся к чату через WebSocket
		chatActions.joinChat(chatId);
		
		// Загружаем сообщения, если их нет
		const currentMessages = get(messages);
		if (!currentMessages[chatId] || currentMessages[chatId].length === 0) {
			console.log('Loading messages for chat:', chatId);
			await loadChatMessages(chatId);
		} else {
			console.log('Messages already loaded for chat:', chatId);
		}
	}

	// Утилиты
	function formatTime(date: Date) {
		return formatDistanceToNow(date, { addSuffix: true, locale: ru });
	}

	function getUserById(userId: string) {
		return mockUsers.find((user) => user.id === userId);
	}

	function toggleSidebar() {
		showSidebar = !showSidebar;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		} else {
			handleTyping();
		}
	}

	// Инициализация только на клиенте
	if (browser) {
		console.log('Browser detected, starting initialization...');
		
		// Сразу загружаем моковые данные для демонстрации
		console.log('Loading mock data...');
		chats.set(mockChats);
		
		// Если есть чаты, выбираем первый
						if (mockChats.length > 0) {
					console.log('Setting first chat as active:', mockChats[0]?.name);
					activeChatId.set(mockChats[0]?.id || '');
				}
		
		// Используем setTimeout для асинхронной инициализации
		setTimeout(() => {
			if (!initialized) {
				console.log('Starting WebSocket initialization...');
				initialized = true;
				
				// Инициализируем WebSocket соединение
				initializeWebSocket().then(() => {
					console.log('WebSocket initialized successfully');
					// Загружаем начальные данные
					loadInitialData();
				}).catch((error) => {
					console.error('Error initializing chat:', error);
				});
			}
		}, 100);
	}

	// Очистка при размонтировании (только на клиенте)
	if (browser) {
		// Используем beforeunload для очистки
		window.addEventListener('beforeunload', () => {
			if (typingTimeout) {
				clearTimeout(typingTimeout);
			}
			cleanupWebSocket();
		});
	}
</script>

<div class="chat-container">
	<!-- Индикатор подключения отключен для демо -->

	<!-- Боковая панель -->
	{#if showSidebar}
		<aside class="chat-sidebar">
			<!-- Заголовок -->
			<header
				class="flex h-16 items-center border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800"
			>
				{#if currentUser}
					<div class="flex items-center gap-3">
						<img src={currentUser.avatar} alt={currentUser.name} class="user-avatar" />
						<div>
							<h2 class="font-semibold text-gray-900 dark:text-gray-100">{currentUser.name}</h2>
							{#if browser}
								<div class="flex items-center gap-1">
									<div class="status-indicator online"></div>
									<p class="text-sm text-gray-500 dark:text-gray-400">
										онлайн
									</p>
								</div>
							{:else}
								<p class="text-sm text-gray-500 dark:text-gray-400">онлайн</p>
							{/if}
						</div>
					</div>
				{/if}
				<button class="btn-ghost ml-auto" onclick={toggleSidebar}>
					<ChevronLeft class="h-5 w-5" />
				</button>
			</header>

			<!-- Поиск -->
			<div class="p-4">
				<div class="relative">
					<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
					<input type="text" placeholder="Поиск чатов..." class="input pl-10" />
				</div>
			</div>

			<!-- Список чатов -->
			<div class="flex-1 overflow-y-auto">
				{#each $chats as chat (chat.id)}
					{@const lastMessage = chat.lastMessage}
					{@const otherUser =
						chat.type === 'direct' && currentUser
							? mockUsers.find((u) => u.id !== currentUser.id && chat.participants.includes(u.id))
							: null}

					<button
						class="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 {$activeChatId ===
						chat.id
							? 'bg-blue-50 dark:bg-blue-900/20'
							: ''}"
						onclick={() => selectChat(chat.id)}
					>
						<div class="relative">
							<img src={chat.avatar || otherUser?.avatar} alt={chat.name} class="user-avatar" />
							{#if otherUser}
								<div
									class="status-indicator {otherUser.status} absolute -right-0.5 -bottom-0.5"
								></div>
							{/if}
						</div>

						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between">
								<h3 class="truncate font-medium text-gray-900 dark:text-gray-100">
									{chat.name}
								</h3>
								{#if lastMessage}
									<span class="text-xs text-gray-500 dark:text-gray-400">
										{formatTime(lastMessage.timestamp)}
									</span>
								{/if}
							</div>

							{#if lastMessage}
								<p class="truncate text-sm text-gray-500 dark:text-gray-400">
									{lastMessage.content}
								</p>
							{/if}
						</div>

						{#if chat.unreadCount > 0}
							<div class="badge badge-primary">
								{chat.unreadCount}
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</aside>
	{/if}

	<!-- Основная область чата -->
	<main class="chat-main">
		{#if $activeChat}
			<!-- Заголовок чата -->
			<header class="chat-header">
				{#if !showSidebar}
					<button class="btn-ghost mr-2" onclick={toggleSidebar}>
						<Menu class="h-5 w-5" />
					</button>
				{/if}

				<div class="flex items-center gap-3">
					<img src={$activeChat.avatar} alt={$activeChat.name} class="user-avatar" />
					<div>
						<h1 class="font-semibold text-gray-900 dark:text-gray-100">{$activeChat.name}</h1>
						{#if $activeChat.type === 'direct' && currentUser}
							{@const otherUser = mockUsers.find(
								(u) => u.id !== currentUser.id && $activeChat.participants.includes(u.id)
							)}
							{#if otherUser}
								<p class="text-sm text-gray-500 dark:text-gray-400">{otherUser.status}</p>
							{/if}
						{:else}
							<p class="text-sm text-gray-500 dark:text-gray-400">
								{$activeChat.participants.length} участников
							</p>
						{/if}
					</div>
				</div>

				<div class="ml-auto flex items-center gap-2">
					<button class="btn-ghost">
						<Phone class="h-5 w-5" />
					</button>
					<button class="btn-ghost">
						<Video class="h-5 w-5" />
					</button>
					<button class="btn-ghost">
						<Info class="h-5 w-5" />
					</button>
				</div>
			</header>

			<!-- Сообщения -->
			<div class="chat-messages">
				{#each $activeChatMessages as message (message.id)}
					{@const sender = getUserById(message.senderId)}
					{@const isOwn = currentUser && message.senderId === currentUser.id}

					<div class="flex gap-3 {isOwn ? 'justify-end' : 'justify-start'}">
						{#if !isOwn}
							<img src={sender?.avatar} alt={sender?.name} class="user-avatar mt-2" />
						{/if}

						<div class="flex flex-col {isOwn ? 'items-end' : 'items-start'}">
							{#if !isOwn}
								<span class="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
									{sender?.name}
								</span>
							{/if}

							<div class="message-bubble {isOwn ? 'sent' : 'received'}">
								{message.content}
							</div>

							<div class="mt-1 flex items-center gap-2">
								<span class="text-xs text-gray-500 dark:text-gray-400">
									{formatTime(message.timestamp)}
								</span>
								{#if isOwn}
									<span class="text-xs text-gray-500 dark:text-gray-400">
										{message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
									</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}

				<!-- Индикатор печатания -->
				{#if browser && $activeChatTyping.length > 0}
					<div class="flex gap-3 justify-start">
						<div class="flex flex-col items-start">
							<div class="message-bubble typing">
								<div class="flex items-center gap-1">
									<span class="text-sm text-gray-500">печатает</span>
									<div class="flex gap-1">
										<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
										<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
										<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Поле ввода -->
			<div class="chat-input">
				<div class="flex items-end gap-2">
					<button class="btn-ghost">
						<Paperclip class="h-5 w-5" />
					</button>
					<button class="btn-ghost">
						<Smile class="h-5 w-5" />
					</button>

					<div class="flex-1">
						<textarea
							bind:value={messageText}
							placeholder="Введите сообщение..."
							class="input resize-none"
							rows="1"
							onkeydown={handleKeydown}
						></textarea>
					</div>

											<button class="btn btn-primary" onclick={sendMessage} disabled={!messageText.trim()}>
						<Send class="h-4 w-4" />
					</button>
				</div>
			</div>
		{:else}
			<!-- Пустое состояние -->
			<div class="flex flex-1 items-center justify-center">
				<div class="text-center">
					<h2 class="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-200">Выберите чат</h2>
					<p class="text-lg text-gray-600 dark:text-gray-300">Начните общение, выбрав чат из списка</p>
				</div>
			</div>
		{/if}
	</main>
</div>
