<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-svelte';

	const dispatch = createEventDispatcher<{
		close: void;
		download: { url: string; filename: string };
	}>();

	const { images = [], currentIndex = 0, isOpen = false } = $props<{
		images?: string[];
		currentIndex?: number;
		isOpen?: boolean;
	}>();

	let zoomLevel = $state(1);
	let isDragging = $state(false);
	let dragStart = $state({ x: 0, y: 0 });
	let imagePosition = $state({ x: 0, y: 0 });
	let currentIndexState = $state(currentIndex);
	let isOpenState = $state(isOpen);

	// Обработка клавиш
	function handleKeydown(event: KeyboardEvent) {
		if (!isOpenState) return;

		switch (event.key) {
			case 'Escape':
				closeGallery();
				break;
			case 'ArrowLeft':
				previousImage();
				break;
			case 'ArrowRight':
				nextImage();
				break;
			case '+':
			case '=':
				zoomIn();
				break;
			case '-':
				zoomOut();
				break;
		}
	}

	// Закрыть галерею
	function closeGallery() {
		isOpenState = false;
		zoomLevel = 1;
		imagePosition = { x: 0, y: 0 };
		dispatch('close');
	}

	// Следующее изображение
	function nextImage() {
		if (currentIndexState < images.length - 1) {
			currentIndexState++;
			resetZoom();
		}
	}

	// Предыдущее изображение
	function previousImage() {
		if (currentIndexState > 0) {
			currentIndexState--;
			resetZoom();
		}
	}

	// Увеличить
	function zoomIn() {
		zoomLevel = Math.min(zoomLevel * 1.2, 3);
	}

	// Уменьшить
	function zoomOut() {
		zoomLevel = Math.max(zoomLevel / 1.2, 0.5);
	}

	// Сбросить зум
	function resetZoom() {
		zoomLevel = 1;
		imagePosition = { x: 0, y: 0 };
	}

	// Обработка колеса мыши для зума
	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		if (event.deltaY < 0) {
			zoomIn();
		} else {
			zoomOut();
		}
	}

	// Начало перетаскивания
	function handleMouseDown(event: MouseEvent) {
		if (zoomLevel > 1) {
			isDragging = true;
			dragStart = { x: event.clientX - imagePosition.x, y: event.clientY - imagePosition.y };
		}
	}

	// Перетаскивание
	function handleMouseMove(event: MouseEvent) {
		if (isDragging && zoomLevel > 1) {
			imagePosition = {
				x: event.clientX - dragStart.x,
				y: event.clientY - dragStart.y
			};
		}
	}

	// Конец перетаскивания
	function handleMouseUp() {
		isDragging = false;
	}

	// Скачать изображение
	function downloadImage() {
		const imageUrl = images[currentIndexState];
		const filename = `image-${currentIndexState + 1}.jpg`;
		
		if (browser) {
			const link = document.createElement('a');
			link.href = imageUrl;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
		
		dispatch('download', { url: imageUrl, filename });
	}

	// Получить имя файла из URL
	function getFilename(url: string): string {
		try {
			const urlObj = new URL(url);
			const pathname = urlObj.pathname;
			return pathname.split('/').pop() || 'image.jpg';
		} catch {
			return 'image.jpg';
		}
	}

	// Обработчики событий
	if (browser) {
		window.addEventListener('keydown', handleKeydown);
	}
</script>

{#if isOpenState}
	<div 
		class="image-gallery-overlay" 
		onclick={closeGallery}
		role="dialog"
		aria-modal="true"
		aria-label="Галерея изображений"
		tabindex="-1"
		onkeydown={(e) => {
			if (e.key === 'Escape') closeGallery();
		}}
	>
		<div 
			class="image-gallery-content" 
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Кнопка закрытия -->
			<button 
				class="close-button" 
				onclick={closeGallery} 
				title="Закрыть (Esc)"
				aria-label="Закрыть галерею"
			>
				<X class="h-6 w-6" />
			</button>

			<!-- Навигация -->
			{#if images.length > 1}
				<button
					class="nav-button prev-button"
					onclick={previousImage}
					disabled={currentIndexState === 0}
					title="Предыдущее изображение (←)"
					aria-label="Предыдущее изображение"
				>
					<ChevronLeft class="h-6 w-6" />
				</button>

				<button
					class="nav-button next-button"
					onclick={nextImage}
					disabled={currentIndexState === images.length - 1}
					title="Следующее изображение (→)"
					aria-label="Следующее изображение"
				>
					<ChevronRight class="h-6 w-6" />
				</button>
			{/if}

			<!-- Изображение -->
			<div
				class="image-container"
				onwheel={handleWheel}
				onmousedown={handleMouseDown}
				onmousemove={handleMouseMove}
				onmouseup={handleMouseUp}
				onmouseleave={handleMouseUp}
				role="img"
				aria-label="Изображение {currentIndexState + 1} из {images.length}"
				tabindex="0"
				onkeydown={(e) => {
					switch (e.key) {
						case 'ArrowLeft':
							if (currentIndexState > 0) previousImage();
							break;
						case 'ArrowRight':
							if (currentIndexState < images.length - 1) nextImage();
							break;
						case '+':
						case '=':
							zoomIn();
							break;
						case '-':
							zoomOut();
							break;
					}
				}}
			>
				<img
					src={images[currentIndexState]}
					alt="Изображение {currentIndexState + 1}"
					class="gallery-image"
					style="transform: scale({zoomLevel}) translate({imagePosition.x}px, {imagePosition.y}px);"
				/>
			</div>

			<!-- Панель инструментов -->
			<div class="toolbar">
				<div class="image-info">
					<span class="image-counter">{currentIndexState + 1} / {images.length}</span>
					<span class="image-filename">{getFilename(images[currentIndexState])}</span>
				</div>

				<div class="toolbar-actions">
					<button 
						class="toolbar-button" 
						onclick={zoomOut}
						disabled={zoomLevel <= 0.5}
						title="Уменьшить (-)"
					>
						<ZoomOut class="h-4 w-4" />
					</button>

					<button 
						class="toolbar-button" 
						onclick={resetZoom}
						title="Сбросить масштаб"
					>
						{Math.round(zoomLevel * 100)}%
					</button>

					<button 
						class="toolbar-button" 
						onclick={zoomIn}
						disabled={zoomLevel >= 3}
						title="Увеличить (+)"
					>
						<ZoomIn class="h-4 w-4" />
					</button>

					<button 
						class="toolbar-button" 
						onclick={downloadImage}
						title="Скачать изображение"
					>
						<Download class="h-4 w-4" />
					</button>
				</div>
			</div>

			<!-- Миниатюры -->
			{#if images.length > 1}
				<div class="thumbnails">
					{#each images as image, index (index)}
						<button
							class="thumbnail {index === currentIndexState ? 'active' : ''}"
							onclick={() => { currentIndexState = index; resetZoom(); }}
						>
							<img src={image} alt="Миниатюра {index + 1}" />
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.image-gallery-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		cursor: pointer;
	}

	.image-gallery-content {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: default;
	}

	.close-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background-color: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		border-radius: 50%;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s ease;
		z-index: 1000;
	}

	.close-button:hover {
		background-color: rgba(0, 0, 0, 0.9);
	}

	.nav-button {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background-color: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		border-radius: 50%;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 0.2s ease;
		z-index: 1000;
	}

	.nav-button:hover:not(:disabled) {
		background-color: rgba(0, 0, 0, 0.9);
	}

	.nav-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.prev-button {
		left: 1rem;
	}

	.next-button {
		right: 1rem;
	}

	.image-container {
		max-width: 90vw;
		max-height: 80vh;
		overflow: hidden;
		cursor: grab;
	}

	.image-container:active {
		cursor: grabbing;
	}

	.gallery-image {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		transition: transform 0.1s ease;
		user-select: none;
	}

	.toolbar {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		z-index: 1000;
	}

	.image-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.image-counter {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.image-filename {
		font-size: 0.75rem;
		opacity: 0.8;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.toolbar-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toolbar-button {
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
		border: none;
		border-radius: 0.25rem;
		padding: 0.5rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
		font-size: 0.75rem;
		min-width: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toolbar-button:hover:not(:disabled) {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.toolbar-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.thumbnails {
		position: absolute;
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.5rem;
		background-color: rgba(0, 0, 0, 0.8);
		padding: 0.5rem;
		border-radius: 0.5rem;
		z-index: 1000;
	}

	.thumbnail {
		width: 3rem;
		height: 3rem;
		border: 2px solid transparent;
		border-radius: 0.25rem;
		overflow: hidden;
		cursor: pointer;
		transition: border-color 0.2s ease;
		background: none;
		padding: 0;
	}

	.thumbnail:hover {
		border-color: rgba(255, 255, 255, 0.5);
	}

	.thumbnail.active {
		border-color: #3b82f6;
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Адаптивность */
	@media (max-width: 768px) {
		.nav-button {
			width: 2.5rem;
			height: 2.5rem;
		}

		.nav-button .h-6 {
			width: 1.25rem;
			height: 1.25rem;
		}

		.toolbar {
			flex-direction: column;
			gap: 0.5rem;
			padding: 0.5rem;
		}

		.toolbar-actions {
			gap: 0.25rem;
		}

		.toolbar-button {
			padding: 0.25rem;
			min-width: 1.5rem;
		}

		.thumbnails {
			bottom: 8rem;
		}

		.thumbnail {
			width: 2rem;
			height: 2rem;
		}
	}
</style>
