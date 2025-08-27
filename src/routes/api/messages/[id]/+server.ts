import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { mockMessages, mockChats, mockUsers } from '$lib/mock-data';
import { validateWithZod } from '$lib/utils/errors';
import { z } from 'zod';
import type { Message } from '$lib/types/chat';

const updateMessageSchema = z.object({
	content: z.string().min(1, 'Содержание сообщения обязательно')
});

// PUT /api/messages/[id] - редактирование сообщения
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const messageId = params.id;
		if (!messageId) {
			return json({ error: 'Message ID is required' }, { status: 400 });
		}

		// Находим сообщение
		const message = Array.isArray(mockMessages)
			? mockMessages.find((m: Message) => m.id === messageId)
			: undefined;
		if (!message) {
			return json({ error: 'Message not found' }, { status: 404 });
		}

		// Проверяем права доступа (только отправитель может редактировать)
		if (message.senderId !== user.id) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Проверяем, что сообщение не слишком старое (например, 15 минут)
		const messageAge = Date.now() - message.timestamp.getTime();
		const maxEditTime = 15 * 60 * 1000; // 15 минут
		if (messageAge > maxEditTime) {
			return json({ error: 'Message is too old to edit' }, { status: 400 });
		}

		const body = await request.json();
		const { data: updateData, error: validationError } = validateWithZod(updateMessageSchema, body);

		if (validationError) {
			return json({ error: validationError.message }, { status: 400 });
		}

		if (!updateData) {
			return json({ error: 'Invalid update data' }, { status: 400 });
		}

		// Обновляем сообщение
		message.content = updateData.content;
		message.edited = true;

		// Обновляем последнее сообщение в чате
		const chat = mockChats.find((c) => c.id === message.chatId);
		if (chat && chat.lastMessage && chat.lastMessage.id === message.id) {
			chat.lastMessage.content = updateData.content;
		}

		// Возвращаем обновленное сообщение с информацией об отправителе
		const sender = mockUsers.find((u) => u.id === user.id);

		return json({
			message: {
				...message,
				sender
			}
		});
	} catch (error) {
		console.error('Error updating message:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/messages/[id] - удаление сообщения
export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const messageId = params.id;
		if (!messageId) {
			return json({ error: 'Message ID is required' }, { status: 400 });
		}

		// Находим сообщение
		const messageIndex = Array.isArray(mockMessages)
			? mockMessages.findIndex((m: Message) => m.id === messageId)
			: -1;
		if (messageIndex === -1) {
			return json({ error: 'Message not found' }, { status: 404 });
		}

		const message = Array.isArray(mockMessages) ? mockMessages[messageIndex] : undefined;
		if (!message) {
			return json({ error: 'Message not found' }, { status: 404 });
		}

		// Проверяем права доступа (только отправитель может удалять)
		if (message.senderId !== user.id) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Проверяем, что сообщение не слишком старое (например, 5 минут)
		const messageAge = Date.now() - message.timestamp.getTime();
		const maxDeleteTime = 5 * 60 * 1000; // 5 минут
		if (messageAge > maxDeleteTime) {
			return json({ error: 'Message is too old to delete' }, { status: 400 });
		}

		// Удаляем сообщение
		if (Array.isArray(mockMessages)) {
			mockMessages.splice(messageIndex, 1);
		}

		// Обновляем последнее сообщение в чате, если нужно
		const chat = mockChats.find((c) => c.id === message.chatId);
		if (chat && chat.lastMessage?.id === messageId) {
			// Находим новое последнее сообщение
			const lastMessage = Array.isArray(mockMessages)
				? mockMessages
						.filter((m: Message) => m.chatId === message.chatId)
						.sort((a: Message, b: Message) => b.timestamp.getTime() - a.timestamp.getTime())[0]
				: undefined;

									if (lastMessage) {
							chat.lastMessage = {
								id: lastMessage.id,
								content: lastMessage.content,
								senderId: lastMessage.senderId,
								timestamp: lastMessage.timestamp,
								chatId: lastMessage.chatId,
								type: lastMessage.type,
								status: lastMessage.status,
								reactions: lastMessage.reactions || []
							};
						} else {
				delete chat.lastMessage;
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting message:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
