import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { mockChats, mockUsers } from '$lib/mock-data';
import { validateWithZod } from '$lib/utils/errors';
import { z } from 'zod';

// Схемы валидации
const addParticipantSchema = z.object({
	userId: z.string().min(1, 'ID пользователя обязателен'),
	role: z.enum(['admin', 'moderator', 'member']).default('member')
});

const updateRoleSchema = z.object({
	userId: z.string().min(1, 'ID пользователя обязателен'),
	role: z.enum(['admin', 'moderator', 'member'])
});

// GET /api/chat/[id]/participants - получение участников группы
export const GET: RequestHandler = async ({ params, request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const chatId = params.id;
		const chat = mockChats.find((c) => c.id === chatId);

		if (!chat) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		// Проверяем, что пользователь является участником чата
		if (!chat.participants.includes(user.id)) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Получаем участников с полной информацией
		const participants = mockUsers.filter((u) => chat.participants.includes(u.id));

		// Для групповых чатов добавляем информацию о ролях
		if (chat.type === 'group' && chat.groupParticipants) {
			const participantsWithRoles = participants.map((participant) => {
				const groupParticipant = chat.groupParticipants!.find((gp) => gp.userId === participant.id);
				return {
					...participant,
					role: groupParticipant?.role || 'member',
					joinedAt: groupParticipant?.joinedAt || chat.createdAt,
					addedBy: groupParticipant?.addedBy
				};
			});

			return json({ participants: participantsWithRoles });
		}

		return json({ participants });
	} catch (error) {
		console.error('Error getting participants:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/chat/[id]/participants - добавление участника в группу
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const chatId = params.id;
		const chat = mockChats.find((c) => c.id === chatId);

		if (!chat) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		// Проверяем, что это групповой чат
		if (chat.type !== 'group') {
			return json({ error: 'Can only add participants to group chats' }, { status: 400 });
		}

		// Проверяем права администратора
		const isAdmin = chat.groupParticipants?.find(
			(gp) => gp.userId === user.id && gp.role === 'admin'
		);
		if (!isAdmin) {
			return json({ error: 'Only admins can add participants' }, { status: 403 });
		}

		const body = await request.json();
		const { data: participantData, error: validationError } = validateWithZod(
			addParticipantSchema,
			body
		);

		if (validationError) {
			return json({ error: validationError.message }, { status: 400 });
		}

		if (!participantData) {
			return json({ error: 'Invalid participant data' }, { status: 400 });
		}

		// Проверяем, что пользователь существует
		const newParticipant = mockUsers.find((u) => u.id === participantData.userId);
		if (!newParticipant) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Проверяем, что пользователь еще не в группе
		if (chat.participants.includes(participantData.userId)) {
			return json({ error: 'User is already a participant' }, { status: 400 });
		}

		// Добавляем участника
		chat.participants.push(participantData.userId);

		// Инициализируем groupParticipants если не существует
		if (!chat.groupParticipants) {
			chat.groupParticipants = [];
		}

		// Добавляем информацию о роли
		chat.groupParticipants.push({
			userId: participantData.userId,
			role: participantData.role,
			joinedAt: new Date(),
			addedBy: user.id
		});

		// Обновляем время последнего изменения
		chat.updatedAt = new Date();

		return json({
			message: 'Participant added successfully',
			participant: {
				...newParticipant,
				role: participantData.role,
				joinedAt: new Date(),
				addedBy: user.id
			}
		});
	} catch (error) {
		console.error('Error adding participant:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PATCH /api/chat/[id]/participants - изменение роли участника
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const chatId = params.id;
		const chat = mockChats.find((c) => c.id === chatId);

		if (!chat) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		// Проверяем, что это групповой чат
		if (chat.type !== 'group') {
			return json({ error: 'Can only modify participants in group chats' }, { status: 400 });
		}

		// Проверяем права администратора
		const isAdmin = chat.groupParticipants?.find(
			(gp) => gp.userId === user.id && gp.role === 'admin'
		);
		if (!isAdmin) {
			return json({ error: 'Only admins can modify participant roles' }, { status: 403 });
		}

		const body = await request.json();
		const { data: roleData, error: validationError } = validateWithZod(updateRoleSchema, body);

		if (validationError) {
			return json({ error: validationError.message }, { status: 400 });
		}

		if (!roleData) {
			return json({ error: 'Invalid role data' }, { status: 400 });
		}

		// Проверяем, что участник существует в группе
		if (!chat.participants.includes(roleData.userId)) {
			return json({ error: 'User is not a participant of this group' }, { status: 404 });
		}

		// Нельзя изменить роль самого себя
		if (roleData.userId === user.id) {
			return json({ error: 'Cannot change your own role' }, { status: 400 });
		}

		// Обновляем роль
		if (chat.groupParticipants) {
			const participant = chat.groupParticipants.find((gp) => gp.userId === roleData.userId);
			if (participant) {
				participant.role = roleData.role;
			}
		}

		// Обновляем время последнего изменения
		chat.updatedAt = new Date();

		return json({
			message: 'Role updated successfully',
			userId: roleData.userId,
			role: roleData.role
		});
	} catch (error) {
		console.error('Error updating participant role:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/chat/[id]/participants - удаление участника из группы
export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const chatId = params.id;
		const chat = mockChats.find((c) => c.id === chatId);

		if (!chat) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		// Проверяем, что это групповой чат
		if (chat.type !== 'group') {
			return json({ error: 'Can only remove participants from group chats' }, { status: 400 });
		}

		// Получаем userId из query параметров
		const url = new URL(request.url);
		const userId = url.searchParams.get('userId');

		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Проверяем права администратора или модератора
		const currentParticipant = chat.groupParticipants?.find((gp) => gp.userId === user.id);
		const targetParticipant = chat.groupParticipants?.find((gp) => gp.userId === userId);

		if (
			!currentParticipant ||
			(currentParticipant.role !== 'admin' && currentParticipant.role !== 'moderator')
		) {
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// Модераторы могут удалять только обычных участников
		if (currentParticipant.role === 'moderator' && targetParticipant?.role !== 'member') {
			return json({ error: 'Moderators can only remove regular members' }, { status: 403 });
		}

		// Нельзя удалить самого себя
		if (userId === user.id) {
			return json({ error: 'Cannot remove yourself from the group' }, { status: 400 });
		}

		// Удаляем участника
		chat.participants = chat.participants.filter((id) => id !== userId);

		if (chat.groupParticipants) {
			chat.groupParticipants = chat.groupParticipants.filter((gp) => gp.userId !== userId);
		}

		// Обновляем время последнего изменения
		chat.updatedAt = new Date();

		return json({
			message: 'Participant removed successfully',
			userId
		});
	} catch (error) {
		console.error('Error removing participant:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
