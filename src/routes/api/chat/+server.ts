import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { mockChats, mockUsers } from '$lib/mock-data';
import { validateWithZod } from '$lib/utils/errors';
import { z } from 'zod';

// Схемы валидации
const createChatSchema = z.object({
	name: z.string().min(1, 'Название чата обязательно'),
	participants: z.array(z.string()).min(1, 'Должен быть хотя бы один участник'),
	type: z.enum(['private', 'group']).default('group')
});

// GET /api/chat - получение списка чатов пользователя
export const GET: RequestHandler = async ({ request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Получаем чаты, в которых участвует пользователь
		const userChats = mockChats.filter((chat) => chat.participants.includes(user.id));

		// Добавляем информацию об участниках
		const chatsWithParticipants = userChats.map((chat) => {
			const participants = mockUsers.filter((user) => chat.participants.includes(user.id));

			return {
				...chat,
				participants
			};
		});

		return json({
			chats: chatsWithParticipants,
			total: chatsWithParticipants.length
		});
	} catch (error) {
		console.error('Error getting chats:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/chat - создание нового чата
export const POST: RequestHandler = async ({ request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { data: chatData, error: validationError } = validateWithZod(createChatSchema, body);

		if (validationError) {
			return json({ error: validationError.message }, { status: 400 });
		}

		if (!chatData) {
			return json({ error: 'Invalid chat data' }, { status: 400 });
		}

		// Проверяем, что пользователь включен в участников
		if (!chatData.participants.includes(user.id)) {
			chatData.participants.push(user.id);
		}

		// Проверяем существование участников
		const validParticipants = chatData.participants.filter((participantId) =>
			mockUsers.some((user) => user.id === participantId)
		);

		if (validParticipants.length === 0) {
			return json({ error: 'No valid participants found' }, { status: 400 });
		}

		// Создаем новый чат
		const newChat = {
			id: crypto.randomUUID(),
			name: chatData.name,
			type: (chatData.type === 'private' ? 'direct' : 'group') as 'direct' | 'group',
			participants: validParticipants,
			createdAt: new Date(),
			updatedAt: new Date(),
			unreadCount: 0
		};

		// Добавляем чат в моковые данные
		mockChats.push(newChat);

		// Возвращаем чат с участниками
		const participants = mockUsers.filter((user) => validParticipants.includes(user.id));

		return json(
			{
				chat: {
					...newChat,
					participants
				}
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating chat:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
