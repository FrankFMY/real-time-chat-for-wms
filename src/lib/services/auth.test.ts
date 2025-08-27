import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginUser, registerUser, getUserFromToken, safeLogin } from './auth';
import { AuthenticationError, ConflictError } from '$lib/utils/errors';
import jwt from 'jsonwebtoken';

// Мокаем bcrypt
vi.mock('bcryptjs', () => ({
	default: {
		hash: vi.fn().mockResolvedValue('hashedPassword123'),
		compare: vi.fn().mockResolvedValue(true)
	}
}));

// Мокаем jsonwebtoken
vi.mock('jsonwebtoken', () => ({
	default: {
		sign: vi.fn().mockReturnValue('mock-jwt-token'),
		verify: vi.fn().mockReturnValue({
			userId: '1',
			email: 'alexey@example.com',
			role: 'admin'
		})
	}
}));

describe('Auth Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('loginUser', () => {
		it('should successfully login with valid credentials', async () => {
			const loginData = {
				email: 'alexey@example.com',
				password: 'password123'
			};

			const result = await loginUser(loginData);

			expect(result).toHaveProperty('user');
			expect(result).toHaveProperty('token');
			expect(result.user.email).toBe('alexey@example.com');
			expect(result.token).toBe('mock-jwt-token');
		});

		it('should throw AuthenticationError for invalid email', async () => {
			const loginData = {
				email: 'nonexistent@example.com',
				password: 'password123'
			};

			await expect(loginUser(loginData)).rejects.toThrow(AuthenticationError);
			await expect(loginUser(loginData)).rejects.toThrow('Неверный email или пароль');
		});

		it('should throw AuthenticationError for invalid password', async () => {
			const loginData = {
				email: 'alexey@example.com',
				password: 'wrongpassword'
			};

			await expect(loginUser(loginData)).rejects.toThrow(AuthenticationError);
			await expect(loginUser(loginData)).rejects.toThrow('Неверный email или пароль');
		});

		it('should throw ValidationError for invalid input', async () => {
			const loginData = {
				email: 'invalid-email',
				password: ''
			};

			await expect(loginUser(loginData)).rejects.toThrow('Ошибка валидации');
		});
	});

	describe('registerUser', () => {
		it('should successfully register new user', async () => {
			const registerData = {
				email: 'newuser@example.com',
				password: 'Password123',
				confirmPassword: 'Password123',
				name: 'New User'
			};

			const result = await registerUser(registerData);

			expect(result).toHaveProperty('user');
			expect(result).toHaveProperty('token');
			expect(result.user.email).toBe('newuser@example.com');
			expect(result.user.name).toBe('New User');
			expect(result.token).toBe('mock-jwt-token');
		});

		it('should throw ConflictError for existing email', async () => {
			const registerData = {
				email: 'alexey@example.com', // уже существует
				password: 'Password123',
				confirmPassword: 'Password123',
				name: 'Alexey'
			};

			await expect(registerUser(registerData)).rejects.toThrow(ConflictError);
			await expect(registerUser(registerData)).rejects.toThrow(
				'Пользователь с таким email уже существует'
			);
		});

		it('should throw ValidationError for mismatched passwords', async () => {
			const registerData = {
				email: 'newuser@example.com',
				password: 'Password123',
				confirmPassword: 'DifferentPassword123',
				name: 'New User'
			};

			await expect(registerUser(registerData)).rejects.toThrow('Ошибка валидации');
		});

		it('should throw ValidationError for weak password', async () => {
			const registerData = {
				email: 'newuser@example.com',
				password: 'weak',
				confirmPassword: 'weak',
				name: 'New User'
			};

			await expect(registerUser(registerData)).rejects.toThrow('Ошибка валидации');
		});
	});

	describe('getUserFromToken', () => {
		it('should return user for valid token', () => {
			const token = 'valid-token';
			const user = getUserFromToken(token);

			expect(user).toBeDefined();
			expect(user.email).toBe('alexey@example.com');
		});

		it('should throw AuthenticationError for invalid token', () => {
			// Мокаем jwt.verify чтобы он выбросил ошибку
			vi.mocked(jwt.verify).mockImplementation(() => {
				throw new Error('Invalid token');
			});

			expect(() => getUserFromToken('invalid-token')).toThrow(AuthenticationError);
		});
	});

	describe('safeLogin', () => {
		it('should return session for valid credentials', async () => {
			const loginData = {
				email: 'alexey@example.com',
				password: 'password123'
			};

			const result = await safeLogin(loginData);

			expect(result.error).toBeNull();
			expect(result.session).toBeDefined();
			expect(result.session?.user.email).toBe('alexey@example.com');
		});

		it('should return error for invalid credentials', async () => {
			const loginData = {
				email: 'nonexistent@example.com',
				password: 'wrongpassword'
			};

			const result = await safeLogin(loginData);

			expect(result.session).toBeNull();
			expect(result.error).toBeDefined();
			expect(result.error?.message).toBe('Неверный email или пароль');
		});

		it('should return error for validation failure', async () => {
			const loginData = {
				email: 'invalid-email',
				password: ''
			};

			const result = await safeLogin(loginData);

			expect(result.session).toBeNull();
			expect(result.error).toBeDefined();
			expect(result.error?.message).toBe('Ошибка валидации');
		});
	});
});
