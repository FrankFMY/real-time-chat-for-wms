<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import { Upload, X, Image, File, Music, Video } from 'lucide-svelte';

	const dispatch = createEventDispatcher<{
		filesSelected: globalThis.File[];
		uploadProgress: { fileId: string; progress: number };
		uploadComplete: { fileId: string; url: string };
		uploadError: { fileId: string; error: string };
	}>();

	const { multiple = true, accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt', maxSize = 10 * 1024 * 1024, maxFiles = 5 } = $props<{
		multiple?: boolean;
		accept?: string;
		maxSize?: number;
		maxFiles?: number;
	}>();

	let dragOver = $state(false);
	let selectedFiles = $state<globalThis.File[]>([]);
	let uploadProgress = $state<Record<string, number>>({});
	let isUploading = $state(false);

	// Поддерживаемые типы файлов
	const supportedTypes = {
		image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
		document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
		spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
		text: ['text/plain', 'text/csv']
	};

	// Получить иконку для типа файла
	function getFileIcon(file: globalThis.File) {
		if (file.type.startsWith('image/')) return Image;
		if (file.type.startsWith('video/')) return Video;
		if (file.type.startsWith('audio/')) return Music;
		return File;
	}

	// Получить тип файла для отображения
	function getFileType(file: globalThis.File) {
		if (file.type.startsWith('image/')) return 'Изображение';
		if (file.type.startsWith('video/')) return 'Видео';
		if (file.type.startsWith('audio/')) return 'Аудио';
		if (file.type === 'application/pdf') return 'PDF';
		if (file.type.includes('word')) return 'Word';
		if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'Excel';
		return 'Файл';
	}

	// Форматировать размер файла
	function formatFileSize(bytes: number) {
		if (bytes === 0) return '0 Б';
		const k = 1024;
		const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	// Проверить валидность файла
	function validateFile(file: globalThis.File): string | null {
		if (file.size > maxSize) {
			return `Файл слишком большой. Максимальный размер: ${formatFileSize(maxSize)}`;
		}

		const acceptedTypes = accept.split(',').map((t: string) => t.trim());
		const isAccepted = acceptedTypes.some((type: string) => {
			if (type.endsWith('/*')) {
				return file.type.startsWith(type.slice(0, -1));
			}
			return file.type === type || file.name.toLowerCase().endsWith(type.slice(1));
		});

		if (!isAccepted) {
			return 'Неподдерживаемый тип файла';
		}

		return null;
	}

	// Обработка выбора файлов
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			const files = Array.from(target.files);
			processFiles(files);
		}
	}

	// Обработка Drag & Drop
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;

		if (event.dataTransfer?.files) {
			const files = Array.from(event.dataTransfer.files);
			processFiles(files);
		}
	}

	// Обработка файлов
	function processFiles(files: globalThis.File[]) {
		const validFiles: globalThis.File[] = [];
		const errors: string[] = [];

		files.forEach(file => {
			const error = validateFile(file);
			if (error) {
				errors.push(`${file.name}: ${error}`);
			} else {
				validFiles.push(file);
			}
		});

		if (errors.length > 0) {
			alert('Ошибки при загрузке файлов:\n' + errors.join('\n'));
		}

		if (validFiles.length > 0) {
			selectedFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles);
			dispatch('filesSelected', selectedFiles);
		}
	}

	// Удалить файл
	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
		dispatch('filesSelected', selectedFiles);
	}

	// Создать предпросмотр для изображения
	function createImagePreview(file: globalThis.File): string {
		if (!browser) return '';
		return URL.createObjectURL(file);
	}

	// Загрузить файлы (симуляция)
	async function uploadFiles() {
		if (selectedFiles.length === 0) return;

		isUploading = true;
		uploadProgress = {};

		for (const file of selectedFiles) {
			const fileId = `${file.name}-${Date.now()}`;
			
			// Симуляция загрузки
			for (let i = 0; i <= 100; i += 10) {
				uploadProgress[fileId] = i;
				dispatch('uploadProgress', { fileId, progress: i });
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			// Симуляция завершения загрузки
			const mockUrl = createImagePreview(file);
			dispatch('uploadComplete', { fileId, url: mockUrl });
		}

		isUploading = false;
		selectedFiles = [];
		uploadProgress = {};
	}
</script>

<div class="file-upload-container">
	<!-- Drag & Drop зона -->
	<div
		class="drop-zone {dragOver ? 'drag-over' : ''}"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		role="button"
		tabindex="0"
		aria-label="Drag and drop zone for file upload"
	>
		<input
			type="file"
			multiple={multiple}
			accept={accept}
			onchange={handleFileSelect}
			class="file-input"
			id="file-upload"
		/>
		
		<label for="file-upload" class="drop-zone-content">
			<Upload class="upload-icon" />
			<div class="upload-text">
				<span class="primary-text">Перетащите файлы сюда</span>
				<span class="secondary-text">или нажмите для выбора</span>
			</div>
			<div class="upload-info">
				<span>Поддерживаемые форматы: JPG, PNG, PDF, DOC, XLS</span>
				<span>Максимальный размер: {formatFileSize(maxSize)}</span>
			</div>
		</label>
	</div>

	<!-- Выбранные файлы -->
	{#if selectedFiles.length > 0}
		<div class="selected-files">
			<h4>Выбранные файлы ({selectedFiles.length}/{maxFiles})</h4>
			
			<div class="files-grid">
				{#each selectedFiles as file, index (file.name)}
					{@const FileIcon = getFileIcon(file)}
					{@const fileType = getFileType(file)}
					{@const isImage = file.type.startsWith('image/')}
					{@const preview = isImage ? createImagePreview(file) : ''}
					
					<div class="file-item">
						{#if isImage && preview}
							<div class="file-preview">
								<img src={preview} alt={file.name} />
								<button
									class="remove-file"
									onclick={() => removeFile(index)}
									title="Удалить файл"
								>
									<X class="h-4 w-4" />
								</button>
							</div>
						{:else}
							<div class="file-icon">
								<FileIcon class="h-8 w-8" />
								<button
									class="remove-file"
									onclick={() => removeFile(index)}
									title="Удалить файл"
								>
									<X class="h-4 w-4" />
								</button>
							</div>
						{/if}
						
						<div class="file-info">
							<div class="file-name" title={file.name}>
								{file.name.length > 20 ? file.name.slice(0, 20) + '...' : file.name}
							</div>
							<div class="file-details">
								<span class="file-type">{fileType}</span>
								<span class="file-size">{formatFileSize(file.size)}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Кнопка загрузки -->
			<div class="upload-actions">
				<button
					class="upload-button"
					onclick={uploadFiles}
					disabled={isUploading}
				>
					{#if isUploading}
						Загрузка...
					{:else}
						Загрузить файлы
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.file-upload-container {
		width: 100%;
	}

	.drop-zone {
		border: 2px dashed var(--border-color, #e5e7eb);
		border-radius: 0.5rem;
		padding: 2rem;
		text-align: center;
		transition: all 0.2s ease;
		cursor: pointer;
		background-color: var(--bg-color);
	}

	.drop-zone:hover {
		border-color: #3b82f6;
		background-color: rgba(59, 130, 246, 0.05);
	}

	.drop-zone.drag-over {
		border-color: #3b82f6;
		background-color: rgba(59, 130, 246, 0.1);
		transform: scale(1.02);
	}

	.file-input {
		display: none;
	}

	.drop-zone-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		cursor: pointer;
	}

	.upload-icon {
		width: 3rem;
		height: 3rem;
		color: #6b7280;
	}

	.upload-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.primary-text {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-color);
	}

	.secondary-text {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.upload-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.selected-files {
		margin-top: 1rem;
	}

	.selected-files h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-color);
		margin-bottom: 0.75rem;
	}

	.files-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.file-item {
		position: relative;
		border: 1px solid var(--border-color, #e5e7eb);
		border-radius: 0.5rem;
		overflow: hidden;
		background-color: var(--bg-color);
	}

	.file-preview {
		position: relative;
		width: 100%;
		height: 120px;
	}

	.file-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.file-icon {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 120px;
		background-color: #f3f4f6;
		color: #6b7280;
	}

	.remove-file {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		background-color: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.remove-file:hover {
		background-color: rgba(0, 0, 0, 0.9);
	}

	.file-info {
		padding: 0.5rem;
	}

	.file-name {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-color);
		margin-bottom: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-details {
		display: flex;
		justify-content: space-between;
		font-size: 0.625rem;
		color: #6b7280;
	}

	.upload-actions {
		display: flex;
		justify-content: center;
	}

	.upload-button {
		padding: 0.5rem 1rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.upload-button:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.upload-button:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}

	/* Темная тема */
	.dark .file-icon {
		background-color: #374151;
		color: #9ca3af;
	}

	.dark .drop-zone:hover {
		background-color: rgba(59, 130, 246, 0.1);
	}

	.dark .drop-zone.drag-over {
		background-color: rgba(59, 130, 246, 0.15);
	}
</style>
