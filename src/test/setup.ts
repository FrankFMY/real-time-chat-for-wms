import '@testing-library/jest-dom';
import { vi, afterEach, afterAll } from 'vitest';

// Мокаем localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// Мокаем fetch
global.fetch = vi.fn();

// Мокаем WebSocket
const WebSocketMock = vi.fn().mockImplementation(() => ({
	send: vi.fn(),
	close: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	readyState: 1
}));

// Добавляем статические свойства WebSocket
Object.assign(WebSocketMock, {
	CONNECTING: 0,
	OPEN: 1,
	CLOSING: 2,
	CLOSED: 3
});

global.WebSocket = WebSocketMock as unknown as typeof WebSocket;

// Мокаем ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Мокаем IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Мокаем matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Мокаем crypto для генерации UUID
Object.defineProperty(global, 'crypto', {
	value: {
		randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7)
	}
});

// Мокаем Date.now для предсказуемых тестов
const originalDateNow = Date.now;
Date.now = vi.fn(() => 1640995200000); // 2022-01-01 00:00:00 UTC

// Восстанавливаем оригинальные функции после тестов
afterEach(() => {
	vi.clearAllMocks();
});

afterAll(() => {
	Date.now = originalDateNow;
});
