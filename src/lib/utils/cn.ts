import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Утилита для объединения классов с поддержкой TailwindCSS
 * Автоматически разрешает конфликты классов Tailwind
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
