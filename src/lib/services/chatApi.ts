import type { Chat, Message } from '$lib/types/chat';

// API для загрузки чатов
export async function loadChats(): Promise<Chat[]> {
	try {
		const response = await fetch('/api/chat', {
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.chats || [];
	} catch (error) {
		console.error('Error loading chats:', error);
		throw error;
	}
}

// API для загрузки сообщений чата
export async function loadMessages(
	chatId: string,
	limit: number = 50,
	offset: number = 0
): Promise<{ messages: Message[]; total: number; hasMore: boolean }> {
	try {
		const url = new URL('/api/messages', window.location.origin);
		url.searchParams.set('chatId', chatId);
		url.searchParams.set('limit', limit.toString());
		url.searchParams.set('offset', offset.toString());

		const response = await fetch(url.toString(), {
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return {
			messages: data.messages || [],
			total: data.total || 0,
			hasMore: data.hasMore || false
		};
	} catch (error) {
		console.error('Error loading messages:', error);
		throw error;
	}
}

// API для отправки сообщения
export async function sendMessage(chatId: string, content: string): Promise<Message> {
	try {
		const response = await fetch('/api/messages', {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				chatId,
				content
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.message;
	} catch (error) {
		console.error('Error sending message:', error);
		throw error;
	}
}

// API для создания нового чата
export async function createChat(
	name: string,
	participants: string[],
	type: 'direct' | 'group' = 'group'
): Promise<Chat> {
	try {
		const response = await fetch('/api/chat', {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name,
				participants,
				type
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.chat;
	} catch (error) {
		console.error('Error creating chat:', error);
		throw error;
	}
}

// API для получения информации о чате
export async function getChat(chatId: string): Promise<Chat> {
	try {
		const response = await fetch(`/api/chat/${chatId}`, {
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.chat;
	} catch (error) {
		console.error('Error getting chat:', error);
		throw error;
	}
}
