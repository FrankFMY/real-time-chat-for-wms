import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser } from '$lib/server/auth';
import { mockMessages, mockChats } from '$lib/mock-data';
import type { Message } from '$lib/types/chat';

// POST /api/messages/[id]/read - отметка сообщения как прочитанного
export const POST: RequestHandler = async ({ params, request }) => {
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

		// Проверяем права доступа (участник чата может отмечать как прочитанное)
		const chat = mockChats.find((c) => c.id === message.chatId);
		if (!chat || !chat.participants.includes(user.id)) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Отмечаем сообщение как прочитанное
		message.status = 'read';

		return json({ success: true });
	} catch (error) {
		console.error('Error marking message as read:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
