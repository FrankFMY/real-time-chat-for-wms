import { WebSocketServer } from 'ws';
import type { RequestHandler } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { mockChats, mockMessages } from '$lib/mock-data';
import type { Message, User, ChatWebSocketEvent, ChatWebSocketMessage } from '$lib/types/chat';

// In-memory хранилище для WebSocket соединений
const connections = new Map<
	string,
	{
		ws: WebSocket;
		userId: string;
		user: User;
		chatIds: string[];
	}
>();

// In-memory хранилище для активных чатов
const activeChats = new Map<string, Set<string>>(); // chatId -> Set<userId>

// In-memory хранилище для статусов печатания
const typingUsers = new Map<string, Map<string, number>>(); // chatId -> Map<userId, timestamp>

// Создание WebSocket сервера
let wss: WebSocketServer;

// Инициализация WebSocket сервера
function initializeWebSocketServer() {
	if (wss) return wss;

	wss = new WebSocketServer({ noServer: true });

	wss.on('connection', async (ws, request) => {
		try {
			// Получаем пользователя из cookies (адаптируем для WebSocket)
			const user = await getCurrentUser(request as unknown as Request);
			if (!user) {
				ws.close(1008, 'Unauthorized');
				return;
			}

			// Преобразуем в полный объект User
			const fullUser: User = {
				...user,
				role: user.role as 'user' | 'admin' | 'moderator',
				status: 'online' as const,
				createdAt: new Date()
			};

			const connectionId = crypto.randomUUID();

			// Сохраняем соединение
			connections.set(connectionId, {
				ws: ws as unknown as WebSocket,
				userId: user.id,
				user: fullUser,
				chatIds: []
			});

			console.log(`WebSocket connected: ${user.name} (${user.id})`);

			// Отправляем приветственное сообщение
			sendToUser(connectionId, {
				type: 'connected',
				data: {
					user: fullUser,
					timestamp: Date.now()
				}
			});

			// Обработка сообщений от клиента
			ws.on('message', async (data) => {
				try {
					const message: ChatWebSocketMessage = JSON.parse(data.toString());
					await handleWebSocketMessage(connectionId, message);
				} catch (error) {
					console.error('Error handling WebSocket message:', error);
					sendToUser(connectionId, {
						type: 'error',
						data: {
							message: 'Invalid message format',
							timestamp: Date.now()
						}
					});
				}
			});

			// Обработка отключения
			ws.on('close', () => {
				handleDisconnect(connectionId);
			});

			ws.on('error', (error) => {
				console.error('WebSocket error:', error);
				handleDisconnect(connectionId);
			});
		} catch (error) {
			console.error('Error establishing WebSocket connection:', error);
			ws.close(1011, 'Internal server error');
		}
	});

	return wss;
}

// Обработка WebSocket сообщений
async function handleWebSocketMessage(connectionId: string, message: ChatWebSocketMessage) {
	const connection = connections.get(connectionId);
	if (!connection) return;

	const { type, data } = message;

	switch (type) {
		case 'join_chat':
			await handleJoinChat(connectionId, data.chatId as string);
			break;

		case 'leave_chat':
			await handleLeaveChat(connectionId, data.chatId as string);
			break;

		case 'send_message':
			await handleSendMessage(connectionId, data as { chatId: string; content: string });
			break;

		case 'typing_start':
			await handleTypingStart(connectionId, data.chatId as string);
			break;

		case 'typing_stop':
			await handleTypingStop(connectionId, data.chatId as string);
			break;

		case 'mark_read':
			await handleMarkRead(connectionId, data.chatId as string, data.messageId as string);
			break;

		case 'get_chat_history':
			await handleGetChatHistory(connectionId, data.chatId as string, data.limit as number);
			break;

		default:
			sendToUser(connectionId, {
				type: 'error',
				data: {
					message: `Unknown message type: ${type}`,
					timestamp: Date.now()
				}
			});
	}
}

// Присоединение к чату
async function handleJoinChat(connectionId: string, chatId: string) {
	const connection = connections.get(connectionId);
	if (!connection) return;

	const chat = mockChats.find((c) => c.id === chatId);
	if (!chat) {
		sendToUser(connectionId, {
			type: 'error',
			data: {
				message: 'Chat not found',
				timestamp: Date.now()
			}
		});
		return;
	}

	// Проверяем права доступа к чату
	if (!chat.participants.includes(connection.userId)) {
		sendToUser(connectionId, {
			type: 'error',
			data: {
				message: 'Access denied to this chat',
				timestamp: Date.now()
			}
		});
		return;
	}

	// Добавляем пользователя в активные участники чата
	if (!activeChats.has(chatId)) {
		activeChats.set(chatId, new Set());
	}
	activeChats.get(chatId)!.add(connection.userId);

	// Добавляем чат в список активных чатов пользователя
	if (!connection.chatIds.includes(chatId)) {
		connection.chatIds.push(chatId);
	}

	// Уведомляем других участников
	broadcastToChat(
		chatId,
		{
			type: 'user_joined',
			data: {
				chatId,
				user: connection.user,
				timestamp: Date.now()
			}
		},
		[connection.userId]
	);

	// Отправляем подтверждение
	sendToUser(connectionId, {
		type: 'chat_joined',
		data: {
			chatId,
			chat,
			timestamp: Date.now()
		}
	});
}

// Выход из чата
async function handleLeaveChat(connectionId: string, chatId: string) {
	const connection = connections.get(connectionId);
	if (!connection) return;

	// Удаляем пользователя из активных участников
	const chatParticipants = activeChats.get(chatId);
	if (chatParticipants) {
		chatParticipants.delete(connection.userId);
		if (chatParticipants.size === 0) {
			activeChats.delete(chatId);
		}
	}

	// Удаляем чат из списка активных чатов пользователя
	connection.chatIds = connection.chatIds.filter((id) => id !== chatId);

	// Уведомляем других участников
	broadcastToChat(
		chatId,
		{
			type: 'user_left',
			data: {
				chatId,
				user: connection.user,
				timestamp: Date.now()
			}
		},
		[connection.userId]
	);

	// Отправляем подтверждение
	sendToUser(connectionId, {
		type: 'chat_left',
		data: {
			chatId,
			timestamp: Date.now()
		}
	});
}

// Отправка сообщения
async function handleSendMessage(connectionId: string, data: { chatId: string; content: string }) {
	const connection = connections.get(connectionId);
	if (!connection) return;

	const { chatId, content } = data;

	// Проверяем, что пользователь в чате
	if (!connection.chatIds.includes(chatId)) {
		sendToUser(connectionId, {
			type: 'error',
			data: {
				message: 'You are not in this chat',
				timestamp: Date.now()
			}
		});
		return;
	}

	// Создаем новое сообщение
	const message: Message = {
		id: crypto.randomUUID(),
		chatId,
		senderId: connection.userId,
		content,
		timestamp: new Date(),
		type: 'text',
		status: 'sent',
		reactions: []
	};

	// Добавляем сообщение в моковые данные
	mockMessages.push(message);

	// Обновляем последнее сообщение в чате
	const chat = mockChats.find((c) => c.id === chatId);
	if (chat) {
		chat.lastMessage = message;
	}

	// Отправляем сообщение всем участникам чата
	broadcastToChat(chatId, {
		type: 'new_message',
		data: {
			message,
			timestamp: Date.now()
		}
	});

	// Отправляем подтверждение отправителю
	sendToUser(connectionId, {
		type: 'message_sent',
		data: {
			messageId: message.id,
			timestamp: Date.now()
		}
	});
}

// Начало печатания
async function handleTypingStart(connectionId: string, chatId: string) {
	const connection = connections.get(connectionId);
	if (!connection) return;

	if (!typingUsers.has(chatId)) {
		typingUsers.set(chatId, new Map());
	}

	typingUsers.get(chatId)!.set(connection.userId, Date.now());

	// Уведомляем других участников
	broadcastToChat(
		chatId,
		{
			type: 'typing_start',
			data: {
				chatId,
				userId: connection.userId,
				user: connection.user,
				timestamp: Date.now()
			}
		},
		[connection.userId]
	);
}

// Остановка печатания
async function handleTypingStop(connectionId: string, chatId: string) {
	const connection = connections.get(connectionId);
	if (!connection) return;

	typingUsers.get(chatId)?.delete(connection.userId);

	// Уведомляем других участников
	broadcastToChat(
		chatId,
		{
			type: 'typing_stop',
			data: {
				chatId,
				userId: connection.userId,
				timestamp: Date.now()
			}
		},
		[connection.userId]
	);
}

// Отметка сообщения как прочитанного
async function handleMarkRead(connectionId: string, chatId: string, messageId: string) {
	const connection = connections.get(connectionId);
	if (!connection) return;

	// Находим сообщение и обновляем статус
	const message = mockMessages.find((m: Message) => m.id === messageId && m.chatId === chatId);
	if (message) {
		message.status = 'read';
	}

	// Уведомляем отправителя
	broadcastToChat(chatId, {
		type: 'message_read',
		data: {
			messageId,
			readBy: connection.userId,
			timestamp: Date.now()
		}
	});
}

// Получение истории чата
async function handleGetChatHistory(connectionId: string, chatId: string, limit: number = 50) {
	const connection = connections.get(connectionId);
	if (!connection) return;

	// Получаем сообщения чата
	const chatMessages = mockMessages.filter((m: Message) => m.chatId === chatId);
	const sortedMessages = chatMessages
		.sort(
			(a: Message, b: Message) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		)
		.slice(0, limit)
		.reverse();

	// Отправляем историю
	sendToUser(connectionId, {
		type: 'chat_history',
		data: {
			chatId,
			messages: sortedMessages,
			timestamp: Date.now()
		}
	});
}

// Обработка отключения пользователя
function handleDisconnect(connectionId: string) {
	const connection = connections.get(connectionId);
	if (!connection) return;

	console.log(`WebSocket disconnected: ${connection.user.name} (${connection.userId})`);

	// Удаляем пользователя из всех активных чатов
	connection.chatIds.forEach((chatId) => {
		const chatParticipants = activeChats.get(chatId);
		if (chatParticipants) {
			chatParticipants.delete(connection.userId);
			if (chatParticipants.size === 0) {
				activeChats.delete(chatId);
			}
		}

		// Уведомляем других участников
		broadcastToChat(chatId, {
			type: 'user_offline',
			data: {
				chatId,
				userId: connection.userId,
				timestamp: Date.now()
			}
		});
	});

	// Удаляем соединение
	connections.delete(connectionId);
}

// Отправка сообщения конкретному пользователю
function sendToUser(connectionId: string, event: ChatWebSocketEvent) {
	const connection = connections.get(connectionId);
	if (!connection) return;

	try {
		connection.ws.send(JSON.stringify(event));
	} catch (error) {
		console.error('Error sending message to user:', error);
		handleDisconnect(connectionId);
	}
}

// Отправка сообщения всем участникам чата
function broadcastToChat(chatId: string, event: ChatWebSocketEvent, excludeUserIds: string[] = []) {
	const chatParticipants = activeChats.get(chatId);
	if (!chatParticipants) return;

	connections.forEach((connection, connectionId) => {
		if (chatParticipants.has(connection.userId) && !excludeUserIds.includes(connection.userId)) {
			sendToUser(connectionId, event);
		}
	});
}

// Отправка сообщения всем подключенным пользователям
function broadcastToAll(event: ChatWebSocketEvent, excludeUserIds: string[] = []) {
	connections.forEach((connection, connectionId) => {
		if (!excludeUserIds.includes(connection.userId)) {
			sendToUser(connectionId, event);
		}
	});
}

// Очистка устаревших статусов печатания
setInterval(() => {
	const now = Date.now();
	typingUsers.forEach((users, chatId) => {
		users.forEach((timestamp, userId) => {
			if (now - timestamp > 5000) {
				// 5 секунд
				users.delete(userId);
			}
		});
		if (users.size === 0) {
			typingUsers.delete(chatId);
		}
	});
}, 5000);

// Экспорт функций для использования в других модулях
export {
	initializeWebSocketServer,
	connections,
	activeChats,
	typingUsers,
	sendToUser,
	broadcastToChat,
	broadcastToAll
};

// SvelteKit WebSocket handler
export const GET: RequestHandler = async () => {
	initializeWebSocketServer();

	// В реальном приложении здесь была бы интеграция с SvelteKit server
	// Для демо возвращаем информацию о WebSocket сервере
	return new Response(
		JSON.stringify({
			status: 'WebSocket server is running',
			connections: connections.size,
			activeChats: activeChats.size
		}),
		{
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
};
