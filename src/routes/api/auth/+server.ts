import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { safeLogin, safeRegister } from '$lib/services/auth';
import { validateWithZod } from '$lib/utils/errors';
import { loginSchema, registerSchema } from '$lib/schemas/auth';
import {
	validateCSRFToken,
	createSession,
	deleteSession,
	setSecureCookies,
	clearAuthCookies,
	parseCookies,
	sessions
} from '$lib/server/auth';

// POST /api/auth/login - безопасный вход
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Для входа CSRF токен не требуется, так как он еще не получен
		// if (!validateCSRFToken(request)) {
		// 	return json({ error: 'CSRF token validation failed' }, { status: 403 });
		// }

		const body = await request.json();
		const { data: loginData, error: validationError } = validateWithZod(loginSchema, body);

		if (validationError) {
			return json({ error: validationError.message }, { status: 400 });
		}

		if (!loginData) {
			return json({ error: 'Invalid login data' }, { status: 400 });
		}

		// Аутентификация пользователя
		const { session, error } = await safeLogin(loginData);

		if (error) {
			return json({ error: error.message }, { status: 401 });
		}

		if (!session) {
			return json({ error: 'Authentication failed' }, { status: 401 });
		}

		// Создаем безопасную сессию
		const { sessionId, csrfToken } = createSession(session.user);

		// Создаем ответ
		const response = json({
			user: {
				id: session.user.id,
				email: session.user.email,
				name: session.user.name,
				avatar: session.user.avatar,
				role: session.user.role,
				status: session.user.status,
				createdAt: session.user.createdAt
			},
			csrfToken
		});

		// Устанавливаем безопасные cookies
		setSecureCookies(response, sessionId, csrfToken);

		return response;
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT /api/auth/register - безопасная регистрация
export const PUT: RequestHandler = async ({ request }) => {
	try {
		// Для регистрации CSRF токен не требуется, так как он еще не получен
		// if (!validateCSRFToken(request)) {
		// 	return json({ error: 'CSRF token validation failed' }, { status: 403 });
		// }

		const body = await request.json();
		const { data: registerData, error: validationError } = validateWithZod(registerSchema, body);

		if (validationError) {
			return json({ error: validationError.message }, { status: 400 });
		}

		if (!registerData) {
			return json({ error: 'Invalid registration data' }, { status: 400 });
		}

		// Регистрация пользователя
		const { session, error } = await safeRegister(registerData);

		if (error) {
			return json({ error: error.message }, { status: 400 });
		}

		if (!session) {
			return json({ error: 'Registration failed' }, { status: 400 });
		}

		// Создаем безопасную сессию
		const { sessionId, csrfToken } = createSession(session.user);

		// Создаем ответ
		const response = json({
			user: {
				id: session.user.id,
				email: session.user.email,
				name: session.user.name,
				avatar: session.user.avatar,
				role: session.user.role,
				status: session.user.status,
				createdAt: session.user.createdAt
			},
			csrfToken
		});

		// Устанавливаем безопасные cookies
		setSecureCookies(response, sessionId, csrfToken);

		return response;
	} catch (error) {
		console.error('Registration error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/auth/logout - безопасный выход
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		// Проверяем CSRF токен
		if (!validateCSRFToken(request)) {
			return json({ error: 'CSRF token validation failed' }, { status: 403 });
		}

		const cookieHeader = request.headers.get('cookie');
		if (cookieHeader) {
			const cookies = parseCookies(cookieHeader);

			// Удаляем сессию из памяти
			if (cookies.sessionId) {
				deleteSession(cookies.sessionId);
			}
		}

		// Создаем ответ с очищенными cookies
		const response = json({ success: true });
		clearAuthCookies(response);

		return response;
	} catch (error) {
		console.error('Logout error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// GET /api/auth/me - получение текущего пользователя
export const GET: RequestHandler = async ({ request }) => {
	try {
		const cookieHeader = request.headers.get('cookie');
		if (!cookieHeader) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const cookies = parseCookies(cookieHeader);
		const sessionId = cookies.sessionId;

		if (!sessionId) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Проверяем сессию
		const session = sessions.get(sessionId);
		if (!session || session.expiresAt < Date.now()) {
			sessions.delete(sessionId);
			return json({ error: 'Session expired' }, { status: 401 });
		}

		// Возвращаем информацию о пользователе
		return json({
			user: {
				id: session.userId,
				email: session.email,
				role: session.role
			}
		});
	} catch (error) {
		console.error('Get user error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
