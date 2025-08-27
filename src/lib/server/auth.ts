import { dev } from '$app/environment';
import type { User } from '$lib/types/chat';

// Интерфейс для сессии
export interface Session {
	userId: string;
	email: string;
	role: string;
	expiresAt: number;
}

// Интерфейс для аутентифицированного пользователя
export interface AuthenticatedUser {
	id: string;
	email: string;
	name: string;
	avatar?: string;
	role: string;
}

// In-memory хранилище сессий (в продакшене использовать Redis)
export const sessions = new Map<string, Session>();

// Генерация CSRF токена
export function generateCSRFToken(): string {
	return crypto.randomUUID();
}

// Генерация session ID
export function generateSessionId(): string {
	return crypto.randomUUID();
}

// Парсинг cookies из заголовка
export function parseCookies(cookieHeader: string | null): Record<string, string> {
	if (!cookieHeader) return {};

	return cookieHeader.split(';').reduce(
		(acc, cookie) => {
			const [key, value] = cookie.trim().split('=');
			if (key && value) {
				acc[key] = value;
			}
			return acc;
		},
		{} as Record<string, string>
	);
}

// Установка безопасных cookies
export function setSecureCookies(response: Response, sessionId: string, csrfToken: string): void {
	// Session cookie (httpOnly, secure, sameSite)
	response.headers.set(
		'Set-Cookie',
		`sessionId=${sessionId}; HttpOnly; Path=/; ${dev ? '' : 'Secure;'} SameSite=Strict; Max-Age=604800`
	);

	// CSRF token cookie (не httpOnly, но secure)
	response.headers.set(
		'Set-Cookie',
		`csrfToken=${csrfToken}; Path=/; ${dev ? '' : 'Secure;'} SameSite=Strict; Max-Age=3600`
	);
}

// Очистка cookies при выходе
export function clearAuthCookies(response: Response): void {
	response.headers.set(
		'Set-Cookie',
		[
			'sessionId=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
			'csrfToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
		].join(', ')
	);
}

// Валидация CSRF токена
export function validateCSRFToken(request: Request): boolean {
	const csrfToken = request.headers.get('x-csrf-token');
	const cookieHeader = request.headers.get('cookie');

	if (!csrfToken || !cookieHeader) return false;

	const cookies = parseCookies(cookieHeader);
	return cookies.csrfToken === csrfToken;
}

// Получение текущего пользователя из сессии
export function getCurrentUser(request: Request): AuthenticatedUser | null {
	const cookieHeader = request.headers.get('cookie');
	if (!cookieHeader) return null;

	const cookies = parseCookies(cookieHeader);
	const sessionId = cookies.sessionId;

	if (!sessionId) return null;

	// Проверяем сессию
	const session = sessions.get(sessionId);
	if (!session || session.expiresAt < Date.now()) {
		sessions.delete(sessionId);
		return null;
	}

	// В реальном приложении здесь был бы запрос к БД для получения полной информации о пользователе
	return {
		id: session.userId,
		email: session.email,
		role: session.role,
		name: 'User' // Временно, в реальном приложении из БД
	};
}

// Создание новой сессии
export function createSession(user: User): { sessionId: string; csrfToken: string } {
	const sessionId = generateSessionId();
	const csrfToken = generateCSRFToken();
	const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 дней

	sessions.set(sessionId, {
		userId: user.id,
		email: user.email,
		role: user.role,
		expiresAt
	});

	return { sessionId, csrfToken };
}

// Удаление сессии
export function deleteSession(sessionId: string): void {
	sessions.delete(sessionId);
}

// Проверка аутентификации (middleware)
export function requireAuth(request: Request): AuthenticatedUser {
	const user = getCurrentUser(request);
	if (!user) {
		throw new Error('Authentication required');
	}
	return user;
}

// Проверка роли пользователя
export function requireRole(request: Request, requiredRole: string): AuthenticatedUser {
	const user = requireAuth(request);
	if (user.role !== requiredRole && user.role !== 'admin') {
		throw new Error('Insufficient permissions');
	}
	return user;
}

// Очистка устаревших сессий (вызывать периодически)
export function cleanupExpiredSessions(): void {
	const now = Date.now();
	for (const [sessionId, session] of sessions.entries()) {
		if (session.expiresAt < now) {
			sessions.delete(sessionId);
		}
	}
}
