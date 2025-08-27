import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { mockMessages, mockChats, mockUsers } from '$lib/mock-data';
import { validateWithZod } from '$lib/utils/errors';
import { z } from 'zod';
import type { Message } from '$lib/types/chat';

// Схемы валидации
const sendMessageSchema = z.object({
	content: z.string().min(1, 'Содержание сообщения обязательно'),
	chatId: z.string().min(1, 'ID чата обязателен')
});

// GET /api/messages?chatId=xxx&limit=50&offset=0 - получение сообщений чата
export const GET: RequestHandler = async ({ url, request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const chatId = url.searchParams.get('chatId');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		if (!chatId) {
			return json({ error: 'Chat ID is required' }, { status: 400 });
		}

		// Проверяем существование чата
		const chat = mockChats.find((c) => c.id === chatId);
		if (!chat) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		// Проверяем права доступа
		if (!chat.participants.includes(user.id)) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Получаем сообщения чата
		const chatMessages = Array.isArray(mockMessages)
			? mockMessages
					.filter((message: Message) => message.chatId === chatId)
					.sort((a: Message, b: Message) => b.timestamp.getTime() - a.timestamp.getTime())
					.slice(offset, offset + limit)
					.reverse()
			: [];

		// Добавляем информацию об отправителях
		const messagesWithSenders = chatMessages.map((message: Message) => {
			const sender = mockUsers.find((user) => user.id === message.senderId);
			return {
				...message,
				sender
			};
		});

		// Получаем общее количество сообщений в чате
		const totalMessages = Array.isArray(mockMessages)
			? mockMessages.filter((message: Message) => message.chatId === chatId).length
			: 0;

		return json({
			messages: messagesWithSenders,
			total: totalMessages,
			hasMore: offset + limit < totalMessages
		});
	} catch (error) {
		console.error('Error getting messages:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/messages - отправка нового сообщения
export const POST: RequestHandler = async ({ request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { data: messageData, error: validationError } = validateWithZod(sendMessageSchema, body);

		if (validationError) {
			return json({ error: validationError.message }, { status: 400 });
		}

		if (!messageData) {
			return json({ error: 'Invalid message data' }, { status: 400 });
		}

		const { content, chatId } = messageData;

		// Проверяем существование чата
		const chat = mockChats.find((c) => c.id === chatId);
		if (!chat) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		// Проверяем права доступа
		if (!chat.participants.includes(user.id)) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Создаем новое сообщение
		const newMessage: Message = {
			id: crypto.randomUUID(),
			chatId,
			senderId: user.id,
			content,
			timestamp: new Date(),
			status: 'sent',
			edited: false,
			type: 'text',
			reactions: []
		};

		// Добавляем сообщение в моковые данные
		if (Array.isArray(mockMessages)) {
			mockMessages.push(newMessage);
		}

		// Обновляем последнее сообщение в чате
		chat.lastMessage = {
			id: newMessage.id,
			content: newMessage.content,
			senderId: user.id,
			timestamp: newMessage.timestamp,
			chatId: newMessage.chatId,
			type: newMessage.type,
			status: newMessage.status,
			reactions: []
		};

		// Возвращаем сообщение с информацией об отправителе
		const sender = mockUsers.find((u) => u.id === user.id);

		return json(
			{
				message: {
					...newMessage,
					sender
				}
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error sending message:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
