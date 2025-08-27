import { z } from 'zod';

// Схема для регистрации
export const registerSchema = z
	.object({
		email: z.string().email('Некорректный email адрес').min(1, 'Email обязателен'),
		password: z
			.string()
			.min(8, 'Пароль должен содержать минимум 8 символов')
			.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Пароль должен содержать буквы и цифры'),
		confirmPassword: z.string(),
		name: z
			.string()
			.min(2, 'Имя должно содержать минимум 2 символа')
			.max(50, 'Имя не должно превышать 50 символов')
			.regex(/^[а-яёa-z\s-]+$/i, 'Имя может содержать только буквы, пробелы и дефисы')
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Пароли не совпадают',
		path: ['confirmPassword']
	});

// Схема для входа
export const loginSchema = z.object({
	email: z.string().email('Некорректный email адрес').min(1, 'Email обязателен'),
	password: z.string().min(1, 'Пароль обязателен')
});

// Схема для сброса пароля
export const resetPasswordSchema = z.object({
	email: z.string().min(1, 'Email обязателен').email('Некорректный email адрес')
});

// Схема для изменения пароля
export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
		newPassword: z
			.string()
			.min(8, 'Новый пароль должен содержать минимум 8 символов')
			.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Пароль должен содержать буквы и цифры'),
		confirmNewPassword: z.string()
	})
	.refine((data) => data.newPassword === data.confirmNewPassword, {
		message: 'Пароли не совпадают',
		path: ['confirmNewPassword']
	});

// Схема для обновления профиля
export const updateProfileSchema = z.object({
	name: z
		.string()
		.min(2, 'Имя должно содержать минимум 2 символа')
		.max(50, 'Имя не должно превышать 50 символов')
		.regex(/^[а-яёa-z\s-]+$/i, 'Имя может содержать только буквы, пробелы и дефисы')
		.optional(),
	avatar: z.string().url('Некорректный URL аватара').optional(),
	status: z.enum(['online', 'away', 'busy', 'offline']).optional()
});

// Типы для TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
