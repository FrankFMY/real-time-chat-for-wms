import type { ChatWebSocketEvent, ChatWebSocketMessage } from '$lib/types/chat';

// Интерфейс для WebSocket соединения
export interface WebSocketConnection {
	ws: WebSocket;
	isConnected: boolean;
	reconnectAttempts: number;
	eventHandlers: Map<string, ((event: ChatWebSocketEvent) => void)[]>;
}

// Конфигурация WebSocket
const WS_CONFIG = {
	url: 'ws://localhost:5173/api/ws',
	maxReconnectAttempts: 5,
	reconnectDelay: 1000,
	heartbeatInterval: 30000, // 30 секунд
	heartbeatTimeout: 5000 // 5 секунд
};

// Глобальное WebSocket соединение
let wsConnection: WebSocketConnection | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

// Создание WebSocket соединения
export function createWebSocketConnection(): Promise<WebSocketConnection> {
	return new Promise((resolve, reject) => {
		try {
			const ws = new WebSocket(WS_CONFIG.url);

			const connection: WebSocketConnection = {
				ws,
				isConnected: false,
				reconnectAttempts: 0,
				eventHandlers: new Map()
			};

			ws.onopen = () => {
				console.log('WebSocket connected');
				connection.isConnected = true;
				connection.reconnectAttempts = 0;
				startHeartbeat(connection);
				resolve(connection);
			};

			ws.onmessage = (event) => {
				try {
					const wsEvent: ChatWebSocketEvent = JSON.parse(event.data);
					handleWebSocketEvent(connection, wsEvent);
				} catch (error) {
					console.error('Error parsing WebSocket message:', error);
				}
			};

			ws.onclose = (event) => {
				console.log('WebSocket disconnected:', event.code, event.reason);
				connection.isConnected = false;
				stopHeartbeat();

				// Попытка переподключения
				if (connection.reconnectAttempts < WS_CONFIG.maxReconnectAttempts) {
					scheduleReconnect(connection);
				} else {
					console.error('Max reconnection attempts reached');
				}
			};

			ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				reject(error);
			};

			wsConnection = connection;
		} catch (error) {
			console.error('Error creating WebSocket connection:', error);
			reject(error);
		}
	});
}

// Получение текущего WebSocket соединения
export function getWebSocketConnection(): WebSocketConnection | null {
	return wsConnection;
}

// Подключение к WebSocket
export async function connectWebSocket(): Promise<WebSocketConnection> {
	if (wsConnection && wsConnection.isConnected) {
		return wsConnection;
	}

	return createWebSocketConnection();
}

// Отключение от WebSocket
export function disconnectWebSocket(): void {
	if (wsConnection) {
		wsConnection.ws.close();
		wsConnection = null;
	}

	stopHeartbeat();
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
}

// Отправка сообщения через WebSocket
export function sendWebSocketMessage(message: ChatWebSocketMessage): boolean {
	if (!wsConnection || !wsConnection.isConnected) {
		console.error('WebSocket not connected');
		return false;
	}

	try {
		wsConnection.ws.send(JSON.stringify(message));
		return true;
	} catch (error) {
		console.error('Error sending WebSocket message:', error);
		return false;
	}
}

// Подписка на WebSocket события
export function subscribeToWebSocketEvent(
	eventType: string,
	handler: (event: ChatWebSocketEvent) => void
): () => void {
	if (!wsConnection) {
		console.error('WebSocket not connected');
		return () => {};
	}

	if (!wsConnection.eventHandlers.has(eventType)) {
		wsConnection.eventHandlers.set(eventType, []);
	}

	wsConnection.eventHandlers.get(eventType)!.push(handler);

	// Возвращаем функцию для отписки
	return () => {
		if (wsConnection && wsConnection.eventHandlers.has(eventType)) {
			const handlers = wsConnection.eventHandlers.get(eventType)!;
			const index = handlers.indexOf(handler);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
	};
}

// Обработка WebSocket событий
function handleWebSocketEvent(connection: WebSocketConnection, event: ChatWebSocketEvent): void {
	const { type } = event;

	// Вызываем обработчики для данного типа события
	if (connection.eventHandlers.has(type)) {
		const handlers = connection.eventHandlers.get(type)!;
		handlers.forEach((handler) => {
			try {
				handler(event);
			} catch (error) {
				console.error(`Error in WebSocket event handler for ${type}:`, error);
			}
		});
	}

	// Общие обработчики
	switch (type) {
		case 'connected':
			console.log('Connected to WebSocket server');
			break;

		case 'error':
			console.error('WebSocket server error:', event.data);
			break;

		default:
			// Обработка других событий
			break;
	}
}

// Heartbeat для поддержания соединения
function startHeartbeat(connection: WebSocketConnection): void {
	stopHeartbeat();

	heartbeatTimer = setInterval(() => {
		if (connection.isConnected) {
			sendWebSocketMessage({
				type: 'ping',
				data: { timestamp: Date.now() }
			});
		}
	}, WS_CONFIG.heartbeatInterval);
}

function stopHeartbeat(): void {
	if (heartbeatTimer) {
		clearInterval(heartbeatTimer);
		heartbeatTimer = null;
	}
}

// Планирование переподключения
function scheduleReconnect(connection: WebSocketConnection): void {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
	}

	const delay = WS_CONFIG.reconnectDelay * Math.pow(2, connection.reconnectAttempts);
	connection.reconnectAttempts++;

	console.log(
		`Scheduling WebSocket reconnect in ${delay}ms (attempt ${connection.reconnectAttempts})`
	);

	reconnectTimer = setTimeout(async () => {
		try {
			await createWebSocketConnection();
		} catch (error) {
			console.error('Reconnection failed:', error);
		}
	}, delay);
}

// Утилиты для работы с чатами
export const chatWebSocket = {
	// Присоединение к чату
	joinChat(chatId: string): boolean {
		return sendWebSocketMessage({
			type: 'join_chat',
			data: { chatId }
		});
	},

	// Выход из чата
	leaveChat(chatId: string): boolean {
		return sendWebSocketMessage({
			type: 'leave_chat',
			data: { chatId }
		});
	},

	// Отправка сообщения
	sendMessage(chatId: string, content: string): boolean {
		return sendWebSocketMessage({
			type: 'send_message',
			data: { chatId, content }
		});
	},

	// Начало печатания
	startTyping(chatId: string): boolean {
		return sendWebSocketMessage({
			type: 'typing_start',
			data: { chatId }
		});
	},

	// Остановка печатания
	stopTyping(chatId: string): boolean {
		return sendWebSocketMessage({
			type: 'typing_stop',
			data: { chatId }
		});
	},

	// Отметка сообщения как прочитанного
	markAsRead(chatId: string, messageId: string): boolean {
		return sendWebSocketMessage({
			type: 'mark_read',
			data: { chatId, messageId }
		});
	},

	// Получение истории чата
	getChatHistory(chatId: string, limit: number = 50): boolean {
		return sendWebSocketMessage({
			type: 'get_chat_history',
			data: { chatId, limit }
		});
	}
};

// Утилиты для подписки на события
export const chatEvents = {
	// Подписка на новые сообщения
	onNewMessage(handler: (event: ChatWebSocketEvent) => void): () => void {
		return subscribeToWebSocketEvent('new_message', handler);
	},

	// Подписка на статусы печатания
	onTypingStart(handler: (event: ChatWebSocketEvent) => void): () => void {
		return subscribeToWebSocketEvent('typing_start', handler);
	},

	onTypingStop(handler: (event: ChatWebSocketEvent) => void): () => void {
		return subscribeToWebSocketEvent('typing_stop', handler);
	},

	// Подписка на статусы пользователей
	onUserJoined(handler: (event: ChatWebSocketEvent) => void): () => void {
		return subscribeToWebSocketEvent('user_joined', handler);
	},

	onUserLeft(handler: (event: ChatWebSocketEvent) => void): () => void {
		return subscribeToWebSocketEvent('user_left', handler);
	},

	onUserOffline(handler: (event: ChatWebSocketEvent) => void): () => void {
		return subscribeToWebSocketEvent('user_offline', handler);
	},

	// Подписка на статусы сообщений
	onMessageRead(handler: (event: ChatWebSocketEvent) => void): () => void {
		return subscribeToWebSocketEvent('message_read', handler);
	},

	// Подписка на историю чата
	onChatHistory(handler: (event: ChatWebSocketEvent) => void): () => void {
		return subscribeToWebSocketEvent('chat_history', handler);
	},

	// Подписка на ошибки
	onError(handler: (event: ChatWebSocketEvent) => void): () => void {
		return subscribeToWebSocketEvent('error', handler);
	}
};
