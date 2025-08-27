import { writable, derived, get } from 'svelte/store';
import {
	connectWebSocket,
	disconnectWebSocket,
	chatWebSocket,
	chatEvents
} from '$lib/utils/websocket';
import type { ChatWebSocketEvent, Message, Chat } from '$lib/types/chat';

// Состояние WebSocket соединения
export const wsConnection = writable<{
	isConnected: boolean;
	isConnecting: boolean;
	error: string | null;
}>({
	isConnected: false,
	isConnecting: false,
	error: null
});

// Состояние чатов
export const chats = writable<Chat[]>([]);
export const messages = writable<Record<string, Message[]>>({});

// Состояние печатания
export const typingUsers = writable<Record<string, string[]>>({});

// Текущий активный чат
export const activeChatId = writable<string | null>(null);

// Статусы пользователей
export const userStatuses = writable<Record<string, 'online' | 'offline' | 'away' | 'busy'>>({});

// Инициализация WebSocket соединения
export async function initializeWebSocket() {
	wsConnection.update((state) => ({ ...state, isConnecting: true, error: null }));

	try {
		const connection = await connectWebSocket();

		wsConnection.update((state) => ({
			...state,
			isConnected: true,
			isConnecting: false
		}));

		// Подписываемся на события
		setupEventListeners();

		return connection;
	} catch (error) {
		wsConnection.update((state) => ({
			...state,
			isConnected: false,
			isConnecting: false,
			error: error instanceof Error ? error.message : 'Ошибка подключения'
		}));
		throw error;
	}
}

// Настройка слушателей событий
function setupEventListeners() {
	// Новые сообщения
	chatEvents.onNewMessage((event: ChatWebSocketEvent) => {
		const message = event.data.message as Message;
		const chatId = message.chatId;

		messages.update((current) => {
			const chatMessages = current[chatId] || [];
			// Проверяем, нет ли уже такого сообщения
			if (!chatMessages.find((m) => m.id === message.id)) {
				return {
					...current,
					[chatId]: [...chatMessages, message]
				};
			}
			return current;
		});

		// Обновляем последнее сообщение в чате
		chats.update((current) =>
			current.map((chat) => (chat.id === chatId ? { ...chat, lastMessage: message } : chat))
		);
	});

	// Статусы печатания
	chatEvents.onTypingStart((event: ChatWebSocketEvent) => {
		const { chatId, userId } = event.data as { chatId: string; userId: string };

		typingUsers.update((current) => {
			const chatTyping = current[chatId] || [];
			if (!chatTyping.includes(userId)) {
				return {
					...current,
					[chatId]: [...chatTyping, userId]
				};
			}
			return current;
		});
	});

	chatEvents.onTypingStop((event: ChatWebSocketEvent) => {
		const { chatId, userId } = event.data as { chatId: string; userId: string };

		typingUsers.update((current) => {
			const chatTyping = current[chatId] || [];
			return {
				...current,
				[chatId]: chatTyping.filter((id) => id !== userId)
			};
		});
	});

	// Статусы пользователей
	chatEvents.onUserJoined((event: ChatWebSocketEvent) => {
		const { userId, status } = event.data as { userId: string; status: string };
		userStatuses.update((current) => ({
			...current,
			[userId]: status as 'online' | 'offline' | 'away' | 'busy'
		}));
	});

	chatEvents.onUserLeft((event: ChatWebSocketEvent) => {
		const { userId } = event.data as { userId: string };
		userStatuses.update((current) => ({
			...current,
			[userId]: 'offline'
		}));
	});

	// История чата
	chatEvents.onChatHistory((event: ChatWebSocketEvent) => {
		const { chatId, messages: chatMessages } = event.data as {
			chatId: string;
			messages: Message[];
		};

		messages.update((current) => ({
			...current,
			[chatId]: chatMessages
		}));
	});

	// Ошибки
	chatEvents.onError((event: ChatWebSocketEvent) => {
		const error = event.data.error as string;
		wsConnection.update((state) => ({ ...state, error }));
	});
}

// Функции для работы с чатами
export const chatActions = {
	// Присоединиться к чату
	joinChat: (chatId: string) => {
		chatWebSocket.joinChat(chatId);
		activeChatId.set(chatId);
	},

	// Выйти из чата
	leaveChat: (chatId: string) => {
		chatWebSocket.leaveChat(chatId);
		if (get(activeChatId) === chatId) {
			activeChatId.set(null);
		}
	},

	// Отправить сообщение
	sendMessage: (chatId: string, content: string) => {
		const success = chatWebSocket.sendMessage(chatId, content);
		if (success) {
			// Добавляем сообщение локально для мгновенного отображения
			const tempMessage: Message = {
				id: `temp-${Date.now()}`,
				content,
				senderId: 'current-user', // Будет заменено на реальный ID
				chatId,
				timestamp: new Date(),
				type: 'text',
				status: 'sending',
				reactions: []
			};

			messages.update((current) => {
				const chatMessages = current[chatId] || [];
				return {
					...current,
					[chatId]: [...chatMessages, tempMessage]
				};
			});
		}
		return success;
	},

	// Начать печатание
	startTyping: (chatId: string) => {
		chatWebSocket.startTyping(chatId);
	},

	// Остановить печатание
	stopTyping: (chatId: string) => {
		chatWebSocket.stopTyping(chatId);
	},

	// Получить историю чата
	getChatHistory: (chatId: string, limit: number = 50) => {
		chatWebSocket.getChatHistory(chatId, limit);
	}
};

// Отключение WebSocket
export function cleanupWebSocket() {
	disconnectWebSocket();
	wsConnection.update((state) => ({
		...state,
		isConnected: false,
		isConnecting: false
	}));
}

// Производные stores
export const isConnected = derived(wsConnection, ($ws) => $ws.isConnected);
export const isConnecting = derived(wsConnection, ($ws) => $ws.isConnecting);
export const connectionError = derived(wsConnection, ($ws) => $ws.error);

export const activeChat = derived([chats, activeChatId], ([$chats, $activeChatId]) =>
	$activeChatId ? $chats.find((chat) => chat.id === $activeChatId) : null
);

export const activeChatMessages = derived([messages, activeChatId], ([$messages, $activeChatId]) =>
	$activeChatId ? $messages[$activeChatId] || [] : []
);

export const activeChatTyping = derived(
	[typingUsers, activeChatId],
	([$typingUsers, $activeChatId]) => ($activeChatId ? $typingUsers[$activeChatId] || [] : [])
);
