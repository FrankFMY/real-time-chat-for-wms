import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mockMessages } from '$lib/mock-data';

// GET - получение сообщения по ID
export const GET: RequestHandler = async ({ params }) => {
	const messageId = params.id;
	const message = mockMessages.find((m) => m.id === messageId);

	if (!message) {
		return json({ error: 'Сообщение не найдено' }, { status: 404 });
	}

	return json({ message });
};

// PATCH - редактирование сообщения
export const PATCH: RequestHandler = async ({ params, request }) => {
	const messageId = params.id;
	const messageIndex = mockMessages.findIndex((m) => m.id === messageId);

	if (messageIndex === -1) {
		return json({ error: 'Сообщение не найдено' }, { status: 404 });
	}

	try {
		const { content } = await request.json();

		if (!content || typeof content !== 'string') {
			return json({ error: 'Неверный формат данных' }, { status: 400 });
		}

		// Обновляем сообщение
		const updatedMessage = {
			...mockMessages[messageIndex]!,
			content,
			edited: true,
			editedAt: new Date()
		};

		mockMessages[messageIndex] = updatedMessage;

		return json({ message: updatedMessage });
	} catch (error) {
		return json({ error: 'Ошибка при обработке запроса' }, { status: 400 });
	}
};

// DELETE - удаление сообщения
export const DELETE: RequestHandler = async ({ params }) => {
	const messageId = params.id;
	const messageIndex = mockMessages.findIndex((m) => m.id === messageId);

	if (messageIndex === -1) {
		return json({ error: 'Сообщение не найдено' }, { status: 404 });
	}

	// Удаляем сообщение из массива
	mockMessages.splice(messageIndex, 1);

	return json({ success: true, message: 'Сообщение успешно удалено' });
};
