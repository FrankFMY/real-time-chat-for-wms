import type { User, Chat, Message } from '$lib/types/chat';

// Моковые пользователи
export const mockUsers: User[] = [
	{
		id: '1',
		name: 'Алексей Петров',
		email: 'alexey@example.com',
		avatar:
			'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
		status: 'online',
		role: 'user',
		createdAt: new Date('2024-01-01'),
		lastSeen: new Date()
	},
	{
		id: '2',
		name: 'Мария Сидорова',
		email: 'maria@example.com',
		avatar:
			'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
		status: 'online',
		role: 'user',
		createdAt: new Date('2024-01-02'),
		lastSeen: new Date()
	},
	{
		id: '3',
		name: 'Дмитрий Козлов',
		email: 'dmitry@example.com',
		avatar:
			'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
		status: 'away',
		role: 'user',
		createdAt: new Date('2024-01-03'),
		lastSeen: new Date(Date.now() - 30 * 60 * 1000) // 30 минут назад
	},
	{
		id: '4',
		name: 'Анна Волкова',
		email: 'anna@example.com',
		avatar:
			'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
		status: 'offline',
		role: 'user',
		createdAt: new Date('2024-01-04'),
		lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 часа назад
	},
	{
		id: '5',
		name: 'Сергей Морозов',
		email: 'sergey@example.com',
		avatar:
			'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
		status: 'online',
		role: 'admin',
		createdAt: new Date('2024-01-05'),
		lastSeen: new Date()
	}
];

// Моковые чаты
export const mockChats: Chat[] = [
	{
		id: '1',
		name: 'Мария Сидорова',
		type: 'direct',
		avatar:
			'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
		participants: ['1', '2'],
		createdAt: new Date('2024-01-15'),
		updatedAt: new Date(),
		lastMessage: {
			id: 'msg1',
			chatId: '1',
			senderId: '2',
			content: 'Привет! Как дела?',
			timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 минут назад
			type: 'text',
			status: 'read',
			reactions: []
		},
		unreadCount: 0
	},
	{
		id: '2',
		name: 'Дмитрий Козлов',
		type: 'direct',
		avatar:
			'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
		participants: ['1', '3'],
		createdAt: new Date('2024-01-16'),
		updatedAt: new Date(),
		lastMessage: {
			id: 'msg2',
			chatId: '2',
			senderId: '1',
			content: 'Встретимся завтра в 15:00',
			timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 минут назад
			type: 'text',
			status: 'delivered',
			reactions: []
		},
		unreadCount: 1
	},
	{
		id: '3',
		name: 'Команда разработки',
		type: 'group',
		avatar:
			'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&h=150&fit=crop&crop=faces',
		participants: ['1', '2', '3', '5'],
		groupParticipants: [
			{
				userId: '1',
				role: 'admin',
				joinedAt: new Date('2024-01-10'),
				addedBy: '1'
			},
			{
				userId: '2',
				role: 'moderator',
				joinedAt: new Date('2024-01-10'),
				addedBy: '1'
			},
			{
				userId: '3',
				role: 'member',
				joinedAt: new Date('2024-01-10'),
				addedBy: '1'
			},
			{
				userId: '5',
				role: 'member',
				joinedAt: new Date('2024-01-10'),
				addedBy: '1'
			}
		],
		createdAt: new Date('2024-01-10'),
		updatedAt: new Date(),
		lastMessage: {
			id: 'msg3',
			chatId: '3',
			senderId: '5',
			content: 'Новый релиз готов к деплою! 🚀',
			timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 часа назад
			type: 'text',
			status: 'read',
			reactions: []
		},
		unreadCount: 3
	},
	{
		id: '4',
		name: 'Анна Волкова',
		type: 'direct',
		avatar:
			'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
		participants: ['1', '4'],
		createdAt: new Date('2024-01-17'),
		updatedAt: new Date(),
		lastMessage: {
			id: 'msg4',
			chatId: '4',
			senderId: '4',
			content: 'Спасибо за помощь!',
			timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 день назад
			type: 'text',
			status: 'read',
			reactions: []
		},
		unreadCount: 0
	},
	{
		id: '5',
		name: 'Общий канал',
		type: 'channel',
		avatar:
			'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&h=150&fit=crop&crop=faces',
		participants: ['1', '2', '3', '4', '5'],
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date(),
		lastMessage: {
			id: 'msg5',
			chatId: '5',
			senderId: '2',
			content: 'Доброе утро всем! ☀️',
			timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 часа назад
			type: 'text',
			status: 'read',
			reactions: []
		},
		unreadCount: 0
	}
];

// Моковые сообщения
export const mockMessages: Message[] = [
	// Сообщения в чате с Марией
	{
		id: 'msg1_1',
		chatId: '1',
		senderId: '2',
		content: 'Привет! Как дела?',
		timestamp: new Date(Date.now() - 10 * 60 * 1000),
		type: 'text',
		status: 'read',
		reactions: [
			{
				id: 'react1',
				emoji: '👍',
				userId: '1',
				messageId: 'msg1_1',
				createdAt: new Date(Date.now() - 9 * 60 * 1000)
			},
			{
				id: 'react2',
				emoji: '❤️',
				userId: '3',
				messageId: 'msg1_1',
				createdAt: new Date(Date.now() - 8 * 60 * 1000)
			}
		]
	},
	{
		id: 'msg1_2',
		chatId: '1',
		senderId: '1',
		content: 'Привет! Все отлично, спасибо! А у тебя как дела?',
		timestamp: new Date(Date.now() - 8 * 60 * 1000),
		type: 'text',
		status: 'read',
		edited: true,
		editedAt: new Date(Date.now() - 7 * 60 * 1000),
		editHistory: [
			{
				id: 'edit1',
				content: 'Привет! Все хорошо, спасибо! А у тебя?',
				editedAt: new Date(Date.now() - 8 * 60 * 1000),
				editedBy: '1'
			}
		],
		reactions: [
			{
				id: 'react3',
				emoji: '😄',
				userId: '2',
				messageId: 'msg1_2',
				createdAt: new Date(Date.now() - 7 * 60 * 1000)
			}
		]
	},
	{
		id: 'msg1_3',
		chatId: '1',
		senderId: '2',
		content: 'Отлично! Посмотри, что я нашла!',
		timestamp: new Date(Date.now() - 7 * 60 * 1000),
		type: 'image',
		status: 'read',
		attachments: [
			{
				id: 'att1',
				name: 'beautiful-landscape.jpg',
				size: 2048576,
				type: 'image/jpeg',
				url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
				thumbnail:
					'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop'
			}
		],
		reactions: [
			{
				id: 'react4',
				emoji: '😍',
				userId: '1',
				messageId: 'msg1_3',
				createdAt: new Date(Date.now() - 6 * 60 * 1000)
			}
		]
	},
	{
		id: 'msg1_4',
		chatId: '1',
		senderId: '2',
		content: 'Отлично! Готовлюсь к презентации',
		timestamp: new Date(Date.now() - 5 * 60 * 1000),
		type: 'text',
		status: 'read',
		reactions: []
	},
	{
		id: 'msg1_5',
		chatId: '1',
		senderId: '1',
		content: 'Кстати, когда у тебя презентация?',
		timestamp: new Date(Date.now() - 4 * 60 * 1000),
		type: 'text',
		status: 'read',
		replyTo: 'msg1_4',
		replyToMessage: {
			id: 'msg1_4',
			content: 'Отлично! Готовлюсь к презентации',
			senderId: '2',
			senderName: 'Мария Сидорова',
			timestamp: new Date(Date.now() - 5 * 60 * 1000),
			type: 'text'
		},
		reactions: []
	},

	// Сообщения в чате с Дмитрием
	{
		id: 'msg2_1',
		chatId: '2',
		senderId: '3',
		content: 'Привет! Есть время обсудить проект?',
		timestamp: new Date(Date.now() - 45 * 60 * 1000),
		type: 'text',
		status: 'read',
		reactions: [
			{
				id: 'react4',
				emoji: '👍',
				userId: '1',
				messageId: 'msg2_1',
				createdAt: new Date(Date.now() - 44 * 60 * 1000)
			},
			{
				id: 'react5',
				emoji: '👍',
				userId: '3',
				messageId: 'msg2_1',
				createdAt: new Date(Date.now() - 43 * 60 * 1000)
			}
		]
	},
	{
		id: 'msg2_2',
		chatId: '2',
		senderId: '1',
		content: 'Конечно! Встретимся завтра в 15:00 в офисе',
		timestamp: new Date(Date.now() - 30 * 60 * 1000),
		type: 'text',
		status: 'delivered',
		edited: true,
		editedAt: new Date(Date.now() - 25 * 60 * 1000),
		editHistory: [
			{
				id: 'edit2',
				content: 'Конечно! Встретимся завтра в 15:00',
				editedAt: new Date(Date.now() - 30 * 60 * 1000),
				editedBy: '1'
			}
		],
		reactions: []
	},
	{
		id: 'msg2_3',
		chatId: '2',
		senderId: '3',
		content: 'Вот макет нового интерфейса',
		timestamp: new Date(Date.now() - 15 * 60 * 1000),
		type: 'image',
		status: 'read',
		attachments: [
			{
				id: 'att2',
				name: 'ui-mockup.png',
				size: 3145728,
				type: 'image/png',
				url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
				thumbnail:
					'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop'
			}
		],
		reactions: [
			{
				id: 'react8',
				emoji: '👏',
				userId: '1',
				messageId: 'msg2_3',
				createdAt: new Date(Date.now() - 14 * 60 * 1000)
			}
		]
	},

	// Сообщения в групповом чате
	{
		id: 'msg3_1',
		chatId: '3',
		senderId: '5',
		content: 'Всем привет! Как продвигается работа над новым фичами?',
		timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
		type: 'text',
		status: 'read',
		reactions: []
	},
	{
		id: 'msg3_2',
		chatId: '3',
		senderId: '2',
		content: 'Я закончил с UI компонентами!',
		timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
		type: 'text',
		status: 'read',
		reactions: []
	},
	{
		id: 'msg3_3',
		chatId: '3',
		senderId: '3',
		content: 'Бэкенд API готов на 80%',
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
		type: 'text',
		status: 'read',
		reactions: []
	},
	{
		id: 'msg3_4',
		chatId: '3',
		senderId: '5',
		content: 'Новый релиз готов к деплою! 🚀',
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
		type: 'text',
		status: 'read',
		reactions: []
	},

	// Сообщения в чате с Анной
	{
		id: 'msg4_1',
		chatId: '4',
		senderId: '4',
		content: 'Спасибо за помощь с документацией!',
		timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
		type: 'text',
		status: 'read',
		reactions: []
	},

	// Сообщения в общем канале
	{
		id: 'msg5_1',
		chatId: '5',
		senderId: '2',
		content: 'Доброе утро всем! ☀️',
		timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
		type: 'text',
		status: 'read',
		reactions: []
	},
	{
		id: 'msg5_2',
		chatId: '5',
		senderId: '1',
		content: 'Доброе утро! 🌅',
		timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
		type: 'text',
		status: 'read',
		reactions: []
	}
];
