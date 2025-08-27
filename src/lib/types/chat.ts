// Типы пользователей
export interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	status: 'online' | 'offline' | 'away' | 'busy';
	lastSeen?: Date;
	role: 'user' | 'admin' | 'moderator';
	createdAt: Date;
}

// Типы сообщений
export interface Message {
	id: string;
	content: string;
	senderId: string;
	chatId: string;
	timestamp: Date;
	type: 'text' | 'file' | 'image' | 'system';
	status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
	replyTo?: string;
	attachments?: Attachment[];
	edited?: boolean;
	editedAt?: Date;
	reactions: Reaction[];
}

// Типы реакций
export interface Reaction {
	id: string;
	emoji: string;
	userId: string;
	messageId: string;
	createdAt: Date;
}

// Типы вложений
export interface Attachment {
	id: string;
	name: string;
	size: number;
	type: string;
	url: string;
	thumbnail?: string;
}

// Типы чатов
export interface Chat {
	id: string;
	name: string;
	type: 'direct' | 'group' | 'channel';
	participants: string[];
	lastMessage?: Message;
	unreadCount: number;
	createdAt: Date;
	updatedAt: Date;
	avatar?: string;
	description?: string;
	settings?: ChatSettings;
}

// Настройки чата
export interface ChatSettings {
	muted: boolean;
	pinned: boolean;
	archived: boolean;
	notifications: boolean;
}

// WebSocket типы
export interface WebSocketMessage {
	type: string;
	data: Record<string, unknown>;
}

export interface WebSocketEvent {
	type: string;
	data: Record<string, unknown>;
}

// Типы для WebSocket событий чата
export interface ChatWebSocketEvent extends WebSocketEvent {
	type:
		| 'connected'
		| 'chat_joined'
		| 'chat_left'
		| 'user_joined'
		| 'user_left'
		| 'user_offline'
		| 'new_message'
		| 'message_sent'
		| 'message_read'
		| 'typing_start'
		| 'typing_stop'
		| 'chat_history'
		| 'error';
}

export interface ChatWebSocketMessage extends WebSocketMessage {
	type:
		| 'join_chat'
		| 'leave_chat'
		| 'send_message'
		| 'typing_start'
		| 'typing_stop'
		| 'mark_read'
		| 'get_chat_history'
		| 'ping';
}

// События чата
export interface ChatEvent extends WebSocketEvent {
	type:
		| 'message_sent'
		| 'message_received'
		| 'message_updated'
		| 'message_deleted'
		| 'user_joined'
		| 'user_left'
		| 'user_typing'
		| 'user_stopped_typing'
		| 'user_status_changed'
		| 'chat_created'
		| 'chat_updated'
		| 'chat_deleted';
}

// Событие отправки сообщения
export interface MessageSentEvent extends ChatEvent {
	type: 'message_sent';
	payload: {
		message: Message;
		chatId: string;
	};
}

// Событие получения сообщения
export interface MessageReceivedEvent extends ChatEvent {
	type: 'message_received';
	payload: {
		message: Message;
		chatId: string;
	};
}

// Событие печати
export interface TypingEvent extends ChatEvent {
	type: 'user_typing' | 'user_stopped_typing';
	payload: {
		userId: string;
		chatId: string;
	};
}

// Событие изменения статуса
export interface StatusChangeEvent extends ChatEvent {
	type: 'user_status_changed';
	payload: {
		userId: string;
		status: User['status'];
		lastSeen?: Date;
	};
}

// Состояние чата
export interface ChatState {
	chats: Chat[];
	currentChat?: Chat;
	messages: Record<string, Message[]>;
	users: Record<string, User>;
	typingUsers: Record<string, string[]>; // chatId -> userId[]
	unreadCounts: Record<string, number>;
	loading: boolean;
	error?: string;
}

// Настройки уведомлений
export interface NotificationSettings {
	enabled: boolean;
	sound: boolean;
	desktop: boolean;
	mentions: boolean;
	quietHours: {
		enabled: boolean;
		start: string; // HH:mm
		end: string; // HH:mm
	};
}

// Настройки пользователя
export interface UserSettings {
	theme: 'light' | 'dark' | 'system';
	language: string;
	notifications: NotificationSettings;
	privacy: {
		showStatus: boolean;
		showLastSeen: boolean;
		allowDirectMessages: boolean;
	};
}

// API ответы
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// Пагинация
export interface PaginationParams {
	page: number;
	limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

// Поиск
export interface SearchParams {
	query: string;
	type?: 'messages' | 'users' | 'chats';
	chatId?: string;
	dateFrom?: Date;
	dateTo?: Date;
}

// Фильтры
export interface ChatFilters {
	type?: Chat['type'];
	participants?: string[];
	hasUnread?: boolean;
	archived?: boolean;
}

// Сортировка
export interface SortParams {
	field: string;
	direction: 'asc' | 'desc';
}
