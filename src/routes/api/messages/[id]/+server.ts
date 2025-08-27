import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import type { Message, MessageEditHistory } from '$lib/types/chat';

// Схема для редактирования сообщения
const editMessageSchema = z.object({
	content: z
		.string()
		.min(1, 'Сообщение не может быть пустым')
		.max(2000, 'Сообщение слишком длинное')
});

// Моковые данные (в реальном приложении будут из базы данных)
import { mockMessages } from '$lib/mock-data';

// Временной лимит для редактирования (в минутах)
const EDIT_TIME_LIMIT = 15;

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const messageId = params.id;
		if (!messageId) {
			return json({ error: 'ID сообщения не указан' }, { status: 400 });
		}

		// Находим сообщение
		const messageIndex = mockMessages.findIndex((msg) => msg.id === messageId);
		if (messageIndex === -1) {
			return json({ error: 'Сообщение не найдено' }, { status: 404 });
		}

		const message = mockMessages[messageIndex]!;

		// Проверяем временной лимит для редактирования
		const now = new Date();
		const messageTime = message.timestamp;
		const timeDiff = now.getTime() - messageTime.getTime();
		const timeLimitMs = EDIT_TIME_LIMIT * 60 * 1000; // 15 минут в миллисекундах

		if (timeDiff > timeLimitMs) {
			return json(
				{
					error: `Редактирование возможно только в течение ${EDIT_TIME_LIMIT} минут после отправки`,
					timeLimit: EDIT_TIME_LIMIT,
					elapsed: Math.floor(timeDiff / 60000)
				},
				{ status: 403 }
			);
		}

		// Парсим и валидируем данные
		const body = await request.json();
		const validatedData = editMessageSchema.parse(body);

		// Проверяем, что контент изменился
		if (validatedData.content === message.content) {
			return json({ error: 'Сообщение не изменилось' }, { status: 400 });
		}

		// Сохраняем предыдущую версию в историю
		const editHistory: MessageEditHistory = {
			id: `edit-${Date.now()}`,
			content: message.content,
			editedAt: message.editedAt || message.timestamp,
			editedBy: message.senderId
		};

		// Обновляем сообщение
		const updatedMessage: Message = {
			...message,
			content: validatedData.content,
			edited: true,
			editedAt: now,
			editHistory: [editHistory, ...(message.editHistory || [])].slice(0, 10) // Ограничиваем историю 10 версиями
		};

		// Обновляем в моковых данных
		mockMessages[messageIndex] = updatedMessage;

		// В реальном приложении здесь был бы запрос к базе данных
		// await db.messages.update({ where: { id: messageId }, data: updatedMessage });

		return json({
			success: true,
			message: updatedMessage
		});
	} catch (error) {
		console.error('Error editing message:', error);

		if (error instanceof z.ZodError) {
			return json(
				{
					error: 'Неверные данные',
					details: error.issues
				},
				{ status: 400 }
			);
		}

		return json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
	}
};

// GET метод для получения сообщения
export const GET: RequestHandler = async ({ params }) => {
	try {
		const messageId = params.id;
		if (!messageId) {
			return json({ error: 'ID сообщения не указан' }, { status: 400 });
		}

		const message = mockMessages.find((msg) => msg.id === messageId);
		if (!message) {
			return json({ error: 'Сообщение не найдено' }, { status: 404 });
		}

		return json({ message });
	} catch (error) {
		console.error('Error getting message:', error);
		return json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
	}
};

// DELETE метод для удаления сообщения
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const messageId = params.id;
		if (!messageId) {
			return json({ error: 'ID сообщения не указан' }, { status: 400 });
		}

		const messageIndex = mockMessages.findIndex((msg) => msg.id === messageId);
		if (messageIndex === -1) {
			return json({ error: 'Сообщение не найдено' }, { status: 404 });
		}

		// Удаляем сообщение
		mockMessages.splice(messageIndex, 1);

		// В реальном приложении здесь был бы запрос к базе данных
		// await db.messages.delete({ where: { id: messageId } });

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting message:', error);
		return json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
	}
};
