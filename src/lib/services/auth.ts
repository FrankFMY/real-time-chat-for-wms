import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
	loginSchema,
	registerSchema,
	type LoginInput,
	type RegisterInput
} from '$lib/schemas/auth';
import {
	AuthenticationError,
	ValidationError,
	ConflictError,
	validateWithZod
} from '$lib/utils/errors';
import { mockUsers } from '$lib/mock-data';
import type { User } from '$lib/types/chat';

// В реальном приложении эти значения должны быть в переменных окружения
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 12;

// Интерфейс для JWT payload
interface JWTPayload {
	userId: string;
	email: string;
	role: string;
}

// Интерфейс для сессии пользователя
export interface UserSession {
	user: User;
	token: string;
}

// Функция для хеширования пароля
async function hashPassword(password: string): Promise<string> {
	return await bcrypt.hash(password, SALT_ROUNDS);
}

// Функция для генерации JWT токена
function generateToken(payload: JWTPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Функция для верификации JWT токена
function verifyToken(token: string): JWTPayload {
	try {
		return jwt.verify(token, JWT_SECRET) as JWTPayload;
	} catch {
		throw new AuthenticationError('Недействительный токен');
	}
}

// Функция для регистрации пользователя
export async function registerUser(input: RegisterInput): Promise<UserSession> {
	const { data: validatedData, error: validationError } = validateWithZod(registerSchema, input);

	if (validationError) {
		throw validationError;
	}

	const { email, password, name } = validatedData!;

	// Проверяем, существует ли пользователь с таким email
	const existingUser = mockUsers.find((user) => user.email === email);
	if (existingUser) {
		throw new ConflictError('Пользователь с таким email уже существует');
	}

	// Хешируем пароль
	await hashPassword(password);

	// Создаем нового пользователя
	const newUser: User = {
		id: (mockUsers.length + 1).toString(),
		email,
		name,
		avatar: `https://images.unsplash.com/photo-${Math.random().toString(36).substring(7)}?w=150&h=150&fit=crop&crop=face`,
		status: 'online',
		role: 'user',
		createdAt: new Date()
	};

	// В реальном приложении здесь был бы запрос к базе данных
	// mockUsers.push(newUser);

	// Генерируем JWT токен
	const token = generateToken({
		userId: newUser.id,
		email: newUser.email,
		role: newUser.role
	});

	return {
		user: newUser,
		token
	};
}

// Функция для входа пользователя
export async function loginUser(input: LoginInput): Promise<UserSession> {
	const { data: validatedData, error: validationError } = validateWithZod(loginSchema, input);

	if (validationError) {
		throw validationError;
	}

	const { email, password } = validatedData!;

	// Ищем пользователя по email
	const user = mockUsers.find((u) => u.email === email);
	if (!user) {
		throw new AuthenticationError('Неверный email или пароль');
	}

	// В реальном приложении здесь была бы проверка хешированного пароля
	// const isValidPassword = await comparePasswords(password, user.hashedPassword);
	// if (!isValidPassword) {
	// 	throw new AuthenticationError('Неверный email или пароль');
	// }

	// Для демонстрации используем простую проверку
	if (password !== 'password123') {
		throw new AuthenticationError('Неверный email или пароль');
	}

	// Генерируем JWT токен
	const token = generateToken({
		userId: user.id,
		email: user.email,
		role: user.role
	});

	return {
		user,
		token
	};
}

// Функция для получения пользователя по токену
export function getUserFromToken(token: string): User {
	const payload = verifyToken(token);
	const user = mockUsers.find((u) => u.id === payload.userId);

	if (!user) {
		throw new AuthenticationError('Пользователь не найден');
	}

	return user;
}

// Функция для обновления токена
export function refreshToken(token: string): string {
	const payload = verifyToken(token);
	return generateToken(payload);
}

// Функция для безопасной аутентификации
export async function safeAuthenticate(
	token: string
): Promise<{ user: User | null; error: AuthenticationError | null }> {
	try {
		const user = getUserFromToken(token);
		return { user, error: null };
	} catch (error) {
		return { user: null, error: error as AuthenticationError };
	}
}

// Функция для безопасного входа
export async function safeLogin(
	input: LoginInput
): Promise<{ session: UserSession | null; error: ValidationError | AuthenticationError | null }> {
	try {
		const session = await loginUser(input);
		return { session, error: null };
	} catch (error) {
		return { session: null, error: error as ValidationError | AuthenticationError };
	}
}

// Функция для безопасной регистрации
export async function safeRegister(
	input: RegisterInput
): Promise<{ session: UserSession | null; error: ValidationError | ConflictError | null }> {
	try {
		const session = await registerUser(input);
		return { session, error: null };
	} catch (error) {
		return { session: null, error: error as ValidationError | ConflictError };
	}
}
