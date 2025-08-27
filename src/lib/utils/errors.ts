import { z } from 'zod';

// Кастомные классы ошибок
export class AppError extends Error {
	constructor(
		message: string,
		public statusCode: number = 500,
		public code?: string
	) {
		super(message);
		this.name = 'AppError';
	}
}

export class ValidationError extends AppError {
	constructor(
		message: string,
		public errors?: z.ZodError
	) {
		super(message, 400, 'VALIDATION_ERROR');
		this.name = 'ValidationError';
	}
}

export class AuthenticationError extends AppError {
	constructor(message: string = 'Не авторизован') {
		super(message, 401, 'AUTHENTICATION_ERROR');
		this.name = 'AuthenticationError';
	}
}

export class AuthorizationError extends AppError {
	constructor(message: string = 'Доступ запрещен') {
		super(message, 403, 'AUTHORIZATION_ERROR');
		this.name = 'AuthorizationError';
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = 'Ресурс не найден') {
		super(message, 404, 'NOT_FOUND_ERROR');
		this.name = 'NotFoundError';
	}
}

export class ConflictError extends AppError {
	constructor(message: string = 'Конфликт данных') {
		super(message, 409, 'CONFLICT_ERROR');
		this.name = 'ConflictError';
	}
}

// Функция для обработки Zod ошибок
export function handleZodError(error: z.ZodError): ValidationError {
	// Возвращаем общее сообщение об ошибке валидации
	return new ValidationError('Ошибка валидации', error);
}

// Функция для обработки общих ошибок
export function handleError(error: unknown): AppError {
	if (error instanceof AppError) {
		return error;
	}

	if (error instanceof z.ZodError) {
		return handleZodError(error);
	}

	if (error instanceof Error) {
		return new AppError(error.message);
	}

	return new AppError('Неизвестная ошибка');
}

// Функция для безопасного выполнения асинхронных операций
export async function safeAsync<T>(
	fn: () => Promise<T>,
	fallback?: T
): Promise<{ data: T | null; error: AppError | null }> {
	try {
		const data = await fn();
		return { data, error: null };
	} catch (error) {
		const appError = handleError(error);
		return { data: fallback || null, error: appError };
	}
}

// Функция для логирования ошибок
export function logError(error: AppError, context?: Record<string, unknown>): void {
	console.error(`[${error.name}] ${error.message}`, {
		statusCode: error.statusCode,
		code: error.code,
		context,
		timestamp: new Date().toISOString()
	});
}

// Функция для создания пользовательских ошибок
export function createError(message: string, statusCode: number = 500, code?: string): AppError {
	return new AppError(message, statusCode, code);
}

// Функция для валидации с обработкой ошибок
export function validateWithZod<T>(
	schema: z.ZodSchema<T>,
	data: unknown
): { data: T | null; error: ValidationError | null } {
	try {
		const validatedData = schema.parse(data);
		return { data: validatedData, error: null };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { data: null, error: handleZodError(error) };
		}
		return { data: null, error: new ValidationError('Ошибка валидации') };
	}
}
