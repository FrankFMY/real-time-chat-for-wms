// Типы для API ответов
export interface ApiResponse<T = unknown> {
	data?: T;
	error?: string;
	success?: boolean;
}

// Типы для аутентифицированных запросов
export interface AuthenticatedRequest {
	user: {
		id: string;
		email: string;
		name: string;
		avatar?: string;
		role: 'user' | 'admin' | 'moderator';
		status: 'online' | 'offline' | 'away' | 'busy';
	};
	csrfToken: string;
}

// Базовый URL для API
const API_BASE = '/api';

// Получение CSRF токена из sessionStorage
function getCSRFToken(): string {
	if (typeof window === 'undefined') return '';
	return sessionStorage.getItem('csrfToken') || '';
}

// Базовый fetch с обработкой ошибок
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
	try {
		const url = `${API_BASE}${endpoint}`;

		// Добавляем CSRF токен для POST/PUT/DELETE запросов
		const method = options.method?.toUpperCase();
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...(options.headers as Record<string, string>)
		};

		if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method || '')) {
			const csrfToken = getCSRFToken();
			if (csrfToken) {
				headers['x-csrf-token'] = csrfToken;
			}
		}

		const response = await fetch(url, {
			...options,
			headers,
			credentials: 'include' // Важно для cookies
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				error: data.error || `HTTP ${response.status}: ${response.statusText}`,
				success: false
			};
		}

		return {
			data,
			success: true
		};
	} catch (error) {
		console.error('API request failed:', error);
		return {
			error: error instanceof Error ? error.message : 'Network error',
			success: false
		};
	}
}

// API функции для аутентификации
export const authApi = {
	// Вход в систему
	async login(credentials: {
		email: string;
		password: string;
	}): Promise<ApiResponse<AuthenticatedRequest>> {
		return apiFetch<AuthenticatedRequest>('/auth', {
			method: 'POST',
			body: JSON.stringify(credentials)
		});
	},

	// Регистрация
	async register(userData: {
		email: string;
		password: string;
		confirmPassword: string;
		name: string;
	}): Promise<ApiResponse<AuthenticatedRequest>> {
		return apiFetch<AuthenticatedRequest>('/auth', {
			method: 'PUT',
			body: JSON.stringify(userData)
		});
	},

	// Выход из системы
	async logout(): Promise<ApiResponse<{ success: boolean }>> {
		return apiFetch<{ success: boolean }>('/auth', {
			method: 'DELETE'
		});
	},

	// Получение текущего пользователя
	async getCurrentUser(): Promise<ApiResponse<{ user: AuthenticatedRequest['user'] }>> {
		return apiFetch<{ user: AuthenticatedRequest['user'] }>('/auth', {
			method: 'GET'
		});
	}
};

// API функции для чатов
export const chatApi = {
	// Получение списка чатов
	async getChats(): Promise<ApiResponse<unknown[]>> {
		return apiFetch<unknown[]>('/chats', {
			method: 'GET'
		});
	},

	// Получение сообщений чата
	async getMessages(chatId: string): Promise<ApiResponse<unknown[]>> {
		return apiFetch<unknown[]>(`/chats/${chatId}/messages`, {
			method: 'GET'
		});
	},

	// Отправка сообщения
	async sendMessage(chatId: string, content: string): Promise<ApiResponse<unknown>> {
		return apiFetch<unknown>(`/chats/${chatId}/messages`, {
			method: 'POST',
			body: JSON.stringify({ content })
		});
	}
};

// Утилиты для работы с аутентификацией
export const authUtils = {
	// Проверка аутентификации
	async isAuthenticated(): Promise<boolean> {
		const response = await authApi.getCurrentUser();
		return response.success === true;
	},

	// Получение текущего пользователя
	async getCurrentUser() {
		const response = await authApi.getCurrentUser();
		return response.success ? response.data : null;
	},

	// Выход из системы
	async logout(): Promise<boolean> {
		const response = await authApi.logout();
		if (response.success) {
			// Очищаем sessionStorage
			sessionStorage.removeItem('csrfToken');
			return true;
		}
		return false;
	},

	// Обновление CSRF токена
	updateCSRFToken(token: string): void {
		sessionStorage.setItem('csrfToken', token);
	}
};

// Экспорт базовой функции для кастомных запросов
export { apiFetch };
