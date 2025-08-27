import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, resetPasswordSchema } from './auth';

describe('Auth Schemas', () => {
	describe('loginSchema', () => {
		it('should validate correct login data', () => {
			const validData = {
				email: 'test@example.com',
				password: 'password123'
			};

			const result = loginSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject invalid email', () => {
			const invalidData = {
				email: 'invalid-email',
				password: 'password123'
			};

			const result = loginSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success && result.error) {
				expect(result.error.issues[0]?.message).toBe('Некорректный email адрес');
			}
		});

		it('should reject empty password', () => {
			const invalidData = {
				email: 'test@example.com',
				password: ''
			};

			const result = loginSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success && result.error) {
				expect(result.error.issues[0]?.message).toBe('Пароль обязателен');
			}
		});

		it('should reject missing fields', () => {
			const invalidData = {
				email: 'test@example.com'
			};

			const result = loginSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe('registerSchema', () => {
		it('should validate correct registration data', () => {
			const validData = {
				email: 'test@example.com',
				password: 'Password123',
				confirmPassword: 'Password123',
				name: 'John Doe'
			};

			const result = registerSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject weak password', () => {
			const invalidData = {
				email: 'test@example.com',
				password: 'weak',
				confirmPassword: 'weak',
				name: 'John Doe'
			};

			const result = registerSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success && result.error) {
				expect(result.error.issues[0]?.message).toBe('Пароль должен содержать минимум 8 символов');
			}
		});

		it('should reject password without letters and numbers', () => {
			const invalidData = {
				email: 'test@example.com',
				password: 'password',
				confirmPassword: 'password',
				name: 'John Doe'
			};

			const result = registerSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success && result.error) {
				expect(result.error.issues[0]?.message).toBe('Пароль должен содержать буквы и цифры');
			}
		});

		it('should reject mismatched passwords', () => {
			const invalidData = {
				email: 'test@example.com',
				password: 'Password123',
				confirmPassword: 'DifferentPassword123',
				name: 'John Doe'
			};

			const result = registerSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success && result.error) {
				expect(result.error.issues[0]?.message).toBe('Пароли не совпадают');
			}
		});

		it('should reject invalid name', () => {
			const invalidData = {
				email: 'test@example.com',
				password: 'Password123',
				confirmPassword: 'Password123',
				name: 'John123' // содержит цифры
			};

			const result = registerSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success && result.error) {
				expect(result.error.issues[0]?.message).toBe(
					'Имя может содержать только буквы, пробелы и дефисы'
				);
			}
		});

		it('should reject too short name', () => {
			const invalidData = {
				email: 'test@example.com',
				password: 'Password123',
				confirmPassword: 'Password123',
				name: 'J' // слишком короткое
			};

			const result = registerSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success && result.error) {
				expect(result.error.issues[0]?.message).toBe('Имя должно содержать минимум 2 символа');
			}
		});
	});

	describe('resetPasswordSchema', () => {
		it('should validate correct email', () => {
			const validData = {
				email: 'test@example.com'
			};

			const result = resetPasswordSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should reject invalid email', () => {
			const invalidData = {
				email: 'invalid-email'
			};

			const result = resetPasswordSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success && result.error) {
				expect(result.error.issues[0]?.message).toBe('Некорректный email адрес');
			}
		});

		it('should reject empty email', () => {
			const invalidData = {
				email: ''
			};

			const result = resetPasswordSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success && result.error) {
				expect(result.error.issues[0]?.message).toBe('Email обязателен');
			}
		});
	});
});
