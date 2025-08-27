import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { mockChats, mockUsers } from '$lib/mock-data';
import { validateWithZod } from '$lib/utils/errors';
import { z } from 'zod';

const updateChatSchema = z.object({
	name: z.string().min(1, 'Название чата обязательно').optional(),
	participants: z.array(z.string()).optional()
});

// GET /api/chat/[id] - получение информации о конкретном чате
export const GET: RequestHandler = async ({ params, request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const chatId = params.id;
		if (!chatId) {
			return json({ error: 'Chat ID is required' }, { status: 400 });
		}

		const chat = mockChats.find((c) => c.id === chatId);
		if (!chat) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		// Проверяем права доступа
		if (!chat.participants.includes(user.id)) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Добавляем информацию об участниках
		const participants = mockUsers.filter((user) => chat.participants.includes(user.id));

		return json({
			chat: {
				...chat,
				participants
			}
		});
	} catch (error) {
		console.error('Error getting chat:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT /api/chat/[id] - обновление чата
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const chatId = params.id;
		if (!chatId) {
			return json({ error: 'Chat ID is required' }, { status: 400 });
		}

		const chat = mockChats.find((c) => c.id === chatId);
		if (!chat) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		// Проверяем права доступа (только участники могут обновлять)
		if (!chat.participants.includes(user.id)) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		const body = await request.json();
		const { data: updateData, error: validationError } = validateWithZod(updateChatSchema, body);

		if (validationError) {
			return json({ error: validationError.message }, { status: 400 });
		}

		if (!updateData) {
			return json({ error: 'Invalid update data' }, { status: 400 });
		}

		// Обновляем чат
		if (updateData.name) {
			chat.name = updateData.name;
		}

		if (updateData.participants) {
			// Проверяем существование участников
			const validParticipants = updateData.participants.filter((participantId) =>
				mockUsers.some((user) => user.id === participantId)
			);

			if (validParticipants.length === 0) {
				return json({ error: 'No valid participants found' }, { status: 400 });
			}

			chat.participants = validParticipants;
		}

		// Обновляем время изменения
		chat.updatedAt = new Date();

		// Добавляем информацию об участниках
		const participants = mockUsers.filter((user) => chat.participants.includes(user.id));

		return json({
			chat: {
				...chat,
				participants
			}
		});
	} catch (error) {
		console.error('Error updating chat:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/chat/[id] - удаление чата
export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const chatId = params.id;
		if (!chatId) {
			return json({ error: 'Chat ID is required' }, { status: 400 });
		}

		const chatIndex = mockChats.findIndex((c) => c.id === chatId);
		if (chatIndex === -1) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		const chat = mockChats[chatIndex];

		// Проверяем права доступа (только участники могут удалять)
		if (!chat || !chat.participants.includes(user.id)) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Удаляем чат
		mockChats.splice(chatIndex, 1);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting chat:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
