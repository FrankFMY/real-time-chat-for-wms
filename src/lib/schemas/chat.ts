import { z } from 'zod';

// Схема для сообщения
export const messageSchema = z.object({
	content: z
		.string()
		.min(1, 'Сообщение не может быть пустым')
		.max(1000, 'Сообщение не должно превышать 1000 символов'),
	chatId: z.string().min(1, 'ID чата обязателен'),
	type: z.enum(['text', 'image', 'file']).default('text'),
	replyTo: z.string().optional()
});

// Схема для создания чата
export const createChatSchema = z.object({
	name: z
		.string()
		.min(1, 'Название чата обязательно')
		.max(100, 'Название чата не должно превышать 100 символов'),
	type: z.enum(['direct', 'group']).default('direct'),
	participants: z
		.array(z.string())
		.min(1, 'Должен быть хотя бы один участник')
		.max(50, 'Максимум 50 участников'),
	avatar: z.string().url('Некорректный URL аватара').optional()
});

// Схема для обновления чата
export const updateChatSchema = z.object({
	name: z
		.string()
		.min(1, 'Название чата обязательно')
		.max(100, 'Название чата не должно превышать 100 символов')
		.optional(),
	avatar: z.string().url('Некорректный URL аватара').optional(),
	participants: z
		.array(z.string())
		.min(1, 'Должен быть хотя бы один участник')
		.max(50, 'Максимум 50 участников')
		.optional()
});

// Схема для поиска чатов
export const searchChatsSchema = z.object({
	query: z
		.string()
		.min(1, 'Поисковый запрос обязателен')
		.max(100, 'Поисковый запрос не должен превышать 100 символов'),
	limit: z
		.number()
		.min(1, 'Лимит должен быть больше 0')
		.max(100, 'Лимит не должен превышать 100')
		.default(20),
	offset: z.number().min(0, 'Смещение не может быть отрицательным').default(0)
});

// Схема для загрузки файла
export const uploadFileSchema = z.object({
	file: z
		.instanceof(File)
		.refine((file) => file.size <= 10 * 1024 * 1024, 'Файл не должен превышать 10MB')
		.refine(
			(file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
			'Поддерживаются только изображения (JPEG, PNG, GIF, WebP)'
		),
	chatId: z.string().min(1, 'ID чата обязателен')
});

// Схема для реакции на сообщение
export const reactionSchema = z.object({
	messageId: z.string().min(1, 'ID сообщения обязателен'),
	reaction: z.enum(['👍', '👎', '❤️', '😄', '😢', '😡', '🎉', '👏']).default('👍')
});

// Схема для типизации
export const typingSchema = z.object({
	chatId: z.string().min(1, 'ID чата обязателен'),
	isTyping: z.boolean().default(true)
});

// Типы для TypeScript
export type MessageInput = z.infer<typeof messageSchema>;
export type CreateChatInput = z.infer<typeof createChatSchema>;
export type UpdateChatInput = z.infer<typeof updateChatSchema>;
export type SearchChatsInput = z.infer<typeof searchChatsSchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type TypingInput = z.infer<typeof typingSchema>;
